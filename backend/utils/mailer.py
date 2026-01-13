"""
Module d'envoi d'emails via SMTP
Support SSL (port 465) et STARTTLS (port 587)
"""
import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


async def get_email_config(db) -> Dict[str, Any]:
    """Récupère la config email depuis settings DB (priorité) puis env vars"""
    # Récupérer depuis DB
    email_enabled_setting = await db.settings.find_one({"key": "email_notif_enabled"}, {"_id": 0})
    admin_email_setting = await db.settings.find_one({"key": "admin_notif_email"}, {"_id": 0})
    
    email_enabled = email_enabled_setting.get("value", False) if email_enabled_setting else None
    admin_email = admin_email_setting.get("value") if admin_email_setting else None
    
    # Fallback sur env vars
    if email_enabled is None:
        email_enabled_str = os.environ.get("EMAIL_NOTIF_ENABLED", "false").lower()
        email_enabled = email_enabled_str == "true"
    
    if not admin_email:
        admin_email = os.environ.get("ADMIN_NOTIF_EMAIL", "")
    
    return {
        "enabled": email_enabled,
        "admin_email": admin_email,
        "smtp_host": os.environ.get("SMTP_HOST", ""),
        "smtp_port": int(os.environ.get("SMTP_PORT", "587")),
        "smtp_user": os.environ.get("SMTP_USER", ""),
        "smtp_pass": os.environ.get("SMTP_PASS", ""),
        "smtp_from": os.environ.get("SMTP_FROM", ""),
        "smtp_tls_mode": os.environ.get("SMTP_TLS_MODE", "starttls")
    }


def send_email_sync(config: Dict[str, Any], to: str, subject: str, html_body: str, text_body: Optional[str] = None):
    """Envoie un email de façon synchrone (à appeler depuis BackgroundTasks)"""
    logger.info(f"[SEND_EMAIL] Début envoi email à {to} (subject: {subject})")
    
    if not config.get("enabled", False):
        logger.warning(f"[SEND_EMAIL] Email notifications désactivées, skip envoi à {to}")
        return
    
    if not config.get("smtp_host") or not config.get("smtp_user") or not config.get("smtp_pass"):
        logger.error(f"[SEND_EMAIL] Configuration SMTP incomplète: host={config.get('smtp_host')}, user={config.get('smtp_user')}, pass={'***' if config.get('smtp_pass') else 'MANQUANT'}")
        return
    
    try:
        logger.info(f"[SEND_EMAIL] Connexion SMTP: {config['smtp_host']}:{config['smtp_port']} (mode: {config.get('smtp_tls_mode', 'starttls')})")
        
        # Créer le message
        msg = MIMEMultipart("alternative")
        msg["From"] = config.get("smtp_from") or config.get("smtp_user", "")
        msg["To"] = to
        msg["Subject"] = subject
        
        # Ajouter le texte brut si fourni
        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        
        # Ajouter le HTML
        msg.attach(MIMEText(html_body, "html"))
        
        # Connexion SMTP
        smtp_host = config["smtp_host"]
        smtp_port = config["smtp_port"]
        smtp_user = config["smtp_user"]
        smtp_pass = config["smtp_pass"]
        tls_mode = config.get("smtp_tls_mode", "starttls")
        
        logger.info(f"[SEND_EMAIL] Connexion au serveur SMTP...")
        if tls_mode == "ssl":
            # SSL/TLS (port 465)
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
        else:
            # STARTTLS (port 587)
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            server.starttls()
        
        logger.info(f"[SEND_EMAIL] Authentification avec {smtp_user}...")
        # Authentification
        server.login(smtp_user, smtp_pass)
        
        logger.info(f"[SEND_EMAIL] Envoi du message...")
        # Envoi
        server.send_message(msg)
        server.quit()
        
        logger.info(f"[SEND_EMAIL] ✅ Email envoyé avec succès à {to}")
        
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"[SEND_EMAIL] ❌ Erreur d'authentification SMTP: {str(e)}", exc_info=True)
    except smtplib.SMTPException as e:
        logger.error(f"[SEND_EMAIL] ❌ Erreur SMTP: {str(e)}", exc_info=True)
    except Exception as e:
        logger.error(f"[SEND_EMAIL] ❌ Erreur lors de l'envoi de l'email à {to}: {str(e)}", exc_info=True)

