# 📧 Système de Notifications Email - DownPricer

## 📋 Vue d'ensemble

Système centralisé de notifications email pour DownPricer. Tous les emails sont envoyés via le module `backend/notifications/notifier.py` avec des templates HTML réutilisables.

## 🏗️ Architecture

### Structure
```
backend/notifications/
├── __init__.py              # Exports publics
├── notifier.py              # Module central (EventType, notify_admin, notify_user)
└── email_templates/
    ├── admin_generic.html   # Template générique admin (fallback)
    ├── user_generic.html    # Template générique user (fallback)
    ├── admin_new_client_request.html
    ├── user_request_received.html
    ├── user_request_status_changed.html
    └── ... (autres templates spécifiques)
```

### Module notifier.py

**Fonctions principales :**
- `notify_admin(db, event_type, payload, background_tasks)` : Notifie l'admin
- `notify_user(db, event_type, user_email, payload, background_tasks)` : Notifie un utilisateur
- `render_template(template_name, context)` : Rend un template HTML avec variables

**EventType enum :**
- `ADMIN_NEW_USER`, `ADMIN_NEW_CLIENT_REQUEST`, `ADMIN_NEW_SELLER_APPLICATION`, `ADMIN_NEW_SALE`, `ADMIN_PAYMENT_PROOF_SUBMITTED`, `ADMIN_SHIPMENT_PENDING`, `ADMIN_NEW_MINISITE`
- `USER_REQUEST_RECEIVED`, `USER_REQUEST_STATUS_CHANGED`, `USER_SELLER_APPLICATION_RECEIVED`, `USER_SELLER_APPLICATION_STATUS_CHANGED`, `USER_PAYMENT_REQUIRED`, `USER_PAYMENT_VALIDATED`, `USER_PAYMENT_REJECTED`, `USER_SHIPPED`, `USER_MINISITE_CREATED`

## ⚙️ Configuration

### Variables d'environnement (backend/.env)

```env
# SMTP Configuration
SMTP_HOST=smtp.mail.ovh.net
SMTP_PORT=587
SMTP_USER=noreply@downpricer.com
SMTP_PASS=votre-mot-de-passe
SMTP_FROM=noreply@downpricer.com
SMTP_TLS_MODE=starttls

# Base URL (pour les liens dans les emails)
BACKEND_PUBLIC_URL=http://localhost:8001
```

### Settings DB (configurables via admin panel)

Les settings suivants sont créés automatiquement au démarrage :

- `email_notif_enabled` (bool) : Active/désactive toutes les notifications
- `admin_notif_email` (string) : Email admin qui reçoit les notifications
- `brand_name` (string) : Nom de la marque (défaut: "DownPricer")
- `base_url` (string) : URL de base pour les liens (défaut: BACKEND_PUBLIC_URL)
- `support_email` (string) : Email de support (défaut: "support@downpricer.com")
- `notify_admin_on_new_user` (bool) : Notifier admin lors de nouvelles inscriptions (défaut: true)
- `notify_admin_on_new_request` (bool) : Notifier admin lors de nouvelles demandes (défaut: true)

## 📨 Événements couverts

### Admin notifications

✅ **ADMIN_NEW_USER** : Nouvel utilisateur inscrit
- Trigger : `POST /api/auth/signup`
- Payload : `user_name`, `user_email`, `created_at`

✅ **ADMIN_NEW_CLIENT_REQUEST** : Nouvelle demande client
- Trigger : `POST /api/demandes`
- Payload : `demande_id`, `demande_name`, `client_name`, `client_email`, `max_price`, etc.

✅ **ADMIN_NEW_SELLER_APPLICATION** : Nouvelle demande de vendeur
- Trigger : `POST /api/seller/request`
- Payload : `first_name`, `last_name`, `email`, `phone`, `user_email`, `request_id`

✅ **ADMIN_NEW_SALE** : Nouvelle vente à valider
- Trigger : `POST /api/seller/sales`
- Payload : `article_name`, `sale_price`, `profit`, `seller_name`, `seller_email`, `sale_id`

✅ **ADMIN_PAYMENT_PROOF_SUBMITTED** : Preuve de paiement soumise
- Trigger : `POST /api/seller/sales/{sale_id}/submit-payment`
- Payload : `article_name`, `sale_price`, `seller_name`, `seller_email`, `payment_method`, `sale_id`

✅ **ADMIN_SHIPMENT_PENDING** : Expédition en attente
- Trigger : `POST /api/admin/sales/{sale_id}/confirm-payment`
- Payload : `article_name`, `sale_price`, `seller_name`, `seller_email`, `sale_id`

✅ **ADMIN_NEW_MINISITE** : Nouveau mini-site créé
- Trigger : `POST /api/minisites`
- Payload : `site_name`, `slug`, `user_email`, `plan_id`, `site_id`

### User notifications

✅ **USER_REQUEST_RECEIVED** : Demande reçue (confirmation)
- Trigger : `POST /api/demandes`
- Payload : `demande_id`, `demande_name`, `max_price`, `deposit_amount`, `status`

✅ **USER_REQUEST_STATUS_CHANGED** : Statut demande changé
- Trigger : `PUT /api/admin/demandes/{demande_id}/status`
- Payload : `demande_id`, `demande_name`, `status`, `reason` (optionnel)

✅ **USER_SELLER_APPLICATION_RECEIVED** : Demande vendeur reçue
- Trigger : `POST /api/seller/request`
- Payload : (générique)

✅ **USER_SELLER_APPLICATION_STATUS_CHANGED** : Statut demande vendeur changé
- Trigger : (à implémenter si route admin existe)
- Payload : `status`, `reason` (optionnel)

✅ **USER_PAYMENT_REQUIRED** : Paiement requis
- Trigger : `POST /api/admin/sales/{sale_id}/validate`
- Payload : `article_name`, `sale_price`, `sale_id`

✅ **USER_PAYMENT_VALIDATED** : Paiement validé
- Trigger : `POST /api/admin/sales/{sale_id}/confirm-payment`
- Payload : `article_name`, `sale_price`, `sale_id`

✅ **USER_PAYMENT_REJECTED** : Paiement refusé
- Trigger : `POST /api/admin/sales/{sale_id}/reject-payment` ou `POST /api/admin/sales/{sale_id}/reject`
- Payload : `article_name`, `sale_price`, `sale_id`, `reason` (optionnel)

✅ **USER_SHIPPED** : Commande expédiée
- Trigger : `POST /api/admin/sales/{sale_id}/mark-shipped`
- Payload : `article_name`, `sale_price`, `sale_id`, `tracking_number` (optionnel)

✅ **USER_MINISITE_CREATED** : Mini-site créé
- Trigger : `POST /api/minisites`
- Payload : `site_name`, `slug`, `plan_id`

## 🧪 Tests

### Route de test

**Endpoint :** `POST /api/admin/notifications/test`

**Description :** Envoie des emails de test (admin + user) pour vérifier la configuration SMTP.

**Utilisation :**
```bash
curl -X POST http://localhost:8001/api/admin/notifications/test \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse :**
```json
{
  "success": true,
  "message": "Emails de test envoyés à admin@example.com (admin) et user@example.com (user)"
}
```

### Test manuel

1. **Activer les notifications** : Admin > Paramètres > Activer les notifications email
2. **Configurer l'email admin** : Admin > Paramètres > Email admin (notifications)
3. **Tester** : Admin > Paramètres > Bouton "Envoyer un email de test"
4. **Vérifier les logs** :
   ```bash
   docker compose -f docker-compose.prod.yml logs backend | grep -i "email\|notification"
   ```

## 🔧 Dépannage

### Les emails ne partent pas

1. **Vérifier les logs backend** :
   ```bash
   docker compose -f docker-compose.prod.yml logs backend | grep -i "email\|smtp\|notification"
   ```

2. **Vérifier la configuration** :
   - Variables SMTP dans `.env` ?
   - Toggle "Activer les notifications email" activé dans l'admin ?
   - Email admin configuré ?

3. **Tester la connexion SMTP** :
   ```bash
   docker compose -f docker-compose.prod.yml exec backend python3 -c "
   import smtplib
   server = smtplib.SMTP('smtp.mail.ovh.net', 587)
   server.starttls()
   server.login('noreply@downpricer.com', 'votre-mot-de-passe')
   server.quit()
   print('Connexion SMTP OK')
   "
   ```

### Les emails arrivent en spam

**Solutions :**
1. Vérifier le SPF/DKIM de votre domaine (OVH)
2. Utiliser `SMTP_FROM=noreply@downpricer.com` (doit correspondre au domaine)
3. Éviter les liens suspects dans les emails

### Erreur "Template non trouvé"

Le système utilise automatiquement les templates génériques (`admin_generic.html` / `user_generic.html`) en fallback si un template spécifique n'existe pas.

## 📝 Checklist des événements

### Admin
- ✅ Nouvel utilisateur inscrit
- ✅ Nouvelle demande client
- ✅ Nouvelle demande de vendeur
- ✅ Nouvelle vente à valider
- ✅ Preuve de paiement soumise
- ✅ Expédition en attente
- ✅ Nouveau mini-site créé

### User/Seller
- ✅ Demande reçue (confirmation)
- ✅ Statut demande changé
- ✅ Demande vendeur reçue
- ✅ Paiement requis
- ✅ Paiement validé
- ✅ Paiement refusé
- ✅ Commande expédiée
- ✅ Mini-site créé

## 🎨 Style des emails

Les emails utilisent la charte graphique DownPricer :
- **Header** : Fond noir (#18181b) avec logo orange (#f97316)
- **Boutons** : Orange (#f97316) avec hover (#ea580c)
- **Boxes** : 
  - Success : Vert (#dcfce7 / #16a34a)
  - Warning : Jaune (#fef3c7 / #f59e0b)
  - Error : Rouge (#fee2e2 / #dc2626)
  - Info : Bleu (#f0f9ff / #2563eb)
- **Police** : Inter (body), Outfit (titres)
- **Responsive** : Compatible mobile (max-width 600px)

## 🔒 Sécurité

- ✅ Tous les emails sont envoyés en **BackgroundTasks** (ne bloquent pas les routes)
- ✅ **Try/except** autour de tous les appels notify_* (ne crash jamais)
- ✅ **Échappement HTML** automatique dans render_template (protection XSS)
- ✅ **Logs** détaillés en cas d'erreur

## 📚 Utilisation dans le code

### Exemple : Notifier l'admin

```python
from notifications import EventType, notify_admin

try:
    await notify_admin(
        db,
        EventType.ADMIN_NEW_USER,
        {
            "title": "Nouvel utilisateur",
            "message": "Un nouvel utilisateur s'est inscrit.",
            "user_name": "John Doe",
            "user_email": "john@example.com",
            "created_at": "2024-01-01T00:00:00Z",
            "details": "<table>...</table>",
            "action_button": '<a href="...">Voir</a>'
        },
        background_tasks
    )
except Exception as e:
    logger.error(f"Erreur notification: {str(e)}")
```

### Exemple : Notifier un utilisateur

```python
from notifications import EventType, notify_user

try:
    await notify_user(
        db,
        EventType.USER_REQUEST_RECEIVED,
        "user@example.com",
        {
            "title": "Votre demande a été reçue",
            "status_box": '<div class="success-box">...</div>',
            "message": "Votre demande a été enregistrée.",
            "details": "<table>...</table>",
            "action_button": '<a href="...">Voir</a>'
        },
        background_tasks
    )
except Exception as e:
    logger.error(f"Erreur notification: {str(e)}")
```

## 🚀 Déploiement

### Sur le VPS

1. **Récupérer les modifications** :
   ```bash
   cd /opt/downpricer
   git pull
   ```

2. **Rebuilder le backend** :
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build backend
   ```

3. **Vérifier les logs** :
   ```bash
   docker compose -f docker-compose.prod.yml logs -f backend --tail=100
   ```

4. **Tester** :
   ```bash
   curl -i http://localhost/api/health
   curl -X POST http://localhost/api/admin/notifications/test \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## 📞 Support

Pour toute question ou problème :
- Vérifier les logs backend : `docker compose logs backend | grep -i email`
- Tester la connexion SMTP (voir section Dépannage)
- Vérifier que les notifications sont activées dans l'admin panel

















