"""
Router pour le module Pro achat/revente.
Accessible uniquement aux utilisateurs S-tier (S_PLAN_5, S_PLAN_10, S_PLAN_15, SITE_PLAN_10).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import base64
from PIL import Image
import io

from dependencies import get_current_user, require_s_tier, require_admin, TokenData
from models import User, UserRole
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Connexion MongoDB (réutilise la même logique que server.py)
mongo_url = os.environ.get('MONGO_URL')
if not mongo_url:
    raise ValueError("MONGO_URL n'est pas défini")

# Si MONGO_URL contient déjà le nom de la base, l'extraire
if mongo_url.count('/') >= 3:
    url_parts = mongo_url.split('/')
    if len(url_parts) > 3:
        db_name_from_url = url_parts[-1].split('?')[0]
        mongo_url_clean = '/'.join(url_parts[:3])
        mongo_url = mongo_url_clean
        db_name = db_name_from_url if db_name_from_url else os.environ.get('DB_NAME', 'downpricer')
    else:
        db_name = os.environ.get('DB_NAME', 'downpricer')
else:
    db_name = os.environ.get('DB_NAME', 'downpricer')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Router avec préfixe /api/pro (sera inclus dans api_router qui a déjà /api)
pro_router = APIRouter(prefix="/pro", tags=["Pro"])

# ============================================================================
# MODÈLES PYDANTIC POUR LE MODULE PRO
# ============================================================================

class ProArticle(BaseModel):
    id: str
    user_id: str
    photo: Optional[str] = None  # base64 encoded image
    name: str
    quantity: int = 1
    purchase_platform: str  # Vinted, eBay, Amazon, LeBonCoin, etc.
    purchase_date: datetime
    return_deadline: Optional[datetime] = None
    payment_method: str
    purchase_price: float
    estimated_sale_price: float
    status: str = "À vendre"  # À vendre, Vendu, À renvoyer, Perte
    actual_sale_price: Optional[float] = None
    sale_platform: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class ProArticleCreate(BaseModel):
    photo: Optional[str] = None
    name: str
    quantity: int = 1
    purchase_platform: str
    purchase_date: datetime
    return_deadline: Optional[datetime] = None
    payment_method: str
    purchase_price: float
    estimated_sale_price: float
    status: str = "À vendre"
    actual_sale_price: Optional[float] = None
    sale_platform: Optional[str] = None

class ProArticleUpdate(BaseModel):
    photo: Optional[str] = None
    name: Optional[str] = None
    quantity: Optional[int] = None
    purchase_platform: Optional[str] = None
    purchase_date: Optional[datetime] = None
    return_deadline: Optional[datetime] = None
    payment_method: Optional[str] = None
    purchase_price: Optional[float] = None
    estimated_sale_price: Optional[float] = None
    status: Optional[str] = None
    actual_sale_price: Optional[float] = None
    sale_platform: Optional[str] = None

class ProArticleLight(BaseModel):
    id: str
    user_id: str
    name: str
    quantity: int = 1
    purchase_platform: str
    purchase_date: datetime
    return_deadline: Optional[datetime] = None
    payment_method: str
    purchase_price: float
    estimated_sale_price: float
    status: str = "À vendre"
    actual_sale_price: Optional[float] = None
    sale_platform: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    has_photo: bool = False

class ProArticlePhoto(BaseModel):
    photo: str

class ProTransaction(BaseModel):
    id: str
    user_id: str
    type: str  # "achat", "vente", "abonnement"
    amount: float
    description: str
    article_id: Optional[str] = None
    date: datetime

# ============================================================================
# FONCTIONS UTILITAIRES
# ============================================================================

async def get_user_from_db(current_user: TokenData) -> User:
    """Récupère l'utilisateur complet depuis MongoDB."""
    user_doc = await db.users.find_one({"email": current_user.email}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    return User(**user_doc)

def compress_image_base64(base64_image: str, max_width: int = 800, quality: int = 80) -> str:
    """Compresse une image base64 pour réduire sa taille"""
    try:
        if not base64_image.startswith('data:image/'):
            return base64_image
        
        header, data = base64_image.split(',', 1)
        image_format = header.split('/')[1].split(';')[0].upper()
        if image_format == 'JPG':
            image_format = 'JPEG'
        
        image_data = base64.b64decode(data)
        image = Image.open(io.BytesIO(image_data))
        
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')
            image_format = 'JPEG'
        
        if image.width > max_width:
            ratio = max_width / image.width
            new_height = int(image.height * ratio)
            image = image.resize((max_width, new_height), Image.Resampling.LANCZOS)
        
        output = io.BytesIO()
        image.save(output, format=image_format, quality=quality, optimize=True)
        compressed_data = output.getvalue()
        
        compressed_base64 = base64.b64encode(compressed_data).decode('utf-8')
        format_lower = image_format.lower()
        if format_lower == 'jpeg':
            format_lower = 'jpg'
        
        return f"data:image/{format_lower};base64,{compressed_base64}"
    except Exception as e:
        print(f"Erreur compression image: {e}")
        return base64_image

# ============================================================================
# ENDPOINTS ARTICLES
# ============================================================================

@pro_router.post("/articles", response_model=ProArticle)
async def create_pro_article(
    article: ProArticleCreate,
    current_user: TokenData = Depends(require_s_tier())
):
    """Créer un nouvel article Pro."""
    user = await get_user_from_db(current_user)
    
    article_dict = article.dict()
    article_dict["id"] = str(uuid.uuid4())
    article_dict["user_id"] = user.id
    
    # Compresser l'image si présente
    if article_dict.get("photo"):
        article_dict["photo"] = compress_image_base64(article_dict["photo"])
    
    article_dict["created_at"] = datetime.utcnow()
    article_dict["updated_at"] = datetime.utcnow()
    
    await db.pro_articles.insert_one(article_dict)
    
    # Créer transaction pour l'achat
    transaction = {
        "id": str(uuid.uuid4()),
        "user_id": user.id,
        "type": "achat",
        "amount": -article.purchase_price,
        "description": f"Achat: {article.name}",
        "article_id": article_dict["id"],
        "date": datetime.utcnow()
    }
    await db.pro_transactions.insert_one(transaction)
    
    return ProArticle(**article_dict)

@pro_router.get("/articles", response_model=List[ProArticle])
async def get_pro_articles(
    current_user: TokenData = Depends(require_s_tier())
):
    """Récupérer tous les articles Pro de l'utilisateur."""
    user = await get_user_from_db(current_user)
    articles = await db.pro_articles.find({"user_id": user.id}).to_list(1000)
    return [ProArticle(**article) for article in articles]

@pro_router.get("/articles-light", response_model=List[ProArticleLight])
async def get_pro_articles_light(
    current_user: TokenData = Depends(require_s_tier())
):
    """Récupérer les articles Pro sans photos (optimisé)."""
    user = await get_user_from_db(current_user)
    articles = await db.pro_articles.find(
        {"user_id": user.id},
        {"photo": 0}
    ).to_list(1000)
    
    light_articles = []
    for article in articles:
        article_data = article.copy()
        # Vérifier si l'article a une photo
        has_photo = await db.pro_articles.find_one(
            {"id": article["id"], "user_id": user.id, "photo": {"$exists": True, "$ne": None}},
            {"_id": 1}
        ) is not None
        article_data["has_photo"] = has_photo
        light_articles.append(ProArticleLight(**article_data))
    
    return light_articles

@pro_router.get("/articles/{article_id}/photo", response_model=ProArticlePhoto)
async def get_pro_article_photo(
    article_id: str,
    current_user: TokenData = Depends(require_s_tier())
):
    """Récupérer uniquement la photo d'un article Pro."""
    user = await get_user_from_db(current_user)
    article = await db.pro_articles.find_one(
        {"id": article_id, "user_id": user.id},
        {"photo": 1}
    )
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if not article.get("photo"):
        raise HTTPException(status_code=404, detail="No photo for this article")
    
    return ProArticlePhoto(photo=article["photo"])

@pro_router.get("/articles/{article_id}", response_model=ProArticle)
async def get_pro_article(
    article_id: str,
    current_user: TokenData = Depends(require_s_tier())
):
    """Récupérer un article Pro spécifique."""
    user = await get_user_from_db(current_user)
    article = await db.pro_articles.find_one({"id": article_id, "user_id": user.id})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return ProArticle(**article)

@pro_router.put("/articles/{article_id}", response_model=ProArticle)
async def update_pro_article(
    article_id: str,
    article_update: ProArticleUpdate,
    current_user: TokenData = Depends(require_s_tier())
):
    """Modifier un article Pro."""
    user = await get_user_from_db(current_user)
    article = await db.pro_articles.find_one({"id": article_id, "user_id": user.id})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    update_data = {k: v for k, v in article_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    # Si marqué comme vendu, créer transaction de vente
    if update_data.get("status") == "Vendu" and article["status"] != "Vendu":
        if update_data.get("actual_sale_price"):
            transaction = {
                "id": str(uuid.uuid4()),
                "user_id": user.id,
                "type": "vente",
                "amount": update_data["actual_sale_price"],
                "description": f"Vente: {article['name']}",
                "article_id": article_id,
                "date": datetime.utcnow()
            }
            await db.pro_transactions.insert_one(transaction)
    
    await db.pro_articles.update_one(
        {"id": article_id, "user_id": user.id},
        {"$set": update_data}
    )
    
    updated_article = await db.pro_articles.find_one({"id": article_id, "user_id": user.id})
    return ProArticle(**updated_article)

@pro_router.delete("/articles/{article_id}")
async def delete_pro_article(
    article_id: str,
    current_user: TokenData = Depends(require_s_tier())
):
    """Supprimer un article Pro."""
    user = await get_user_from_db(current_user)
    result = await db.pro_articles.delete_one({"id": article_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"message": "Article deleted successfully"}

# ============================================================================
# ENDPOINTS TRANSACTIONS
# ============================================================================

@pro_router.get("/transactions", response_model=List[ProTransaction])
async def get_pro_transactions(
    current_user: TokenData = Depends(require_s_tier())
):
    """Récupérer toutes les transactions Pro de l'utilisateur."""
    user = await get_user_from_db(current_user)
    transactions = await db.pro_transactions.find({"user_id": user.id}).sort("date", -1).to_list(1000)
    return [ProTransaction(**transaction) for transaction in transactions]

# ============================================================================
# ENDPOINTS DASHBOARD
# ============================================================================

@pro_router.get("/dashboard/alerts")
async def get_pro_dashboard_alerts(
    current_user: TokenData = Depends(require_s_tier())
):
    """Récupérer les alertes de retour (< 3 jours)."""
    user = await get_user_from_db(current_user)
    three_days_from_now = datetime.utcnow() + timedelta(days=3)
    articles = await db.pro_articles.find({
        "user_id": user.id,
        "status": {"$ne": "Vendu"},
        "return_deadline": {"$lte": three_days_from_now, "$gte": datetime.utcnow()}
    }).to_list(1000)
    
    return [ProArticle(**article) for article in articles]

@pro_router.get("/dashboard/stats")
async def get_pro_dashboard_stats(
    current_user: TokenData = Depends(require_s_tier())
):
    """Récupérer les statistiques du dashboard Pro."""
    user = await get_user_from_db(current_user)
    articles = await db.pro_articles.find({"user_id": user.id}).to_list(1000)
    
    total_articles = len(articles)
    articles_for_sale = len([a for a in articles if a["status"] == "À vendre"])
    articles_sold = len([a for a in articles if a["status"] == "Vendu"])
    articles_to_return = len([a for a in articles if a["status"] == "À renvoyer"])
    articles_lost = len([a for a in articles if a["status"] == "Perte"])
    
    total_invested = sum(a["purchase_price"] for a in articles)
    total_earned = sum(a.get("actual_sale_price", 0) for a in articles if a.get("actual_sale_price"))
    potential_revenue = sum(a["estimated_sale_price"] for a in articles if a["status"] == "À vendre")
    
    return {
        "total_articles": total_articles,
        "articles_for_sale": articles_for_sale,
        "articles_sold": articles_sold,
        "articles_to_return": articles_to_return,
        "articles_lost": articles_lost,
        "total_invested": total_invested,
        "total_earned": total_earned,
        "potential_revenue": potential_revenue,
        "current_margin": total_earned - total_invested
    }

# ============================================================================
# ENDPOINTS ADMIN (STATS GLOBALES - TOUS LES USERS)
# ============================================================================

@pro_router.get("/admin/stats")
async def get_pro_admin_stats(
    current_user: TokenData = Depends(require_admin())
):
    """
    Statistiques globales pour tous les utilisateurs du module Pro.
    Accessible uniquement aux administrateurs.
    """
    db_conn = db  # Utiliser la connexion MongoDB locale
    
    # Récupérer tous les articles (tous users)
    all_articles = await db_conn.pro_articles.find({}).to_list(length=None)
    
    # Récupérer toutes les transactions (tous users)
    all_transactions = await db_conn.pro_transactions.find({}).to_list(length=None)
    
    # Calculer les stats globales
    total_articles = len(all_articles)
    articles_for_sale = len([a for a in all_articles if a.get("status") == "À vendre"])
    articles_sold = len([a for a in all_articles if a.get("status") == "Vendu"])
    articles_lost = len([a for a in all_articles if a.get("status") == "Perte"])
    
    # Calculer les montants globaux
    total_invested = sum(a.get("purchase_price", 0) for a in all_articles)
    total_earned = sum(a.get("actual_sale_price", 0) for a in all_articles if a.get("status") == "Vendu")
    potential_revenue = sum(a.get("estimated_sale_price", 0) for a in all_articles if a.get("status") == "À vendre")
    
    # Calculer les transactions
    total_transactions = len(all_transactions)
    total_purchases = sum(abs(t.get("amount", 0)) for t in all_transactions if t.get("type") == "achat")
    total_sales = sum(t.get("amount", 0) for t in all_transactions if t.get("type") == "vente")
    
    # Alertes retour globales (dans les 3 prochains jours)
    three_days_from_now = datetime.utcnow() + timedelta(days=3)
    alerts_count = 0
    for a in all_articles:
        return_deadline = a.get("return_deadline")
        if return_deadline and a.get("status") != "Vendu":
            # Gérer les différents formats de datetime (datetime object ou string)
            if isinstance(return_deadline, datetime):
                deadline_dt = return_deadline
            elif isinstance(return_deadline, str):
                try:
                    deadline_dt = datetime.fromisoformat(return_deadline.replace("Z", "+00:00"))
                except (ValueError, AttributeError):
                    continue
            else:
                continue
            
            if deadline_dt <= three_days_from_now:
                alerts_count += 1
    
    # Compter les users uniques
    unique_user_ids = set()
    unique_user_ids.update(a.get("user_id") for a in all_articles)
    unique_user_ids.update(t.get("user_id") for t in all_transactions)
    total_users = len(unique_user_ids)
    
    return {
        "total_users": total_users,
        "total_articles": total_articles,
        "articles_for_sale": articles_for_sale,
        "articles_sold": articles_sold,
        "articles_lost": articles_lost,
        "total_transactions": total_transactions,
        "total_invested": total_invested,
        "total_earned": total_earned,
        "total_revenue": total_earned,  # Alias pour compatibilité
        "potential_revenue": potential_revenue,
        "current_margin": total_earned - total_invested,
        "total_purchases": total_purchases,
        "total_sales": total_sales,
        "alerts_count": alerts_count
    }

@pro_router.get("/admin/users")
async def get_pro_admin_users(
    current_user: TokenData = Depends(require_admin())
):
    """
    Liste des utilisateurs ayant utilisé le module Pro.
    Accessible uniquement aux administrateurs.
    """
    db_conn = db  # Utiliser la connexion MongoDB locale
    
    # Récupérer tous les user_ids uniques depuis les articles et transactions
    user_ids_from_articles = await db_conn.pro_articles.distinct("user_id")
    user_ids_from_transactions = await db_conn.pro_transactions.distinct("user_id")
    all_user_ids = set(user_ids_from_articles) | set(user_ids_from_transactions)
    
    # Récupérer les infos des users depuis la collection users
    users_list = []
    for user_id in all_user_ids:
        user_doc = await db_conn.users.find_one({"id": user_id})
        if user_doc:
            # Compter les articles et transactions de cet user
            user_articles_count = await db_conn.pro_articles.count_documents({"user_id": user_id})
            user_transactions_count = await db_conn.pro_transactions.count_documents({"user_id": user_id})
            
            users_list.append({
                "id": user_doc.get("id"),
                "email": user_doc.get("email"),
                "is_admin": UserRole.ADMIN.value in user_doc.get("roles", []),
                "created_at": user_doc.get("created_at"),
                "articles_count": user_articles_count,
                "transactions_count": user_transactions_count
            })
    
    return users_list

