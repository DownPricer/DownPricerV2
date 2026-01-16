# ✅ Checklist - Notifications Email

## 📋 RÉSUMÉ

Le système de notifications email est **déjà implémenté** dans le backend. Ce patch ajoute uniquement l'UI admin pour gérer les paramètres email.

### Ce qui existe déjà :
- ✅ Module `backend/utils/mailer.py` (complet)
- ✅ Endpoint `/api/admin/email/test`
- ✅ Triggers email sur les demandes (ACCEPTED, PROPOSAL_FOUND, CANCELLED)
- ✅ Triggers email sur les ventes (création, validation, rejet)
- ✅ Configuration via variables d'environnement
- ✅ Configuration via settings DB (priorité sur env vars)

### Ce qui a été ajouté :
- ✅ UI admin pour activer/désactiver les notifications
- ✅ UI admin pour configurer l'email admin
- ✅ Bouton "Envoyer un email de test" dans l'admin
- ✅ Mise à jour des fichiers `.env.example`

---

## 🚀 CONFIGURATION INITIALE

### 1. Configurer les variables SMTP (sur le VPS)

**Sur le VPS**, éditer le fichier `.env` du backend :

```bash
ssh ubuntu@51.210.179.212
sudo -i
cd /opt/downpricer
nano backend/.env
```

**Ajouter/modifier** :

```bash
# SMTP Configuration (OVH Zimbra)
SMTP_HOST=smtp.mail.ovh.net
SMTP_PORT=587
SMTP_USER=noreply@downpricer.com
SMTP_PASS=votre-mot-de-passe-smtp-ovh
SMTP_FROM=noreply@downpricer.com
SMTP_TLS_MODE=starttls

# Email notifications (désactivé par défaut, activable depuis l'admin)
EMAIL_NOTIF_ENABLED=false
ADMIN_NOTIF_EMAIL=contact@downpricer.com
```

**Note** : Pour OVH Zimbra, utiliser :
- Port **587** avec `SMTP_TLS_MODE=starttls` (recommandé)
- OU port **465** avec `SMTP_TLS_MODE=ssl`

### 2. Redémarrer le backend (si variables modifiées)

```bash
cd /opt/downpricer
docker compose -f docker-compose.prod.yml restart backend

# Vérifier les logs
docker compose -f docker-compose.prod.yml logs backend | tail -20
```

---

## 🧪 TESTS

### Test 1 : Activer les notifications depuis l'admin UI

1. **Se connecter** : http://51.210.179.212
2. **Login Admin**
3. **Aller dans** : Admin > Paramètres > Onglet "Notifications email"
4. **Activer** le toggle "Activer les notifications email"
5. **Configurer** l'email admin (ex: contact@downpricer.com)
6. **Cliquer** sur "Envoyer un email de test"
7. **Vérifier** :
   - ✅ Toast de succès affiché
   - ✅ Email reçu dans la boîte configurée

### Test 2 : Test via API (depuis le VPS)

```bash
# Récupérer le token admin (depuis la console navigateur F12 > Application > Local Storage > token)
TOKEN="votre-token-admin"

# Test endpoint email
curl -X POST http://localhost/api/admin/email/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Résultat attendu :
# {"success":true,"message":"Email de test envoyé à contact@downpricer.com"}
```

### Test 3 : Test fonctionnel - Trigger demande

1. **Créer une demande** (en tant que client)
2. **Aller dans** Admin > Demandes
3. **Changer le statut** de la demande à "ACCEPTED" ou "PROPOSAL_FOUND"
4. **Vérifier** :
   - ✅ Email reçu par le client
   - ✅ Email reçu par l'admin (si configuré)

### Test 4 : Test fonctionnel - Trigger vente

1. **Créer une vente** (en tant que vendeur)
2. **Vérifier** :
   - ✅ Email reçu par l'admin (nouvelle vente à valider)
3. **Valider ou refuser la vente** (admin)
4. **Vérifier** :
   - ✅ Email reçu par le vendeur (validation ou refus avec raison)

### Test 5 : Vérifier les logs Docker

```bash
# Logs backend (erreurs SMTP)
docker compose -f docker-compose.prod.yml logs backend | grep -i "email\|smtp" | tail -20

# Logs complets
docker compose -f docker-compose.prod.yml logs backend | tail -50
```

**Erreurs courantes** :
- `SMTPAuthenticationError` : Mauvais identifiants SMTP
- `SMTPException` : Problème de connexion SMTP (vérifier le port/firewall)
- `Configuration SMTP incomplète` : Variables d'environnement manquantes

---

## 🔍 DIAGNOSTIC

### Problème : L'email de test ne s'envoie pas

**Vérifier les logs** :
```bash
docker compose -f docker-compose.prod.yml logs backend | grep -i "email\|smtp" | tail -30
```

**Vérifier la configuration** :
1. Variables d'environnement présentes dans `.env` ?
2. Toggle "Activer les notifications email" activé dans l'admin ?
3. Email admin configuré ?
4. Identifiants SMTP corrects ?

**Tester la connexion SMTP manuellement** (depuis le VPS) :
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

### Problème : Emails reçus en spam

**Solutions** :
1. Vérifier le SPF/DKIM de votre domaine (OVH)
2. Utiliser `SMTP_FROM=noreply@downpricer.com` (doit correspondre au domaine)
3. Ajouter un en-tête `Reply-To` dans les emails (à faire dans `mailer.py` si nécessaire)

### Problème : Les notifications ne se déclenchent pas

**Vérifier** :
1. Le toggle est bien activé dans l'admin ?
2. Les triggers sont bien dans le code (déjà présents) ?
3. Les logs montrent "Email notifications désactivées" ?

---

## 📝 TRIGGERS EMAIL IMPLÉMENTÉS

### Demandes clients

- ✅ **ACCEPTED** : Email au client + admin
- ✅ **PROPOSAL_FOUND** : Email au client + admin
- ✅ **CANCELLED** (avec raison) : Email au client + admin

### Ventes vendeurs

- ✅ **Création de vente** : Email à l'admin (nouvelle vente à valider)
- ✅ **Validation de vente** : Email au vendeur
- ✅ **Rejet de vente** (avec raison) : Email au vendeur

---

## ⚙️ CONFIGURATION AVANCÉE

### Activer/désactiver depuis l'admin (sans redéployer)

1. Aller dans Admin > Paramètres > Notifications email
2. Toggle "Activer les notifications email"
3. Sauvegarde automatique dans la DB (priorité sur env vars)

### Configuration SMTP OVH

Pour OVH Zimbra, utiliser :
- **Port 587** (STARTTLS) : Recommandé, plus compatible
- **Port 465** (SSL) : Alternative si le port 587 est bloqué

**Variables** :
```bash
SMTP_HOST=smtp.mail.ovh.net
SMTP_PORT=587  # ou 465
SMTP_TLS_MODE=starttls  # ou ssl si port 465
SMTP_USER=noreply@downpricer.com
SMTP_PASS=votre-mot-de-passe-zimbra
SMTP_FROM=noreply@downpricer.com
```

---

## ✅ VALIDATION FINALE

- [ ] Variables SMTP configurées dans `.env`
- [ ] Test email réussi depuis l'admin UI
- [ ] Test email réussi via API curl
- [ ] Trigger demande testé (ACCEPTED → emails client + admin)
- [ ] Trigger vente testé (création → email admin)
- [ ] Trigger validation vente testé (validation → email vendeur)
- [ ] Aucune erreur dans les logs Docker

---

## 🎯 RÉSULTAT ATTENDU

Après configuration, le système doit :
- ✅ Envoyer des emails de notification automatiques
- ✅ Permettre l'activation/désactivation depuis l'admin
- ✅ Tester la configuration via un bouton dans l'admin
- ✅ Gérer les erreurs SMTP sans bloquer l'API (BackgroundTasks)

---

## 📌 NOTES

- **Pas de coûts** : SMTP simple, pas de service externe (Sendgrid/Mailgun)
- **Asynchrone** : Les emails sont envoyés en background (ne bloque pas l'API)
- **Priorité DB** : Les settings de la DB ont priorité sur les variables d'environnement
- **Fallback** : Si les settings DB n'existent pas, utilisation des env vars




