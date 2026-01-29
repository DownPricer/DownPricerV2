# Modifications - Stripe Checkout Flow

## Date : 2024

## Résumé des modifications

Correction du flow de paiement Stripe pour les mini-sites :
- Landing page : clic sur pack → checkout Stripe direct (plus de navigation vers `/minisite/create`)
- Gestion autopay après login
- Correction erreur 500 backend (création customer Stripe)
- Amélioration gestion d'erreurs et logs

---

## Fichiers modifiés

### Frontend

#### `frontend/src/pages/MinisiteLanding.jsx`
**Modifications :**
1. **Remplacement des plan IDs** : `SITE_PLAN_1/10/15` → `planKey: "starter"/"standard"/"premium"`
2. **Nouvelle fonction `startCheckout(planKey)`** :
   - Appelle `POST /api/billing/minisite/checkout` avec `{ plan: planKey }`
   - Redirige vers l'URL Stripe retournée
   - Gestion d'erreurs avec toasts
3. **Modification `handleSelectPlan(planKey)`** :
   - Si non connecté → redirige vers `/login?redirect=/minisite?autopay=1&plan={planKey}`
   - Si connecté → lance directement `startCheckout(planKey)`
4. **Gestion autopay** :
   - Détection des query params `autopay=1&plan=starter/standard/premium`
   - Après login, retour sur landing et lancement automatique du checkout
5. **UI** : Ajout icône `CreditCard` et état de chargement sur le bouton

**Comportement avant :**
- Clic "Choisir Starter" → navigate vers `/minisite/create?plan=SITE_PLAN_1`

**Comportement après :**
- Clic "Choisir Starter" → Si connecté : checkout Stripe direct | Si non connecté : login puis autopay

---

### Backend

#### `backend/server.py` - Endpoint `/api/billing/minisite/checkout`
**Modifications :**
1. **Suppression vérification mini-site existant** :
   - Avant : exigeait qu'un mini-site existe déjà (erreur 404 sinon)
   - Après : permet de créer un checkout même sans mini-site (créé après paiement via webhook)
2. **Amélioration logs** :
   - Logs détaillés à chaque étape (plan reçu, user ID, price ID, etc.)
   - Logs d'erreur avec contexte complet
3. **Gestion d'erreurs améliorée** :
   - 400 : Plan invalide, configuration manquante
   - 403 : Paiements désactivés
   - 404 : Utilisateur non trouvé
   - 500 : Erreurs serveur avec messages explicites
4. **Mapping plan → price ID** :
   - Vérification explicite des variables d'environnement `STRIPE_PRICE_MINISITE_*`
   - Logs si price ID manquant

#### `backend/stripe_billing.py`
**Modifications :**
1. **`get_stripe_customer_id()` → `async`** :
   - Rendu async pour utiliser `await db.users.find_one()`
   - Gestion d'erreurs améliorée avec types spécifiques (ValueError, StripeError)
   - Logs détaillés à chaque étape
   - Vérification `stripe.api_key` avant utilisation
2. **`create_checkout_session()` → `async`** :
   - Rendu async pour appeler `await get_stripe_customer_id()`
   - Gestion d'erreurs par type (validation, Stripe API, autres)
3. **`create_portal_session()` → `async`** :
   - Rendu async pour cohérence
   - Utilise `await db.users.find_one()`

---

## Corrections techniques

### Problème résolu #1 : Flow landing cassé
**Avant :** Navigation vers `/minisite/create` au lieu de checkout
**Après :** Checkout Stripe direct depuis la landing

### Problème résolu #2 : Erreur 500 "Failed to get/create Stripe customer"
**Cause :** 
- `get_stripe_customer_id()` utilisait `db.users.find_one()` (sync) au lieu de `await db.users.find_one()` (async)
- Retournait `None` silencieusement en cas d'erreur

**Solution :**
- Fonction rendue `async`
- Utilisation correcte de `await` pour les opérations MongoDB
- Gestion d'erreurs avec exceptions explicites
- Logs détaillés pour debug

### Problème résolu #3 : Vérification mini-site trop stricte
**Avant :** Endpoint exigeait qu'un mini-site existe déjà
**Après :** Permet checkout sans mini-site (créé après paiement via webhook)

---

## Tests recommandés

### Test 1 : Landing page - Utilisateur non connecté
1. Aller sur `/minisite`
2. Cliquer "Choisir Starter"
3. ✅ Doit rediriger vers `/login?redirect=/minisite?autopay=1&plan=starter`
4. Se connecter
5. ✅ Doit revenir sur `/minisite?autopay=1&plan=starter` et lancer automatiquement le checkout Stripe

### Test 2 : Landing page - Utilisateur connecté
1. Se connecter
2. Aller sur `/minisite`
3. Cliquer "Choisir Standard"
4. ✅ Doit lancer directement le checkout Stripe (pas de navigation vers `/minisite/create`)

### Test 3 : Backend - Checkout sans mini-site
1. Utilisateur connecté sans mini-site
2. POST `/api/billing/minisite/checkout` avec `{ plan: "starter" }`
3. ✅ Doit retourner 200 avec `{ url: "https://checkout.stripe.com/..." }`
4. ✅ Ne doit plus retourner 404 "Aucun mini-site trouvé"

### Test 4 : Backend - Gestion d'erreurs
1. POST avec plan invalide → ✅ 400 avec message clair
2. POST sans authentification → ✅ 401
3. POST avec price ID manquant → ✅ 400 avec message explicite
4. POST avec Stripe API error → ✅ 500 avec message (sans exposer les clés)

---

## Variables d'environnement requises

Le backend nécessite ces variables dans `.env` :
```env
STRIPE_SECRET_KEY=sk_test_... ou sk_live_...
STRIPE_PRICE_MINISITE_STARTER=price_...
STRIPE_PRICE_MINISITE_STANDARD=price_...
STRIPE_PRICE_MINISITE_PREMIUM=price_...
STRIPE_SUCCESS_URL=https://downpricer.com/minisite/dashboard?stripe=success&session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=https://downpricer.com/minisite?stripe=cancel
```

---

## Notes importantes

1. **Mini-site créé après paiement** : Le mini-site n'est plus requis avant le checkout. Il sera créé automatiquement via le webhook `checkout.session.completed` après paiement réussi.

2. **Plan keys** : Utilisation de `"starter"`, `"standard"`, `"premium"` au lieu de `SITE_PLAN_1/10/15` pour le checkout Stripe. Les plan IDs restent utilisés en interne pour les rôles utilisateur.

3. **Bouton upgrade** : Le bouton upgrade dans `MinisiteDashboard.jsx` existe déjà et fonctionne (navigue vers `/minisite/upgrade`).

4. **Logs** : Tous les logs backend sont préfixés avec des emojis pour faciliter le debug :
   - 🔵 Requête reçue
   - ✅ Succès
   - ❌ Erreur
   - ⚠️ Avertissement
   - 🔄 En cours

---

## Prochaines étapes (si nécessaire)

1. Tester le flow complet en production
2. Vérifier que les webhooks créent bien le mini-site après paiement
3. Ajouter des tests unitaires pour `get_stripe_customer_id()` et `create_checkout_session()`










