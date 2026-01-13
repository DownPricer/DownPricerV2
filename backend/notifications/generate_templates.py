#!/usr/bin/env python3
"""
Script pour générer les templates d'emails manquants
"""
from pathlib import Path

TEMPLATES_DIR = Path(__file__).parent / "email_templates"

# Template HTML de base (structure commune)
BASE_STYLES = """body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .email-header { background-color: #1a1a1a; color: #ffffff; padding: 30px 20px; text-align: center; }
        .email-header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .email-body { padding: 30px 20px; }
        .email-footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e5e5; }
        .email-footer a { color: #2563eb; text-decoration: none; }
        .info-box { background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
        .success-box { background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
        .warning-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .error-box { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        table td { padding: 10px; border-bottom: 1px solid #e5e5e5; }
        table td:first-child { font-weight: 600; width: 40%; }
        .button { display: inline-block; padding: 12px 24px; background-color: #ff5722; color: #ffffff; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: 500; }
        @media only screen and (max-width: 600px) { .email-body { padding: 20px 15px; } .email-header { padding: 20px 15px; } }"""

FOOTER = """        <div class="email-footer">
            <p><strong>{{{{ brand_name }}}}</strong><br>Pour toute question, contactez-nous à <a href="mailto:{{{{ support_email }}}}">{{{{ support_email }}}}</a></p>
            <p style="margin-top: 15px; color: #999;">Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
        </div>
    </div>
</body>
</html>"""

def create_template(filename, title, h2, body_content):
    """Crée un template d'email"""
    template = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        {BASE_STYLES}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>{{{{ brand_name }}}}</h1>
        </div>
        <div class="email-body">
            <h2 style="color: #2563eb; margin-top: 0;">{h2}</h2>
{body_content}
        </div>
{FOOTER}"""
    
    template_path = TEMPLATES_DIR / filename
    template_path.write_text(template, encoding='utf-8')
    print(f"✓ Créé: {filename}")

# Templates à créer
templates_data = [
    ("admin_new_user.html", "Nouvel utilisateur enregistré", "Nouvel utilisateur",
     """            <p>Un nouvel utilisateur s'est inscrit sur la plateforme.</p>
            <div class="info-box">
                <table>
                    <tr><td>Nom</td><td>{{{{ user_name }}}}</td></tr>
                    <tr><td>Email</td><td>{{{{ user_email }}}}</td></tr>
                    <tr><td>Date</td><td>{{{{ created_at }}}}</td></tr>
                </table>
            </div>
            <p><a href="{{{{ base_url }}}}/admin/users" class="button">Voir les utilisateurs</a></p>"""),
    
    ("admin_new_seller_application.html", "Nouvelle demande de vendeur", "Nouvelle demande de vendeur",
     """            <p>Un utilisateur a demandé à devenir vendeur.</p>
            <div class="info-box">
                <table>
                    <tr><td>Nom</td><td>{{{{ first_name }}}} {{{{ last_name }}}}</td></tr>
                    <tr><td>Email</td><td>{{{{ email }}}}</td></tr>
                    <tr><td>Téléphone</td><td>{{{{ phone }}}}</td></tr>
                    <tr><td>Utilisateur</td><td>{{{{ user_email }}}}</td></tr>
                    <tr><td>ID Demande</td><td>{{{{ request_id }}}}</td></tr>
                </table>
            </div>
            <p><a href="{{{{ base_url }}}}/admin" class="button">Voir la demande</a></p>"""),
    
    ("admin_new_sale.html", "Nouvelle vente à valider", "Nouvelle vente à valider",
     """            <p>Une nouvelle vente nécessite votre validation.</p>
            <div class="info-box">
                <table>
                    <tr><td>Article</td><td>{{{{ article_name }}}}</td></tr>
                    <tr><td>Prix de vente</td><td>{{{{ sale_price }}}}€</td></tr>
                    <tr><td>Bénéfice</td><td>{{{{ profit }}}}€</td></tr>
                    <tr><td>Vendeur</td><td>{{{{ seller_name }}}} ({{{{ seller_email }}}})</td></tr>
                    <tr><td>ID Vente</td><td>{{{{ sale_id }}}}</td></tr>
                </table>
            </div>
            <p><a href="{{{{ base_url }}}}/admin/sales/{{{{ sale_id }}}}" class="button">Voir la vente</a></p>"""),
    
    ("admin_payment_proof_submitted.html", "Preuve de paiement à valider", "Preuve de paiement à valider",
     """            <p>Un vendeur a soumis une preuve de paiement.</p>
            <div class="info-box">
                <table>
                    <tr><td>Article</td><td>{{{{ article_name }}}}</td></tr>
                    <tr><td>Prix de vente</td><td>{{{{ sale_price }}}}€</td></tr>
                    <tr><td>Vendeur</td><td>{{{{ seller_name }}}} ({{{{ seller_email }}}})</td></tr>
                    <tr><td>Méthode</td><td>{{{{ payment_method }}}}</td></tr>
                    <tr><td>ID Vente</td><td>{{{{ sale_id }}}}</td></tr>
                </table>
            </div>
            <p><a href="{{{{ base_url }}}}/admin/sales/{{{{ sale_id }}}}" class="button">Voir la vente</a></p>"""),
    
    ("admin_shipment_pending.html", "Expédition en attente", "Expédition en attente",
     """            <p>Une vente est prête pour l'expédition.</p>
            <div class="info-box">
                <table>
                    <tr><td>Article</td><td>{{{{ article_name }}}}</td></tr>
                    <tr><td>Prix de vente</td><td>{{{{ sale_price }}}}€</td></tr>
                    <tr><td>Vendeur</td><td>{{{{ seller_name }}}} ({{{{ seller_email }}}})</td></tr>
                    <tr><td>ID Vente</td><td>{{{{ sale_id }}}}</td></tr>
                </table>
            </div>
            <p><a href="{{{{ base_url }}}}/admin/sales/{{{{ sale_id }}}}" class="button">Voir la vente</a></p>"""),
    
    ("admin_new_minisite.html", "Nouveau mini-site créé", "Nouveau mini-site créé",
     """            <p>Un nouveau mini-site a été créé.</p>
            <div class="info-box">
                <table>
                    <tr><td>Nom du site</td><td>{{{{ site_name }}}}</td></tr>
                    <tr><td>Slug</td><td>{{{{ slug }}}}</td></tr>
                    <tr><td>Propriétaire</td><td>{{{{ user_email }}}}</td></tr>
                    <tr><td>Plan</td><td>{{{{ plan_id }}}}</td></tr>
                    <tr><td>ID Site</td><td>{{{{ site_id }}}}</td></tr>
                </table>
            </div>
            <p><a href="{{{{ base_url }}}}/admin/minisites/{{{{ site_id }}}}" class="button">Voir le mini-site</a></p>"""),
    
    ("user_seller_application_received.html", "Votre demande de vendeur a été reçue", "Votre demande de vendeur a été reçue",
     """            <p>Bonjour,</p>
            <div class="success-box">
                <p style="margin: 0;"><strong>✓ Votre demande de vendeur a été enregistrée avec succès !</strong></p>
            </div>
            <p>Nous avons bien reçu votre demande pour devenir vendeur sur {{{{ brand_name }}}}. Nous allons l'étudier dans les plus brefs délais.</p>
            <p>Vous recevrez une notification par email dès que votre demande sera traitée.</p>
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>"""),
    
    ("user_seller_application_status_changed.html", "Mise à jour de votre demande de vendeur", "Mise à jour de votre demande de vendeur",
     """            <p>Bonjour,</p>
            <p>Votre demande pour devenir vendeur a été mise à jour.</p>
            {{{{ status_message }}}}
            {{{{ reason_message }}}}
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>"""),
    
    ("user_payment_required.html", "Paiement requis", "Paiement requis",
     """            <p>Bonjour,</p>
            <div class="warning-box">
                <p style="margin: 0;"><strong>⚠ Paiement requis</strong></p>
            </div>
            <p>Votre vente a été validée. Vous devez maintenant effectuer le paiement.</p>
            <div class="info-box">
                <table>
                    <tr><td>Article</td><td>{{{{ article_name }}}}</td></tr>
                    <tr><td>Prix de vente</td><td>{{{{ sale_price }}}}€</td></tr>
                    <tr><td>ID Vente</td><td>{{{{ sale_id }}}}</td></tr>
                </table>
            </div>
            <p><a href="{{{{ base_url }}}}/seller/sales/{{{{ sale_id }}}}" class="button">Effectuer le paiement</a></p>"""),
    
    ("user_payment_validated.html", "Paiement validé", "Votre paiement a été validé",
     """            <p>Bonjour,</p>
            <div class="success-box">
                <p style="margin: 0;"><strong>✓ Votre paiement a été validé avec succès !</strong></p>
            </div>
            <p>Votre paiement pour la vente suivante a été validé par l'administration.</p>
            <div class="info-box">
                <table>
                    <tr><td>Article</td><td>{{{{ article_name }}}}</td></tr>
                    <tr><td>Prix de vente</td><td>{{{{ sale_price }}}}€</td></tr>
                    <tr><td>ID Vente</td><td>{{{{ sale_id }}}}</td></tr>
                </table>
            </div>
            <p>Votre vente peut maintenant être expédiée.</p>
            <p><a href="{{{{ base_url }}}}/seller/sales/{{{{ sale_id }}}}" class="button">Voir ma vente</a></p>"""),
    
    ("user_payment_rejected.html", "Paiement refusé", "Votre paiement a été refusé",
     """            <p>Bonjour,</p>
            <div class="error-box">
                <p style="margin: 0;"><strong>❌ Votre paiement a été refusé</strong></p>
            </div>
            <p>Votre preuve de paiement pour la vente suivante a été refusée par l'administration.</p>
            {{{{ reason_message }}}}
            <div class="info-box">
                <table>
                    <tr><td>Article</td><td>{{{{ article_name }}}}</td></tr>
                    <tr><td>Prix de vente</td><td>{{{{ sale_price }}}}€</td></tr>
                    <tr><td>ID Vente</td><td>{{{{ sale_id }}}}</td></tr>
                </table>
            </div>
            <p>Veuillez soumettre une nouvelle preuve de paiement.</p>
            <p><a href="{{{{ base_url }}}}/seller/sales/{{{{ sale_id }}}}" class="button">Voir ma vente</a></p>"""),
    
    ("user_shipped.html", "Votre commande a été expédiée", "Votre commande a été expédiée",
     """            <p>Bonjour,</p>
            <div class="success-box">
                <p style="margin: 0;"><strong>✓ Votre commande a été expédiée !</strong></p>
            </div>
            <p>Votre commande a été expédiée et vous recevrez bientôt votre colis.</p>
            <div class="info-box">
                <table>
                    <tr><td>Article</td><td>{{{{ article_name }}}}</td></tr>
                    <tr><td>Prix de vente</td><td>{{{{ sale_price }}}}€</td></tr>
                    {{{{ tracking_row }}}}
                    <tr><td>ID Vente</td><td>{{{{ sale_id }}}}</td></tr>
                </table>
            </div>
            <p><a href="{{{{ base_url }}}}/seller/sales/{{{{ sale_id }}}}" class="button">Voir ma vente</a></p>"""),
    
    ("user_minisite_created.html", "Votre mini-site a été créé", "Votre mini-site a été créé",
     """            <p>Bonjour,</p>
            <div class="success-box">
                <p style="margin: 0;"><strong>✓ Votre mini-site a été créé avec succès !</strong></p>
            </div>
            <p>Votre mini-site "<strong>{{{{ site_name }}}}</strong>" est maintenant actif.</p>
            <div class="info-box">
                <table>
                    <tr><td>Nom du site</td><td>{{{{ site_name }}}}</td></tr>
                    <tr><td>URL</td><td><a href="{{{{ base_url }}}}/{{{{ slug }}}}">{{{{ base_url }}}}/{{{{ slug }}}}</a></td></tr>
                    <tr><td>Plan</td><td>{{{{ plan_id }}}}</td></tr>
                </table>
            </div>
            <p>Vous pouvez maintenant ajouter des articles à votre mini-site et commencer à vendre.</p>
            <p><a href="{{{{ base_url }}}}/minisites/my" class="button">Gérer mon mini-site</a></p>"""),
]

if __name__ == "__main__":
    TEMPLATES_DIR.mkdir(exist_ok=True)
    
    for filename, title, h2, body_content in templates_data:
        if not (TEMPLATES_DIR / filename).exists():
            create_template(filename, title, h2, body_content)
        else:
            print(f"⊘ Existe déjà: {filename}")

