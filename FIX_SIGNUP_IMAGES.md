# 🔧 Correction : Signup + Images Upload

## ✅ PROBLÈMES IDENTIFIÉS ET CORRIGÉS

### 1. ❌ Signup retourne "Not Found"
**Cause** : Utilisation de `axios` directement avec `process.env.REACT_APP_BACKEND_URL` qui créait un double `/api/api/auth/signup`

**Correction** : Remplacement par l'instance `api` configurée dans `utils/api.js`

**Fichiers corrigés** :
- ✅ `frontend/src/pages/Signup.jsx`
- ✅ `frontend/src/pages/FaireDemande.jsx`
- ✅ `frontend/src/pages/ArticleDetail.jsx`
- ✅ `frontend/src/pages/admin/Categories.jsx`
- ✅ `frontend/src/pages/AdminArticles.jsx`
- ✅ `frontend/src/pages/seller/SellerArticleDetail.jsx`
- ✅ `frontend/src/pages/seller/SellerDashboard.jsx`

### 2. ❌ Images ne chargent pas après upload
**Causes possibles** :
- Configuration Nginx pour servir les uploads
- Volume Docker non synchronisé
- URL retournée incorrecte
- Permissions de fichiers

---

## 🔧 CORRECTIONS APPLIQUÉES

### Signup.jsx (et autres fichiers)

**AVANT** :
```javascript
import axios from 'axios';
...
const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/signup`, formData);
// Si REACT_APP_BACKEND_URL=/api → /api/api/auth/signup ❌
```

**APRÈS** :
```javascript
import api from '../utils/api';
...
const response = await api.post('/auth/signup', formData);
// Utilise baseURL=/api → /api/auth/signup ✅
```

---

## 🚀 DÉPLOIEMENT DES CORRECTIONS

### Sur votre PC Windows

```powershell
cd C:\Users\ironi\Desktop\DownPricer

# Vérifier les changements
git status

# Ajouter les fichiers modifiés
git add frontend/src/pages/

# Commit
git commit -m "Fix: Correction signup et API calls - utilisation de l'instance api configurée"

# Push sur GitHub
git push
```

### Sur le VPS

```bash
ssh ubuntu@51.210.179.212
sudo -i
cd /opt/downpricer

# Mettre à jour depuis GitHub
git pull

# Rebuild le frontend (IMPORTANT car le code a changé)
docker compose -f docker-compose.prod.yml up -d --build frontend

# Redémarrer Nginx pour prendre en compte les changements
docker compose -f docker-compose.prod.yml restart nginx

# Vérifier les logs
docker compose -f docker-compose.prod.yml logs --tail=50 frontend
docker compose -f docker-compose.prod.yml logs --tail=50 nginx
```

---

## 🔍 DIAGNOSTIC IMAGES UPLOAD

Si les images ne chargent toujours pas après rebuild, vérifiez :

### 1. Vérifier que les fichiers sont créés

```bash
# Dans le conteneur backend
docker compose -f docker-compose.prod.yml exec backend ls -la /app/uploads/

# Dans le conteneur nginx
docker compose -f docker-compose.prod.yml exec nginx ls -la /usr/share/nginx/html/uploads/
```

**Les deux doivent afficher les mêmes fichiers** (même volume Docker).

---

### 2. Tester l'accès direct à une image

```bash
# Depuis le VPS
curl -I http://localhost/api/uploads/UN_FICHIER.webp

# Depuis votre PC
curl -I http://51.210.179.212/api/uploads/UN_FICHIER.webp
```

**Si 404** : le fichier n'existe pas ou Nginx ne sert pas correctement.
**Si 200** : le fichier est accessible, le problème est côté frontend.

---

### 3. Vérifier les logs backend lors d'un upload

```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

Ensuite, essayez d'uploader une image et regardez :
- ✅ Le fichier est créé ?
- ✅ L'URL retournée est correcte ?
- ✅ Pas d'erreur ?

---

### 4. Vérifier l'URL retournée par le backend

Le backend retourne (ligne 182 de `server.py`) :
```python
backend_url = os.environ.get('BACKEND_PUBLIC_URL', ...)
image_url = f"{backend_url}/api/uploads/{unique_filename}"
```

**Vérifiez la variable d'environnement** :
```bash
docker compose -f docker-compose.prod.yml exec backend env | grep BACKEND_PUBLIC_URL
```

**Doit afficher** : `BACKEND_PUBLIC_URL=http://51.210.179.212`

**Si différent**, éditez `.env` sur le VPS :
```bash
nano .env
# Vérifier que BACKEND_PUBLIC_URL=http://51.210.179.212
# Puis redémarrer :
docker compose -f docker-compose.prod.yml restart backend
```

---

### 5. Problème de configuration Nginx

Si les images ne sont pas servies, on peut modifier Nginx pour laisser le backend servir directement les uploads (via StaticFiles) :

**Option A** : Laisser Nginx servir depuis le volume (actuel)
```nginx
location /api/uploads/ {
    alias /usr/share/nginx/html/uploads/;
    expires 1y;
    add_header Cache-Control "public";
}
```

**Option B** : Proxy vers le backend (alternative si A ne marche pas)
```nginx
location /api/uploads/ {
    proxy_pass http://backend:8001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    expires 1y;
    add_header Cache-Control "public";
}
```

**Si Option A ne marche pas**, utilisez Option B :
```bash
nano nginx/conf.d/downpricer-ip.conf
# Modifier la location /api/uploads/
docker compose -f docker-compose.prod.yml restart nginx
```

---

### 6. Vérifier les permissions

```bash
# Vérifier les permissions du volume
docker compose -f docker-compose.prod.yml exec backend ls -la /app/uploads/

# Si nécessaire, corriger les permissions
docker compose -f docker-compose.prod.yml exec backend chmod -R 755 /app/uploads
```

---

## 🧪 TESTS À EFFECTUER

### Test 1 : Signup

1. Ouvrir `http://51.210.179.212/signup`
2. Remplir le formulaire
3. Cliquer sur "Créer mon compte"
4. **Résultat attendu** : ✅ Compte créé, redirection vers `/mes-demandes`

**Si erreur "Not Found"** :
- Ouvrir la console développeur (F12)
- Onglet Network / Réseau
- Vérifier la requête `/api/auth/signup`
- Doit être `POST http://51.210.179.212/api/auth/signup` (pas `/api/api/auth/signup`)

---

### Test 2 : Upload Image

1. Se connecter (admin ou autre)
2. Aller sur une page avec upload d'image (créer article, etc.)
3. Cliquer sur "Upload fichier"
4. Sélectionner une image
5. **Résultat attendu** : ✅ Image uploadée, affichée dans la prévisualisation

**Si l'image ne charge pas** :
- Ouvrir la console développeur (F12)
- Onglet Network / Réseau
- Vérifier la requête `/api/upload/image` (POST) → doit retourner `200 OK` avec `{"success": true, "url": "http://51.210.179.212/api/uploads/xxx.webp"}`
- Vérifier le chargement de l'image (GET `http://51.210.179.212/api/uploads/xxx.webp`) → doit retourner `200 OK` avec le contenu de l'image

---

## ✅ CHECKLIST FINALE

- ✅ Code frontend corrigé (utilisation de `api` au lieu de `axios` directement)
- ✅ Fichiers commités et poussés sur GitHub
- ✅ Frontend rebuildé sur le VPS
- ✅ Nginx redémarré
- ✅ Test signup fonctionne
- ✅ Test upload image fonctionne
- ✅ Images accessibles via `http://51.210.179.212/api/uploads/xxx.webp`

---

## 🚨 SI ÇA NE MARCHE TOUJOURS PAS

### Pour Signup :

1. Vérifier les logs backend :
   ```bash
   docker compose -f docker-compose.prod.yml logs backend | grep signup
   ```

2. Tester directement l'API :
   ```bash
   curl -X POST http://localhost/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123","first_name":"Test","last_name":"User"}'
   ```

### Pour Images :

1. Vérifier les logs backend :
   ```bash
   docker compose -f docker-compose.prod.yml logs backend | grep upload
   ```

2. Vérifier que le volume est bien partagé :
   ```bash
   # Créer un fichier test dans backend
   docker compose -f docker-compose.prod.yml exec backend touch /app/uploads/test.txt
   
   # Vérifier qu'il apparaît dans nginx
   docker compose -f docker-compose.prod.yml exec nginx ls -la /usr/share/nginx/html/uploads/test.txt
   ```

3. Si le fichier n'apparaît pas, le volume n'est pas partagé correctement. Vérifiez `docker-compose.prod.yml` :
   - Backend : `uploads_data:/app/uploads`
   - Nginx : `uploads_data:/usr/share/nginx/html/uploads`

---

**Fin du guide** 🎉









