"""
Module centralisé de notifications email pour DownPricer
Utilise les templates HTML existants et mailer.py pour l'envoi
"""
import os
import logging
from enum import Enum
from typing import Dict, Any, Optional
from pathlib import Path
from fastapi import BackgroundTasks
from utils.mailer import get_email_config, send_email_sync

logger = logging.getLogger(__name__)

# Chemin vers les templates
TEMPLATES_DIR = Path(__file__).parent / "email_templates"


class EventType(str, Enum):
    """Types d'événements pour les notifications"""
    # Admin notifications
    ADMIN_NEW_USER = "admin_new_user"
    ADMIN_NEW_CLIENT_REQUEST = "admin_new_client_request"
    ADMIN_NEW_SELLER_APPLICATION = "admin_new_seller_application"
    ADMIN_NEW_SALE = "admin_new_sale"
    ADMIN_PAYMENT_PROOF_SUBMITTED = "admin_payment_proof_submitted"
    ADMIN_SHIPMENT_PENDING = "admin_shipment_pending"
    ADMIN_NEW_MINISITE = "admin_new_minisite"
    ADMIN_DEPOSIT_PAID = "admin_deposit_paid"
    ADMIN_MINISITE_SUBSCRIPTION = "admin_minisite_subscription"
    
    # User notifications
    USER_REQUEST_RECEIVED = "user_request_received"
    USER_REQUEST_STATUS_CHANGED = "user_request_status_changed"
    USER_SELLER_APPLICATION_RECEIVED = "user_seller_application_received"
    USER_SELLER_APPLICATION_STATUS_CHANGED = "user_seller_application_status_changed"
    USER_PAYMENT_REQUIRED = "user_payment_required"
    USER_PAYMENT_VALIDATED = "user_payment_validated"
    USER_PAYMENT_REJECTED = "user_payment_rejected"
    USER_SHIPPED = "user_shipped"
    USER_MINISITE_CREATED = "user_minisite_created"


def render_template(template_name: str, context: Dict[str, Any]) -> str:
    """
    Rend un template HTML avec les variables du contexte
    Échappe automatiquement les valeurs pour éviter XSS
    """
    template_path = TEMPLATES_DIR / template_name
    
    if not template_path.exists():
        # Fallback sur template générique
        if "admin" in template_name:
            template_path = TEMPLATES_DIR / "admin_generic.html"
        else:
            template_path = TEMPLATES_DIR / "user_generic.html"
        
        if not template_path.exists():
            logger.error(f"Template non trouvé: {template_name}")
            return ""
    
    try:
        with open(template_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Remplacement simple des variables {{ variable }}
        for key, value in context.items():
            # Échapper HTML pour éviter XSS
            if isinstance(value, str):
                # Échapper les caractères HTML dangereux
                safe_value = (
                    value.replace("&", "&amp;")
                         .replace("<", "&lt;")
                         .replace(">", "&gt;")
                         .replace('"', "&quot;")
                         .replace("'", "&#x27;")
                )
            else:
                safe_value = str(value)
            
            content = content.replace(f"{{{{ {key} }}}}", safe_value)
            content = content.replace(f"{{{{{key}}}}}", safe_value)  # Sans espaces aussi
        
        return content
    except Exception as e:
        logger.error(f"Erreur lors du rendu du template {template_name}: {str(e)}")
        return ""


async def notify_admin(
    db,
    event_type: EventType,
    payload: Dict[str, Any],
    background_tasks: BackgroundTasks
):
    """
    Notifie l'admin d'un événement
    """
    try:
        # Récupérer la config email
        email_config = await get_email_config(db)
        
        if not email_config.get("enabled", False):
            logger.info(f"Notifications email désactivées, skip {event_type}")
            return
        
        admin_email = email_config.get("admin_email")
        if not admin_email:
            logger.warning("Email admin non configuré, impossible d'envoyer la notification")
            return
        
        # Récupérer les settings pour le contexte
        brand_name_setting = await db.settings.find_one({"key": "brand_name"}, {"_id": 0})
        support_email_setting = await db.settings.find_one({"key": "support_email"}, {"_id": 0})
        base_url_setting = await db.settings.find_one({"key": "base_url"}, {"_id": 0})
        
        brand_name = brand_name_setting.get("value", "DownPricer") if brand_name_setting else "DownPricer"
        support_email = support_email_setting.get("value", "support@downpricer.com") if support_email_setting else "support@downpricer.com"
        base_url = base_url_setting.get("value", os.environ.get("BACKEND_PUBLIC_URL", "http://localhost:8001")) if base_url_setting else os.environ.get("BACKEND_PUBLIC_URL", "http://localhost:8001")
        
        # Déterminer le template à utiliser
        template_map = {
            EventType.ADMIN_NEW_USER: "admin_new_user.html",
            EventType.ADMIN_NEW_CLIENT_REQUEST: "admin_new_client_request.html",
            EventType.ADMIN_NEW_SELLER_APPLICATION: "admin_generic.html",
            EventType.ADMIN_NEW_SALE: "admin_generic.html",
            EventType.ADMIN_PAYMENT_PROOF_SUBMITTED: "admin_generic.html",
            EventType.ADMIN_SHIPMENT_PENDING: "admin_generic.html",
            EventType.ADMIN_NEW_MINISITE: "admin_generic.html",
            EventType.ADMIN_DEPOSIT_PAID: "admin_generic.html",
            EventType.ADMIN_MINISITE_SUBSCRIPTION: "admin_generic.html",
        }
        
        template_name = template_map.get(event_type, "admin_generic.html")
        
        # Préparer le contexte
        context = {
            "title": payload.get("title", "Nouvelle notification"),
            "message": payload.get("message", ""),
            "details": payload.get("details", ""),
            "action_button": payload.get("action_button", ""),
            "brand_name": brand_name,
            "support_email": support_email,
            **payload  # Ajouter toutes les autres variables du payload
        }
        
        # Rendre le template
        html_body = render_template(template_name, context)
        
        if not html_body:
            logger.error(f"Impossible de rendre le template {template_name}")
            return
        
        # Préparer le sujet
        subject = payload.get("subject", f"[{brand_name}] {context.get('title', 'Nouvelle notification')}")
        
        # Ajouter la tâche d'envoi en arrière-plan
        background_tasks.add_task(
            send_email_sync,
            email_config,
            admin_email,
            subject,
            html_body
        )
        
        logger.info(f"Notification admin {event_type} programmée pour {admin_email}")
        
    except Exception as e:
        logger.error(f"Erreur lors de la notification admin {event_type}: {str(e)}", exc_info=True)


async def notify_user(
    db,
    event_type: EventType,
    user_email: str,
    payload: Dict[str, Any],
    background_tasks: BackgroundTasks
):
    """
    Notifie un utilisateur d'un événement
    """
    try:
        # Récupérer la config email
        email_config = await get_email_config(db)
        
        if not email_config.get("enabled", False):
            logger.info(f"Notifications email désactivées, skip {event_type}")
            return
        
        if not user_email:
            logger.warning("Email utilisateur non fourni")
            return
        
        # Récupérer les settings pour le contexte
        brand_name_setting = await db.settings.find_one({"key": "brand_name"}, {"_id": 0})
        support_email_setting = await db.settings.find_one({"key": "support_email"}, {"_id": 0})
        base_url_setting = await db.settings.find_one({"key": "base_url"}, {"_id": 0})
        
        brand_name = brand_name_setting.get("value", "DownPricer") if brand_name_setting else "DownPricer"
        support_email = support_email_setting.get("value", "support@downpricer.com") if support_email_setting else "support@downpricer.com"
        base_url = base_url_setting.get("value", os.environ.get("BACKEND_PUBLIC_URL", "http://localhost:8001")) if base_url_setting else os.environ.get("BACKEND_PUBLIC_URL", "http://localhost:8001")
        
        # Déterminer le template à utiliser
        template_map = {
            EventType.USER_REQUEST_RECEIVED: "user_request_received.html",
            EventType.USER_REQUEST_STATUS_CHANGED: "user_request_status_changed.html",
            EventType.USER_SELLER_APPLICATION_RECEIVED: "user_generic.html",
            EventType.USER_SELLER_APPLICATION_STATUS_CHANGED: "user_generic.html",
            EventType.USER_PAYMENT_REQUIRED: "user_generic.html",
            EventType.USER_PAYMENT_VALIDATED: "user_generic.html",
            EventType.USER_PAYMENT_REJECTED: "user_generic.html",
            EventType.USER_SHIPPED: "user_generic.html",
            EventType.USER_MINISITE_CREATED: "user_generic.html",
        }
        
        template_name = template_map.get(event_type, "user_generic.html")
        
        # Préparer le contexte
        context = {
            "title": payload.get("title", "Notification"),
            "message": payload.get("message", ""),
            "details": payload.get("details", ""),
            "action_button": payload.get("action_button", ""),
            "brand_name": brand_name,
            "support_email": support_email,
            **payload  # Ajouter toutes les autres variables du payload
        }
        
        # Rendre le template
        html_body = render_template(template_name, context)
        
        if not html_body:
            logger.error(f"Impossible de rendre le template {template_name}")
            return
        
        # Préparer le sujet
        subject = payload.get("subject", f"[{brand_name}] {context.get('title', 'Notification')}")
        
        # Ajouter la tâche d'envoi en arrière-plan
        background_tasks.add_task(
            send_email_sync,
            email_config,
            user_email,
            subject,
            html_body
        )
        
        logger.info(f"Notification user {event_type} programmée pour {user_email}")
        
    except Exception as e:
        logger.error(f"Erreur lors de la notification user {event_type}: {str(e)}", exc_info=True)
