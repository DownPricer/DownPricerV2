# ✅ Configuration Stripe Finale - VPS OVH (Mode TEST)

## 📋 A) Variables d'environnement `.env` VPS

**Fichier :** `/opt/downpricer/.env`

**IP VPS :** `51.210.179.212` (vérifier avec `curl ifconfig.me`)

### Variables à ajouter/modifier :

```env
# ===== STRIPE CONFIGURATION (MODE TEST) =====

# Clé API Stripe (récupérée depuis https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...

# Webhook Signing Secret (récupéré depuis Stripe Dashboard → Webhooks → Signing secret)
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs des 3 plans (récupérés depuis Stripe Dashboard → Produits → Prix)
STRIPE_PRICE_MINISITE_STARTER=price_...
STRIPE_PRICE_MINISITE_STANDARD=price_...
STRIPE_PRICE_MINISITE_PREMIUM=price_...

# URLs de redirection (⚠️ IMPORTANT: utiliser l'IP VPS, PAS localhost)
STRIPE_SUCCESS_URL=http://51.210.179.212/minisite/dashboard?stripe=success&session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=http://51.210.179.212/minisite/dashboard?stripe=cancel
STRIPE_PORTAL_RETURN_URL=http://51.210.179.212/minisite/dashboard
```

**⚠️ REMPLACER `51.210.179.212` par votre IP VPS réelle !**

---

## ✅ B) Vérification Webhook (Raw Body + Signature)

**Fichier :** `backend/server.py` ligne ~1653

**Code actuel :**
```python
# Récupérer le raw body (IMPORTANT: ne pas parser en JSON avant)
body = await request.body()
sig_header = request.headers.get("stripe-signature")

# Vérifier la signature Stripe avec le raw body
event = stripe.Webhook.construct_event(
    body,
    sig_header,
    webhook_secret
)
```

**✅ CONFIRMÉ :** Le webhook :
- ✅ Lit le **RAW BODY** avec `await request.body()`
- ✅ Vérifie la **signature Stripe** avec `stripe.Webhook.construct_event()`
- ✅ Utilise le **webhook_secret** (`whsec_...`)
- ✅ Logs détaillés ajoutés (event type, customer, subscription, user email)

**Aucune modification nécessaire** - le code est correct.

---

## 📋 C) Événements Stripe à activer (Dashboard)

**Stripe Dashboard → Webhooks → Votre endpoint → Événements à envoyer**

### ✅ Liste MINIMUM (5 événements) :

1. ✅ `checkout.session.completed`
   - **Quand :** Après un paiement réussi
   - **Action :** Crée l'abonnement dans la DB

2. ✅ `customer.subscription.updated`
   - **Quand :** Upgrade, downgrade, renouvellement, changement de statut
   - **Action :** Met à jour le plan et le statut

3. ✅ `customer.subscription.deleted`
   - **Quand :** Annulation d'abonnement
   - **Action :** Désactive l'accès mini-site

4. ✅ `invoice.paid`
   - **Quand :** Paiement réussi (renouvellement ou après échec)
   - **Action :** Réactive l'accès si nécessaire

5. ✅ `invoice.payment_failed`
   - **Quand :** Échec de paiement
   - **Action :** Désactive l'accès mini-site

**Note :** `customer.subscription.created` n'est **PAS nécessaire** car `checkout.session.completed` couvre ce cas.

### URL du webhook :

```
http://51.210.179.212/api/billing/webhook
```

**⚠️ REMPLACER `51.210.179.212` par votre IP VPS réelle !**

---

## 📊 D) Logs ajoutés

### Logs dans le webhook (`server.py`) :

- 📥 Webhook reçu (headers, body size)
- ✅ Signature vérifiée (event ID)
- 🛒 Checkout session completed (customer, subscription, user, plan)
- 🔄 Subscription updated/deleted (subscription, customer, status, user, plan)
- 💳 Invoice paid/failed (invoice, subscription, customer, amount)
- ✅ Traitement réussi pour chaque événement
- ❌ Erreurs détaillées avec stack trace

### Logs dans les handlers (`stripe_billing.py`) :

- Chaque handler log :
  - Event type
  - Customer ID
  - Subscription ID
  - User ID + Email
  - Plan
  - Status
  - Résultat du traitement

### Voir les logs :

```bash
# Logs en temps réel (filtrés Stripe)
docker compose -f docker-compose.prod.yml logs -f backend | grep -i "stripe\|webhook\|✅\|❌"

# Derniers logs Stripe
docker compose -f docker-compose.prod.yml logs backend --tail=100 | grep -i stripe
```

---

## 🧪 E) Guide de Test de Bout en Bout

### Prérequis

- [ ] Variables Stripe ajoutées dans `.env` VPS
- [ ] Produits créés dans Stripe Dashboard
- [ ] Webhook configuré dans Stripe Dashboard
- [ ] Backend rebuild avec les nouvelles variables

---

### Test 1 : Checkout (Souscription)

**Objectif :** Vérifier qu'un utilisateur peut souscrire à un plan

**Étapes :**

1. Se connecter sur `http://51.210.179.212`
2. Aller sur `/minisite/dashboard`
3. Cliquer sur "Souscrire Starter (1€/mois)"
4. Utiliser la carte de test : `4242 4242 4242 4242`
   - Date : 12/25 (ou toute date future)
   - CVC : 123 (ou n'importe quel 3 chiffres)
5. Compléter le paiement

**Vérifications :**

```bash
# Vérifier les logs backend
docker compose -f docker-compose.prod.yml logs backend | grep -i "checkout\|✅" | tail -20

# Vérifier dans MongoDB
docker compose -f docker-compose.prod.yml exec mongo mongosh downpricer --eval "
db.users.findOne(
  {email: 'VOTRE_EMAIL'},
  {
    stripe_subscription_id: 1,
    stripe_subscription_status: 1,
    minisite_active: 1,
    minisite_plan: 1
  }
)
"

docker compose -f docker-compose.prod.yml exec mongo mongosh downpricer --eval "
db.subscriptions.find({product: 'minisite'}).sort({created_at: -1}).limit(1).pretty()
"
```

**Résultat attendu :**
- ✅ Redirection vers `/minisite/dashboard?stripe=success&session_id=...`
- ✅ `minisite_active = true` dans la DB
- ✅ `stripe_subscription_id` présent
- ✅ Abonnement visible dans Stripe Dashboard
- ✅ Abonnement visible dans Admin → Abonnements

---

### Test 2 : Retour Success/Cancel

**Objectif :** Vérifier que les redirections fonctionnent

**Étapes :**

1. **Success :** Compléter un checkout → doit rediriger vers `/minisite/dashboard?stripe=success&session_id=...`
2. **Cancel :** Démarrer un checkout puis cliquer sur "Retour" → doit rediriger vers `/minisite/dashboard?stripe=cancel`

**Vérifications :**

- ✅ URL contient `stripe=success` ou `stripe=cancel`
- ✅ Page dashboard s'affiche correctement
- ✅ Pas d'erreur dans la console navigateur (F12)

---

### Test 3 : Customer Portal (Gestion abonnement)

**Objectif :** Vérifier que l'utilisateur peut gérer son abonnement

**Étapes :**

1. Se connecter avec un utilisateur ayant un abonnement actif
2. Aller sur `/minisite/dashboard`
3. Cliquer sur "Gérer mon abonnement"
4. Dans le Stripe Portal :
   - Vérifier les informations de l'abonnement
   - Tester l'upgrade (changer vers Premium)
   - Tester le downgrade (changer vers Starter)
   - Tester l'annulation (annuler l'abonnement)

**Vérifications :**

```bash
# Vérifier les logs backend (webhook subscription.updated)
docker compose -f docker-compose.prod.yml logs backend | grep -i "subscription.updated\|✅" | tail -20

# Vérifier dans MongoDB
docker compose -f docker-compose.prod.yml exec mongo mongosh downpricer --eval "
db.subscriptions.findOne({id: 'SUB_ID'})
"
```

**Résultat attendu :**
- ✅ Portal s'ouvre correctement
- ✅ Modifications reflétées dans la DB après quelques secondes (webhook)
- ✅ `minisite_plan` mis à jour si upgrade/downgrade
- ✅ `minisite_active = false` si annulation (après période)

---

### Test 4 : Webhook (Depuis Dashboard/CLI)

**Objectif :** Vérifier que les webhooks sont bien reçus et traités

**Méthode 1 : Via Stripe Dashboard**

1. Stripe Dashboard → **Webhooks** → Votre endpoint
2. Cliquer sur **"Send test webhook"**
3. Choisir un événement (ex: `checkout.session.completed`)
4. Cliquer sur **"Send test webhook"**

**Méthode 2 : Via Stripe CLI (si installé)**

```bash
# Envoyer un événement de test
stripe trigger checkout.session.completed
```

**Vérifications :**

```bash
# Vérifier les logs backend
docker compose -f docker-compose.prod.yml logs backend | grep -i "webhook\|📥\|✅" | tail -30

# Vérifier que l'événement a été traité
docker compose -f docker-compose.prod.yml logs backend | grep -i "✅ Traitement réussi"
```

**Résultat attendu :**
- ✅ Logs montrent "📥 Webhook reçu"
- ✅ Logs montrent "✅ Signature Stripe vérifiée"
- ✅ Logs montrent "✅ Traitement réussi: [event_type]"
- ✅ Pas d'erreur dans les logs

---

### Test 5 : Admin Page Abonnements

**Objectif :** Vérifier que l'admin voit tous les abonnements

**Étapes :**

1. Se connecter en tant qu'admin
2. Aller sur `/admin/abonnements`
3. Vérifier l'onglet "Mini-sites"

**Vérifications :**

- ✅ Liste des abonnements s'affiche
- ✅ Email utilisateur visible
- ✅ Plan affiché (Starter/Standard/Premium)
- ✅ Statut affiché (Actif/Trialing/Annulé/etc.)
- ✅ Prochaine échéance affichée
- ✅ ID Stripe visible (tronqué)

**Vérifier dans MongoDB :**

```bash
docker compose -f docker-compose.prod.yml exec mongo mongosh downpricer --eval "
db.subscriptions.find({product: 'minisite'}).sort({created_at: -1}).pretty()
"
```

---

## 🚀 Commandes VPS Exactes

### 1. Connexion au VPS

```bash
ssh ubuntu@51.210.179.212
sudo -i
cd /opt/downpricer
```

---

### 2. Vérifier l'IP du VPS

```bash
curl ifconfig.me
# Notez cette IP (exemple: 51.210.179.212)
```

---

### 3. Ajouter les variables Stripe dans `.env`

```bash
# Éditer le fichier .env
nano .env
```

**Ajouter ces lignes (remplacer les valeurs par vos vraies clés Stripe) :**

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MINISITE_STARTER=price_...
STRIPE_PRICE_MINISITE_STANDARD=price_...
STRIPE_PRICE_MINISITE_PREMIUM=price_...
STRIPE_SUCCESS_URL=http://51.210.179.212/minisite/dashboard?stripe=success&session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=http://51.210.179.212/minisite/dashboard?stripe=cancel
STRIPE_PORTAL_RETURN_URL=http://51.210.179.212/minisite/dashboard
```

**Sauvegarder :** `Ctrl+X`, puis `Y`, puis `Enter`

---

### 4. Vérifier que les variables sont bien chargées

```bash
# Vérifier le contenu du .env
grep STRIPE .env

# Vérifier que les variables sont dans l'environnement du conteneur (après rebuild)
docker compose -f docker-compose.prod.yml exec backend env | grep STRIPE
```

---

### 5. Rebuild et redémarrer le backend

```bash
cd /opt/downpricer

# Arrêter les services
docker compose -f docker-compose.prod.yml down

# Rebuild le backend avec les nouvelles variables
docker compose -f docker-compose.prod.yml up -d --build backend

# Attendre 10 secondes
sleep 10

# Vérifier que le backend démarre correctement
docker compose -f docker-compose.prod.yml logs backend --tail=50
```

---

### 6. Vérifier que le backend fonctionne

```bash
# Health check
curl http://localhost/api/health

# Vérifier les logs (rechercher les erreurs Stripe)
docker compose -f docker-compose.prod.yml logs backend | grep -i "stripe\|error" | tail -20

# Vérifier que Stripe est configuré
docker compose -f docker-compose.prod.yml logs backend | grep -i "STRIPE_SECRET_KEY\|stripe.*config"
```

---

### 7. Redémarrer tous les services (si nécessaire)

```bash
cd /opt/downpricer

# Redémarrer tout
docker compose -f docker-compose.prod.yml restart

# OU rebuild complet
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# Vérifier que tout tourne
docker ps
```

---

## 🔍 Vérifications Post-Déploiement

### Vérifier les logs Stripe

```bash
# Logs en temps réel (filtrés)
docker compose -f docker-compose.prod.yml logs -f backend | grep -i "stripe\|webhook\|✅\|❌"

# Logs des 100 dernières lignes
docker compose -f docker-compose.prod.yml logs backend --tail=100 | grep -i stripe
```

### Vérifier la configuration Stripe dans le backend

```bash
# Tester la connexion Stripe (depuis le conteneur backend)
docker compose -f docker-compose.prod.yml exec backend python3 -c "
import os
import stripe
from dotenv import load_dotenv
load_dotenv()
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')
if stripe.api_key:
    print('✅ STRIPE_SECRET_KEY configurée:', stripe.api_key[:20] + '...')
    try:
        customers = stripe.Customer.list(limit=1)
        print('✅ Connexion Stripe OK')
    except Exception as e:
        print('❌ Erreur Stripe:', str(e))
else:
    print('❌ STRIPE_SECRET_KEY non configurée')
"
```

### Vérifier les webhooks dans Stripe Dashboard

1. Stripe Dashboard → **Webhooks**
2. Vérifier que votre endpoint est **"Enabled"**
3. Vérifier les **"Recent events"** → doit montrer les événements reçus
4. Cliquer sur un événement → vérifier le statut (200 OK = succès)

---

## 📝 Checklist de Déploiement

- [ ] Variables Stripe ajoutées dans `.env` VPS
- [ ] URLs de redirection utilisent l'IP VPS (pas localhost)
- [ ] Produits créés dans Stripe Dashboard (3 plans)
- [ ] Webhook créé dans Stripe Dashboard avec la bonne URL
- [ ] 5 événements Stripe activés (voir section C)
- [ ] Webhook Signing Secret récupéré et ajouté dans `.env`
- [ ] Backend rebuild avec les nouvelles variables
- [ ] Test checkout réussi
- [ ] Test portal réussi
- [ ] Test webhook réussi
- [ ] Admin page Abonnements affiche les données

---

## 🚨 Dépannage Rapide

### Le webhook ne fonctionne pas

```bash
# Vérifier que STRIPE_WEBHOOK_SECRET est configuré
docker compose -f docker-compose.prod.yml exec backend env | grep STRIPE_WEBHOOK_SECRET

# Vérifier que l'URL est accessible
curl -X POST http://51.210.179.212/api/billing/webhook -H "stripe-signature: test" -d "{}"
# Doit retourner une erreur de signature, pas 404
```

### Les abonnements ne se créent pas

```bash
# Vérifier les logs lors d'un checkout
docker compose -f docker-compose.prod.yml logs backend | grep -i "checkout\|error" | tail -30

# Vérifier les price_id
docker compose -f docker-compose.prod.yml exec backend env | grep STRIPE_PRICE
```

### L'utilisateur n'a pas accès au mini-site

```bash
# Vérifier l'utilisateur dans MongoDB
docker compose -f docker-compose.prod.yml exec mongo mongosh downpricer --eval "
db.users.findOne(
  {email: 'VOTRE_EMAIL'},
  {
    stripe_subscription_id: 1,
    stripe_subscription_status: 1,
    minisite_active: 1,
    minisite_plan: 1
  }
)
"
```

---

## 📚 Documentation Complète

- **`STRIPE_SETUP.md`** : Guide général Stripe
- **`STRIPE_VPS_CONFIG.md`** : Configuration spécifique VPS + Guide de test détaillé
- **`STRIPE_FINAL_CONFIG.md`** : Ce document (récapitulatif)

---

## ✅ Résumé Final

**Variables `.env` VPS :** 8 variables Stripe à ajouter
**Webhook :** ✅ Raw body + signature vérifiée (code correct)
**Événements Stripe :** 5 événements minimum à activer
**Logs :** ✅ Logs détaillés ajoutés partout
**Tests :** Guide complet dans `STRIPE_VPS_CONFIG.md`

**Tout est prêt pour les tests ! 🚀**








