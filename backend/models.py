from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    VISITOR = "VISITOR"
    CLIENT = "CLIENT"
    SELLER = "SELLER"
    SITE_PLAN_1 = "SITE_PLAN_1"
    SITE_PLAN_2 = "SITE_PLAN_2"
    SITE_PLAN_3 = "SITE_PLAN_3"
    S_PLAN_5 = "S_PLAN_5"
    S_PLAN_15 = "S_PLAN_15"
    ADMIN = "ADMIN"

class DemandeStatus(str, Enum):
    ANALYSIS = "ANALYSIS"
    DEPOSIT_PENDING = "DEPOSIT_PENDING"
    DEPOSIT_PAID = "DEPOSIT_PAID"
    ANALYSIS_AFTER_DEPOSIT = "ANALYSIS_AFTER_DEPOSIT"
    AWAITING_DEPOSIT = "AWAITING_DEPOSIT"  # Ancien statut, gardé pour compatibilité
    ACCEPTED = "ACCEPTED"
    IN_ANALYSIS = "IN_ANALYSIS"
    PURCHASE_LAUNCHED = "PURCHASE_LAUNCHED"
    PROPOSAL_FOUND = "PROPOSAL_FOUND"
    AWAITING_BALANCE = "AWAITING_BALANCE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class SaleStatus(str, Enum):
    WAITING_ADMIN_APPROVAL = "WAITING_ADMIN_APPROVAL"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    PAYMENT_SUBMITTED = "PAYMENT_SUBMITTED"
    PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED"
    SHIPPING_PENDING = "SHIPPING_PENDING"
    SHIPPED = "SHIPPED"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    DISPUTE = "DISPUTE"

class BillingMode(str, Enum):
    FREE_TEST = "FREE_TEST"
    STRIPE_PROD = "STRIPE_PROD"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    roles: List[UserRole] = [UserRole.VISITOR]
    site_plan: Optional[str] = None  # SITE_PLAN_1, SITE_PLAN_2, SITE_PLAN_3
    created_at: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Article(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    photos: List[str] = []
    price: float
    reference_price: float
    category_id: Optional[str] = None
    seller_id: Optional[str] = None
    platform_links: Dict[str, str] = {}
    status: str = "active"
    stock: int = 1
    created_at: str
    views: int = 0
    # Champs de visibilité pour distinguer les catalogues
    visible_public: bool = True  # Visible sur le catalogue public
    visible_seller: bool = True  # Visible pour les vendeurs/revendeurs

class ArticleCreate(BaseModel):
    name: str
    description: str
    photos: List[str] = []
    price: float
    reference_price: float
    category_id: Optional[str] = None
    platform_links: Dict[str, str] = {}
    stock: int = 1
    visible_public: bool = True
    visible_seller: bool = True

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    slug: str
    icon: Optional[str] = None

class CategoryCreate(BaseModel):
    name: str
    slug: str
    icon: Optional[str] = None

class Demande(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    client_id: str
    name: str
    description: str
    photos: List[str] = []
    max_price: float
    reference_price: float
    deposit_amount: float
    prefer_delivery: bool = False
    prefer_hand_delivery: bool = False
    status: DemandeStatus
    payment_type: Optional[str] = None
    deposit_payment_url: Optional[str] = None
    deposit_requested_at: Optional[str] = None
    deposit_paid_at: Optional[str] = None
    deposit_stripe_session_id: Optional[str] = None
    created_at: str
    can_cancel: bool = True

class DemandeCreate(BaseModel):
    name: str
    description: str
    photos: List[str] = []
    max_price: float
    reference_price: float
    prefer_delivery: bool = False
    prefer_hand_delivery: bool = False

class SellerSale(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    seller_id: str
    article_id: str
    article_name: str
    sale_price: float
    seller_cost: float
    profit: float
    status: SaleStatus
    payment_proof: Optional[Dict[str, Any]] = None
    payment_method: Optional[str] = None
    tracking_number: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

class SellerSaleCreate(BaseModel):
    article_id: str
    sale_price: float

class MiniSite(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    user_email: str
    plan_id: str
    site_name: str
    slug: str
    logo_url: Optional[str] = None
    welcome_text: str = ""
    template: str = "template1"
    primary_color: str = "#FF5722"
    font_family: str = "Arial"
    articles: List[str] = []
    views: int = 0
    status: str = "active"
    logo_changes_count: int = 0
    name_changes_count: int = 0
    last_logo_change: Optional[str] = None
    last_name_change: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

class MiniSiteCreate(BaseModel):
    site_name: str
    plan_id: str
    slug: str
    welcome_text: Optional[str] = ""
    template: Optional[str] = "template1"
    primary_color: Optional[str] = "#FF5722"
    font_family: Optional[str] = "Arial"

class MiniSiteArticle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    minisite_id: str
    name: str
    description: str
    photos: List[str] = []
    price: float
    reference_price: float
    platform_links: Dict[str, str] = {}
    created_at: str
    # Option pour afficher dans le catalogue revendeur (plan >= 10€)
    show_in_reseller_catalog: bool = False

class MiniSiteArticleCreate(BaseModel):
    name: str
    description: str
    photos: List[str] = []
    price: float
    reference_price: float
    platform_links: Dict[str, str] = {}
    show_in_reseller_catalog: bool = False

class Setting(BaseModel):
    model_config = ConfigDict(extra="ignore")
    key: str
    value: Any

class TokenData(BaseModel):
    email: str
    roles: List[str]
