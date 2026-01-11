# ✅ Checklist - Notifications Email

## 📋 RÉSUMÉ DES MODIFICATIONS

- ✅ **backend/utils/mailer.py** : Module SMTP avec support SSL/STARTTLS
- ✅ **backend/server.py** : Endpoint `/api/admin/email/test` + triggers sur demandes/ventes
- ✅ **backend/server.py** : Paramètres email dans `initialize_default_settings`
- ✅ **frontend/src/pages/admin/Parametres.jsx** : Section notifications email dans l'admin
- ✅ **backend/env.example** : Variables SMTP ajoutées

---

## 🚀 DÉPLOIEMENT SUR VPS

### 1. Se connecter au VPS

```bash
ssh ubuntu@51.210.179.212
sudo -i
cd /opt/downpricer
```

### 2. Récupérer les modifications

```bash
# Si code poussé sur GitHub
git pull origin main

# OU copier les fichiers modifiés manuellement
```

### 3. Configurer les variables d'environnement

**Éditer `backend/.env`** (ou via docker-compose.prod.yml) :

```bash
# SMTP Configuration (OVH Zimbra)
SMTP_HOST=smtp.mail.ovh.net
SMTP_PORT=587
SMTP_USER=noreply@downpricer.com
SMTP_PASS=votre-mot-de-passe-smtp
SMTP_FROM=noreply@downpricer.com
SMTP_TLS_MODE=starttls

# Email notifications (fallback si pas dans DB)
EMAIL_NOTIF_ENABLED=false
ADMIN_NOTIF_EMAIL=contact@downpricer.com
```

**Note** : Les paramètres peuvent aussi être configurés depuis l'admin UI (priorité sur les variables d'environnement).

### 4. Rebuild et redémarrer

```bash
# Rebuild backend (pour inclure utils/mailer.py)
docker compose -f docker-compose.prod.yml build --no-cache backend

# Redémarrer backend
docker compose -f docker-compose.prod.yml up -d backend

# Vérifier les logs
docker compose -f docker-compose.prod.yml logs -f backend | tail -50
```

---

## 🧪 TESTS OBLIGATOIRES

### Test 1 : Configuration SMTP (via Admin UI)

1. **Se connecter** : http://51.210.179.212/admin/parametres
2. **Aller dans "Notifications email"**
3. **Vérifier** :
   - ✅ Section "Notifications email" visible
   - ✅ Toggle ON/OFF présent
   - ✅ Champ "Email admin" présent
   - ✅ Bouton "Envoyer un email de test" présent

### Test 2 : Activer les notifications depuis l'admin

1. **Activer le toggle** "Activer les notifications email"
2. **Configurer l'email admin** : `contact@downpricer.com` (ou votre email de test)
3. **Vérifier** : Le paramètre est sauvegardé (toast succès)

### Test 3 : Tester l'envoi d'email

1. **Cliquer sur** "Envoyer un email de test"
2. **Vérifier** :
   - ✅ Toast succès : "Email de test envoyé à contact@downpricer.com"
   - ✅ Email reçu dans la boîte de réception
   - ✅ Contenu : "Test de notification email - DownPricer"

**Si erreur** :
- Vérifier les variables SMTP dans `backend/.env`
- Vérifier les logs : `docker compose -f docker-compose.prod.yml logs backend | grep -i email`

### Test 4 : Test fonctionnel - Création vente

1. **Se connecter en tant que vendeur** (ou créer un compte vendeur)
2. **Créer une vente** depuis l'espace vendeur
3. **Vérifier** :
   - ✅ Email envoyé à l'admin configuré
   - ✅ Sujet : "Nouvelle vente à valider - [Nom article]"
   - ✅ Contenu : Détails de la vente (article, prix, bénéfice, vendeur)

### Test 5 : Test fonctionnel - Validation/Refus vente

1. **Se connecter en admin**
2. **Aller dans** "Ventes vendeurs"
3. **Valider une vente** (ou la refuser)
4. **Vérifier** :
   - ✅ Email envoyé au vendeur
   - ✅ Sujet : "Votre vente a été validée" (ou "refusée")
   - ✅ Contenu : Détails de la vente + prochaine étape (validation) ou raison (refus)

### Test 6 : Test fonctionnel - Mise à jour demande

1. **Se connecter en admin**
2. **Aller dans** "Demandes clients"
3. **Changer le statut d'une demande** vers ACCEPTED, PROPOSAL_FOUND ou CANCELLED
4. **Vérifier** :
   - ✅ Email envoyé au client
   - ✅ Email envoyé à l'admin (si configuré)
   - ✅ Sujet approprié selon le statut
   - ✅ Contenu : Détails de la demande + raison (si annulation)

---

## 🔍 DIAGNOSTIC EN CAS DE PROBLÈME

### Problème : Email de test ne s'envoie pas

**Vérifier la configuration SMTP** :

```bash
# Vérifier les variables d'environnement dans le conteneur
docker compose -f docker-compose.prod.yml exec backend env | grep SMTP

# Devrait afficher :
# SMTP_HOST=smtp.mail.ovh.net
# SMTP_PORT=587
# SMTP_USER=noreply@downpricer.com
# SMTP_PASS=***
# SMTP_FROM=noreply@downpricer.com
# SMTP_TLS_MODE=starttls
```

**Vérifier les logs** :

```bash
docker compose -f docker-compose.prod.yml logs backend | grep -i email | tail -20
```

**Erreurs courantes** :
- `SMTPAuthenticationError` : Vérifier SMTP_USER et SMTP_PASS
- `SMTPException` : Vérifier SMTP_HOST et SMTP_PORT
- `Connection timeout` : Vérifier que le port n'est pas bloqué (587 ou 465)

### Problème : Notifications désactivées alors qu'elles sont activées

**Vérifier dans la DB** :

```bash
# Se connecter à MongoDB
docker compose -f docker-compose.prod.yml exec mongo mongosh downpricer

# Dans mongosh :
db.settings.find({key: "email_notif_enabled"})
db.settings.find({key: "admin_notif_email"})

# Si absent, les créer :
db.settings.insertOne({key: "email_notif_enabled", value: true})
db.settings.insertOne({key: "admin_notif_email", value: "contact@downpricer.com"})
```

### Problème : Emails envoyés mais pas reçus

**Vérifier** :
1. Boîte de spam
2. Filtres email serveur
3. Logs SMTP serveur (OVH)
4. Email admin configuré correctement

### Problème : Erreur "Configuration SMTP incomplète"

**Solution** :
- Vérifier que toutes les variables SMTP sont définies dans `backend/.env`
- OU les configurer via l'admin UI (settings DB)

---

## ✅ VALIDATION FINALE

- [ ] Test 1 : Section notifications visible dans admin ✅
- [ ] Test 2 : Activation/désactivation fonctionne ✅
- [ ] Test 3 : Email de test envoyé et reçu ✅
- [ ] Test 4 : Email envoyé lors de création vente ✅
- [ ] Test 5 : Email envoyé lors validation/refus vente ✅
- [ ] Test 6 : Email envoyé lors mise à jour demande ✅

---

## 📝 NOTES

- **Priorité config** : Settings DB > Variables d'environnement
- **BackgroundTasks** : Les emails sont envoyés en arrière-plan (non bloquant)
- **Logs** : Chercher "Email envoyé avec succès" ou erreurs dans les logs backend
- **SMTP OVH** : 
  - Port 587 (STARTTLS) : `SMTP_TLS_MODE=starttls`
  - Port 465 (SSL) : `SMTP_TLS_MODE=ssl` + `SMTP_PORT=465`
- **Désactivation** : Les notifications peuvent être désactivées depuis l'admin sans redéployer

---

## 🎯 RÉSULTAT ATTENDU

Après ces modifications, le système de notifications email doit être :
- ✅ Configurable depuis l'admin (toggle ON/OFF + email admin)
- ✅ Testable via bouton "Envoyer un email de test"
- ✅ Actif sur les événements : création vente, validation/refus vente, mise à jour demande
- ✅ Sans coûts externes (SMTP simple OVH)
- ✅ Non bloquant (BackgroundTasks FastAPI)

