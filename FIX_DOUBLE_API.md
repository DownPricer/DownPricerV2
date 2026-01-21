# 🔧 FIX DOUBLE /api - CHECKLIST & COMMANDES

## ✅ PROBLÈME IDENTIFIÉ

Les requêtes API sont `api/api/...` au lieu de `/api/...` à cause d'un double préfixe `/api`.

## ✅ CORRECTIONS APPORTÉES

### 1. Frontend (`frontend/src/utils/api.js`)
- ✅ **Logique simplifiée** : Si `REACT_APP_BACKEND_URL` est vide ou égal à `/api`, utiliser `/api` comme baseURL
- ✅ **Intercepteur ajouté** : Protection contre le double `/api/api/` dans les URLs
- ✅ **URLs relatives** : Tous les appels API utilisent des routes sans préfixe (ex: `/articles`, pas `/api/articles`)

### 2. Docker Compose (`docker-compose.prod.yml`)
- ✅ **REACT_APP_BACKEND_URL vidé** : Passé de `/api` à vide (string vide)
- ✅ Le code frontend utilisera automatiquement `/api` par défaut

### 3. Dockerfile Frontend (`frontend/Dockerfile`)
- ✅ **Valeur par défaut corrigée** : `ARG REACT_APP_BACKEND_URL=` (vide au lieu de `/api`)
- ✅ Évite le conflit avec la valeur passée depuis docker-compose

## 📋 VÉRIFICATION DES ROUTES

### Backend (confirmé)
- Router préfixe : `api_router = APIRouter(prefix="/api")`
- Routes finales : `/api/articles`, `/api/settings/public`, `/api/auth/signup`, etc.
- ✅ Correct

### Nginx (confirmé)
- Configuration : `location /api/ { proxy_pass http://backend:8001; }`
- Route `/api/articles` → `http://backend:8001/api/articles`
- ✅ Correct

### Frontend (corrigé)
- Avant : `baseURL = '/api'` + appels avec potentiellement `/api/...` → `api/api/...`
- Après : `baseURL = '/api'` + appels avec `/articles` → `/api/articles`
- ✅ Corrigé

## 🚀 COMMANDES DE DÉPLOIEMENT

### Sur le VPS

```bash
# 1. Reconstruire le frontend avec la nouvelle config
docker compose -f docker-compose.prod.yml build frontend

# 2. Redémarrer les services
docker compose -f docker-compose.prod.yml up -d

# 3. Vérifier les logs
docker compose -f docker-compose.prod.yml logs --tail=50 frontend
docker compose -f docker-compose.prod.yml logs --tail=50 nginx
docker compose -f docker-compose.prod.yml logs --tail=50 backend
```

## 🧪 TESTS DE VALIDATION

### 1. Vérifier dans la console navigateur (F12)
```javascript
// Ouvrir la console et vérifier que les requêtes sont :
✅ /api/articles?sort=recent&limit=20
✅ /api/settings/public
✅ /api/auth/signup
❌ PAS /api/api/articles (double /api)
```

### 2. Tester manuellement
```bash
# Depuis le navigateur, ouvrir la console (F12) > Network
# Tester les endpoints :
1. Charger la page d'accueil -> vérifier /api/articles et /api/categories
2. Se connecter -> vérifier /api/auth/login
3. Vérifier qu'il n'y a pas de 404
```

### 3. Tester depuis le VPS (curl)
```bash
# Tester que le backend répond correctement
docker compose -f docker-compose.prod.yml exec backend curl http://localhost:8001/api/health
# ✅ Doit retourner {"status":"ok"}

# Tester que Nginx route correctement
curl http://localhost/api/health
# ✅ Doit retourner {"status":"ok"}
```

## 🔍 DIAGNOSTIC EN CAS DE PROBLÈME

### Si les requêtes sont toujours `api/api/...`

1. **Vider le cache du navigateur** : Ctrl+Shift+R (hard refresh)

2. **Vérifier que le build frontend est à jour** :
```bash
docker compose -f docker-compose.prod.yml exec frontend ls -la /output/static/js/ | head -5
# Vérifier la date de modification des fichiers JS
```

3. **Vérifier la variable d'environnement dans le build** :
```bash
# Inspecter un fichier JS compilé
docker compose -f docker-compose.prod.yml exec frontend cat /output/static/js/*.js | grep -i "api/api\|baseURL" | head -5
# Ne devrait PAS contenir "api/api"
```

4. **Rebuild complet** :
```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d
```

### Si les requêtes sont correctes mais 404 toujours

1. **Vérifier que le backend expose bien `/api/...`** :
```bash
docker compose -f docker-compose.prod.yml exec backend curl http://localhost:8001/api/articles
# ✅ Doit retourner du JSON (ou 401 si pas auth)
```

2. **Vérifier la config Nginx** :
```bash
docker compose -f docker-compose.prod.yml exec nginx nginx -t
# ✅ Doit retourner "syntax is ok"
```

3. **Vérifier les logs Nginx** :
```bash
docker compose -f docker-compose.prod.yml logs nginx | grep -i "error\|404"
```

## 📝 NOTES IMPORTANTES

1. **Variables d'environnement** :
   - En production : `REACT_APP_BACKEND_URL` doit être vide ou non défini
   - En dev local : `REACT_APP_BACKEND_URL=http://localhost:8001` (URL complète)
   - Le code gère automatiquement les deux cas

2. **Intercepteur de protection** :
   - Si une URL contient `/api/api/`, elle est automatiquement corrigée en `/api/`
   - Cette protection évite les doublons même si une route est mal formée

3. **Routes backend** :
   - Toutes les routes backend ont le préfixe `/api` via `APIRouter(prefix="/api")`
   - Ne PAS ajouter `/api` dans les appels frontend : `api.get('/articles')` et non `api.get('/api/articles')`

## ✅ RÉSULTAT ATTENDU

Après déploiement, toutes les requêtes API doivent être :
- ✅ `/api/articles`
- ✅ `/api/settings/public`
- ✅ `/api/auth/login`
- ✅ `/api/auth/signup`
- ❌ **PAS** `/api/api/articles`

---

**Date du fix** : $(date)  
**Fichiers modifiés** :
- `frontend/src/utils/api.js` (logique corrigée + intercepteur)
- `docker-compose.prod.yml` (REACT_APP_BACKEND_URL vidé)
- `frontend/Dockerfile` (ARG par défaut corrigé)









