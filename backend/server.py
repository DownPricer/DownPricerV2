from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body, BackgroundTasks
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
from utils.mailer import get_email_config, send_email_sync
from notifications import EventType, notify_admin, notify_user

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


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
# En production, Nginx sert directement /api/uploads/, pas besoin de monter ici
# En dev local uniquement, on peut monter pour tester
# app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

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
async def signup(user_data: UserCreate):
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
    
    token = create_access_token(data={"sub": user_data.email, "roles": user_doc["roles"]})
    
    # Notification admin : nouvel utilisateur
    try:
        background_tasks = BackgroundTasks()
        await notify_admin(
            db,
            EventType.ADMIN_NEW_USER,
            {
                "title": "Nouvel utilisateur enregistré",
                "message": "Un nouvel utilisateur s'est inscrit sur la plateforme.",
                "user_name": f"{user_data.first_name} {user_data.last_name}",
                "user_email": user_data.email,
                "created_at": user_doc["created_at"],
                "details": f'<div class="info-box"><table><tr><td>Nom</td><td>{user_data.first_name} {user_data.last_name}</td></tr><tr><td>Email</td><td>{user_data.email}</td></tr><tr><td>Date</td><td>{user_doc["created_at"]}</td></tr></table></div>',
                "action_button": f'<p style="text-align: center;"><a href="{{{{ base_url }}}}/admin/users" class="button">Voir les utilisateurs</a></p>'
            },
            background_tasks
        )
    except Exception as e:
        logger.error(f"Erreur notification admin_new_user: {str(e)}")
    
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
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Le fichier doit être une image")
        
        file_ext = file.filename.split(".")[-1].lower()
        if file_ext not in ["jpg", "jpeg", "png", "webp", "gif"]:
            raise HTTPException(status_code=400, detail="Format d'image non supporté")
        
        # Toujours convertir en WebP pour de meilleures performances
        unique_filename = f"{uuid.uuid4()}.webp"
        file_path = UPLOAD_DIR / unique_filename
        
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convertir en RGB si nécessaire (pour les PNG avec alpha)
        if image.mode in ('RGBA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if len(image.split()) == 4 else None)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Redimensionner - max 800px pour une meilleure performance
        max_size = (800, 800)
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Sauvegarder en WebP avec qualité optimisée
        image.save(file_path, "WEBP", quality=75, method=4)
        
        # Retourner une URL relative standard /uploads/ (Nginx servira directement)
        # Le frontend résoudra cette URL relative par rapport au domaine actuel
        image_url = f"/uploads/{unique_filename}"
        
        return {"success": True, "url": image_url, "filename": unique_filename}
    
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload: {str(e)}")

@api_router.get("/settings/public")
async def get_public_settings():
    settings_docs = await db.settings.find({"key": {"$in": ["logo_url", "contact_phone", "contact_email", "discord_invite_url", "billing_mode"]}}, {"_id": 0}).to_list(100)
    
    settings_dict = {s["key"]: s["value"] for s in settings_docs}
    
    if "billing_mode" not in settings_dict:
        settings_dict["billing_mode"] = BillingMode.FREE_TEST
    
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
async def create_demande(demande_data: DemandeCreate, current_user = Depends(get_current_user)):
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
        "status": DemandeStatus.AWAITING_DEPOSIT,
        "payment_type": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "can_cancel": True
    }
    
    await db.demandes.insert_one(demande_doc)
    
    # Notifications : user (confirmation) + admin (nouvelle demande)
    try:
        await notify_user(
            db,
            EventType.USER_REQUEST_RECEIVED,
            current_user.email,
            {
                "title": "Votre demande a été reçue",
                "status_box": '<div class="success-box"><p style="margin: 0;"><strong>✓ Votre demande a été enregistrée avec succès !</strong></p></div>',
                "message": f'Nous avons bien reçu votre demande "{demande_data.name}" et nous allons l\'étudier dans les plus brefs délais.',
                "demande_id": demande_id,
                "demande_name": demande_data.name,
                "max_price": demande_data.max_price,
                "deposit_amount": demande_doc["deposit_amount"],
                "status": demande_doc["status"],
                "details": f'<table><tr><td>ID Demande</td><td>{demande_id}</td></tr><tr><td>Prix maximum</td><td>{demande_data.max_price}€</td></tr><tr><td>Acompte</td><td>{demande_doc["deposit_amount"]}€</td></tr><tr><td>Statut</td><td>{demande_doc["status"]}</td></tr></table>',
                "action_button": f'<p style="text-align: center;"><a href="{{{{ base_url }}}}/demandes/{demande_id}" class="button">Voir ma demande</a></p>'
            },
            background_tasks
        )
        
        await notify_admin(
            db,
            EventType.ADMIN_NEW_CLIENT_REQUEST,
            {
                "title": "Nouvelle demande client",
                "message": "Une nouvelle demande client a été créée et nécessite votre attention.",
                "demande_id": demande_id,
                "demande_name": demande_data.name,
                "client_name": f"{user_doc.get('first_name', '')} {user_doc.get('last_name', '')}",
                "client_email": current_user.email,
                "max_price": demande_data.max_price,
                "reference_price": demande_data.reference_price,
                "deposit_amount": demande_doc["deposit_amount"],
                "status": demande_doc["status"],
                "description": demande_data.description if demande_data.description else "",
                "details": f'<div class="info-box"><table><tr><td>ID Demande</td><td>{demande_id}</td></tr><tr><td>Nom</td><td>{demande_data.name}</td></tr><tr><td>Client</td><td>{user_doc.get("first_name", "")} {user_doc.get("last_name", "")} ({current_user.email})</td></tr><tr><td>Prix maximum</td><td>{demande_data.max_price}€</td></tr><tr><td>Prix de référence</td><td>{demande_data.reference_price}€</td></tr><tr><td>Acompte</td><td>{demande_doc["deposit_amount"]}€</td></tr><tr><td>Statut</td><td>{demande_doc["status"]}</td></tr></table></div>',
                "action_button": f'<p style="text-align: center;"><a href="{{{{ base_url }}}}/admin/demandes/{demande_id}" class="button">Voir la demande</a></p>'
            },
            background_tasks
        )
    except Exception as e:
        logger.error(f"Erreur notifications demande: {str(e)}")
    
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
async def cancel_demande(demande_id: str, current_user = Depends(get_current_user)):
    demande = await db.demandes.find_one({"id": demande_id}, {"_id": 0})
    
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    is_admin = UserRole.ADMIN in current_user.roles
    
    if demande["client_id"] != user_doc["id"] and not is_admin:
        raise HTTPException(status_code=403, detail="Accès interdit")
    
    # Statuts qui bloquent l'annulation côté client (mais pas admin)
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
    
    if demande["status"] == DemandeStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Cette demande est déjà annulée")
    
    billing_mode = await get_billing_mode()
    
    if demande["status"] == DemandeStatus.DEPOSIT_PAID and billing_mode == BillingMode.STRIPE_PROD:
        provider = get_billing_provider(billing_mode)
        try:
            await provider.refund_deposit(
                payment_id=demande.get("payment_id", ""),
                amount=demande["deposit_amount"]
            )
        except Exception as e:
            logger.error(f"Refund error: {str(e)}")
    
    await db.demandes.update_one(
        {"id": demande_id},
        {"$set": {"status": DemandeStatus.CANCELLED, "can_cancel": False}}
    )
    
    return {"success": True, "message": "Demande annulée avec succès"}

@api_router.post("/seller/request", dependencies=[Depends(get_current_user)])
async def request_seller_access(
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
async def create_seller_sale(sale_data: SellerSaleCreate, current_user = Depends(get_current_user), background_tasks: BackgroundTasks = BackgroundTasks()):
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
    
    # Notification admin : nouvelle vente
    try:
        await notify_admin(
            db,
            EventType.ADMIN_NEW_SALE,
            {
                "title": "Nouvelle vente à valider",
                "message": "Une nouvelle vente nécessite votre validation.",
                "article_name": article['name'],
                "sale_price": sale_data.sale_price,
                "profit": profit,
                "seller_name": f"{user_doc.get('first_name', '')} {user_doc.get('last_name', '')}",
                "seller_email": current_user.email,
                "sale_id": sale_id,
                "details": f'<div class="info-box"><table><tr><td>Article</td><td>{article["name"]}</td></tr><tr><td>Prix de vente</td><td>{sale_data.sale_price}€</td></tr><tr><td>Bénéfice</td><td>{profit}€</td></tr><tr><td>Vendeur</td><td>{user_doc.get("first_name", "")} {user_doc.get("last_name", "")} ({current_user.email})</td></tr><tr><td>ID Vente</td><td>{sale_id}</td></tr></table></div>',
                "action_button": f'<p style="text-align: center;"><a href="{{{{ base_url }}}}/admin/sales/{sale_id}" class="button">Voir la vente</a></p>'
            },
            background_tasks
        )
    except Exception as e:
        logger.error(f"Erreur notification admin_new_sale: {str(e)}")
    
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

@api_router.put("/admin/demandes/{demande_id}/status", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def admin_update_demande_status(demande_id: str, data: dict, background_tasks: BackgroundTasks = BackgroundTasks()):
    new_status = data.get("status")
    reason = data.get("reason", "")
    
    if not new_status:
        raise HTTPException(status_code=400, detail="Statut requis")
    
    try:
        status_enum = DemandeStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Statut invalide")
    
    # Récupérer la demande avant mise à jour
    demande = await db.demandes.find_one({"id": demande_id}, {"_id": 0})
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    can_cancel = new_status not in [DemandeStatus.PURCHASE_LAUNCHED, DemandeStatus.COMPLETED, DemandeStatus.CANCELLED]
    
    update_data = {"status": new_status, "can_cancel": can_cancel}
    if new_status == DemandeStatus.CANCELLED and reason:
        update_data["cancellation_reason"] = reason
    
    result = await db.demandes.update_one(
        {"id": demande_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    # Notifications : user (changement statut) + admin si nécessaire
    try:
        client = await db.users.find_one({"id": demande["client_id"]}, {"_id": 0})
        client_email = client.get("email") if client else None
        
        if client_email:
            # Déterminer le message et le status_box selon le statut
            if new_status == DemandeStatus.CANCELLED:
                status_box = '<div class="error-box"><p style="margin: 0;"><strong>❌ Votre demande a été annulée</strong></p></div>'
                message = f'Votre demande "{demande.get("name", "")}" a été annulée.'
                reason_msg = f'<p><strong>Raison :</strong> {reason}</p>' if reason else ''
            elif new_status in [DemandeStatus.ACCEPTED, DemandeStatus.PROPOSAL_FOUND]:
                status_box = '<div class="success-box"><p style="margin: 0;"><strong>✓ Nouveau statut : ' + new_status + '</strong></p></div>'
                message = f'Votre demande "{demande.get("name", "")}" est maintenant au statut : <strong>{new_status}</strong>.'
                reason_msg = ''
            else:
                status_box = '<div class="info-box"><p style="margin: 0;"><strong>Nouveau statut : ' + new_status + '</strong></p></div>'
                message = f'Votre demande "{demande.get("name", "")}" a été mise à jour.'
                reason_msg = ''
            
            await notify_user(
                db,
                EventType.USER_REQUEST_STATUS_CHANGED,
                client_email,
                {
                    "title": "Mise à jour de votre demande",
                    "status_box": status_box,
                    "message": message,
                    "reason_message": reason_msg,
                    "demande_id": demande_id,
                    "demande_name": demande.get("name", ""),
                    "status": new_status,
                    "details": f'<table><tr><td>ID Demande</td><td>{demande_id}</td></tr><tr><td>Statut</td><td>{new_status}</td></tr></table>',
                    "action_button": f'<p style="text-align: center;"><a href="{{{{ base_url }}}}/demandes/{demande_id}" class="button">Voir ma demande</a></p>',
                    "footer_message": '<p>Si vous avez des questions, n\'hésitez pas à nous contacter.</p>' if new_status != DemandeStatus.CANCELLED else ''
                },
                background_tasks
            )
    except Exception as e:
        logger.error(f"Erreur notification user_request_status_changed: {str(e)}")
    
    return {"success": True, "message": f"Statut mis à jour: {new_status}"}

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

@api_router.post("/admin/notifications/test", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def test_notifications(background_tasks: BackgroundTasks, current_user = Depends(get_current_user)):
    """Envoie des emails de test (admin + user) pour vérifier la configuration"""
    try:
        config = await get_email_config(db)
        
        if not config.get("enabled", False):
            raise HTTPException(status_code=400, detail="Notifications email désactivées. Activez-les dans les paramètres.")
        
        if not config.get("smtp_host") or not config.get("smtp_user") or not config.get("smtp_pass"):
            raise HTTPException(status_code=500, detail="Configuration SMTP incomplète. Vérifiez les variables d'environnement.")
        
        # Test admin
        admin_email = config.get("admin_email") or current_user.email
        await notify_admin(
            db,
            EventType.ADMIN_NEW_USER,
            {
                "title": "Test de notification admin",
                "message": "Ceci est un email de test pour vérifier la configuration SMTP de DownPricer.",
                "user_name": "Test User",
                "user_email": "test@example.com",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "details": '<div class="info-box"><p>Si vous recevez cet email, la configuration est correcte ! ✅</p></div>',
                "action_button": ""
            },
            background_tasks
        )
        
        # Test user
        await notify_user(
            db,
            EventType.USER_REQUEST_RECEIVED,
            current_user.email,
            {
                "title": "Test de notification utilisateur",
                "status_box": '<div class="success-box"><p style="margin: 0;"><strong>✓ Email de test</strong></p></div>',
                "message": "Ceci est un email de test pour vérifier la configuration SMTP de DownPricer.",
                "details": '<div class="info-box"><p>Si vous recevez cet email, la configuration est correcte ! ✅</p></div>',
                "action_button": ""
            },
            background_tasks
        )
        
        return {"success": True, "message": f"Emails de test envoyés à {admin_email} (admin) et {current_user.email} (user)"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi des emails de test: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'envoi des emails: {str(e)}")

@api_router.post("/admin/email/test", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def test_email(background_tasks: BackgroundTasks, current_user = Depends(get_current_user)):
    """Envoie un email de test à l'admin configuré ou à l'utilisateur connecté"""
    try:
        config = await get_email_config(db)
        
        if not config.get("enabled", False):
            raise HTTPException(status_code=400, detail="Notifications email désactivées. Activez-les dans les paramètres.")
        
        if not config.get("smtp_host") or not config.get("smtp_user") or not config.get("smtp_pass"):
            raise HTTPException(status_code=500, detail="Configuration SMTP incomplète. Vérifiez les variables d'environnement.")
        
        # Utiliser l'email admin ou celui de l'utilisateur connecté
        test_email_to = config.get("admin_email") or current_user.email
        
        if not test_email_to:
            raise HTTPException(status_code=400, detail="Aucun email de destination configuré")
        
        subject = "Test de notification - DownPricer"
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">Test de notification email</h2>
                    <p>Ceci est un email de test pour vérifier la configuration SMTP de DownPricer.</p>
                    <p>Si vous recevez cet email, la configuration est correcte ! ✅</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 12px;">
                        Email envoyé depuis DownPricer<br>
                        {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")}
                    </p>
                </div>
            </body>
        </html>
        """
        text_body = "Test de notification email - DownPricer\n\nCeci est un email de test pour vérifier la configuration SMTP.\nSi vous recevez cet email, la configuration est correcte !"
        
        # Envoyer en background
        background_tasks.add_task(send_email_sync, config, test_email_to, subject, html_body, text_body)
        
        return {"success": True, "message": f"Email de test envoyé à {test_email_to}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de l'email de test: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'envoi de l'email: {str(e)}")

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
async def create_minisite(site_data: MiniSiteCreate, current_user = Depends(get_current_user)):
    
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0})
    
    # Vérifier que le slug n'existe pas déjà
    existing = await db.minisites.find_one({"slug": site_data.slug}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Ce slug est déjà utilisé")
    
    # Vérifier que l'utilisateur n'a pas déjà un mini-site
    existing_user_site = await db.minisites.find_one({"user_id": user_doc["id"]}, {"_id": 0})
    if existing_user_site:
        raise HTTPException(status_code=400, detail="Vous avez déjà un mini-site")
    
    site_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    site_doc = {
        "id": site_id,
        "user_id": user_doc["id"],
        "user_email": user_doc["email"],
        "plan_id": site_data.plan_id,
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
    
    # Notifications : user (mini-site créé) + admin (nouveau mini-site)
    try:
        await notify_user(
            db,
            EventType.USER_MINISITE_CREATED,
            current_user.email,
            {
                "title": "Votre mini-site a été créé",
                "status_box": '<div class="success-box"><p style="margin: 0;"><strong>✓ Votre mini-site a été créé avec succès !</strong></p></div>',
                "message": f'Votre mini-site "<strong>{site_data.site_name}</strong>" est maintenant actif.',
                "site_name": site_data.site_name,
                "slug": site_data.slug,
                "plan_id": site_data.plan_id,
                "details": f'<table><tr><td>Nom du site</td><td>{site_data.site_name}</td></tr><tr><td>URL</td><td><a href="{{{{ base_url }}}}/{site_data.slug}">{{{{ base_url }}}}/{site_data.slug}</a></td></tr><tr><td>Plan</td><td>{site_data.plan_id}</td></tr></table>',
                "action_button": f'<p style="text-align: center;"><a href="{{{{ base_url }}}}/minisites/my" class="button">Gérer mon mini-site</a></p>'
            },
            background_tasks
        )
        
        await notify_admin(
            db,
            EventType.ADMIN_NEW_MINISITE,
            {
                "title": "Nouveau mini-site créé",
                "message": "Un nouveau mini-site a été créé.",
                "site_name": site_data.site_name,
                "slug": site_data.slug,
                "user_email": current_user.email,
                "plan_id": site_data.plan_id,
                "site_id": site_id,
                "details": f'<div class="info-box"><table><tr><td>Nom du site</td><td>{site_data.site_name}</td></tr><tr><td>Slug</td><td>{site_data.slug}</td></tr><tr><td>Propriétaire</td><td>{current_user.email}</td></tr><tr><td>Plan</td><td>{site_data.plan_id}</td></tr><tr><td>ID Site</td><td>{site_id}</td></tr></table></div>',
                "action_button": f'<p style="text-align: center;"><a href="{{{{ base_url }}}}/admin/minisites/{site_id}" class="button">Voir le mini-site</a></p>'
            },
            background_tasks
        )
    except Exception as e:
        logger.error(f"Erreur notifications minisite_created: {str(e)}")
    
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
        "SITE_PLAN_10": {"logo_changes_per_month": 10, "name_changes_per_month": 10},
        "SITE_PLAN_15": {"logo_changes_per_month": 999, "name_changes_per_month": 999}
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
        "SITE_PLAN_10": 10,
        "SITE_PLAN_15": 20
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

@api_router.put("/admin/users/{user_id}/roles", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def update_user_roles(user_id: str, roles: List[str]):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"roles": roles}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    return {"success": True, "message": "Rôles mis à jour"}

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
async def validate_sale(sale_id: str, background_tasks: BackgroundTasks = BackgroundTasks()):
    sale = await db.seller_sales.find_one({"id": sale_id}, {"_id": 0})
    
    if not sale:
        raise HTTPException(status_code=404, detail="Vente non trouvée")
    
    if sale["status"] != SaleStatus.WAITING_ADMIN_APPROVAL:
        raise HTTPException(status_code=400, detail="Cette vente ne peut pas être validée dans son état actuel")
    
    await db.seller_sales.update_one(
        {"id": sale_id},
        {"$set": {"status": SaleStatus.PAYMENT_PENDING, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Notification user : vente validée (paiement requis)
    try:
        seller = await db.users.find_one({"id": sale["seller_id"]}, {"_id": 0})
        seller_email = seller.get("email") if seller else None
        
        if seller_email:
            await notify_user(
                db,
                EventType.USER_PAYMENT_REQUIRED,
                seller_email,
                {
                    "title": "Paiement requis",
                    "status_box": '<div class="warning-box"><p style="margin: 0;"><strong>⚠ Paiement requis</strong></p></div>',
                    "message": "Votre vente a été validée. Vous devez maintenant effectuer le paiement.",
                    "article_name": sale.get("article_name", ""),
                    "sale_price": sale.get("sale_price", 0),
                    "sale_id": sale_id,
                    "details": f'<table><tr><td>Article</td><td>{sale.get("article_name", "")}</td></tr><tr><td>Prix de vente</td><td>{sale.get("sale_price", 0)}€</td></tr><tr><td>Bénéfice</td><td>{sale.get("profit", 0)}€</td></tr><tr><td>ID Vente</td><td>{sale_id}</td></tr></table>',
                    "action_button": f'<p style="text-align: center;"><a href="{{{{ base_url }}}}/seller/sales/{sale_id}" class="button">Effectuer le paiement</a></p>'
                },
                background_tasks
            )
    except Exception as e:
        logger.error(f"Erreur notification user_payment_required: {str(e)}")
    
    return {"success": True, "message": "Vente validée. Le vendeur doit maintenant effectuer le paiement."}

@api_router.post("/admin/sales/{sale_id}/reject", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def reject_sale(sale_id: str, data: dict, background_tasks: BackgroundTasks = BackgroundTasks()):
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
    
    # Notification user : vente refusée
    try:
        seller = await db.users.find_one({"id": sale["seller_id"]}, {"_id": 0})
        seller_email = seller.get("email") if seller else None
        
        if seller_email:
            reason_html = f'<p><strong>Raison :</strong> {reason}</p>' if reason else '<p>Pour plus d\'informations, veuillez nous contacter.</p>'
            await notify_user(
                db,
                EventType.USER_PAYMENT_REJECTED,
                seller_email,
                {
                    "title": "Vente refusée",
                    "status_box": '<div class="error-box"><p style="margin: 0;"><strong>❌ Votre vente a été refusée</strong></p></div>',
                    "message": f'Votre vente de l\'article "{sale.get("article_name", "")}" a été refusée par l\'administration.',
                    "reason_message": reason_html,
                    "article_name": sale.get("article_name", ""),
                    "sale_price": sale.get("sale_price", 0),
                    "sale_id": sale_id,
                    "details": f'<table><tr><td>Article</td><td>{sale.get("article_name", "")}</td></tr><tr><td>Prix de vente</td><td>{sale.get("sale_price", 0)}€</td></tr><tr><td>ID Vente</td><td>{sale_id}</td></tr></table>',
                    "action_button": f'<p style="text-align: center;"><a href="{{{{ base_url }}}}/seller/sales/{sale_id}" class="button">Voir ma vente</a></p>'
                },
                background_tasks
            )
    except Exception as e:
        logger.error(f"Erreur notification user_payment_rejected: {str(e)}")
    
    return {"success": True, "message": "Vente refusée"}

@api_router.post("/seller/sales/{sale_id}/submit-payment", dependencies=[Depends(require_roles([UserRole.SELLER, UserRole.ADMIN]))])
async def submit_payment_proof(sale_id: str, data: dict, current_user = Depends(get_current_user), background_tasks: BackgroundTasks = BackgroundTasks()):
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
    
    # Notification admin : preuve de paiement soumise
    try:
        await notify_admin(
            db,
            EventType.ADMIN_PAYMENT_PROOF_SUBMITTED,
            {
                "title": "Preuve de paiement à valider",
                "message": "Un vendeur a soumis une preuve de paiement.",
                "article_name": sale.get("article_name", ""),
                "sale_price": sale.get("sale_price", 0),
                "seller_name": f"{user_doc.get('first_name', '')} {user_doc.get('last_name', '')}",
                "seller_email": current_user.email,
                "payment_method": data.get("method", ""),
                "sale_id": sale_id,
                "details": f'<div class="info-box"><table><tr><td>Article</td><td>{sale.get("article_name", "")}</td></tr><tr><td>Prix de vente</td><td>{sale.get("sale_price", 0)}€</td></tr><tr><td>Vendeur</td><td>{user_doc.get("first_name", "")} {user_doc.get("last_name", "")} ({current_user.email})</td></tr><tr><td>Méthode</td><td>{data.get("method", "")}</td></tr><tr><td>ID Vente</td><td>{sale_id}</td></tr></table></div>',
                "action_button": f'<p style="text-align: center;"><a href="{{{{ base_url }}}}/admin/sales/{sale_id}" class="button">Voir la vente</a></p>'
            },
            background_tasks
        )
    except Exception as e:
        logger.error(f"Erreur notification admin_payment_proof_submitted: {str(e)}")
    
    return {"success": True, "message": "Preuve de paiement envoyée. En attente de validation admin."}

@api_router.post("/admin/sales/{sale_id}/confirm-payment", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
async def confirm_payment(sale_id: str, background_tasks: BackgroundTasks = BackgroundTasks()):
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
    
    # Notifications : user (paiement validé) + admin (expédition en attente)
    try:
        seller = await db.users.find_one({"id": sale["seller_id"]}, {"_id": 0})
        seller_email = seller.get("email") if seller else None
        
        if seller_email:
            await notify_user(
                db,
                EventType.USER_PAYMENT_VALIDATED,
                seller_email,
                {
                    "title": "Paiement validé",
                    "status_box": '<div class="success-box"><p style="margin: 0;"><strong>✓ Votre paiement a été validé avec succès !</strong></p></div>',
                    "message": "Votre paiement pour la vente suivante a été validé par l'administration.",
                    "article_name": sale.get("article_name", ""),
                    "sale_price": sale.get("sale_price", 0),
                    "sale_id": sale_id,
                    "details": f'<table><tr><td>Article</td><td>{sale.get("article_name", "")}</td></tr><tr><td>Prix de vente</td><td>{sale.get("sale_price", 0)}€</td></tr><tr><td>ID Vente</td><td>{sale_id}</td></tr></table>',
                    "action_button": f'<p style="text-align: center;"><a href="{{{{ base_url }}}}/seller/sales/{sale_id}" class="button">Voir ma vente</a></p>'
                },
                background_tasks
            )
        
        await notify_admin(
            db,
            EventType.ADMIN_SHIPMENT_PENDING,
            {
                "title": "Expédition en attente",
                "message": "Une vente est prête pour l'expédition.",
                "article_name": sale.get("article_name", ""),
                "sale_price": sale.get("sale_price", 0),
                "seller_name": f"{seller.get('first_name', '')} {seller.get('last_name', '')}" if seller else "",
                "seller_email": seller.get("email", "") if seller else "",
                "sale_id": sale_id,
                "details": f'<div class="info-box"><table><tr><td>Article</td><td>{sale.get("article_name", "")}</td></tr><tr><td>Prix de vente</td><td>{sale.get("sale_price", 0)}€</td></tr><tr><td>Vendeur</td><td>{seller.get("first_name", "") if seller else ""} {seller.get("last_name", "") if seller else ""} ({seller.get("email", "") if seller else ""})</td></tr><tr><td>ID Vente</td><td>{sale_id}</td></tr></table></div>',
                "action_button": f'<p style="text-align: center;"><a href="{{{{ base_url }}}}/admin/sales/{sale_id}" class="button">Voir la vente</a></p>'
            },
            background_tasks
        )
    except Exception as e:
        logger.error(f"Erreur notifications payment_validated: {str(e)}")
    
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
        {"key": "discord_invite_url", "value": ""},
        {"key": "email_notif_enabled", "value": False},
        {"key": "admin_notif_email", "value": "contact@downpricer.com"},
        {"key": "brand_name", "value": "DownPricer"},
        {"key": "base_url", "value": os.environ.get("BACKEND_PUBLIC_URL", "http://localhost:8001")},
        {"key": "notify_admin_on_new_user", "value": True},
        {"key": "notify_admin_on_new_request", "value": True}
    ]
    
    for setting in default_settings:
        existing = await db.settings.find_one({"key": setting["key"]})
        if not existing:
            await db.settings.insert_one(setting)
