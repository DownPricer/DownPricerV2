"""
Module centralisé de notifications email
Gère tous les emails (admin + users) avec templates
"""
import logging
from enum import Enum
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import BackgroundTasks
from utils.mailer import get_email_config, send_email_sync

logger = logging.getLogger(__name__)

# Chemin vers les templates
TEMPLATES_DIR = Path(__file__).parent / "email_templates"


class EventType(str, Enum):
    """Types d'événements déclenchant des notifications"""
    # Admin events
    ADMIN_NEW_USER = "admin_new_user"
    ADMIN_NEW_CLIENT_REQUEST = "admin_new_client_request"
    ADMIN_NEW_SELLER_APPLICATION = "admin_new_seller_application"
    ADMIN_NEW_SALE = "admin_new_sale"
    ADMIN_PAYMENT_PROOF_SUBMITTED = "admin_payment_proof_submitted"
    ADMIN_SHIPMENT_PENDING = "admin_shipment_pending"
    ADMIN_NEW_MINISITE = "admin_new_minisite"
    
    # User events
    USER_REQUEST_RECEIVED = "user_request_received"
    USER_REQUEST_STATUS_CHANGED = "user_request_status_changed"
    USER_SELLER_APPLICATION_RECEIVED = "user_seller_application_received"
    USER_SELLER_APPLICATION_STATUS_CHANGED = "user_seller_application_status_changed"
    USER_PAYMENT_REQUIRED = "user_payment_required"
    USER_PAYMENT_VALIDATED = "user_payment_validated"
    USER_PAYMENT_REJECTED = "user_payment_rejected"
    USER_SHIPPED = "user_shipped"
    USER_MINISITE_CREATED = "user_minisite_created"


async def get_notification_settings(db) -> Dict[str, Any]:
    """Récupère les settings de notification depuis la DB"""
    settings = await db.settings.find({
        "key": {
            "$in": [
                "brand_name", "base_url", "support_email", "contact_email",
                "admin_notif_email", "email_notif_enabled",
                "notify_admin_on_new_user", "notify_admin_on_new_request"
            ]
        }
    }, {"_id": 0}).to_list(100)
    
    settings_dict = {s["key"]: s["value"] for s in settings}
    
    return {
        "brand_name": settings_dict.get("brand_name", "DownPricer"),
        "base_url": settings_dict.get("base_url", "http://localhost"),
        "support_email": settings_dict.get("support_email") or settings_dict.get("contact_email", "support@downpricer.com"),
        "admin_email": settings_dict.get("admin_notif_email", ""),
        "email_enabled": settings_dict.get("email_notif_enabled", False),
        "notify_admin_on_new_user": settings_dict.get("notify_admin_on_new_user", True),
        "notify_admin_on_new_request": settings_dict.get("notify_admin_on_new_request", True)
    }


def render_template(template_name: str, context: Dict[str, Any]) -> str:
    """Rend un template HTML avec le contexte (remplacement simple de variables)"""
    template_path = TEMPLATES_DIR / template_name
    
    if not template_path.exists():
        logger.warning(f"Template non trouvé: {template_name}, utilisation du template générique")
        # Fallback sur template générique
        if "admin_" in template_name:
            template_path = TEMPLATES_DIR / "admin_generic.html"
        elif "user_" in template_name:
            template_path = TEMPLATES_DIR / "user_generic.html"
        else:
            logger.error(f"Aucun template générique disponible pour {template_name}")
            return ""
        
        if not template_path.exists():
            logger.error(f"Template générique non trouvé: {template_path}")
            return ""
    
    try:
        with open(template_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Remplacement simple de variables {{ variable }}
        # Utiliser regex pour éviter les remplacements partiels
        import re
        for key, value in context.items():
            # Échapper les caractères spéciaux dans la clé pour la regex
            placeholder = r'\{\{\s*' + re.escape(key) + r'\s*\}\}'
            if value is None:
                value_str = ""
            else:
                # Si la valeur contient déjà du HTML (commence par <), ne pas échapper
                if isinstance(value, str) and value.strip().startswith("<"):
                    value_str = value
                elif isinstance(value, str):
                    # Échapper HTML pour éviter les injections XSS
                    value_str = (value
                        .replace("&", "&amp;")
                        .replace("<", "&lt;")
                        .replace(">", "&gt;")
                        .replace('"', "&quot;")
                        .replace("'", "&#x27;"))
                else:
                    value_str = str(value)
            
            content = re.sub(placeholder, value_str, content)
        
        # Nettoyer les placeholders non remplacés (optionnel, pour debug)
        # content = re.sub(r'\{\{\s*\w+\s*\}\}', '', content)
        
        return content
    except Exception as e:
        logger.error(f"Erreur lors du rendu du template {template_name}: {str(e)}", exc_info=True)
        return ""


def get_template_config(event_type: EventType) -> Dict[str, str]:
    """Retourne la config (template, subject) pour un EventType"""
    configs = {
        # Admin templates
        EventType.ADMIN_NEW_USER: {
            "template": "admin_new_user.html",
            "subject": "Nouvel utilisateur enregistré"
        },
        EventType.ADMIN_NEW_CLIENT_REQUEST: {
            "template": "admin_new_client_request.html",
            "subject": "Nouvelle demande client"
        },
        EventType.ADMIN_NEW_SELLER_APPLICATION: {
            "template": "admin_new_seller_application.html",
            "subject": "Nouvelle demande de vendeur"
        },
        EventType.ADMIN_NEW_SALE: {
            "template": "admin_new_sale.html",
            "subject": "Nouvelle vente à valider"
        },
        EventType.ADMIN_PAYMENT_PROOF_SUBMITTED: {
            "template": "admin_payment_proof_submitted.html",
            "subject": "Preuve de paiement à valider"
        },
        EventType.ADMIN_SHIPMENT_PENDING: {
            "template": "admin_shipment_pending.html",
            "subject": "Expédition en attente"
        },
        EventType.ADMIN_NEW_MINISITE: {
            "template": "admin_new_minisite.html",
            "subject": "Nouveau mini-site créé"
        },
        # User templates
        EventType.USER_REQUEST_RECEIVED: {
            "template": "user_request_received.html",
            "subject": "Votre demande a été reçue"
        },
        EventType.USER_REQUEST_STATUS_CHANGED: {
            "template": "user_request_status_changed.html",
            "subject": "Mise à jour de votre demande"
        },
        EventType.USER_SELLER_APPLICATION_RECEIVED: {
            "template": "user_seller_application_received.html",
            "subject": "Votre demande de vendeur a été reçue"
        },
        EventType.USER_SELLER_APPLICATION_STATUS_CHANGED: {
            "template": "user_seller_application_status_changed.html",
            "subject": "Mise à jour de votre demande de vendeur"
        },
        EventType.USER_PAYMENT_REQUIRED: {
            "template": "user_payment_required.html",
            "subject": "Paiement requis"
        },
        EventType.USER_PAYMENT_VALIDATED: {
            "template": "user_payment_validated.html",
            "subject": "Paiement validé"
        },
        EventType.USER_PAYMENT_REJECTED: {
            "template": "user_payment_rejected.html",
            "subject": "Paiement refusé"
        },
        EventType.USER_SHIPPED: {
            "template": "user_shipped.html",
            "subject": "Votre commande a été expédiée"
        },
        EventType.USER_MINISITE_CREATED: {
            "template": "user_minisite_created.html",
            "subject": "Votre mini-site a été créé"
        }
    }
    
    return configs.get(event_type, {"template": "", "subject": ""})


async def notify_admin(
    db,
    event_type: EventType,
    payload: Dict[str, Any],
    background_tasks: BackgroundTasks
):
    """Notifie l'admin d'un événement"""
    try:
        logger.info(f"[NOTIFY_ADMIN] Début notification {event_type}")
        settings = await get_notification_settings(db)
        logger.info(f"[NOTIFY_ADMIN] Settings récupérés: email_enabled={settings.get('email_enabled')}, admin_email={settings.get('admin_email')}")
        
        if not settings["email_enabled"]:
            logger.warning(f"[NOTIFY_ADMIN] Notifications email désactivées, skip {event_type}")
            return
        
        admin_email = settings["admin_email"]
        if not admin_email:
            logger.warning(f"[NOTIFY_ADMIN] Admin email non configuré, skip {event_type}")
            return
        
        # Vérifier si l'événement doit être notifié (pour certains événements optionnels)
        if event_type == EventType.ADMIN_NEW_USER and not settings.get("notify_admin_on_new_user", True):
            logger.info(f"[NOTIFY_ADMIN] Notification admin_new_user désactivée dans settings")
            return
        
        config = await get_email_config(db)
        logger.info(f"[NOTIFY_ADMIN] Email config: enabled={config.get('enabled')}, smtp_host={config.get('smtp_host')}")
        if not config.get("enabled"):
            logger.warning(f"[NOTIFY_ADMIN] Email config désactivée, skip {event_type}")
            return
        
        template_config = get_template_config(event_type)
        logger.info(f"[NOTIFY_ADMIN] Template config: {template_config}")
        if not template_config.get("template"):
            logger.error(f"[NOTIFY_ADMIN] Pas de template configuré pour {event_type}")
            return
        
        # Préparer le contexte
        context = {
            **payload,
            "brand_name": settings["brand_name"],
            "base_url": settings["base_url"],
            "support_email": settings["support_email"]
        }
        logger.info(f"[NOTIFY_ADMIN] Contexte préparé avec {len(context)} variables")
        
        # Rendre le template
        html_body = render_template(template_config["template"], context)
        if not html_body:
            logger.error(f"[NOTIFY_ADMIN] Erreur lors du rendu du template pour {event_type} (html_body vide)")
            return
        
        logger.info(f"[NOTIFY_ADMIN] Template rendu avec succès ({len(html_body)} caractères)")
        
        subject = template_config["subject"]
        if payload.get("subject_extra"):
            subject = f"{subject} - {payload['subject_extra']}"
        
        # Générer un text_body simple
        text_body = payload.get("text_body", subject)
        
        # Envoyer en background
        logger.info(f"[NOTIFY_ADMIN] Ajout de la tâche background: {event_type} -> {admin_email} (subject: {subject})")
        background_tasks.add_task(send_email_sync, config, admin_email, subject, html_body, text_body)
        logger.info(f"[NOTIFY_ADMIN] ✅ Notification admin planifiée: {event_type} -> {admin_email}")
        
    except Exception as e:
        logger.error(f"Erreur lors de la notification admin {event_type}: {str(e)}", exc_info=True)


async def notify_user(
    db,
    event_type: EventType,
    user_email: str,
    payload: Dict[str, Any],
    background_tasks: BackgroundTasks
):
    """Notifie un utilisateur d'un événement"""
    try:
        logger.info(f"[NOTIFY_USER] Début notification {event_type} -> {user_email}")
        settings = await get_notification_settings(db)
        logger.info(f"[NOTIFY_USER] Settings récupérés: email_enabled={settings.get('email_enabled')}")
        
        if not settings["email_enabled"]:
            logger.warning(f"[NOTIFY_USER] Notifications email désactivées, skip {event_type}")
            return
        
        if not user_email:
            logger.warning(f"[NOTIFY_USER] Email utilisateur vide, skip {event_type}")
            return
        
        config = await get_email_config(db)
        logger.info(f"[NOTIFY_USER] Email config: enabled={config.get('enabled')}, smtp_host={config.get('smtp_host')}")
        if not config.get("enabled"):
            logger.warning(f"[NOTIFY_USER] Email config désactivée, skip {event_type}")
            return
        
        template_config = get_template_config(event_type)
        logger.info(f"[NOTIFY_USER] Template config: {template_config}")
        if not template_config.get("template"):
            logger.error(f"[NOTIFY_USER] Pas de template configuré pour {event_type}")
            return
        
        # Préparer le contexte
        context = {
            **payload,
            "user_email": user_email,
            "brand_name": settings["brand_name"],
            "base_url": settings["base_url"],
            "support_email": settings["support_email"]
        }
        logger.info(f"[NOTIFY_USER] Contexte préparé avec {len(context)} variables")
        
        # Rendre le template
        html_body = render_template(template_config["template"], context)
        if not html_body:
            logger.error(f"[NOTIFY_USER] Erreur lors du rendu du template pour {event_type} (html_body vide)")
            return
        
        logger.info(f"[NOTIFY_USER] Template rendu avec succès ({len(html_body)} caractères)")
        
        subject = template_config["subject"]
        if payload.get("subject_extra"):
            subject = f"{subject} - {payload['subject_extra']}"
        
        # Générer un text_body simple
        text_body = payload.get("text_body", subject)
        
        # Envoyer en background
        logger.info(f"[NOTIFY_USER] Ajout de la tâche background: {event_type} -> {user_email} (subject: {subject})")
        background_tasks.add_task(send_email_sync, config, user_email, subject, html_body, text_body)
        logger.info(f"[NOTIFY_USER] ✅ Notification user planifiée: {event_type} -> {user_email}")
        
    except Exception as e:
        logger.error(f"Erreur lors de la notification user {event_type}: {str(e)}", exc_info=True)

