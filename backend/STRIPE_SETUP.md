# 🔐 Configuration Stripe - Abonnements Mini-site

## 📋 Vue d'ensemble

Intégration Stripe complète pour gérer les abonnements mensuels des mini-sites DownPricer.

**Architecture :**
- Stripe Checkout pour les souscriptions
- Stripe Customer Portal pour la gestion (annulation, upgrade, downgrade)
- Webhooks Stripe pour synchroniser les statuts (pas de cron)

---

## 🚀 Configuration initiale

### 1. Créer un compte Stripe (mode test)

1. Aller sur https://dashboard.stripe.com/test/apikeys
2. Récupérer la **Secret Key** (sk_test_...)
3. Créer un **Webhook** (voir section Webhooks ci-dessous)

### 2. Créer les produits et prix dans Stripe

Dans le dashboard Stripe :

1. **Produits** → Créer un produit "Mini-site Starter"
   - Prix : 1€ / mois (récurrent)
   - Récupérer le `price_id` (price_...)

2. **Produits** → Créer un produit "Mini-site Standard"
   - Prix : 10€ / mois (récurrent)
   - Récupérer le `price_id` (price_...)

3. **Produits** → Créer un produit "Mini-site Premium"
   - Prix : 15€ / mois (récurrent)
   - Récupérer le `price_id` (price_...)

### 3. Configurer les variables d'environnement

Ajouter dans `backend/.env` :

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (récupérés depuis Stripe Dashboard)
STRIPE_PRICE_MINISITE_STARTER=price_...
STRIPE_PRICE_MINISITE_STANDARD=price_...
STRIPE_PRICE_MINISITE_PREMIUM=price_...

# URLs de redirection
STRIPE_SUCCESS_URL=http://localhost:3000/minisite/dashboard?stripe=success&session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=http://localhost:3000/minisite/dashboard?stripe=cancel
STRIPE_PORTAL_RETURN_URL=http://localhost:3000/minisite/dashboard
```

**⚠️ IMPORTANT :** Ne JAMAIS commiter ces secrets dans Git !

---

## 🔗 Configuration Webhook Stripe

### En développement local

1. Installer Stripe CLI : https://stripe.com/docs/stripe-cli
2. Se connecter : `stripe login`
3. Forwarder les webhooks :
   ```bash
   stripe listen --forward-to http://localhost:8001/api/billing/webhook
   ```
4. Récupérer le **Webhook Signing Secret** (whsec_...)
5. L'ajouter dans `.env` comme `STRIPE_WEBHOOK_SECRET`

### En production (VPS)

1. Dans Stripe Dashboard → **Webhooks**
2. Cliquer sur **"Add endpoint"**
3. URL : `http://VOTRE_IP/api/billing/webhook` (ex: `http://51.210.179.212/api/billing/webhook`)
4. **Événements à activer (MINIMUM requis) :**
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`
   
   **Note :** `customer.subscription.created` n'est pas nécessaire car `checkout.session.completed` couvre ce cas.
5. Récupérer le **Signing Secret** (cliquer sur "Reveal") et l'ajouter dans `.env` du serveur comme `STRIPE_WEBHOOK_SECRET`

**⚠️ IMPORTANT :** Utiliser l'IP du VPS, pas `localhost` ni un domaine si vous n'en avez pas configuré.

---

## 📊 Modèles de données

### Collection `users` (MongoDB)

Champs ajoutés pour Stripe :

```javascript
{
  stripe_customer_id: "cus_...",
  stripe_subscription_id: "sub_...",
  stripe_subscription_status: "active" | "trialing" | "canceled" | "past_due" | "unpaid",
  stripe_current_period_end: "2024-01-15T00:00:00Z",
  minisite_plan: "starter" | "standard" | "premium" | null,
  minisite_active: true | false
}
```

### Collection `subscriptions` (MongoDB)

Créée automatiquement par les webhooks :

```javascript
{
  id: "sub_...",  // stripe_subscription_id
  user_id: "...",
  user_email: "...",
  product: "minisite",
  plan: "starter" | "standard" | "premium",
  price_id: "price_...",
  amount_cents: 100,  // en centimes
  currency: "eur",
  stripe_customer_id: "cus_...",
  stripe_subscription_id: "sub_...",
  status: "active" | "trialing" | "canceled" | "past_due" | "unpaid",
  current_period_end: "2024-01-15T00:00:00Z",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
}
```

---

## 🔌 API Endpoints

### 1. Créer une session Checkout

**POST** `/api/billing/minisite/checkout`

**Auth :** Requis (user connecté)

**Body :**
```json
{
  "plan": "starter" | "standard" | "premium"
}
```

**Response :**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### 2. Créer une session Customer Portal

**POST** `/api/billing/portal`

**Auth :** Requis (user connecté)

**Response :**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

### 3. Webhook Stripe

**POST** `/api/billing/webhook`

**Auth :** Aucune (vérification signature Stripe)

**Headers :**
- `stripe-signature` : Signature Stripe

**Body :** Raw body (événement Stripe)

---

## 🧪 Tests

### Cartes de test Stripe

- **Succès :** `4242 4242 4242 4242`
- **Échec :** `4000 0000 0000 0002`
- **3D Secure :** `4000 0027 6000 3184`
- **Date :** N'importe quelle date future
- **CVC :** N'importe quel 3 chiffres

### Scénarios de test

1. **Souscription**
   - Aller sur `/minisite/dashboard`
   - Cliquer sur "Souscrire Starter"
   - Utiliser la carte `4242 4242 4242 4242`
   - Vérifier que l'abonnement est créé dans Stripe
   - Vérifier que `minisite_active = true` dans la DB

2. **Upgrade**
   - Via Customer Portal
   - Vérifier que le plan change dans la DB

3. **Annulation**
   - Via Customer Portal
   - Vérifier que `minisite_active = false` après la période

4. **Paiement échoué**
   - Utiliser la carte `4000 0000 0000 0002`
   - Vérifier que `minisite_active = false`

---

## 🔍 Vérification

### Backend

```bash
# Vérifier que le backend démarre
docker compose -f docker-compose.prod.yml up -d --build backend

# Vérifier les logs
docker compose -f docker-compose.prod.yml logs backend | grep -i stripe
```

### Webhooks

```bash
# En local avec Stripe CLI
stripe listen --forward-to http://localhost:8001/api/billing/webhook

# Vérifier les événements reçus
stripe events list
```

### Base de données

```javascript
// Vérifier les abonnements
db.subscriptions.find({product: "minisite"}).pretty()

// Vérifier un utilisateur
db.users.findOne({email: "user@example.com"})
```

---

## 🚨 Dépannage

### Le webhook ne fonctionne pas

1. Vérifier que `STRIPE_WEBHOOK_SECRET` est correct
2. Vérifier que l'URL du webhook est accessible publiquement (en prod)
3. Vérifier les logs backend pour les erreurs de signature

### L'abonnement ne se crée pas

1. Vérifier que les `price_id` sont corrects dans `.env`
2. Vérifier que `STRIPE_SECRET_KEY` est valide
3. Vérifier les logs Stripe Dashboard → Logs

### L'utilisateur n'a pas accès au mini-site

1. Vérifier `minisite_active` dans la DB
2. Vérifier `stripe_subscription_status` (doit être "active" ou "trialing")
3. Vérifier que le webhook `checkout.session.completed` a bien été traité

---

## 📝 Notes importantes

- **Pas de cron** : Tout est géré par les webhooks Stripe
- **Mode test** : Utiliser `sk_test_...` et les cartes de test
- **Production** : Changer vers `sk_live_...` et configurer les webhooks en prod
- **Sécurité** : Ne JAMAIS exposer les clés Stripe côté frontend
- **Customer Portal** : Permet à l'utilisateur de gérer son abonnement sans intervention admin

---

## 🔄 Migration vers la production

1. Créer les produits dans Stripe **Production**
2. Récupérer les nouveaux `price_id` (price_...)
3. Changer `STRIPE_SECRET_KEY` vers `sk_live_...`
4. Configurer le webhook en production
5. Mettre à jour les URLs de redirection (`STRIPE_SUCCESS_URL`, etc.)
6. Tester avec une vraie carte (petit montant)

---

## 📚 Ressources

- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)

