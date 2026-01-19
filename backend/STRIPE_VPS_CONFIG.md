# 🔐 Configuration Stripe - VPS OVH (Mode TEST)

## 📋 Variables d'environnement à ajouter/modifier dans `.env` VPS

**IP VPS détectée :** `51.210.179.212` (à vérifier avec `curl ifconfig.me`)

**⚠️ IMPORTANT :** Toutes les URLs doivent utiliser l'IP du VPS, **PAS** `localhost` !

### Variables Stripe à ajouter dans `/opt/downpricer/.env` :

```env
# ===== STRIPE CONFIGURATION (MODE TEST) =====

# Clé API Stripe (mode test)
STRIPE_SECRET_KEY=sk_test_...

# Webhook Signing Secret (récupéré depuis Stripe Dashboard → Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs des 3 plans Mini-site (récupérés depuis Stripe Dashboard → Produits)
STRIPE_PRICE_MINISITE_STARTER=price_...
STRIPE_PRICE_MINISITE_STANDARD=price_...
STRIPE_PRICE_MINISITE_PREMIUM=price_...

# URLs de redirection (IMPORTANT: utiliser l'IP du VPS, pas localhost)
STRIPE_SUCCESS_URL=http://51.210.179.212/minisite/dashboard?stripe=success&session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=http://51.210.179.212/minisite/dashboard?stripe=cancel
STRIPE_PORTAL_RETURN_URL=http://51.210.179.212/minisite/dashboard
```

**⚠️ REMPLACER `51.210.179.212` par votre IP VPS réelle si différente !**

---

## 🔗 Configuration Webhook Stripe Dashboard

### Événements à activer (MINIMUM requis) :

Dans Stripe Dashboard → **Webhooks** → Votre endpoint → **Événements à envoyer** :

✅ **Événements obligatoires :**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

**Note :** `customer.subscription.created` n'est pas nécessaire car `checkout.session.completed` couvre ce cas.

### URL du webhook :

```
http://51.210.179.212/api/billing/webhook
```

**⚠️ REMPLACER `51.210.179.212` par votre IP VPS réelle !**

### Récupérer le Webhook Signing Secret :

1. Stripe Dashboard → **Webhooks**
2. Cliquer sur votre endpoint
3. Section **"Signing secret"**
4. Cliquer sur **"Reveal"**
5. Copier le secret (commence par `whsec_...`)
6. L'ajouter dans `.env` comme `STRIPE_WEBHOOK_SECRET`

---

## ✅ Vérification du Webhook (Raw Body + Signature)

Le webhook dans `server.py` :

✅ **Lit le RAW BODY** : `body = await request.body()`
✅ **Vérifie la signature** : `stripe.Webhook.construct_event(body, sig_header, webhook_secret)`
✅ **Logs détaillés** : Event type, customer, subscription, user email

**Aucune modification nécessaire** - le code est correct.

---

## 🧪 Guide de Test de Bout en Bout

### Prérequis

1. ✅ Variables d'environnement configurées dans `.env`
2. ✅ Produits créés dans Stripe Dashboard
3. ✅ Webhook configuré dans Stripe Dashboard
4. ✅ Backend redémarré avec les nouvelles variables

---

### Test 1 : Checkout (Souscription)

**Objectif :** Vérifier qu'un utilisateur peut souscrire à un plan

**Étapes :**

1. Se connecter sur `http://51.210.179.212`
2. Aller sur `/minisite/dashboard`
3. Cliquer sur "Souscrire Starter (1€/mois)"
4. Utiliser la carte de test Stripe : `4242 4242 4242 4242`
   - Date : N'importe quelle date future (ex: 12/25)
   - CVC : N'importe quel 3 chiffres (ex: 123)
5. Compléter le paiement

**Vérifications :**

```bash
# Vérifier les logs backend
docker compose -f docker-compose.prod.yml logs backend | grep -i "checkout\|stripe"

# Vérifier dans MongoDB
docker compose -f docker-compose.prod.yml exec mongo mongosh downpricer --eval "db.users.findOne({email: 'VOTRE_EMAIL'})"
docker compose -f docker-compose.prod.yml exec mongo mongosh downpricer --eval "db.subscriptions.find({product: 'minisite'}).pretty()"
```

**Résultat attendu :**
- ✅ Redirection vers `/minisite/dashboard?stripe=success&session_id=...`
- ✅ `minisite_active = true` dans la DB
- ✅ `stripe_subscription_id` présent dans la DB
- ✅ Abonnement visible dans Stripe Dashboard
- ✅ Abonnement visible dans Admin → Abonnements

---

### Test 2 : Retour Success/Cancel

**Objectif :** Vérifier que les redirections fonctionnent

**Étapes :**

1. **Success :** Compléter un checkout → doit rediriger vers `/minisite/dashboard?stripe=success&session_id=...`
2. **Cancel :** Démarrer un checkout puis annuler → doit rediriger vers `/minisite/dashboard?stripe=cancel`

**Vérifications :**

- ✅ URL contient `stripe=success` ou `stripe=cancel`
- ✅ Page dashboard s'affiche correctement
- ✅ Pas d'erreur dans la console navigateur

---

### Test 3 : Customer Portal (Gestion abonnement)

**Objectif :** Vérifier que l'utilisateur peut gérer son abonnement

**Étapes :**

1. Se connecter avec un utilisateur ayant un abonnement actif
2. Aller sur `/minisite/dashboard`
3. Cliquer sur "Gérer mon abonnement"
4. Dans le Stripe Portal :
   - Vérifier les informations de l'abonnement
   - Tester l'upgrade (changer de plan)
   - Tester le downgrade (changer de plan)
   - Tester l'annulation (annuler l'abonnement)

**Vérifications :**

```bash
# Vérifier les logs backend (webhook subscription.updated)
docker compose -f docker-compose.prod.yml logs backend | grep -i "subscription.updated"

# Vérifier dans MongoDB
docker compose -f docker-compose.prod.yml exec mongo mongosh downpricer --eval "db.subscriptions.findOne({id: 'SUB_ID'})"
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

**Méthode 2 : Via Stripe CLI (si installé sur le VPS)**

```bash
# Envoyer un événement de test
stripe trigger checkout.session.completed
```

**Vérifications :**

```bash
# Vérifier les logs backend
docker compose -f docker-compose.prod.yml logs backend | grep -i "webhook\|stripe" | tail -20

# Vérifier que l'événement a été traité
docker compose -f docker-compose.prod.yml logs backend | grep -i "✅\|❌"
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
docker compose -f docker-compose.prod.yml exec mongo mongosh downpricer --eval "db.subscriptions.find({product: 'minisite'}).pretty()"
```

---

## 🚀 Commandes VPS pour Rebuild/Restart

### 1. Connexion au VPS

```bash
ssh ubuntu@51.210.179.212
sudo -i
cd /opt/downpricer
```

---

### 2. Ajouter/Modifier les variables Stripe dans `.env`

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

### 3. Vérifier que les variables sont bien chargées

```bash
# Vérifier le contenu du .env
grep STRIPE .env
```

---

### 4. Rebuild et redémarrer le backend

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

### 5. Vérifier que le backend fonctionne

```bash
# Health check
curl http://localhost/api/health

# Vérifier les logs (rechercher les erreurs Stripe)
docker compose -f docker-compose.prod.yml logs backend | grep -i "stripe\|error" | tail -20
```

---

### 6. Redémarrer tous les services (si nécessaire)

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
# Logs en temps réel
docker compose -f docker-compose.prod.yml logs -f backend | grep -i stripe

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

## 🚨 Dépannage

### Le webhook ne fonctionne pas

**Symptômes :**
- Les événements Stripe ne sont pas traités
- Les logs montrent "Invalid signature"

**Solutions :**

1. Vérifier que `STRIPE_WEBHOOK_SECRET` est correct :
   ```bash
   docker compose -f docker-compose.prod.yml exec backend env | grep STRIPE_WEBHOOK_SECRET
   ```

2. Vérifier que l'URL du webhook est accessible publiquement :
   ```bash
   curl -X POST http://51.210.179.212/api/billing/webhook -H "stripe-signature: test" -d "{}"
   # Doit retourner une erreur de signature, pas 404
   ```

3. Vérifier que le webhook dans Stripe Dashboard utilise la bonne URL (IP, pas localhost)

### Les abonnements ne se créent pas

**Vérifications :**

1. Vérifier que les `price_id` sont corrects :
   ```bash
   docker compose -f docker-compose.prod.yml exec backend env | grep STRIPE_PRICE
   ```

2. Vérifier les logs lors d'un checkout :
   ```bash
   docker compose -f docker-compose.prod.yml logs backend | grep -i "checkout\|error" | tail -30
   ```

3. Vérifier dans Stripe Dashboard → **Logs** qu'il n'y a pas d'erreur

### L'utilisateur n'a pas accès au mini-site

**Vérifications :**

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

**Si `minisite_active = false` :**
- Vérifier `stripe_subscription_status` (doit être "active" ou "trialing")
- Vérifier que le webhook `checkout.session.completed` a bien été traité

---

## 📝 Checklist de Déploiement

- [ ] Variables Stripe ajoutées dans `.env` VPS
- [ ] URLs de redirection utilisent l'IP VPS (pas localhost)
- [ ] Produits créés dans Stripe Dashboard
- [ ] Webhook créé dans Stripe Dashboard avec la bonne URL
- [ ] Événements Stripe activés (5 événements minimum)
- [ ] Webhook Signing Secret récupéré et ajouté dans `.env`
- [ ] Backend rebuild avec les nouvelles variables
- [ ] Test checkout réussi
- [ ] Test portal réussi
- [ ] Test webhook réussi
- [ ] Admin page Abonnements affiche les données

---

## 📚 Ressources

- [Stripe Dashboard Test Mode](https://dashboard.stripe.com/test)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)

