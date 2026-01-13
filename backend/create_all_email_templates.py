#!/usr/bin/env python3
"""Script pour créer tous les templates d'emails manquants avec style DownPricer"""
from pathlib import Path

TEMPLATES_DIR = Path(__file__).parent / "notifications" / "email_templates"
TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)

# Style DownPricer : Orange (#f97316), Noir (#18181b), Table-based email-safe
EMAIL_STYLE = {
    'header_bg': '#18181b',
    'header_color': '#f97316',
    'button_bg': '#f97316',
    'button_hover': '#ea580c',
    'success_bg': '#dcfce7',
    'success_border': '#16a34a',
    'warning_bg': '#fef3c7',
    'warning_border': '#f59e0b',
    'error_bg': '#fee2e2',
    'error_border': '#dc2626',
    'info_bg': '#f0f9ff',
    'info_border': '#2563eb',
}

def create_email_template(filename, title, content_html):
    """Crée un template email avec style DownPricer"""
    template = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{title}</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {{font-family: Arial, sans-serif !important;}}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: {EMAIL_STYLE['header_bg']}; padding: 30px 20px; text-align: center;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: {EMAIL_STYLE['header_color']}; font-family: 'Outfit', 'Arial Black', Arial, sans-serif; letter-spacing: -0.5px;">{{{{ brand_name }}}}</h1>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding: 30px 20px;">
{content_html}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
                                <strong style="color: #18181b;">{{{{ brand_name }}}}</strong><br>
                                Pour toute question, contactez-nous à <a href="mailto:{{{{ support_email }}}}" style="color: {EMAIL_STYLE['button_bg']}; text-decoration: none;">{{{{ support_email }}}}</a>
                            </p>
                            <p style="margin: 10px 0 0 0; font-size: 11px; color: #9ca3af;">
                                Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""
    
    template_path = TEMPLATES_DIR / filename
    template_path.write_text(template, encoding='utf-8')
    print(f"Cree: {filename}")

# Templates à créer
templates = [
    ("admin_new_user.html", "Nouvel utilisateur enregistré", """<h2 style="color: #18181b; margin-top: 0; font-size: 20px; font-weight: 700;">Nouvel utilisateur enregistré</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Un nouvel utilisateur s'est inscrit sur la plateforme.</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Nom</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ user_name }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Email</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ user_email }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151;">Date</td><td style="padding: 12px; background-color: #ffffff; color: #111827;">{{{{ created_at }}}}</td></tr>
                            </table>
                            <div style="margin: 25px 0; text-align: center;">
                                <a href="{{{{ base_url }}}}/admin/users" style="display: inline-block; padding: 12px 24px; background-color: {EMAIL_STYLE['button_bg']}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Voir les utilisateurs</a>
                            </div>"""),
    
    ("admin_new_seller_application.html", "Nouvelle demande de vendeur", """<h2 style="color: #18181b; margin-top: 0; font-size: 20px; font-weight: 700;">Nouvelle demande de vendeur</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Un utilisateur a demandé à devenir vendeur.</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Nom</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ first_name }}}} {{{{ last_name }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Email</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ email }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Téléphone</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ phone }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Utilisateur</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ user_email }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151;">ID Demande</td><td style="padding: 12px; background-color: #ffffff; color: #111827;">{{{{ request_id }}}}</td></tr>
                            </table>
                            <div style="margin: 25px 0; text-align: center;">
                                <a href="{{{{ base_url }}}}/admin" style="display: inline-block; padding: 12px 24px; background-color: {EMAIL_STYLE['button_bg']}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Voir la demande</a>
                            </div>"""),
    
    ("admin_new_sale.html", "Nouvelle vente à valider", """<h2 style="color: #18181b; margin-top: 0; font-size: 20px; font-weight: 700;">Nouvelle vente à valider</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Une nouvelle vente nécessite votre validation.</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Article</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ article_name }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Prix de vente</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ sale_price }}}}€</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Bénéfice</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ profit }}}}€</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Vendeur</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ seller_name }}}} ({{{{ seller_email }}}})</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151;">ID Vente</td><td style="padding: 12px; background-color: #ffffff; color: #111827;">{{{{ sale_id }}}}</td></tr>
                            </table>
                            <div style="margin: 25px 0; text-align: center;">
                                <a href="{{{{ base_url }}}}/admin/sales/{{{{ sale_id }}}}" style="display: inline-block; padding: 12px 24px; background-color: {EMAIL_STYLE['button_bg']}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Voir la vente</a>
                            </div>"""),
    
    ("admin_payment_proof_submitted.html", "Preuve de paiement à valider", """<h2 style="color: #18181b; margin-top: 0; font-size: 20px; font-weight: 700;">Preuve de paiement à valider</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Un vendeur a soumis une preuve de paiement.</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Article</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ article_name }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Prix de vente</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ sale_price }}}}€</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Vendeur</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ seller_name }}}} ({{{{ seller_email }}}})</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Méthode</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ payment_method }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151;">ID Vente</td><td style="padding: 12px; background-color: #ffffff; color: #111827;">{{{{ sale_id }}}}</td></tr>
                            </table>
                            <div style="margin: 25px 0; text-align: center;">
                                <a href="{{{{ base_url }}}}/admin/sales/{{{{ sale_id }}}}" style="display: inline-block; padding: 12px 24px; background-color: {EMAIL_STYLE['button_bg']}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Voir la vente</a>
                            </div>"""),
    
    ("admin_shipment_pending.html", "Expédition en attente", """<h2 style="color: #18181b; margin-top: 0; font-size: 20px; font-weight: 700;">Expédition en attente</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Une vente est prête pour l'expédition.</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Article</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ article_name }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Prix de vente</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ sale_price }}}}€</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Vendeur</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ seller_name }}}} ({{{{ seller_email }}}})</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151;">ID Vente</td><td style="padding: 12px; background-color: #ffffff; color: #111827;">{{{{ sale_id }}}}</td></tr>
                            </table>
                            <div style="margin: 25px 0; text-align: center;">
                                <a href="{{{{ base_url }}}}/admin/sales/{{{{ sale_id }}}}" style="display: inline-block; padding: 12px 24px; background-color: {EMAIL_STYLE['button_bg']}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Voir la vente</a>
                            </div>"""),
    
    ("admin_new_minisite.html", "Nouveau mini-site créé", """<h2 style="color: #18181b; margin-top: 0; font-size: 20px; font-weight: 700;">Nouveau mini-site créé</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Un nouveau mini-site a été créé.</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Nom du site</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ site_name }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Slug</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ slug }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Propriétaire</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ user_email }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Plan</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ plan_id }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151;">ID Site</td><td style="padding: 12px; background-color: #ffffff; color: #111827;">{{{{ site_id }}}}</td></tr>
                            </table>
                            <div style="margin: 25px 0; text-align: center;">
                                <a href="{{{{ base_url }}}}/admin/minisites/{{{{ site_id }}}}" style="display: inline-block; padding: 12px 24px; background-color: {EMAIL_STYLE['button_bg']}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Voir le mini-site</a>
                            </div>"""),
    
    ("user_seller_application_received.html", "Votre demande de vendeur a été reçue", """<h2 style="color: #18181b; margin-top: 0; font-size: 20px; font-weight: 700;">Votre demande de vendeur a été reçue</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Bonjour,</p>
                            <div style="background-color: {EMAIL_STYLE['success_bg']}; border-left: 4px solid {EMAIL_STYLE['success_border']}; padding: 15px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #166534; font-weight: 600;">✓ Votre demande de vendeur a été enregistrée avec succès !</p>
                            </div>
                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">Nous avons bien reçu votre demande pour devenir vendeur sur {{{{ brand_name }}}}. Nous allons l'étudier dans les plus brefs délais.</p>
                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">Vous recevrez une notification par email dès que votre demande sera traitée.</p>
                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">Si vous avez des questions, n'hésitez pas à nous contacter.</p>"""),
    
    ("user_seller_application_status_changed.html", "Mise à jour de votre demande de vendeur", """<h2 style="color: #18181b; margin-top: 0; font-size: 20px; font-weight: 700;">Mise à jour de votre demande de vendeur</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Bonjour,</p>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Votre demande pour devenir vendeur a été mise à jour.</p>
                            {{{{ status_message }}}}
                            {{{{ reason_message }}}}
                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">Si vous avez des questions, n'hésitez pas à nous contacter.</p>"""),
    
    ("user_payment_required.html", "Paiement requis", """<h2 style="color: #18181b; margin-top: 0; font-size: 20px; font-weight: 700;">Paiement requis</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Bonjour,</p>
                            <div style="background-color: {EMAIL_STYLE['warning_bg']}; border-left: 4px solid {EMAIL_STYLE['warning_border']}; padding: 15px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #92400e; font-weight: 600;">⚠ Paiement requis</p>
                            </div>
                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">Votre vente a été validée. Vous devez maintenant effectuer le paiement.</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Article</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ article_name }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Prix de vente</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ sale_price }}}}€</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151;">ID Vente</td><td style="padding: 12px; background-color: #ffffff; color: #111827;">{{{{ sale_id }}}}</td></tr>
                            </table>
                            <div style="margin: 25px 0; text-align: center;">
                                <a href="{{{{ base_url }}}}/seller/sales/{{{{ sale_id }}}}" style="display: inline-block; padding: 12px 24px; background-color: {EMAIL_STYLE['button_bg']}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Effectuer le paiement</a>
                            </div>"""),
    
    ("user_payment_validated.html", "Paiement validé", """<h2 style="color: #18181b; margin-top: 0; font-size: 20px; font-weight: 700;">Votre paiement a été validé</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Bonjour,</p>
                            <div style="background-color: {EMAIL_STYLE['success_bg']}; border-left: 4px solid {EMAIL_STYLE['success_border']}; padding: 15px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #166534; font-weight: 600;">✓ Votre paiement a été validé avec succès !</p>
                            </div>
                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">Votre paiement pour la vente suivante a été validé par l'administration.</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Article</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ article_name }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Prix de vente</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ sale_price }}}}€</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151;">ID Vente</td><td style="padding: 12px; background-color: #ffffff; color: #111827;">{{{{ sale_id }}}}</td></tr>
                            </table>
                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">Votre vente peut maintenant être expédiée.</p>
                            <div style="margin: 25px 0; text-align: center;">
                                <a href="{{{{ base_url }}}}/seller/sales/{{{{ sale_id }}}}" style="display: inline-block; padding: 12px 24px; background-color: {EMAIL_STYLE['button_bg']}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Voir ma vente</a>
                            </div>"""),
    
    ("user_payment_rejected.html", "Paiement refusé", """<h2 style="color: #18181b; margin-top: 0; font-size: 20px; font-weight: 700;">Votre paiement a été refusé</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Bonjour,</p>
                            <div style="background-color: {EMAIL_STYLE['error_bg']}; border-left: 4px solid {EMAIL_STYLE['error_border']}; padding: 15px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #991b1b; font-weight: 600;">❌ Votre paiement a été refusé</p>
                            </div>
                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">Votre preuve de paiement pour la vente suivante a été refusée par l'administration.</p>
                            {{{{ reason_message }}}}
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Article</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ article_name }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Prix de vente</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ sale_price }}}}€</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151;">ID Vente</td><td style="padding: 12px; background-color: #ffffff; color: #111827;">{{{{ sale_id }}}}</td></tr>
                            </table>
                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">Veuillez soumettre une nouvelle preuve de paiement.</p>
                            <div style="margin: 25px 0; text-align: center;">
                                <a href="{{{{ base_url }}}}/seller/sales/{{{{ sale_id }}}}" style="display: inline-block; padding: 12px 24px; background-color: {EMAIL_STYLE['button_bg']}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Voir ma vente</a>
                            </div>"""),
    
    ("user_shipped.html", "Votre commande a été expédiée", """<h2 style="color: #18181b; margin-top: 0; font-size: 20px; font-weight: 700;">Votre commande a été expédiée</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Bonjour,</p>
                            <div style="background-color: {EMAIL_STYLE['success_bg']}; border-left: 4px solid {EMAIL_STYLE['success_border']}; padding: 15px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #166534; font-weight: 600;">✓ Votre commande a été expédiée !</p>
                            </div>
                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">Votre commande a été expédiée et vous recevrez bientôt votre colis.</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Article</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ article_name }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Prix de vente</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ sale_price }}}}€</td></tr>
                                {{{{ tracking_row }}}}
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151;">ID Vente</td><td style="padding: 12px; background-color: #ffffff; color: #111827;">{{{{ sale_id }}}}</td></tr>
                            </table>
                            <div style="margin: 25px 0; text-align: center;">
                                <a href="{{{{ base_url }}}}/seller/sales/{{{{ sale_id }}}}" style="display: inline-block; padding: 12px 24px; background-color: {EMAIL_STYLE['button_bg']}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Voir ma vente</a>
                            </div>"""),
    
    ("user_minisite_created.html", "Votre mini-site a été créé", """<h2 style="color: #18181b; margin-top: 0; font-size: 20px; font-weight: 700;">Votre mini-site a été créé</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Bonjour,</p>
                            <div style="background-color: {EMAIL_STYLE['success_bg']}; border-left: 4px solid {EMAIL_STYLE['success_border']}; padding: 15px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #166534; font-weight: 600;">✓ Votre mini-site a été créé avec succès !</p>
                            </div>
                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">Votre mini-site "<strong style="color: #18181b;">{{{{ site_name }}}}</strong>" est maintenant actif.</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Nom du site</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;">{{{{ site_name }}}}</td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">URL</td><td style="padding: 12px; background-color: #ffffff; color: #111827; border-bottom: 1px solid #e5e7eb;"><a href="{{{{ base_url }}}}/{{{{ slug }}}}" style="color: {EMAIL_STYLE['button_bg']}; text-decoration: none;">{{{{ base_url }}}}/{{{{ slug }}}}</a></td></tr>
                                <tr><td style="padding: 12px; background-color: #f9fafb; font-weight: 600; color: #374151;">Plan</td><td style="padding: 12px; background-color: #ffffff; color: #111827;">{{{{ plan_id }}}}</td></tr>
                            </table>
                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">Vous pouvez maintenant ajouter des articles à votre mini-site et commencer à vendre.</p>
                            <div style="margin: 25px 0; text-align: center;">
                                <a href="{{{{ base_url }}}}/minisites/my" style="display: inline-block; padding: 12px 24px; background-color: {EMAIL_STYLE['button_bg']}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Gérer mon mini-site</a>
                            </div>"""),
]

if __name__ == "__main__":
    print(f"Création des templates dans: {TEMPLATES_DIR.absolute()}")
    
    created = 0
    skipped = 0
    
    for filename, title, content in templates:
        template_path = TEMPLATES_DIR / filename
        if template_path.exists():
            print(f"⊘ Existe déjà: {filename}")
            skipped += 1
        else:
            create_email_template(filename, title, content)
            created += 1
    
    print(f"\n✅ Créés: {created}, ⊘ Déjà existants: {skipped}, Total: {len(templates)}")

