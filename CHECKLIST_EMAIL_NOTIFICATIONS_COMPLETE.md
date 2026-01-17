# ✅ Checklist - Système de Notifications Email Complet

## 📋 Modifications effectuées

### 1. Mode test EMAIL_FORCE_TO
- ✅ Ajouté dans `backend/utils/mailer.py`
- ✅ Redirige tous les emails vers une adresse unique si défini
- ✅ Ajoute `[TEST]` au sujet et log l'original

### 2. Logs améliorés
- ✅ Ajout de `event_type` et `event_id` dans les logs
- ✅ Format: `event_type={type} | id={id}` dans les logs d'envoi

### 3. Triggers branchés dans server.py

#### ✅ ADMIN_NEW_SELLER_APPLICATION
- **Fichier**: `backend/server.py` ligne ~543
- **Endpoint**: `POST /api/seller/request`
- **Fonction**: `request_seller_access()`
- **Status**: ✅ BRANCHÉ

#### ✅ USER_SELLER_APPLICATION_RECEIVED
- **Fichier**: `backend/server.py` ligne ~543
- **Endpoint**: `POST /api/seller/request`
- **Fonction**: `request_seller_access()`
- **Status**: ✅ BRANCHÉ

#### ✅ ADMIN_PAYMENT_VALIDATED
- **Fichier**: `backend/server.py` ligne ~1262
- **Endpoint**: `POST /api/admin/sales/{sale_id}/confirm-payment`
- **Fonction**: `confirm_payment()`
- **Status**: ✅ BRANCHÉ

#### ✅ USER_SHIPPED
- **Fichier**: `backend/server.py` ligne ~1395
- **Endpoint**: `POST /api/admin/sales/{sale_id}/mark-shipped`
- **Fonction**: `admin_mark_shipped()`
- **Status**: ✅ BRANCHÉ

#### ✅ ADMIN_NEW_SALE (vente refusée)
- **Fichier**: `backend/server.py` ligne ~1177
- **Endpoint**: `POST /api/admin/sales/{sale_id}/reject`
- **Fonction**: `reject_sale()`
- **Status**: ✅ BRANCHÉ (notifie admin quand vente refusée)

### 4. Route de test
- ✅ Créée: `POST /api/debug/email/test`
- **Fichier**: `backend/server.py` ligne ~1018
- **Fonction**: `debug_email_test()`
- **Envoie**: 3 emails de test (admin demande, user demande, admin vendeur)

### 5. EventType ajouté
- ✅ `ADMIN_PAYMENT_VALIDATED` ajouté dans `backend/notifications/notifier.py`
- ✅ Template configuré (utilise `admin_generic.html`)

## 📝 Templates existants

Les templates suivants existent déjà avec la charte graphique DownPricer (fond sombre #09090b, orange #f97316):
- `admin_generic.html` ✅
- `admin_new_client_request.html` ✅
- `admin_new_user.html` ✅
- `user_generic.html` ✅
- `user_request_received.html` ✅
- `user_request_status_changed.html` ✅

## ⚠️ Templates à créer (optionnel)

Les templates suivants peuvent être créés pour personnaliser davantage, mais utilisent actuellement les templates génériques:
- `admin_new_seller_application.html` (utilise `admin_generic.html`)
- `admin_payment_validated.html` (utilise `admin_generic.html`)
- `user_seller_application_received.html` (utilise `user_generic.html`)
- `user_seller_application_status_changed.html` (utilise `user_generic.html`)
- `user_payment_validated.html` (utilise `user_generic.html`)
- `user_shipped.html` (utilise `user_generic.html`)

## 🔧 Configuration requise

### Variables d'environnement
```env
# SMTP (déjà configuré)
SMTP_HOST=smtp.mail.ovh.net
SMTP_PORT=587
SMTP_USER=noreply@downpricer.com
SMTP_PASS=...
SMTP_FROM=noreply@downpricer.com
SMTP_TLS_MODE=starttls

# Mode test (optionnel)
EMAIL_FORCE_TO=monmail@gmail.com  # Redirige tous les emails vers cette adresse
```

### Settings DB
- `email_notif_enabled`: true/false
- `admin_notif_email`: email admin
- `brand_name`: "DownPricer"
- `base_url`: URL de base
- `support_email`: email support

## 🧪 Tests

### Test local
```bash
# Activer le mode test
export EMAIL_FORCE_TO=monmail@gmail.com

# Démarrer le backend
cd backend
python server.py

# Appeler la route de test (nécessite auth admin)
curl -X POST http://localhost:8001/api/debug/email/test \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test sur VPS
```bash
# Vérifier les logs
docker logs downpricer-backend | grep SEND_EMAIL

# Appeler la route de test via l'API
# Via l'interface admin ou curl avec token admin
```

## 📊 Événements couverts

### Admin notifications
- ✅ ADMIN_NEW_USER
- ✅ ADMIN_NEW_CLIENT_REQUEST
- ✅ ADMIN_NEW_SELLER_APPLICATION
- ✅ ADMIN_NEW_SALE (créée + refusée)
- ✅ ADMIN_PAYMENT_PROOF_SUBMITTED
- ✅ ADMIN_PAYMENT_VALIDATED
- ✅ ADMIN_SHIPMENT_PENDING
- ✅ ADMIN_NEW_MINISITE

### User notifications
- ✅ USER_REQUEST_RECEIVED
- ✅ USER_REQUEST_STATUS_CHANGED
- ✅ USER_SELLER_APPLICATION_RECEIVED
- ⚠️ USER_SELLER_APPLICATION_STATUS_CHANGED (pas d'endpoint admin pour accepter/refuser)
- ✅ USER_PAYMENT_REQUIRED
- ✅ USER_PAYMENT_VALIDATED
- ✅ USER_PAYMENT_REJECTED
- ✅ USER_SHIPPED
- ✅ USER_MINISITE_CREATED

## 🚀 Prochaines étapes (optionnel)

1. Créer endpoint admin pour accepter/refuser demandes vendeur avec notification `USER_SELLER_APPLICATION_STATUS_CHANGED`
2. Créer templates spécifiques pour personnaliser davantage les emails
3. Ajouter notifications pour nouveaux abonnements (si système d'abonnement existe)

## 📁 Fichiers modifiés

- `backend/utils/mailer.py` - Mode test EMAIL_FORCE_TO + logs améliorés
- `backend/notifications/notifier.py` - EventType ADMIN_PAYMENT_VALIDATED + logs améliorés
- `backend/server.py` - Tous les triggers manquants branchés + route /debug/email/test

