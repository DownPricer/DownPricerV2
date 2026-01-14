# ✅ Checklist - Correction Upload Images

## 📋 RÉSUMÉ DES MODIFICATIONS

- ✅ **docker-compose.prod.yml** : Volume `uploads_data` monté sur `/uploads` pour nginx (au lieu de `/usr/share/nginx/html/uploads`)
- ✅ **nginx/conf.d/downpricer.conf** : Ajout location `/uploads/` et correction `/api/uploads/` (les deux pointent vers `/uploads/`)
- ✅ **nginx/conf.d/downpricer-ip.conf** : Même correction (pour déploiement IP)
- ✅ **backend/server.py** : Route upload retourne `/uploads/{filename}` au lieu de `/api/uploads/{filename}`
- ✅ **frontend/src/utils/images.js** : Fonction `resolveImageUrl()` convertit `/api/uploads/` → `/uploads/` (compatibilité)

---

## 🚀 DÉPLOIEMENT SUR VPS

### 1. Se connecter au VPS

```bash
ssh ubuntu@51.210.179.212
sudo -i
cd /opt/downpricer
```

### 2. Récupérer les modifications depuis GitHub

```bash
# Si vous avez poussé les modifications sur GitHub
git pull origin main

# OU si vous copiez les fichiers manuellement, assurez-vous que ces fichiers sont à jour :
# - docker-compose.prod.yml
# - nginx/conf.d/downpricer.conf
# - nginx/conf.d/downpricer-ip.conf
# - backend/server.py
# - frontend/src/utils/images.js
```

### 3. Rebuild et redémarrer les services

```bash
# Arrêter les services
docker compose -f docker-compose.prod.yml down

# Rebuild (important pour que le frontend ait la nouvelle fonction resolveImageUrl)
docker compose -f docker-compose.prod.yml build --no-cache frontend backend

# Démarrer les services
docker compose -f docker-compose.prod.yml up -d

# Vérifier les logs
docker compose -f docker-compose.prod.yml logs -f --tail=50
```

### 4. Redémarrer Nginx (pour prendre en compte la nouvelle config)

```bash
docker compose -f docker-compose.prod.yml restart nginx

# Vérifier que Nginx a démarré correctement
docker compose -f docker-compose.prod.yml logs nginx | tail -20
```

---

## 🧪 TESTS OBLIGATOIRES

### Test 1 : Lister les fichiers upload existants

```bash
# Dans le conteneur nginx, vérifier que le volume est monté
docker compose -f docker-compose.prod.yml exec nginx ls -la /uploads | head -10

# Prendre note d'un nom de fichier .webp existant (ex: 19ca2041-80fe-4898-b114-9638d2aeaeab.webp)
```

### Test 2 : Vérifier l'accès via `/uploads/` (standard)

**Depuis le VPS :**

```bash
# Remplacer <file>.webp par un fichier réel de la liste ci-dessus
FILE_NAME="19ca2041-80fe-4898-b114-9638d2aeaeab.webp"

# Test depuis localhost (dans le conteneur nginx)
curl -I http://localhost/uploads/$FILE_NAME

# Résultat attendu : HTTP/1.1 200 OK
```

**Depuis l'extérieur (depuis votre machine locale) :**

```bash
# Test depuis votre machine
curl -I http://51.210.179.212/uploads/$FILE_NAME

# Résultat attendu : HTTP/1.1 200 OK
```

### Test 3 : Vérifier la compatibilité `/api/uploads/` (anciennes URLs)

```bash
# Test depuis localhost
curl -I http://localhost/api/uploads/$FILE_NAME

# Résultat attendu : HTTP/1.1 200 OK
```

```bash
# Test depuis l'extérieur
curl -I http://51.210.179.212/api/uploads/$FILE_NAME

# Résultat attendu : HTTP/1.1 200 OK
```

### Test 4 : Test fonctionnel - Upload d'image depuis Admin

1. **Se connecter au site** : http://51.210.179.212
2. **Login Admin** (utiliser vos identifiants)
3. **Aller dans Admin > Articles**
4. **Créer ou modifier un article**
5. **Uploader une image** via le composant ImageUpload
6. **Vérifier** :
   - ✅ L'upload retourne une URL `/uploads/...`
   - ✅ L'image s'affiche dans le preview
   - ✅ Après sauvegarde, l'image s'affiche sur la fiche article

### Test 5 : Vérifier l'affichage sur le catalogue public

1. **Aller sur** : http://51.210.179.212
2. **Parcourir les articles** avec images
3. **Vérifier** :
   - ✅ Les images s'affichent correctement
   - ✅ Pas d'erreur 404 dans la console du navigateur (F12)
   - ✅ Les URLs sont bien `/uploads/...` ou `/api/uploads/...` (compatibilité)

### Test 6 : Vérifier la console navigateur (F12)

Ouvrir la console (F12) et vérifier :

- ❌ **Aucune erreur** : `Failed to load resource: 404 (Not Found) /uploads/...`
- ❌ **Aucune erreur** : `Failed to load resource: 404 (Not Found) /api/uploads/...`
- ✅ **Status 200** pour toutes les requêtes d'images

---

## 🔍 DIAGNOSTIC EN CAS DE PROBLÈME

### Problème : Les images ne s'affichent toujours pas

**Vérifier le volume Docker :**

```bash
# Vérifier que le volume existe
docker volume ls | grep uploads_data

# Inspecter le volume
docker volume inspect downpricer_uploads_data

# Vérifier le contenu depuis le backend
docker compose -f docker-compose.prod.yml exec backend ls -la /app/uploads | head -10

# Vérifier le contenu depuis nginx
docker compose -f docker-compose.prod.yml exec nginx ls -la /uploads | head -10
```

**Vérifier la configuration Nginx :**

```bash
# Tester la configuration Nginx
docker compose -f docker-compose.prod.yml exec nginx nginx -t

# Devrait retourner : nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Vérifier les logs :**

```bash
# Logs Nginx
docker compose -f docker-compose.prod.yml logs nginx | tail -50

# Logs Backend
docker compose -f docker-compose.prod.yml logs backend | tail -50

# Chercher les erreurs
docker compose -f docker-compose.prod.yml logs | grep -i error
```

### Problème : Erreur 404 sur `/uploads/` ou `/api/uploads/`

**Vérifier que le volume est bien monté :**

```bash
# Dans docker-compose.prod.yml, vérifier :
# nginx:
#   volumes:
#     - uploads_data:/uploads:ro
```

**Vérifier les permissions :**

```bash
# Les fichiers doivent être lisibles
docker compose -f docker-compose.prod.yml exec nginx ls -la /uploads/

# Si nécessaire, corriger les permissions depuis le backend
docker compose -f docker-compose.prod.yml exec backend chmod -R 755 /app/uploads
```

### Problème : Le backend retourne toujours `/api/uploads/`

**Vérifier le code backend :**

```bash
# Vérifier que server.py a bien la modification ligne 185
docker compose -f docker-compose.prod.yml exec backend grep -n "image_url = " /app/server.py

# Devrait afficher : image_url = f"/uploads/{unique_filename}"
```

**Rebuild le backend si nécessaire :**

```bash
docker compose -f docker-compose.prod.yml build --no-cache backend
docker compose -f docker-compose.prod.yml up -d backend
```

---

## ✅ VALIDATION FINALE

- [ ] Test 1 : Lister fichiers upload ✅
- [ ] Test 2 : `/uploads/<file>.webp` retourne 200 ✅
- [ ] Test 3 : `/api/uploads/<file>.webp` retourne 200 ✅
- [ ] Test 4 : Upload image depuis Admin fonctionne ✅
- [ ] Test 5 : Images affichées sur catalogue public ✅
- [ ] Test 6 : Aucune erreur 404 dans console navigateur ✅

---

## 📝 NOTES

- **Standard** : Les nouvelles URLs sont `/uploads/...`
- **Compatibilité** : Les anciennes URLs `/api/uploads/...` fonctionnent toujours grâce à Nginx
- **Backend** : Retourne maintenant `/uploads/...` après upload
- **Frontend** : La fonction `resolveImageUrl()` convertit `/api/uploads/` → `/uploads/` pour compatibilité

---

## 🎯 RÉSULTAT ATTENDU

Après ces corrections, toutes les images uploadées doivent être accessibles via :

- ✅ `http://51.210.179.212/uploads/<uuid>.webp` (200 OK)
- ✅ `http://51.210.179.212/api/uploads/<uuid>.webp` (200 OK - compatibilité)

Et s'afficher correctement dans l'interface sans erreur 404.




