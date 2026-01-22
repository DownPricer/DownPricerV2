from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body, BackgroundTasks, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import shutil
from PIL import Image
import io

from models import (
    User, UserCreate, UserLogin, Article, ArticleCreate, Category, CategoryCreate,
    Demande, DemandeCreate, SellerSale, SellerSaleCreate, MiniSite, MiniSiteCreate,
    MiniSiteArticle, MiniSiteArticleCreate, Setting,
    UserRole, DemandeStatus, SaleStatus, BillingMode
)
from auth import verify_password, get_password_hash, create_access_token
from dependencies import get_current_user, require_roles
from billing_provider import get_billing_provider
from notifications import EventType, notify_admin, notify_user, get_base_url
from stripe_billing import (
    create_checkout_session,
    create_portal_session,
    handle_checkout_session_completed,
    handle_subscription_updated,
    handle_subscription_deleted,
    handle_invoice_payment_failed,
    handle_invoice_paid
)
import stripe

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Vérification des variables d'environnement obligatoires
mongo_url = os.environ.get('MONGO_URL')
if not mongo_url:
    raise ValueError(
        "❌ MONGO_URL n'est pas défini dans backend/.env\n"
        "Créez le fichier backend/.env avec :\n"
        "MONGO_URL=mongodb://localhost:27017\n"
        "DB_NAME=downpricer\n"
        "JWT_SECRET_KEY=votre-cle-secrete\n"
        "CORS_ORIGINS=http://localhost:3000\n"
        "BACKEND_PUBLIC_URL=http://localhost:8001"
    )

# Si MONGO_URL contient déjà le nom de la base, l'extraire
# Format possible: mongodb://localhost:27017/downpricer
if mongo_url.count('/') >= 3:
    # Extraire le nom de la base depuis l'URL
    url_parts = mongo_url.split('/')
    if len(url_parts) > 3:
        # Le dernier élément après le dernier / est le nom de la base
        db_name_from_url = url_parts[-1].split('?')[0]  # Enlever les paramètres de requête
        mongo_url_clean = '/'.join(url_parts[:3])  # mongodb://localhost:27017
        mongo_url = mongo_url_clean
        db_name = db_name_from_url if db_name_from_url else os.environ.get('DB_NAME', 'downpricer')
    else:
        db_name = os.environ.get('DB_NAME', 'downpricer')
else:
    db_name = os.environ.get('DB_NAME')
    if not db_name:
        raise ValueError(
            "❌ DB_NAME n'est pas défini dans backend/.env\n"
            "Ajoutez DB_NAME=downpricer dans votre fichier backend/.env"
        )

# Configuration du logger AVANT son utilisation
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    logger.info(f"✅ Connexion MongoDB configurée : {db_name}")
except Exception as e:
    logger.error(f"❌ Erreur de connexion MongoDB : {str(e)}")
    raise

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Chemin relatif au répertoire backend pour les uploads
UPLOAD_DIR = Path(ROOT_DIR / "uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
# Monte les uploads sous /api/uploads pour être accessible via l'ingress Kubernetes
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

async def get_billing_mode() -> str:
    setting = await db.settings.find_one({"key": "billing_mode"}, {"_id": 0})
    if setting:
        return setting.get("value", BillingMode.FREE_TEST)
    return BillingMode.FREE_TEST

async def get_deposit_percentage() -> float:
    setting = await db.settings.find_one({"key": "deposit_percentage"}, {"_id": 0})
    if setting:
        return float(setting.get("value", 40))
    return 40.0

@api_router.post("/auth/signup")
async def signup(
    background_tasks: BackgroundTasks,
    user_data: UserCreate
):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": get_password_hash(user_data.password),
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "phone": user_data.phone,
        "roles": [UserRole.CLIENT],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Notification admin : nouvel utilisateur
    try:
        await notify_admin(
            db,
            EventType.ADMIN_NEW_USER,
            {
                "title": "Nouvel utilisateur inscrit",
                "message": f"Un nouvel utilisateur s'est inscrit sur la plateforme.",
                "user_name": f"{user_data.first_name} {user_data.last_name}",
                "user_email": user_data.email,
                "created_at": user_doc["created_at"],
                "details": f"<table class='details-table'><tr><td>Nom</td><td>{user_data.first_name} {user_data.last_name}</td></tr><tr><td>Email</td><td>{user_data.email}</td></tr><tr><td>Téléphone</td><td>{user_data.phone or 'Non renseigné'}</td></tr></table>"
            },
            background_tasks
        )
    except Exception as e:
        logger.error(f"Erreur notification admin signup: {str(e)}")
    
    token = create_access_token(data={"sub": user_data.email, "roles": user_doc["roles"]})
    
    return {
        "token": token,
        "user": User(**{k: v for k, v in user_doc.items() if k != "password_hash"})
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user_doc or not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    token = create_access_token(data={"sub": credentials.email, "roles": user_doc["roles"]})
    
    return {
        "token": token,
        "user": User(**{k: v for k, v in user_doc.items() if k != "password_hash"})
    }

@api_router.get("/auth/me")
async def get_me(current_user = Depends(get_current_user)):
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0, "password_hash": 0})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    return User(**user_doc)

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), current_user = Depends(get_current_user)):
    MAX_FILE_SIZE = 12 * 1024 * 1024  # 12MB max (augmenté pour correspondre à nginx)
    COMPRESSION_THRESHOLD = 1 * 1024 * 1024  # 1MB - déclenche compression
    TARGET_SIZE = 400 * 1024  # 400KB cible après compression
    
    try:
        # Vérifier que le fichier est présent
        if not file or not file.filename:
            raise HTTPException(
                status_code=400, 
                detail={"error": "missing_file", "detail": "Aucun fichier fourni. Le champ 'file' est requis."}
            )
        
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400, 
                detail={"error": "invalid_type", "detail": "Le fichier doit être une image. Type reçu: " + (file.content_type or "inconnu")}
            )
        
        file_ext = file.filename.split(".")[-1].lower()
        if file_ext not in ["jpg", "jpeg", "png", "webp", "gif"]:
            raise HTTPException(
                status_code=400, 
                detail={"error": "unsupported_format", "detail": f"Format d'image non supporté: .{file_ext}. Formats acceptés: jpg, jpeg, png, webp, gif"}
            )
        
        # Lire le contenu du fichier
        contents = await file.read()
        file_size = len(contents)
        
        # Vérifier la taille maximale
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail={
                    "error": "file_too_large",
                    "detail": f"Le fichier est trop volumineux. Taille maximale autorisée : {MAX_FILE_SIZE / (1024*1024):.0f}MB (fichier reçu : {file_size / (1024*1024):.2f}MB)"
                }
            )
        
        # Toujours convertir en WebP pour de meilleures performances
        unique_filename = f"{uuid.uuid4()}.webp"
        file_path = UPLOAD_DIR / unique_filename
        
        image = Image.open(io.BytesIO(contents))
        original_size = image.size
        
        # Convertir en RGB si nécessaire (pour les PNG avec alpha)
        if image.mode in ('RGBA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if len(image.split()) == 4 else None)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Si le fichier dépasse 1MB, appliquer une compression agressive
        if file_size > COMPRESSION_THRESHOLD:
            # Calculer un facteur de redimensionnement pour atteindre ~400KB
            # Estimation: qualité 75 WebP ~= 0.1-0.2 bytes par pixel selon complexité
            # On vise ~400KB = 400000 bytes, donc ~2-4M pixels max
            target_pixels = TARGET_SIZE * 8  # Estimation conservatrice
            current_pixels = image.size[0] * image.size[1]
            
            if current_pixels > target_pixels:
                # Calculer le ratio de redimensionnement
                scale_factor = (target_pixels / current_pixels) ** 0.5
                new_size = (int(image.size[0] * scale_factor), int(image.size[1] * scale_factor))
                # S'assurer que la taille minimale est respectée
                new_size = (max(new_size[0], 400), max(new_size[1], 400))
                image = image.resize(new_size, Image.Resampling.LANCZOS)
                logger.info(f"Image redimensionnée de {original_size} à {new_size} pour compression")
            
            # Compression agressive avec qualité ajustée
            quality = 60  # Qualité réduite pour fichiers > 1MB
            method = 6  # Méthode de compression maximale
            
            # Essayer différentes qualités jusqu'à atteindre ~400KB
            for attempt_quality in [quality, 50, 40, 30]:
                temp_buffer = io.BytesIO()
                image.save(temp_buffer, "WEBP", quality=attempt_quality, method=method)
                temp_size = temp_buffer.tell()
                
                if temp_size <= TARGET_SIZE * 1.2:  # Accepter jusqu'à 480KB
                    image.save(file_path, "WEBP", quality=attempt_quality, method=method)
                    logger.info(f"Image compressée à {temp_size / 1024:.2f}KB avec qualité {attempt_quality}")
                    break
            else:
                # Si même avec qualité 30 on dépasse, sauvegarder quand même
                image.save(file_path, "WEBP", quality=30, method=method)
                logger.warning(f"Image compressée mais taille finale > 400KB")
        else:
            # Fichier < 1MB : compression normale
            max_size = (800, 800)
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
            image.save(file_path, "WEBP", quality=75, method=4)
        
        # Construire l'URL - utiliser get_base_url pour cohérence
        base_url = await get_base_url(db)
        image_url = f"{base_url}/api/uploads/{unique_filename}"
        
        return {"success": True, "url": image_url, "filename": unique_filename}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "upload_failed",
                "detail": f"Erreur lors de l'upload: {str(e)}"
            }
        )

@api_router.get("/settings/public")
async def get_public_settings():
    settings_docs = await db.settings.find({"key": {"$in": ["logo_url", "contact_phone", "contact_email", "discord_invite_url", "billing_mode", "payments_enabled"]}}, {"_id": 0}).to_list(100)
    
    settings_dict = {s["key"]: s["value"] for s in settings_docs}
    
    if "billing_mode" not in settings_dict:
        settings_dict["billing_mode"] = BillingMode.FREE_TEST
    
    if "payments_enabled" not in settings_dict:
        settings_dict["payments_enabled"] = False
    
    return settings_dict

@api_router.get("/categories")
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

@api_router.get("/articles")
async def get_articles(
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "recent",
    skip: int = 0,
    limit: int = 20
):
    # Catalogue public : seulement les articles avec visible_public != false
    query = {"status": "active", "visible_public": {"$ne": False}}
    
    if category_id:
        query["category_id"] = category_id
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    sort_options = {
        "recent": ("created_at", -1),
        "price_low": ("price", 1),
        "views": ("views", -1)
    }
    
    sort_field, sort_order = sort_options.get(sort, ("created_at", -1))
    
    articles = await db.articles.find(query, {"_id": 0}).sort(sort_field, sort_order).skip(skip).limit(limit).to_list(limit)
    total = await db.articles.count_documents(query)
    
    return {"articles": articles, "total": total}

@api_router.get("/articles/{article_id}")
async def get_article(article_id: str):
    article = await db.articles.find_one({"id": article_id}, {"_id": 0})
    
    if not article:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    await db.articles.update_one({"id": article_id}, {"$inc": {"views": 1}})
    article["views"] = article.get("views", 0) + 1
    
    return article

@api_router.post("/demandes", dependencies=[Depends(require_roles([UserRole.CLIENT, UserRole.ADMIN]))])
async def create_demande(
    background_tasks: BackgroundTasks,
    demande_data: DemandeCreate,
    current_user = Depends(get_current_user)
):
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    deposit_percentage = await get_deposit_percentage()
    deposit_amount = (demande_data.max_price * deposit_percentage) / 100
    
    billing_mode = await get_billing_mode()
    
    demande_id = str(uuid.uuid4())
    demande_doc = {
        "id": demande_id,
        "client_id": user_doc["id"],
        "name": demande_data.name,
        "description": demande_data.description,
        "photos": demande_data.photos,
        "max_price": demande_data.max_price,
        "reference_price": demande_data.reference_price,
        "deposit_amount": deposit_amount if billing_mode == BillingMode.STRIPE_PROD else 0,
        "prefer_delivery": demande_data.prefer_delivery,
        "prefer_hand_delivery": demande_data.prefer_hand_delivery,
        "status": DemandeStatus.ANALYSIS,
        "payment_type": None,
        "deposit_payment_url": None,
        "deposit_requested_at": None,
        "deposit_paid_at": None,
        "deposit_stripe_session_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "can_cancel": True
    }
    
    await db.demandes.insert_one(demande_doc)
    
    # Notification admin : nouvelle demande client
    try:
        await notify_admin(
            db,
            EventType.ADMIN_NEW_CLIENT_REQUEST,
            {
                "title": "Nouvelle demande client",
                "message": f"Une nouvelle demande a été créée par {user_doc.get('first_name', '')} {user_doc.get('last_name', '')}.",
                "demande_id": demande_id,
                "demande_name": demande_data.name,
                "client_name": f"{user_doc.get('first_name', '')} {user_doc.get('last_name', '')}",
                "client_email": user_doc["email"],
                "max_price": demande_data.max_price,
                "deposit_amount": deposit_amount,
                "details": f"<table class='details-table'><tr><td>Demande</td><td>{demande_data.name}</td></tr><tr><td>Prix max</td><td>{demande_data.max_price}€</td></tr><tr><td>Acompte</td><td>{deposit_amount}€</td></tr><tr><td>Client</td><td>{user_doc.get('first_name', '')} {user_doc.get('last_name', '')} ({user_doc['email']})</td></tr></table>"
            },
            background_tasks
        )
    except Exception as e:
        logger.error(f"Erreur notification admin demande: {str(e)}")
    
    # Notification user : demande reçue
    try:
        await notify_user(
            db,
            EventType.USER_REQUEST_RECEIVED,
            user_doc["email"],
            {
                "title": "Votre demande a été reçue",
                "message": f"Votre demande '{demande_data.name}' a été enregistrée avec succès.",
                "demande_id": demande_id,
                "demande_name": demande_data.name,
                "max_price": demande_data.max_price,
                "deposit_amount": deposit_amount,
                "status": "ANALYSIS"
            },
            background_tasks
        )
    except Exception as e:
        logger.error(f"Erreur notification user demande: {str(e)}")
    
    return Demande(**demande_doc)

@api_router.post("/demandes/{demande_id}/pay-deposit", dependencies=[Depends(require_roles([UserRole.CLIENT, UserRole.ADMIN]))])
async def pay_deposit(demande_id: str, current_user = Depends(get_current_user)):
    demande = await db.demandes.find_one({"id": demande_id}, {"_id": 0})
    
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    
    if demande["client_id"] != user_doc["id"] and UserRole.ADMIN not in current_user.roles:
        raise HTTPException(status_code=403, detail="Accès interdit")
    
    if demande["status"] != DemandeStatus.AWAITING_DEPOSIT:
        raise HTTPException(status_code=400, detail="Acompte déjà payé ou demande dans un état invalide")
    
    billing_mode = await get_billing_mode()
    provider = get_billing_provider(billing_mode)
    
    try:
        payment_result = await provider.create_deposit_payment(
            amount=demande["deposit_amount"],
            metadata={"demande_id": demande_id, "client_id": demande["client_id"]}
        )
        
        await db.demandes.update_one(
            {"id": demande_id},
            {
                "$set": {
                    "status": DemandeStatus.DEPOSIT_PAID,
                    "payment_type": payment_result.get("type", "UNKNOWN")
                }
            }
        )
        
        return {"success": True, "message": "Acompte payé avec succès", "payment": payment_result}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/demandes", dependencies=[Depends(require_roles([UserRole.CLIENT, UserRole.ADMIN]))])
async def get_my_demandes(current_user = Depends(get_current_user)):
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    
    query = {}
    if UserRole.ADMIN not in current_user.roles:
        query["client_id"] = user_doc["id"]
    
    demandes = await db.demandes.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return demandes

@api_router.get("/demandes/{demande_id}", dependencies=[Depends(require_roles([UserRole.CLIENT, UserRole.ADMIN]))])
async def get_demande(demande_id: str, current_user = Depends(get_current_user)):
    demande = await db.demandes.find_one({"id": demande_id}, {"_id": 0})
    
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    
    if demande["client_id"] != user_doc["id"] and UserRole.ADMIN not in current_user.roles:
        raise HTTPException(status_code=403, detail="Accès interdit")
    
    return demande

@api_router.post("/demandes/{demande_id}/cancel", dependencies=[Depends(require_roles([UserRole.CLIENT, UserRole.ADMIN]))])
async def cancel_demande(
    demande_id: str, 
    background_tasks: BackgroundTasks,
    data: dict = Body(default={}),
    current_user = Depends(get_current_user)
):
    demande = await db.demandes.find_one({"id": demande_id}, {"_id": 0})
    
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    is_admin = UserRole.ADMIN in current_user.roles
    
    if demande["client_id"] != user_doc["id"] and not is_admin:
        raise HTTPException(status_code=403, detail="Accès interdit")
    
    if demande["status"] == DemandeStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Cette demande est déjà annulée")
    
    # Statuts qui bloquent l'annulation côté client uniquement (admin peut toujours annuler)
    blocking_statuses = [
        DemandeStatus.PROPOSAL_FOUND, 
        DemandeStatus.PURCHASE_LAUNCHED, 
        DemandeStatus.AWAITING_BALANCE,
        DemandeStatus.COMPLETED
    ]
    
    if demande["status"] in blocking_statuses and not is_admin:
        # Récupérer l'email de support depuis les paramètres
        support_setting = await db.settings.find_one({"key": "support_email"}, {"_id": 0})
        contact_setting = await db.settings.find_one({"key": "contact_email"}, {"_id": 0})
        support_email = support_setting["value"] if support_setting else (contact_setting["value"] if contact_setting else "contact@downpricer.com")
        raise HTTPException(
            status_code=400, 
            detail=f"Il n'est pas possible d'annuler cette commande. Veuillez contacter {support_email}"
        )
    
    # Récupérer la raison d'annulation
    cancel_reason = data.get("reason", "")
    
    # Conserver les informations de paiement lors de l'annulation
    update_data = {
        "status": DemandeStatus.CANCELLED,
        "can_cancel": False,
        "cancelled_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Conserver les champs deposit même après annulation
    if demande.get("deposit_paid_at"):
        update_data["deposit_paid_at"] = demande["deposit_paid_at"]
    if demande.get("deposit_stripe_session_id"):
        update_data["deposit_stripe_session_id"] = demande["deposit_stripe_session_id"]
    
    if cancel_reason:
        update_data["cancellation_reason"] = cancel_reason
    
    # Tentative de remboursement si acompte payé (optionnel, ne bloque pas l'annulation)
    billing_mode = await get_billing_mode()
    refund_status = None
    if demande["status"] == DemandeStatus.DEPOSIT_PAID and billing_mode == BillingMode.STRIPE_PROD:
        provider = get_billing_provider(billing_mode)
        try:
            await provider.refund_deposit(
                payment_id=demande.get("deposit_stripe_session_id", demande.get("payment_id", "")),
                amount=demande["deposit_amount"]
            )
            refund_status = "refunded"
            logger.info(f"Remboursement réussi pour demande {demande_id}")
        except Exception as e:
            logger.error(f"Refund error pour demande {demande_id}: {str(e)}")
            refund_status = "refund_failed"
    
    if refund_status:
        update_data["refund_status"] = refund_status
    
    await db.demandes.update_one(
        {"id": demande_id},
        {"$set": update_data}
    )
    
    # Récupérer le client pour les notifications
    client_doc = await db.users.find_one({"id": demande["client_id"]}, {"_id": 0})
    client_email = client_doc["email"] if client_doc else None
    client_name = f"{client_doc.get('first_name', '')} {client_doc.get('last_name', '')}".strip() if client_doc else "Client"
    
    # Notification admin : demande annulée
    try:
        # Calculer le suffixe avant pour éviter backslash dans f-string
        who_cancelled = " par l'admin" if is_admin else " par le client"
        await notify_admin(
            db,
            EventType.ADMIN_NEW_CLIENT_REQUEST,  # Réutiliser le template existant
            {
                "title": "Demande annulée",
                "message": f"La demande '{demande['name']}' a été annulée{who_cancelled}.",
                "demande_id": demande_id,
                "demande_name": demande["name"],
                "client_name": client_name,
                "client_email": client_email or "N/A",
                "status": "CANCELLED",
                "cancellation_reason": cancel_reason or "Non spécifiée",
                "details": f"<table class='details-table'><tr><td>Demande</td><td>{demande['name']}</td></tr><tr><td>Statut</td><td>Annulée</td></tr><tr><td>Raison</td><td>{cancel_reason or 'Non spécifiée'}</td></tr><tr><td>Client</td><td>{client_name}<br><span style='font-size:12px; color:#71717a;'>{client_email or 'N/A'}</span></td></tr></table>"
            },
            background_tasks
        )
    except Exception as e:
        logger.error(f"Erreur notification admin annulation: {str(e)}")
    
    # Notification client : demande annulée
    if client_email:
        try:
            # Construire le message de statut formaté
            status_label = "Annulée"
            status_message = f'<div class="error-box">Votre demande a été annulée.</div>'
            reason_message = f"Raison : {cancel_reason}" if cancel_reason else None
            
            await notify_user(
                db,
                EventType.USER_REQUEST_STATUS_CHANGED,
                client_email,
                {
                    "title": "Votre demande a été annulée",
                    "message": f"Votre demande '{demande['name']}' a été annulée.",
                    "demande_id": demande_id,
                    "demande_name": demande["name"],
                    "status": "CANCELLED",
                    "status_label": status_label,
                    "status_message": status_message,
                    "reason": cancel_reason or "Non spécifiée",
                    "reason_message": reason_message,
                    "base_url": await get_base_url(db)
                },
                background_tasks
            )
        except Exception as e:
            logger.error(f"Erreur notification user annulation: {str(e)}")
    
    return {"success": True, "message": "Demande annulée avec succès"}

@api_router.post("/seller/request", dependencies=[Depends(get_current_user)])
async def request_seller_access(
    background_tasks: BackgroundTasks,
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    current_user = Depends(get_current_user)
):
    request_id = str(uuid.uuid4())
    request_doc = {
        "id": request_id,
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "phone": phone,
        "user_email": current_user.email,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.seller_requests.insert_one(request_doc)
    
    # Notification admin : nouvelle demande vendeur
    try:
        await notify_admin(
            db,
            EventType.ADMIN_NEW_SELLER_APPLICATION,
            {
                "title": "Nouvelle demande de vendeur",
                "message": f"Une nouvelle demande d'accès vendeur a été soumise.",
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "phone": phone,
                "user_email": current_user.email,
                "request_id": request_id,
                "details": f"<table class='details-table'><tr><td>Nom</td><td>{first_name} {last_name}</td></tr><tr><td>Email</td><td>{email}</td></tr><tr><td>Téléphone</td><td>{phone}</td></tr><tr><td>Compte utilisateur</td><td>{current_user.email}</td></tr></table>"
            },
            background_tasks
        )
    except Exception as e:
        logger.error(f"Erreur notification admin seller request: {str(e)}")
    
    # Notification user : demande reçue
    try:
        await notify_user(
            db,
            EventType.USER_SELLER_APPLICATION_RECEIVED,
            current_user.email,
            {
                "title": "Votre demande vendeur a été reçue",
                "message": "Votre demande d'accès vendeur a été enregistrée. Nous vous contacterons sous peu."
            },
            background_tasks
        )
    except Exception as e:
        logger.error(f"Erreur notification user seller request: {str(e)}")
    
    return {"success": True, "message": "Demande envoyée. Nous vous contacterons par email."}

@api_router.get("/seller/articles", dependencies=[Depends(require_roles([UserRole.SELLER, UserRole.ADMIN]))])
async def get_seller_articles(
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    current_user = Depends(get_current_user)
):
    query = {"status": "active", "stock": {"$gt": 0}}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    articles = await db.articles.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    for article in articles:
        article["potential_profit"] = article["reference_price"] - article["price"]
    
    return articles

@api_router.post("/seller/sales", dependencies=[Depends(require_roles([UserRole.SELLER, UserRole.ADMIN]))])
async def create_seller_sale(
    background_tasks: BackgroundTasks,
    sale_data: SellerSaleCreate,
    current_user = Depends(get_current_user)
):
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    article = await db.articles.find_one({"id": sale_data.article_id}, {"_id": 0})
    
    if not article:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    current_stock = article.get("stock", 1)
    if current_stock <= 0:
        raise HTTPException(status_code=400, detail="Article en rupture de stock")
    
    sale_id = str(uuid.uuid4())
    profit = sale_data.sale_price - article["price"]
    
    sale_doc = {
        "id": sale_id,
        "seller_id": user_doc["id"],
        "article_id": sale_data.article_id,
        "article_name": article["name"],
        "sale_price": sale_data.sale_price,
        "seller_cost": article["price"],
        "profit": profit,
        "status": SaleStatus.WAITING_ADMIN_APPROVAL,
        "payment_proof": None,
        "payment_method": None,
        "tracking_number": None,
        "rejection_reason": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None
    }
    
    await db.seller_sales.insert_one(sale_doc)
    
    new_stock = current_stock - 1
    await db.articles.update_one(
        {"id": sale_data.article_id},
        {"$set": {"stock": new_stock}}
    )
    
    # Notification admin : nouvelle vente à valider
    try:
        await notify_admin(
            db,
            EventType.ADMIN_NEW_SALE,
            {
                "title": "Nouvelle vente à valider",
                "message": f"Une nouvelle vente nécessite votre validation.",
                "article_name": article["name"],
                "sale_price": sale_data.sale_price,
                "profit": profit,
                "seller_name": f"{user_doc.get('first_name', '')} {user_doc.get('last_name', '')}",
                "seller_email": user_doc["email"],
                "sale_id": sale_id,
                "details": f"<table class='details-table'><tr><td>Article</td><td>{article['name']}</td></tr><tr><td>Prix de vente</td><td>{sale_data.sale_price}€</td></tr><tr><td>Profit</td><td>{profit}€</td></tr><tr><td>Vendeur</td><td>{user_doc.get('first_name', '')} {user_doc.get('last_name', '')} ({user_doc['email']})</td></tr></table>"
            },
            background_tasks
        )
    except Exception as e:
        logger.error(f"Erreur notification admin sale: {str(e)}")
    
    return {"success": True, "message": "Vente enregistrée. Elle sera validée par DownPricer.", "sale": SellerSale(**sale_doc)}

@api_router.get("/seller/sales", dependencies=[Depends(require_roles([UserRole.SELLER, UserRole.ADMIN]))])
async def get_seller_sales(current_user = Depends(get_current_user)):
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    
    query = {}
    if UserRole.ADMIN not in current_user.roles:
        query["seller_id"] = user_doc["id"]
    
    sales = await db.seller_sales.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return sales

@api_router.get("/seller/stats", dependencies=[Depends(require_roles([UserRole.SELLER, UserRole.ADMIN]))])
async def get_seller_stats(current_user = Depends(get_current_user)):
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    
    query = {"seller_id": user_doc["id"]}
    
    sales = await db.seller_sales.find(query, {"_id": 0}).to_list(1000)
    
    total_revenue = sum(s["sale_price"] for s in sales if s["status"] == SaleStatus.COMPLETED)
    total_sales = len([s for s in sales if s["status"] == SaleStatus.COMPLETED])
    total_profit = sum(s["profit"] for s in sales if s["status"] == SaleStatus.COMPLETED)
    
    pending_payments = [s for s in sales if s["status"] == SaleStatus.PAYMENT_PENDING]
    
    return {
        "total_revenue": total_revenue,
        "total_sales": total_sales,
        "total_profit": total_profit,
        "pending_payments": len(pending_payments)
    }

@api_router.get("/admin/dashboard", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def get_admin_dashboard():
    total_users = await db.users.count_documents({})
    total_articles = await db.articles.count_documents({"status": "active"})
    total_demandes = await db.demandes.count_documents({})
    total_sales = await db.seller_sales.count_documents({})
    
    recent_demandes = await db.demandes.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_users": total_users,
        "total_articles": total_articles,
        "total_demandes": total_demandes,
        "total_sales": total_sales,
        "recent_demandes": recent_demandes
    }

@api_router.post("/admin/articles", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def create_article(article_data: ArticleCreate):
    article_id = str(uuid.uuid4())
    article_doc = {
        "id": article_id,
        "name": article_data.name,
        "description": article_data.description,
        "photos": article_data.photos,
        "price": article_data.price,
        "reference_price": article_data.reference_price,
        "category_id": article_data.category_id,
        "platform_links": article_data.platform_links,
        "stock": article_data.stock,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "views": 0
    }
    
    await db.articles.insert_one(article_doc)
    
    return Article(**article_doc)

@api_router.put("/admin/articles/{article_id}", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def update_article(article_id: str, article_data: ArticleCreate):
    article = await db.articles.find_one({"id": article_id}, {"_id": 0})
    
    if not article:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    await db.articles.update_one(
        {"id": article_id},
        {"$set": article_data.model_dump()}
    )
    
    return {"success": True, "message": "Article mis à jour"}

@api_router.patch("/admin/articles/{article_id}/stock", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def update_article_stock(article_id: str, data: dict):
    stock = data.get("stock", 0)
    
    if stock < 0:
        raise HTTPException(status_code=400, detail="Le stock ne peut pas être négatif")
    
    result = await db.articles.update_one(
        {"id": article_id},
        {"$set": {"stock": stock}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    return {"success": True, "message": f"Stock mis à jour: {stock}"}

@api_router.patch("/admin/articles/{article_id}/visibility", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def update_article_visibility(article_id: str, visibility: dict = Body(...)):
    update_fields = {}
    if "visible_public" in visibility:
        update_fields["visible_public"] = visibility["visible_public"]
    if "visible_seller" in visibility:
        update_fields["visible_seller"] = visibility["visible_seller"]
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")
    
    result = await db.articles.update_one(
        {"id": article_id},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    return {"success": True, "message": "Visibilité mise à jour"}

@api_router.delete("/admin/articles/{article_id}", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def delete_article(article_id: str):
    result = await db.articles.update_one(
        {"id": article_id},
        {"$set": {"status": "deleted"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    return {"success": True, "message": "Article supprimé"}

@api_router.post("/admin/categories", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def create_category(category_data: CategoryCreate):
    category_id = str(uuid.uuid4())
    category_doc = {
        "id": category_id,
        "name": category_data.name,
        "slug": category_data.slug,
        "icon": category_data.icon
    }
    
    await db.categories.insert_one(category_doc)
    
    return {"success": True, "category": Category(**category_doc)}

# ===== ROUTES ADMIN MANQUANTES =====

@api_router.patch("/admin/demandes/{demande_id}/cancel", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def admin_cancel_demande(
    demande_id: str,
    background_tasks: BackgroundTasks,
    data: dict = Body(default={})
):
    """
    Endpoint admin spécifique pour annuler une demande même après acompte payé.
    Conserve toutes les informations de paiement.
    """
    demande = await db.demandes.find_one({"id": demande_id}, {"_id": 0})
    
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    if demande["status"] == DemandeStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Cette demande est déjà annulée")
    
    cancel_reason = data.get("reason", "")
    
    # Conserver les informations de paiement lors de l'annulation
    update_data = {
        "status": DemandeStatus.CANCELLED,
        "can_cancel": False,
        "cancelled_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Conserver les champs deposit même après annulation
    if demande.get("deposit_paid_at"):
        update_data["deposit_paid_at"] = demande["deposit_paid_at"]
    if demande.get("deposit_stripe_session_id"):
        update_data["deposit_stripe_session_id"] = demande["deposit_stripe_session_id"]
    if demande.get("deposit_requested_at"):
        update_data["deposit_requested_at"] = demande["deposit_requested_at"]
    
    if cancel_reason:
        update_data["cancellation_reason"] = cancel_reason
    
    # Tentative de remboursement si acompte payé (optionnel)
    billing_mode = await get_billing_mode()
    refund_status = None
    if demande["status"] == DemandeStatus.DEPOSIT_PAID and billing_mode == BillingMode.STRIPE_PROD:
        provider = get_billing_provider(billing_mode)
        try:
            await provider.refund_deposit(
                payment_id=demande.get("deposit_stripe_session_id", demande.get("payment_id", "")),
                amount=demande["deposit_amount"]
            )
            refund_status = "refunded"
            logger.info(f"Remboursement réussi pour demande {demande_id}")
        except Exception as e:
            logger.error(f"Refund error pour demande {demande_id}: {str(e)}")
            refund_status = "refund_failed"
    
    if refund_status:
        update_data["refund_status"] = refund_status
    
    await db.demandes.update_one(
        {"id": demande_id},
        {"$set": update_data}
    )
    
    # Récupérer le client pour les notifications
    client_doc = await db.users.find_one({"id": demande["client_id"]}, {"_id": 0})
    client_email = client_doc["email"] if client_doc else None
    client_name = f"{client_doc.get('first_name', '')} {client_doc.get('last_name', '')}".strip() if client_doc else "Client"
    
    # Notification admin
    try:
        await notify_admin(
            db,
            EventType.ADMIN_NEW_CLIENT_REQUEST,
            {
                "title": "Demande annulée par l'admin",
                "message": f"La demande '{demande['name']}' a été annulée par l'admin.",
                "demande_id": demande_id,
                "demande_name": demande["name"],
                "client_name": client_name,
                "client_email": client_email or "N/A",
                "status": "CANCELLED",
                "cancellation_reason": cancel_reason or "Non spécifiée",
                "details": f"<table class='details-table'><tr><td>Demande</td><td>{demande['name']}</td></tr><tr><td>Statut</td><td>Annulée</td></tr><tr><td>Raison</td><td>{cancel_reason or 'Non spécifiée'}</td></tr><tr><td>Client</td><td>{client_name}<br><span style='font-size:12px; color:#71717a;'>{client_email or 'N/A'}</span></td></tr></table>"
            },
            background_tasks
        )
    except Exception as e:
        logger.error(f"Erreur notification admin annulation: {str(e)}")
    
    # Notification client
    if client_email:
        try:
            # Construire le message de statut formaté
            status_label = "Annulée"
            status_message = f'<div class="error-box">Votre demande a été annulée par l\'administrateur.</div>'
            reason_message = f"Raison : {cancel_reason}" if cancel_reason else None
            
            base_url = await get_base_url(db)
            
            await notify_user(
                db,
                EventType.USER_REQUEST_STATUS_CHANGED,
                client_email,
                {
                    "title": "Votre demande a été annulée",
                    "message": f"Votre demande '{demande['name']}' a été annulée par l\'administrateur.",
                    "demande_id": demande_id,
                    "demande_name": demande["name"],
                    "status": "CANCELLED",
                    "status_label": status_label,
                    "status_message": status_message,
                    "reason": cancel_reason or "Non spécifiée",
                    "reason_message": reason_message,
                    "base_url": base_url
                },
                background_tasks
            )
        except Exception as e:
            logger.error(f"Erreur notification user annulation: {str(e)}")
    
    return {"success": True, "message": "Demande annulée avec succès"}

@api_router.put("/admin/demandes/{demande_id}/status", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def admin_update_demande_status(
    demande_id: str, 
    background_tasks: BackgroundTasks,
    data: dict
):
    new_status = data.get("status")
    reason = data.get("reason", "")
    
    if not new_status:
        raise HTTPException(status_code=400, detail="Statut requis")
    
    try:
        status_enum = DemandeStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Statut invalide")
    
    demande = await db.demandes.find_one({"id": demande_id}, {"_id": 0})
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    can_cancel = new_status not in [DemandeStatus.PURCHASE_LAUNCHED, DemandeStatus.COMPLETED, DemandeStatus.CANCELLED]
    
    update_data = {"status": new_status, "can_cancel": can_cancel}
    if new_status == DemandeStatus.CANCELLED and reason:
        update_data["cancellation_reason"] = reason
        update_data["cancelled_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.demandes.update_one(
        {"id": demande_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    # Notification client si le statut change (sauf si déjà annulé)
    if new_status != demande.get("status") and new_status != DemandeStatus.CANCELLED:
        client_doc = await db.users.find_one({"id": demande["client_id"]}, {"_id": 0})
        if client_doc:
            # Construire le message de statut formaté
            # Mapping des statuts vers libellés lisibles
            status_labels = {
                "ANALYSIS": "En analyse",
                "DEPOSIT_PENDING": "En attente d'acompte",
                "DEPOSIT_PAID": "Acompte payé",
                "ANALYSIS_AFTER_DEPOSIT": "En analyse (après acompte)",
                "AWAITING_DEPOSIT": "En attente d'acompte",
                "ACCEPTED": "Acceptée",
                "IN_ANALYSIS": "En analyse",
                "PROPOSAL_FOUND": "Proposition trouvée",
                "AWAITING_BALANCE": "En attente du solde",
                "COMPLETED": "Terminée",
                "CANCELLED": "Annulée",
                "PURCHASE_LAUNCHED": "Achat lancé"
            }
            status_label = status_labels.get(new_status, new_status)
            
            # Déterminer le type de message selon le statut
            if new_status in [DemandeStatus.ACCEPTED, DemandeStatus.PROPOSAL_FOUND]:
                status_message = f'<div class="success-box">Votre demande a été acceptée !</div>'
            elif new_status == DemandeStatus.DEPOSIT_PAID:
                status_message = f'<div class="info-box">Votre acompte a été reçu et validé.</div>'
            elif new_status == DemandeStatus.COMPLETED:
                status_message = f'<div class="success-box">Votre demande est terminée !</div>'
            else:
                status_message = f'<div class="info-box">Le statut de votre demande a été mis à jour.</div>'
            
            reason_message = f"Raison : {reason}" if reason else None
            
            base_url = await get_base_url(db)
            
            try:
                await notify_user(
                    db,
                    EventType.USER_REQUEST_STATUS_CHANGED,
                    client_doc["email"],
                    {
                        "title": "Mise à jour de votre demande",
                        "message": f"Le statut de votre demande '{demande['name']}' a été mis à jour.",
                        "demande_id": demande_id,
                        "demande_name": demande["name"],
                        "status": new_status,
                        "status_label": status_label,
                        "status_message": status_message,
                        "reason": reason or "",
                        "reason_message": reason_message,
                        "base_url": base_url
                    },
                    background_tasks
                )
            except Exception as e:
                logger.error(f"Erreur notification user changement statut: {str(e)}")
    
    return {"success": True, "message": f"Statut mis à jour: {new_status}"}

@api_router.patch("/admin/demandes/{demande_id}/request-deposit", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def admin_request_deposit(
    background_tasks: BackgroundTasks,
    demande_id: str,
    data: dict = Body(...)
):
    """
    Demande un acompte pour une demande
    L'admin peut soit fournir un lien Stripe existant, soit générer une nouvelle session checkout
    """
    demande = await db.demandes.find_one({"id": demande_id}, {"_id": 0})
    
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    if demande["status"] != DemandeStatus.ANALYSIS:
        raise HTTPException(status_code=400, detail="Seules les demandes en analyse peuvent recevoir une demande d'acompte")
    
    deposit_payment_url = data.get("deposit_payment_url", "").strip()
    generate_stripe_session = data.get("generate_stripe_session", False)
    
    if not deposit_payment_url and not generate_stripe_session:
        raise HTTPException(status_code=400, detail="Soit 'deposit_payment_url' soit 'generate_stripe_session' doit être fourni")
    
    # Si on doit générer une session Stripe
    if generate_stripe_session:
        from stripe_billing import create_deposit_checkout_session
        
        user = await db.users.find_one({"id": demande["client_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        try:
            result = await create_deposit_checkout_session(
                db,
                demande_id,
                demande["client_id"],
                user.get("email", ""),
                demande["deposit_amount"]
            )
            
            if not result.get("success"):
                raise HTTPException(status_code=500, detail=result.get("error", "Erreur lors de la création de la session Stripe"))
            
            deposit_payment_url = result.get("url")
            deposit_stripe_session_id = result.get("session_id")
        except Exception as e:
            logger.error(f"Erreur création session Stripe pour acompte: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erreur lors de la création de la session: {str(e)}")
    else:
        deposit_stripe_session_id = None
    
    # Mettre à jour la demande
    now = datetime.now(timezone.utc).isoformat()
    update_data = {
        "status": DemandeStatus.DEPOSIT_PENDING,
        "deposit_payment_url": deposit_payment_url,
        "deposit_requested_at": now
    }
    
    if deposit_stripe_session_id:
        update_data["deposit_stripe_session_id"] = deposit_stripe_session_id
    
    await db.demandes.update_one(
        {"id": demande_id},
        {"$set": update_data}
    )
    
    # Envoyer un email au client
    user = await db.users.find_one({"id": demande["client_id"]}, {"_id": 0})
    if user:
        try:
            await notify_user(
                db,
                EventType.USER_PAYMENT_REQUIRED,
                user["email"],
                {
                    "title": "Acompte requis pour votre demande",
                    "message": f"Un acompte de {demande['deposit_amount']}€ est requis pour votre demande '{demande['name']}'.",
                    "demande_id": demande_id,
                    "demande_name": demande["name"],
                    "deposit_amount": demande["deposit_amount"],
                    "deposit_payment_url": deposit_payment_url,
                    "action_button": f'<a href="{deposit_payment_url}" style="display: inline-block; padding: 12px 24px; background-color: #FF5722; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Payer l\'acompte</a>',
                    "details": f"<p>Veuillez cliquer sur le lien ci-dessous pour procéder au paiement de l\'acompte :</p><p><a href=\'{deposit_payment_url}\'>{deposit_payment_url}</a></p>"
                },
                background_tasks
            )
        except Exception as e:
            logger.error(f"Erreur notification user acompte: {str(e)}")
    
    return {
        "success": True,
        "message": "Demande d'acompte envoyée",
        "deposit_payment_url": deposit_payment_url,
        "deposit_stripe_session_id": deposit_stripe_session_id
    }

@api_router.get("/admin/settings", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def admin_get_all_settings():
    settings = await db.settings.find({}, {"_id": 0}).to_list(1000)
    
    settings_dict = {}
    for setting in settings:
        settings_dict[setting["key"]] = setting["value"]
    
    return settings_dict

@api_router.put("/admin/settings/{key}", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def admin_update_setting(key: str, data: dict):
    value = data.get("value")
    
    if value is None:
        raise HTTPException(status_code=400, detail="Valeur requise")
    
    existing = await db.settings.find_one({"key": key}, {"_id": 0})
    
    if existing:
        await db.settings.update_one(
            {"key": key},
            {"$set": {"value": value}}
        )
    else:
        await db.settings.insert_one({
            "key": key,
            "value": value
        })
    
    return {"success": True, "message": f"Paramètre {key} mis à jour"}

@api_router.post("/admin/sales/{sale_id}/reject-payment", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def admin_reject_payment(sale_id: str, data: dict):
    reason = data.get("reason", "Paiement refusé par l'admin")
    
    sale = await db.seller_sales.find_one({"id": sale_id}, {"_id": 0})
    
    if not sale:
        raise HTTPException(status_code=404, detail="Vente non trouvée")
    
    if sale["status"] != SaleStatus.PAYMENT_SUBMITTED:
        raise HTTPException(status_code=400, detail="Le paiement n'est pas en attente de validation")
    
    await db.seller_sales.update_one(
        {"id": sale_id},
        {
            "$set": {
                "status": SaleStatus.PAYMENT_PENDING,
                "rejection_reason": reason,
                "payment_proof": None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"success": True, "message": "Paiement refusé"}

@api_router.post("/admin/sales/{sale_id}/mark-shipped", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def admin_mark_shipped(sale_id: str, data: dict):
    tracking_number = data.get("tracking_number", "")
    
    sale = await db.seller_sales.find_one({"id": sale_id}, {"_id": 0})
    
    if not sale:
        raise HTTPException(status_code=404, detail="Vente non trouvée")
    
    if sale["status"] != SaleStatus.SHIPPING_PENDING:
        raise HTTPException(status_code=400, detail="La vente n'est pas prête pour l'expédition")
    
    await db.seller_sales.update_one(
        {"id": sale_id},
        {
            "$set": {
                "status": SaleStatus.SHIPPED,
                "tracking_number": tracking_number,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"success": True, "message": "Vente marquée comme expédiée"}

# ===== MINI-SITES ROUTES =====

@api_router.post("/minisites", dependencies=[Depends(require_roles([UserRole.CLIENT, UserRole.ADMIN]))])
async def create_minisite(
    background_tasks: BackgroundTasks,
    site_data: MiniSiteCreate,
    current_user = Depends(get_current_user)
):
    
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    
    # Vérifier que le slug n'existe pas déjà
    existing = await db.minisites.find_one({"slug": site_data.slug}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Ce slug est déjà utilisé")
    
    # Vérifier que l'utilisateur n'a pas déjà un mini-site
    existing_user_site = await db.minisites.find_one({"user_id": user_doc["id"]}, {"_id": 0})
    if existing_user_site:
        raise HTTPException(status_code=400, detail="Vous avez déjà un mini-site")
    
    # Utiliser site_plan de l'utilisateur comme source de vérité unique si disponible
    user_site_plan = user_doc.get("site_plan")
    final_plan_id = user_site_plan if user_site_plan else site_data.plan_id
    
    # Valider que le plan est valide
    if final_plan_id not in ["SITE_PLAN_1", "SITE_PLAN_2", "SITE_PLAN_3"]:
        raise HTTPException(status_code=400, detail=f"Plan invalide: {final_plan_id}")
    
    site_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    site_doc = {
        "id": site_id,
        "user_id": user_doc["id"],
        "user_email": user_doc["email"],
        "plan_id": final_plan_id,
        "site_name": site_data.site_name,
        "slug": site_data.slug,
        "logo_url": None,
        "welcome_text": site_data.welcome_text or "",
        "template": site_data.template or "template1",
        "primary_color": site_data.primary_color or "#FF5722",
        "font_family": site_data.font_family or "Arial",
        "articles": [],
        "views": 0,
        "status": "active",
        "logo_changes_count": 0,
        "name_changes_count": 0,
        "last_logo_change": None,
        "last_name_change": None,
        "created_at": now,
        "updated_at": None
    }
    
    await db.minisites.insert_one(site_doc)
    
    # Ajouter le rôle correspondant à l'utilisateur
    roles = user_doc.get("roles", [])
    if site_data.plan_id not in roles:
        roles.append(site_data.plan_id)
        await db.users.update_one({"id": user_doc["id"]}, {"$set": {"roles": roles}})
    
    # Notification admin : nouveau mini-site
    try:
        await notify_admin(
            db,
            EventType.ADMIN_NEW_MINISITE,
            {
                "title": "Nouveau mini-site créé",
                "message": f"Un nouveau mini-site a été créé.",
                "site_name": site_data.site_name,
                "slug": site_data.slug,
                "user_email": user_doc["email"],
                "plan_id": site_data.plan_id,
                "site_id": site_id,
                "details": f"<table class='details-table'><tr><td>Nom du site</td><td>{site_data.site_name}</td></tr><tr><td>Slug</td><td>{site_data.slug}</td></tr><tr><td>Plan</td><td>{site_data.plan_id}</td></tr><tr><td>Utilisateur</td><td>{user_doc['email']}</td></tr></table>"
            },
            background_tasks
        )
    except Exception as e:
        logger.error(f"Erreur notification admin minisite: {str(e)}")
    
    # Notification user : mini-site créé
    try:
        await notify_user(
            db,
            EventType.USER_MINISITE_CREATED,
            user_doc["email"],
            {
                "title": "Votre mini-site a été créé",
                "message": f"Félicitations ! Votre mini-site '{site_data.site_name}' est maintenant en ligne.",
                "site_name": site_data.site_name,
                "slug": site_data.slug,
                "plan_id": site_data.plan_id
            },
            background_tasks
        )
    except Exception as e:
        logger.error(f"Erreur notification user minisite: {str(e)}")
    
    return {"success": True, "minisite": MiniSite(**site_doc)}

@api_router.get("/minisites/my", dependencies=[Depends(require_roles([UserRole.CLIENT, UserRole.ADMIN]))])
async def get_my_minisite(current_user = Depends(get_current_user)):
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    minisite = await db.minisites.find_one({"user_id": user_doc["id"]}, {"_id": 0})
    
    if not minisite:
        raise HTTPException(status_code=404, detail="Aucun mini-site trouvé")
    
    return minisite

@api_router.get("/minisites/slug/{slug}")
async def get_minisite_by_slug(slug: str):
    minisite = await db.minisites.find_one({"slug": slug}, {"_id": 0})
    
    if not minisite or minisite.get("status") != "active":
        raise HTTPException(status_code=404, detail="Mini-site non trouvé")
    
    # Incrémenter les vues
    await db.minisites.update_one({"slug": slug}, {"$inc": {"views": 1}})
    
    # Récupérer les articles du mini-site par minisite_id (pas par liste d'ids)
    articles = await db.minisite_articles.find(
        {"minisite_id": minisite["id"], "status": {"$ne": "suspended"}}, 
        {"_id": 0}
    ).to_list(100)
    
    minisite["articles_data"] = articles
    
    return minisite

@api_router.put("/minisites/{site_id}", dependencies=[Depends(require_roles([UserRole.CLIENT, UserRole.ADMIN]))])
async def update_minisite(site_id: str, updates: dict, current_user = Depends(get_current_user)):
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    minisite = await db.minisites.find_one({"id": site_id}, {"_id": 0})
    
    if not minisite:
        raise HTTPException(status_code=404, detail="Mini-site non trouvé")
    
    # Vérifier que l'utilisateur est propriétaire (sauf admin)
    if "ADMIN" not in user_doc.get("roles", []) and minisite["user_id"] != user_doc["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = {}
    
    # Gérer les limites de modification selon le plan
    plan_limits = {
        "SITE_PLAN_1": {"logo_changes_per_month": 1, "name_changes_per_month": 1},
        "SITE_PLAN_2": {"logo_changes_per_month": 10, "name_changes_per_month": 10},
        "SITE_PLAN_3": {"logo_changes_per_month": 999, "name_changes_per_month": 999}
    }
    
    limits = plan_limits.get(minisite["plan_id"], {"logo_changes_per_month": 1, "name_changes_per_month": 1})
    
    # Changement de logo
    if "logo_url" in updates:
        last_change = minisite.get("last_logo_change")
        changes_count = minisite.get("logo_changes_count", 0)
        
        if last_change:
            last_date = datetime.fromisoformat(last_change)
            if (datetime.now(timezone.utc) - last_date).days < 30 and changes_count >= limits["logo_changes_per_month"]:
                raise HTTPException(status_code=400, detail=f"Limite de {limits['logo_changes_per_month']} changement(s) de logo par mois atteinte")
        
        update_data["logo_url"] = updates["logo_url"]
        update_data["last_logo_change"] = now
        update_data["logo_changes_count"] = changes_count + 1
    
    # Changement de nom
    if "site_name" in updates:
        last_change = minisite.get("last_name_change")
        changes_count = minisite.get("name_changes_count", 0)
        
        if last_change:
            last_date = datetime.fromisoformat(last_change)
            if (datetime.now(timezone.utc) - last_date).days < 30 and changes_count >= limits["name_changes_per_month"]:
                raise HTTPException(status_code=400, detail=f"Limite de {limits['name_changes_per_month']} changement(s) de nom par mois atteinte")
        
        update_data["site_name"] = updates["site_name"]
        update_data["last_name_change"] = now
        update_data["name_changes_count"] = changes_count + 1
    
    # Autres mises à jour simples
    allowed_fields = ["welcome_text", "template", "primary_color", "font_family"]
    for field in allowed_fields:
        if field in updates:
            update_data[field] = updates[field]
    
    if update_data:
        update_data["updated_at"] = now
        await db.minisites.update_one({"id": site_id}, {"$set": update_data})
    
    return {"success": True, "message": "Mini-site mis à jour"}

@api_router.post("/minisites/{site_id}/articles", dependencies=[Depends(require_roles([UserRole.CLIENT, UserRole.ADMIN]))])
async def add_minisite_article(site_id: str, article_data: MiniSiteArticleCreate, current_user = Depends(get_current_user)):
    
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    minisite = await db.minisites.find_one({"id": site_id}, {"_id": 0})
    
    if not minisite:
        raise HTTPException(status_code=404, detail="Mini-site non trouvé")
    
    if "ADMIN" not in user_doc.get("roles", []) and minisite["user_id"] != user_doc["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    # Vérifier quotas d'articles selon le plan
    plan_quotas = {
        "SITE_PLAN_1": 5,
        "SITE_PLAN_2": 10,
        "SITE_PLAN_3": 20
    }
    
    max_articles = plan_quotas.get(minisite["plan_id"], 5)
    current_articles = len(minisite.get("articles", []))
    
    if current_articles >= max_articles:
        raise HTTPException(status_code=400, detail=f"Quota d'articles atteint ({max_articles} max pour votre plan)")
    
    article_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    article_doc = {
        "id": article_id,
        "minisite_id": site_id,
        "name": article_data.name,
        "description": article_data.description,
        "photos": article_data.photos,
        "price": article_data.price,
        "reference_price": article_data.reference_price,
        "platform_links": article_data.platform_links,
        "created_at": now
    }
    
    await db.minisite_articles.insert_one(article_doc)
    
    # Ajouter l'article à la liste du mini-site
    articles_list = minisite.get("articles", [])
    articles_list.append(article_id)
    await db.minisites.update_one({"id": site_id}, {"$set": {"articles": articles_list}})
    
    return {"success": True, "article": MiniSiteArticle(**article_doc)}

@api_router.get("/minisites/{site_id}/articles", dependencies=[Depends(require_roles([UserRole.CLIENT, UserRole.ADMIN]))])
async def get_minisite_articles(site_id: str, current_user = Depends(get_current_user)):
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    minisite = await db.minisites.find_one({"id": site_id}, {"_id": 0})
    
    if not minisite:
        raise HTTPException(status_code=404, detail="Mini-site non trouvé")
    
    if "ADMIN" not in user_doc.get("roles", []) and minisite["user_id"] != user_doc["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    articles = await db.minisite_articles.find({"minisite_id": site_id}, {"_id": 0}).to_list(100)
    
    return articles

@api_router.delete("/minisites/{site_id}/articles/{article_id}", dependencies=[Depends(require_roles([UserRole.CLIENT, UserRole.ADMIN]))])
async def delete_minisite_article(site_id: str, article_id: str, current_user = Depends(get_current_user)):
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    minisite = await db.minisites.find_one({"id": site_id}, {"_id": 0})
    
    if not minisite:
        raise HTTPException(status_code=404, detail="Mini-site non trouvé")
    
    if "ADMIN" not in user_doc.get("roles", []) and minisite["user_id"] != user_doc["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.minisite_articles.delete_one({"id": article_id, "minisite_id": site_id})
    
    # Retirer de la liste
    articles_list = minisite.get("articles", [])
    if article_id in articles_list:
        articles_list.remove(article_id)
        await db.minisites.update_one({"id": site_id}, {"$set": {"articles": articles_list}})
    
    return {"success": True, "message": "Article supprimé"}

# Admin routes pour mini-sites
@api_router.get("/admin/minisites", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def admin_get_all_minisites():
    minisites = await db.minisites.find({}, {"_id": 0}).to_list(1000)
    return minisites

@api_router.patch("/admin/minisites/{site_id}/status", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def admin_update_minisite_status(site_id: str, data: dict = Body(...)):
    status = data.get("status", "active")
    reason = data.get("reason", "")
    
    update_data = {
        "status": status, 
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Si suspendu ou supprimé, enregistrer la raison
    if status in ["suspended", "deleted"]:
        update_data["suspension_reason"] = reason
        update_data["suspended_at"] = datetime.now(timezone.utc).isoformat()
        
        # Désactiver les abonnements associés si suspendu/supprimé
        minisite = await db.minisites.find_one({"id": site_id}, {"_id": 0})
        if minisite:
            # Retirer le rôle SITE_PLAN_* de l'utilisateur
            user = await db.users.find_one({"id": minisite.get("user_id")})
            if user:
                new_roles = [r for r in user.get("roles", []) if not r.startswith("SITE_PLAN_")]
                await db.users.update_one(
                    {"id": user["id"]},
                    {"$set": {"roles": new_roles}}
                )
    
    result = await db.minisites.update_one(
        {"id": site_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Mini-site non trouvé")
    
    return {"success": True, "message": f"Statut mis à jour: {status}"}

@api_router.get("/admin/minisites/{site_id}", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def admin_get_minisite_detail(site_id: str):
    minisite = await db.minisites.find_one({"id": site_id}, {"_id": 0})
    if not minisite:
        raise HTTPException(status_code=404, detail="Mini-site non trouvé")
    
    # Récupérer les articles du mini-site
    articles = await db.minisite_articles.find({"minisite_id": site_id}, {"_id": 0}).to_list(100)
    minisite["articles"] = articles
    
    # Récupérer info utilisateur
    user = await db.users.find_one({"id": minisite.get("user_id")}, {"_id": 0, "password_hash": 0})
    minisite["user"] = user
    
    return minisite

@api_router.get("/admin/minisite-articles", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def admin_get_all_minisite_articles():
    """Liste tous les articles de tous les mini-sites pour modération"""
    articles = await db.minisite_articles.find({}, {"_id": 0}).to_list(1000)
    
    # Enrichir avec les infos du mini-site
    for article in articles:
        minisite = await db.minisites.find_one({"id": article.get("minisite_id")}, {"_id": 0, "site_name": 1, "user_email": 1, "status": 1})
        if minisite:
            article["minisite_name"] = minisite.get("site_name")
            article["minisite_email"] = minisite.get("user_email")
            article["minisite_status"] = minisite.get("status")
    
    return articles

@api_router.patch("/admin/minisite-articles/{article_id}/status", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def admin_update_minisite_article_status(article_id: str, data: dict = Body(...)):
    """Suspendre ou supprimer un article de mini-site"""
    status = data.get("status", "active")
    reason = data.get("reason", "")
    
    update_data = {"status": status}
    if status in ["suspended", "deleted"]:
        update_data["moderation_reason"] = reason
        update_data["moderated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.minisite_articles.update_one(
        {"id": article_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    return {"success": True, "message": f"Statut article mis à jour: {status}"}

@api_router.delete("/admin/minisites/{site_id}", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def admin_delete_minisite(site_id: str, data: dict = Body(...)):
    """Supprimer définitivement un mini-site"""
    reason = data.get("reason", "Suppression administrative")
    
    minisite = await db.minisites.find_one({"id": site_id}, {"_id": 0})
    if not minisite:
        raise HTTPException(status_code=404, detail="Mini-site non trouvé")
    
    # Retirer le rôle SITE_PLAN_* de l'utilisateur
    user = await db.users.find_one({"id": minisite.get("user_id")})
    if user:
        new_roles = [r for r in user.get("roles", []) if not r.startswith("SITE_PLAN_")]
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"roles": new_roles}}
        )
    
    # Marquer comme supprimé (soft delete)
    await db.minisites.update_one(
        {"id": site_id},
        {"$set": {
            "status": "deleted",
            "deletion_reason": reason,
            "deleted_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Mini-site supprimé"}

@api_router.get("/admin/users", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def get_all_users():
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.get("/admin/subscriptions", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def get_all_subscriptions():
    """
    Récupère tous les abonnements Mini-site depuis la collection subscriptions
    """
    subscriptions = await db.subscriptions.find(
        {"product": "minisite"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    # Enrichir avec les infos utilisateur
    for sub in subscriptions:
        user = await db.users.find_one(
            {"id": sub.get("user_id")},
            {"_id": 0, "first_name": 1, "last_name": 1, "email": 1}
        )
        if user:
            sub["user_name"] = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
            sub["user_email"] = user.get("email", sub.get("user_email", ""))
    
    return subscriptions

@api_router.put("/admin/users/{user_id}/roles", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def update_user_roles(user_id: str, roles: List[str]):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"roles": roles}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    return {"success": True, "message": "Rôles mis à jour"}

@api_router.delete("/admin/users/{user_id}", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def delete_user(user_id: str):
    """
    Supprime définitivement un utilisateur et toutes ses données liées (hard delete)
    """
    # Vérifier que l'utilisateur existe
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    user_email = user.get("email", "")
    
    try:
        # 1. Supprimer les mini-sites et leurs articles
        minisites = await db.minisites.find({"user_id": user_id}, {"_id": 0, "id": 1}).to_list(1000)
        for minisite in minisites:
            # Supprimer les articles du mini-site
            await db.minisite_articles.delete_many({"minisite_id": minisite["id"]})
            # Supprimer le mini-site
            await db.minisites.delete_one({"id": minisite["id"]})
        
        # 2. Supprimer les demandes (client_id)
        await db.demandes.delete_many({"client_id": user_id})
        
        # 3. Supprimer les ventes vendeur (seller_id)
        await db.seller_sales.delete_many({"seller_id": user_id})
        
        # 4. Supprimer les abonnements (subscriptions)
        await db.subscriptions.delete_many({"user_id": user_id})
        
        # 5. Supprimer les demandes vendeur (seller_requests)
        await db.seller_requests.delete_many({"user_email": user_email})
        
        # 6. Supprimer l'utilisateur lui-même
        await db.users.delete_one({"id": user_id})
        
        logger.info(f"✅ Utilisateur {user_id} ({user_email}) supprimé définitivement avec toutes ses données")
        
        return {"success": True, "message": f"Utilisateur {user_email} supprimé définitivement"}
    
    except Exception as e:
        logger.error(f"❌ Erreur lors de la suppression de l'utilisateur {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression: {str(e)}")

@api_router.get("/admin/settings", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def get_all_settings():
    settings = await db.settings.find({}, {"_id": 0}).to_list(100)
    return {s["key"]: s["value"] for s in settings}

@api_router.put("/admin/settings/{key}", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def update_setting(key: str, value: dict):
    await db.settings.update_one(
        {"key": key},
        {"$set": {"key": key, "value": value.get("value")}},
        upsert=True
    )
    
    return {"success": True, "message": f"Paramètre {key} mis à jour"}

@api_router.put("/admin/sales/{sale_id}/status", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def update_sale_status(sale_id: str, status: dict):
    new_status = status.get("status")
    
    result = await db.seller_sales.update_one(
        {"id": sale_id},
        {"$set": {"status": new_status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Vente non trouvée")
    
    return {"success": True, "message": "Statut de vente mis à jour"}

@api_router.get("/admin/demandes", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def get_all_demandes():
    demandes = await db.demandes.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return demandes

@api_router.get("/admin/sales", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def get_all_sales():
    sales = await db.seller_sales.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return sales

@api_router.get("/admin/sales/{sale_id}", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def get_sale_detail(sale_id: str):
    sale = await db.seller_sales.find_one({"id": sale_id}, {"_id": 0})
    if not sale:
        raise HTTPException(status_code=404, detail="Vente non trouvée")
    
    # Get article details
    article = await db.articles.find_one({"id": sale["article_id"]}, {"_id": 0})
    
    # Get seller details
    seller = await db.users.find_one({"id": sale["seller_id"]}, {"_id": 0, "password_hash": 0})
    
    return {
        "sale": sale,
        "article": article,
        "seller": seller
    }

@api_router.post("/admin/sales/{sale_id}/validate", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def validate_sale(sale_id: str):
    sale = await db.seller_sales.find_one({"id": sale_id}, {"_id": 0})
    
    if not sale:
        raise HTTPException(status_code=404, detail="Vente non trouvée")
    
    if sale["status"] != SaleStatus.WAITING_ADMIN_APPROVAL:
        raise HTTPException(status_code=400, detail="Cette vente ne peut pas être validée dans son état actuel")
    
    await db.seller_sales.update_one(
        {"id": sale_id},
        {"$set": {"status": SaleStatus.PAYMENT_PENDING, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "message": "Vente validée. Le vendeur doit maintenant effectuer le paiement."}

@api_router.post("/admin/sales/{sale_id}/reject", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def reject_sale(sale_id: str, data: dict):
    reason = data.get("reason", "")
    
    sale = await db.seller_sales.find_one({"id": sale_id}, {"_id": 0})
    
    if not sale:
        raise HTTPException(status_code=404, detail="Vente non trouvée")
    
    await db.seller_sales.update_one(
        {"id": sale_id},
        {"$set": {
            "status": SaleStatus.REJECTED,
            "rejection_reason": reason,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Vente refusée"}

@api_router.post("/seller/sales/{sale_id}/submit-payment", dependencies=[Depends(require_roles([UserRole.SELLER, UserRole.ADMIN]))])
async def submit_payment_proof(sale_id: str, data: dict, current_user = Depends(get_current_user)):
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    
    sale = await db.seller_sales.find_one({"id": sale_id}, {"_id": 0})
    
    if not sale:
        raise HTTPException(status_code=404, detail="Vente non trouvée")
    
    if sale["status"] != SaleStatus.PAYMENT_PENDING:
        raise HTTPException(status_code=400, detail="Le paiement ne peut pas être soumis dans l'état actuel")
    
    payment_proof = {
        "method": data.get("method", ""),
        "proof_url": data.get("proof_url", ""),
        "note": data.get("note", ""),
        "link": data.get("link", "")
    }
    
    await db.seller_sales.update_one(
        {"id": sale_id},
        {"$set": {
            "status": SaleStatus.PAYMENT_SUBMITTED,
            "payment_proof": payment_proof,
            "payment_method": data.get("method", ""),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Preuve de paiement envoyée. En attente de validation admin."}

@api_router.post("/admin/sales/{sale_id}/confirm-payment", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def confirm_payment(sale_id: str):
    sale = await db.seller_sales.find_one({"id": sale_id}, {"_id": 0})
    
    if not sale:
        raise HTTPException(status_code=404, detail="Vente non trouvée")
    
    if sale["status"] != SaleStatus.PAYMENT_SUBMITTED:
        raise HTTPException(status_code=400, detail="Le paiement ne peut pas être confirmé dans l'état actuel")
    
    await db.seller_sales.update_one(
        {"id": sale_id},
        {"$set": {
            "status": SaleStatus.SHIPPING_PENDING,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Paiement confirmé. Vente en attente d'expédition."}

@api_router.post("/admin/sales/{sale_id}/reject-payment", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def reject_payment(sale_id: str, data: dict):
    reason = data.get("reason", "")
    
    await db.seller_sales.update_one(
        {"id": sale_id},
        {"$set": {
            "status": SaleStatus.PAYMENT_PENDING,
            "rejection_reason": reason,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Paiement refusé. Le vendeur doit soumettre une nouvelle preuve."}

@api_router.post("/admin/sales/{sale_id}/mark-shipped", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def mark_shipped(sale_id: str, data: dict):
    tracking = data.get("tracking_number", "")
    
    sale = await db.seller_sales.find_one({"id": sale_id}, {"_id": 0})
    
    if not sale:
        raise HTTPException(status_code=404, detail="Vente non trouvée")
    
    await db.seller_sales.update_one(
        {"id": sale_id},
        {"$set": {
            "status": SaleStatus.SHIPPED,
            "tracking_number": tracking,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Vente marquée comme expédiée"}

@api_router.post("/admin/sales/{sale_id}/complete", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def complete_sale(sale_id: str):
    await db.seller_sales.update_one(
        {"id": sale_id},
        {"$set": {
            "status": SaleStatus.COMPLETED,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Vente terminée"}

@api_router.get("/seller/sales/{sale_id}", dependencies=[Depends(require_roles([UserRole.SELLER, UserRole.ADMIN]))])
async def get_seller_sale_detail(sale_id: str, current_user = Depends(get_current_user)):
    sale = await db.seller_sales.find_one({"id": sale_id}, {"_id": 0})
    
    if not sale:
        raise HTTPException(status_code=404, detail="Vente non trouvée")
    
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    
    if sale["seller_id"] != user_doc["id"] and UserRole.ADMIN not in current_user.roles:
        raise HTTPException(status_code=403, detail="Accès interdit")
    
    # Get article details
    article = await db.articles.find_one({"id": sale["article_id"]}, {"_id": 0})
    
    return {
        "sale": sale,
        "article": article
    }

# ===== STRIPE BILLING ENDPOINTS =====

@api_router.post("/billing/minisite/checkout", dependencies=[Depends(get_current_user)])
async def create_minisite_checkout(
    plan_data: dict = Body(...),
    current_user = Depends(get_current_user)
):
    """
    Crée une session Stripe Checkout pour un abonnement Mini-site
    """
    logger.info(f"🔵 Checkout request received - User: {current_user.email}, Plan data: {plan_data}")
    
    # Vérifier si les paiements sont activés
    payments_setting = await db.settings.find_one({"key": "payments_enabled"}, {"_id": 0})
    payments_enabled = payments_setting.get("value", False) if payments_setting else False
    
    logger.info(f"📊 Payments enabled: {payments_enabled}")
    
    if not payments_enabled:
        logger.warning(f"❌ Payments disabled - User: {current_user.email}")
        raise HTTPException(status_code=403, detail="Les paiements sont actuellement désactivés")
    
    plan = plan_data.get("plan")
    
    if not plan:
        logger.error(f"❌ Missing plan in request - User: {current_user.email}, Data: {plan_data}")
        raise HTTPException(status_code=400, detail="Le paramètre 'plan' est requis")
    
    if plan not in ["starter", "standard", "premium"]:
        logger.error(f"❌ Invalid plan: {plan} - User: {current_user.email}")
        raise HTTPException(status_code=400, detail=f"Plan invalide: '{plan}'. Doit être: starter, standard ou premium")
    
    logger.info(f"✅ Plan validated: {plan}")
    
    # Récupérer l'utilisateur
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    if not user_doc:
        logger.error(f"❌ User not found in DB - Email: {current_user.email}")
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    user_id = user_doc.get("id")
    logger.info(f"✅ User found - ID: {user_id}, Email: {current_user.email}")
    
    # Note: On ne vérifie PAS si un mini-site existe déjà
    # Le mini-site sera créé automatiquement après le paiement réussi via webhook
    # Cela permet de créer un checkout depuis la landing page
    
    # Vérifier les variables Stripe
    stripe_secret = os.environ.get("STRIPE_SECRET_KEY", "")
    if not stripe_secret:
        logger.error("❌ STRIPE_SECRET_KEY not configured in environment")
        raise HTTPException(status_code=500, detail="Configuration Stripe manquante. Veuillez contacter le support.")
    
    logger.info(f"✅ Stripe secret key present: {stripe_secret[:10]}...")
    
    # Créer la session checkout
    try:
        logger.info(f"🔄 Creating checkout session - User: {user_id}, Plan: {plan}, Email: {current_user.email}")
        
        # Mapper le plan vers le price ID
        plan_to_price_key = {
            "starter": "STRIPE_PRICE_MINISITE_STARTER",
            "standard": "STRIPE_PRICE_MINISITE_STANDARD",
            "premium": "STRIPE_PRICE_MINISITE_PREMIUM"
        }
        price_key = plan_to_price_key.get(plan)
        price_id_env = os.environ.get(price_key, "") if price_key else ""
        
        logger.info(f"📊 Plan mapping - Plan: {plan}, Price Key: {price_key}, Price ID configured: {bool(price_id_env)}")
        
        result = await create_checkout_session(
            db,
            user_id,
            current_user.email,
            plan
        )
        
        if not result.get("success"):
            error_msg = result.get("error", "Erreur inconnue lors de la création de la session")
            logger.error(f"❌ Checkout session creation failed - Error: {error_msg}, User: {user_id}, Plan: {plan}")
            
            # Analyser l'erreur pour retourner un code approprié
            if "Price ID not configured" in error_msg or "Invalid plan" in error_msg or "STRIPE_PRICE" in error_msg:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Configuration invalide pour le plan '{plan}'. Variable d'environnement {price_key} manquante ou vide."
                )
            elif "Failed to get/create Stripe customer" in error_msg or "Stripe customer" in error_msg:
                raise HTTPException(
                    status_code=500, 
                    detail="Erreur lors de la création du client Stripe. Veuillez réessayer ou contacter le support."
                )
            elif "Validation error" in error_msg or "User" in error_msg and "not found" in error_msg:
                raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
            elif "Stripe error" in error_msg or "Stripe API" in error_msg:
                # Extraire le message d'erreur Stripe sans exposer les clés
                stripe_error = error_msg.replace("Stripe error: ", "").replace("Stripe API error: ", "")
                raise HTTPException(
                    status_code=500,
                    detail=f"Erreur Stripe: {stripe_error}"
                )
            else:
                raise HTTPException(status_code=500, detail=f"Erreur lors de la création de la session: {error_msg}")
    
        checkout_url = result.get("url")
        session_id = result.get("session_id")
        
        if not checkout_url:
            logger.error(f"❌ No URL in checkout result - Result: {result}")
            raise HTTPException(status_code=500, detail="Aucune URL de paiement générée par Stripe")
        
        logger.info(f"✅ Checkout session created successfully - Session ID: {session_id}, User: {user_id}, URL: {checkout_url[:50]}...")
        
        return {"url": checkout_url, "session_id": session_id}
    
    except HTTPException:
        # Re-lancer les HTTPException telles quelles
        raise
    except ValueError as e:
        # Erreurs de validation
        logger.error(f"❌ Validation error in checkout endpoint: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Erreur de validation: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Unexpected error in checkout endpoint - Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur serveur inattendue: {str(e)}")


@api_router.get("/billing/subscription", dependencies=[Depends(get_current_user)])
async def get_my_subscription(
    current_user = Depends(get_current_user)
):
    """
    Récupère les informations d'abonnement de l'utilisateur connecté
    """
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    subscription_id = user_doc.get("stripe_subscription_id")
    if not subscription_id:
        return {
            "has_subscription": False,
            "minisite_active": False
        }
    
    # Récupérer l'abonnement depuis la collection subscriptions
    subscription = await db.subscriptions.find_one(
        {"id": subscription_id},
        {"_id": 0}
    )
    
    if not subscription:
        return {
            "has_subscription": False,
            "minisite_active": user_doc.get("minisite_active", False)
        }
    
    # Récupérer site_plan depuis le user document (source de vérité unique)
    site_plan = user_doc.get("site_plan")
    
    # Mapper le plan Stripe vers site_plan si nécessaire (fallback)
    if not site_plan:
        plan_mapping = {
            "starter": "SITE_PLAN_1",
            "standard": "SITE_PLAN_2",
            "premium": "SITE_PLAN_3"
        }
        stripe_plan = subscription.get("plan")
        site_plan = plan_mapping.get(stripe_plan) if stripe_plan else None
    
    # Calculer le prix en EUR depuis site_plan
    site_plan_price_eur = None
    if site_plan == "SITE_PLAN_1":
        site_plan_price_eur = 1
    elif site_plan == "SITE_PLAN_2":
        site_plan_price_eur = 10
    elif site_plan == "SITE_PLAN_3":
        site_plan_price_eur = 15
    
    return {
        "has_subscription": True,
        "subscription_id": subscription_id,
        "plan": subscription.get("plan"),
        "site_plan": site_plan,
        "site_plan_price_eur": site_plan_price_eur,
        "status": subscription.get("status"),
        "current_period_end": subscription.get("current_period_end"),
        "minisite_active": user_doc.get("minisite_active", False)
    }


@api_router.post("/billing/portal", dependencies=[Depends(get_current_user)])
async def create_portal_session(
    current_user = Depends(get_current_user)
):
    """
    Crée une session Stripe Customer Portal pour gérer l'abonnement
    """
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    if not user_doc.get("stripe_customer_id"):
        raise HTTPException(status_code=400, detail="Aucun abonnement actif")
    
    result = await create_portal_session(db, user_doc["id"])
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Erreur lors de la création de la session"))
    
    return {"url": result["url"]}


@api_router.post("/billing/webhook")
async def stripe_webhook(request: Request):
    """
    Webhook Stripe pour gérer les événements d'abonnement
    ⚠️ IMPORTANT: Cette route doit être accessible publiquement (pas d'auth)
    Utilise le RAW BODY pour vérifier la signature Stripe
    """
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    
    if not webhook_secret:
        logger.error("❌ STRIPE_WEBHOOK_SECRET not configured")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    
    # Récupérer le raw body (IMPORTANT: ne pas parser en JSON avant)
    body = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    logger.info(f"📥 Webhook reçu - Headers: stripe-signature={'présent' if sig_header else 'MANQUANT'}, body_size={len(body)} bytes")
    
    if not sig_header:
        logger.error("❌ Missing stripe-signature header")
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")
    
    try:
        # Vérifier la signature Stripe avec le raw body
        event = stripe.Webhook.construct_event(
            body,
            sig_header,
            webhook_secret
        )
        logger.info(f"✅ Signature Stripe vérifiée - Event ID: {event.get('id')}")
    except ValueError as e:
        logger.error(f"❌ Invalid payload: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"❌ Invalid signature: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Extraire les infos de l'événement
    event_type = event.get("type")
    event_id = event.get("id")
    event_data = event.get("data", {}).get("object", {})
    
    # Logs détaillés selon le type d'événement
    if event_type == "checkout.session.completed":
        customer_id = event_data.get("customer")
        subscription_id = event_data.get("subscription")
        metadata = event_data.get("metadata", {})
        user_id = metadata.get("user_id")
        plan = metadata.get("plan")
        logger.info(f"🛒 CHECKOUT SESSION COMPLETED - Event: {event_id}, Customer: {customer_id}, Subscription: {subscription_id}, User: {user_id}, Plan: {plan}")
    
    elif event_type in ["customer.subscription.updated", "customer.subscription.deleted"]:
        subscription_id = event_data.get("id")
        customer_id = event_data.get("customer")
        status = event_data.get("status")
        metadata = event_data.get("metadata", {})
        user_id = metadata.get("user_id")
        plan = metadata.get("plan")
        logger.info(f"🔄 SUBSCRIPTION {event_type.upper().split('.')[-1]} - Event: {event_id}, Subscription: {subscription_id}, Customer: {customer_id}, Status: {status}, User: {user_id}, Plan: {plan}")
    
    elif event_type in ["invoice.payment_failed", "invoice.paid"]:
        invoice_id = event_data.get("id")
        subscription_id = event_data.get("subscription")
        customer_id = event_data.get("customer")
        amount = event_data.get("amount_paid", event_data.get("amount_due", 0)) / 100
        logger.info(f"💳 INVOICE {event_type.upper().split('.')[-1]} - Event: {event_id}, Invoice: {invoice_id}, Subscription: {subscription_id}, Customer: {customer_id}, Amount: {amount}€")
    
    else:
        logger.info(f"ℹ️  Unhandled event type: {event_type} - Event ID: {event_id}")
    
    # Gérer les événements
    try:
        if event_type == "checkout.session.completed":
            metadata = event_data.get("metadata", {})
            payment_type = metadata.get("type")
            
            await handle_checkout_session_completed(db, event_data)
            
            # Notifications selon le type de paiement (après traitement réussi)
            if payment_type == "deposit":
                # Notification admin : acompte payé
                demande_id = metadata.get("demande_id")
                user_id = metadata.get("user_id")
                
                if demande_id and user_id:
                    try:
                        demande = await db.demandes.find_one({"id": demande_id}, {"_id": 0})
                        user = await db.users.find_one({"id": user_id}, {"_id": 0})
                        
                        if demande and user:
                            await notify_admin(
                                db,
                                EventType.ADMIN_DEPOSIT_PAID,
                                {
                                    "title": "Acompte payé",
                                    "message": f"L'acompte pour la demande '{demande['name']}' a été payé avec succès.",
                                    "demande_id": demande_id,
                                    "demande_name": demande["name"],
                                    "client_name": f"{user.get('first_name', '')} {user.get('last_name', '')}",
                                    "client_email": user.get("email", ""),
                                    "deposit_amount": demande.get("deposit_amount", 0),
                                    "details": f"<table class='details-table'><tr><td>Demande</td><td>{demande['name']}</td></tr><tr><td>Acompte</td><td>{demande.get('deposit_amount', 0)}€</td></tr><tr><td>Client</td><td>{user.get('first_name', '')} {user.get('last_name', '')} ({user.get('email', '')})</td></tr></table>"
                                },
                                BackgroundTasks()
                            )
                    except Exception as e:
                        logger.error(f"Erreur notification admin acompte payé: {str(e)}")
            elif metadata.get("product") == "minisite":
                # Notification admin : nouvel abonnement minisite
                user_id = metadata.get("user_id")
                plan = metadata.get("plan")
                
                if user_id:
                    try:
                        user = await db.users.find_one({"id": user_id}, {"_id": 0})
                        
                        if user:
                            await notify_admin(
                                db,
                                EventType.ADMIN_MINISITE_SUBSCRIPTION,
                                {
                                    "title": "Nouvel abonnement Mini-site",
                                    "message": f"Un nouvel abonnement Mini-site a été souscrit.",
                                    "user_name": f"{user.get('first_name', '')} {user.get('last_name', '')}",
                                    "user_email": user.get("email", ""),
                                    "plan": plan,
                                    "details": f"<table class='details-table'><tr><td>Plan</td><td>{plan}</td></tr><tr><td>Utilisateur</td><td>{user.get('first_name', '')} {user.get('last_name', '')} ({user.get('email', '')})</td></tr></table>"
                                },
                                BackgroundTasks()
                            )
                    except Exception as e:
                        logger.error(f"Erreur notification admin abonnement minisite: {str(e)}")
            
            logger.info(f"✅ Traitement réussi: checkout.session.completed")
        
        elif event_type == "customer.subscription.updated":
            await handle_subscription_updated(db, event_data)
            logger.info(f"✅ Traitement réussi: customer.subscription.updated")
        
        elif event_type == "customer.subscription.deleted":
            await handle_subscription_deleted(db, event_data)
            logger.info(f"✅ Traitement réussi: customer.subscription.deleted")
        
        elif event_type == "invoice.payment_failed":
            await handle_invoice_payment_failed(db, event_data)
            logger.info(f"✅ Traitement réussi: invoice.payment_failed")
        
        elif event_type == "invoice.paid":
            await handle_invoice_paid(db, event_data)
            logger.info(f"✅ Traitement réussi: invoice.paid")
        
        else:
            logger.warning(f"⚠️  Event type non géré: {event_type}")
        
        return {"received": True, "event_id": event_id, "event_type": event_type}
        
    except HTTPException:
        # Re-lancer les HTTPException telles quelles
        raise
    except Exception as e:
        logger.error(f"❌ Erreur lors du traitement du webhook {event_type} (ID: {event_id}): {str(e)}", exc_info=True)
        # Retourner 500 pour que Stripe réessaie
        raise HTTPException(status_code=500, detail=f"Erreur lors du traitement du webhook: {str(e)}")


app.include_router(api_router)

@app.get("/health")
@app.get("/api/health")
async def health_check():
    """Route de health check pour le déploiement"""
    return {"status": "ok"}

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.on_event("startup")
async def initialize_default_settings():
    existing_billing = await db.settings.find_one({"key": "billing_mode"})
    if not existing_billing:
        await db.settings.insert_one({"key": "billing_mode", "value": BillingMode.FREE_TEST})
    
    existing_deposit = await db.settings.find_one({"key": "deposit_percentage"})
    if not existing_deposit:
        await db.settings.insert_one({"key": "deposit_percentage", "value": 40})
    
    default_settings = [
        {"key": "logo_url", "value": ""},
        {"key": "contact_phone", "value": ""},
        {"key": "contact_email", "value": "contact@downpricer.com"},
        {"key": "support_email", "value": "support@downpricer.com"},
        {"key": "discord_invite_url", "value": ""}
    ]
    
    for setting in default_settings:
        existing = await db.settings.find_one({"key": setting["key"]})
        if not existing:
            await db.settings.insert_one(setting)
