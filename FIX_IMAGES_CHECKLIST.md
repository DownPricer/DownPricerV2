# 🔧 FIX IMAGES - CHECKLIST & COMMANDES

## ✅ MODIFICATIONS APPORTÉES

### 1. Backend (server.py)
- ✅ **Retourne maintenant URL relative** : `/api/uploads/{filename}` au lieu d'URL absolue
- ✅ **Montage StaticFiles désactivé** : Nginx sert directement les fichiers, pas besoin de monter `/api/uploads` dans le backend
- ✅ Les fichiers sont toujours sauvegardés dans `/app/uploads` (volume Docker)

### 2. Docker Compose (docker-compose.prod.yml)
- ✅ Volume `uploads_data` correctement monté :
  - Backend : `/app/uploads`
  - Nginx : `/usr/share/nginx/html/uploads`
- ✅ Pas de modification nécessaire, configuration déjà correcte

### 3. Nginx (nginx/conf.d/downpricer-ip.conf)
- ✅ **ORDRE CORRIGÉ** : `/api/uploads/` placé AVANT `/api/` pour priorité
- ✅ Configuration `/api/uploads/` améliorée avec types MIME explicites
- ✅ Cache headers configurés (1 an)
- ✅ IMPORTANT : Les locations plus spécifiques doivent être avant les moins spécifiques

### 4. Frontend
- ✅ **Nouvel utilitaire** : `frontend/src/utils/images.js` avec fonction `resolveImageUrl()`
- ✅ **SafeImage mis à jour** : Utilise `resolveImageUrl()` pour résoudre les URLs
- ✅ **Tous les composants mis à jour** :
  - Home.jsx
  - ArticleDetail.jsx
  - SellerArticles.jsx
  - SellerArticleDetail.jsx
  - MesDemandes.jsx
  - DemandeDetail.jsx
  - AdminVenteDetail.jsx
  - SellerVenteDetail.jsx
  - ImageUpload.jsx

## 📋 CHECKLIST DE DÉPLOIEMENT

### Sur le VPS (à exécuter dans cet ordre)

#### A. Sauvegarder les modifications
```bash
# Depuis le répertoire du projet sur le VPS
cd /chemin/vers/DownPricer
git add .
git commit -m "Fix: Images - URLs relatives et pipeline complet"
git push origin main  # Si vous utilisez git
```

#### B. Reconstruire et redémarrer les conteneurs
```bash
# Arrêter les conteneurs
docker compose -f docker-compose.prod.yml down

# Reconstruire les images (si nécessaire)
docker compose -f docker-compose.prod.yml build backend frontend

# Démarrer les conteneurs
docker compose -f docker-compose.prod.yml up -d

# Vérifier que tout est OK
docker compose -f docker-compose.prod.yml ps
```

#### C. Vérifier les logs
```bash
# Logs backend
docker compose -f docker-compose.prod.yml logs --tail=100 backend

# Logs nginx
docker compose -f docker-compose.prod.yml logs --tail=100 nginx

# Logs frontend
docker compose -f docker-compose.prod.yml logs --tail=100 frontend
```

## 🧪 TESTS DE VALIDATION (OBLIGATOIRES)

### 1. Test Upload d'image (Admin Articles)
```bash
# Depuis votre navigateur
1. Se connecter en admin
2. Aller dans "Articles" > "Créer un article"
3. Uploader une image via le composant ImageUpload
4. ✅ Vérifier que l'image s'affiche dans la prévisualisation
5. ✅ Sauvegarder l'article
6. ✅ Vérifier que l'image s'affiche dans la liste des articles
7. ✅ Ouvrir l'article et vérifier que l'image s'affiche dans le détail
```

### 2. Test URL externe
```bash
# Depuis votre navigateur
1. Créer un article avec une URL externe (ex: https://example.com/image.jpg)
2. ✅ Vérifier que l'image s'affiche correctement
```

### 3. Test Accès direct à l'image
```bash
# Depuis le VPS
# 1. Lister les fichiers uploadés
docker compose -f docker-compose.prod.yml exec backend ls -la /app/uploads

# 2. Prendre un nom de fichier (ex: 12345678-1234-1234-1234-123456789abc.webp)

# 3. Tester depuis le VPS (internal)
docker compose -f docker-compose.prod.yml exec nginx curl -I http://localhost/api/uploads/NOM_DU_FICHIER.webp
# ✅ Doit retourner HTTP 200

# 4. Tester depuis votre PC (external)
# Ouvrir dans le navigateur :
http://VOTRE_IP_VPS/api/uploads/NOM_DU_FICHIER.webp
# ✅ L'image doit s'afficher dans le navigateur
```

### 4. Test Mini-sites
```bash
# Depuis votre navigateur
1. Créer/modifier un mini-site avec des images
2. ✅ Vérifier que les images s'affichent dans la page publique du mini-site
```

### 5. Test Demandes
```bash
# Depuis votre navigateur
1. Créer une demande avec des images
2. ✅ Vérifier que les images s'affichent dans "Mes demandes"
3. ✅ Vérifier que les images s'affichent dans le détail de la demande
```

### 6. Test Vendeur
```bash
# Depuis votre navigateur (compte vendeur)
1. Voir les articles disponibles
2. ✅ Vérifier que les images s'affichent dans la liste
3. ✅ Ouvrir un article et vérifier que les images s'affichent
```

## 🔍 DIAGNOSTIC EN CAS DE PROBLÈME

### Si les images ne s'affichent toujours pas :

#### 1. Vérifier que le volume est bien monté
```bash
# Vérifier dans backend
docker compose -f docker-compose.prod.yml exec backend ls -la /app/uploads
# ✅ Doit lister les fichiers .webp

# Vérifier dans nginx
docker compose -f docker-compose.prod.yml exec nginx ls -la /usr/share/nginx/html/uploads
# ✅ Doit lister les MÊMES fichiers (même volume)
```

#### 2. Vérifier les permissions
```bash
# Si les fichiers n'existent pas dans nginx mais existent dans backend :
docker compose -f docker-compose.prod.yml exec backend chmod -R 755 /app/uploads
docker compose -f docker-compose.prod.yml restart backend nginx
```

#### 3. Vérifier la config Nginx
```bash
# Tester la config Nginx
docker compose -f docker-compose.prod.yml exec nginx nginx -t
# ✅ Doit retourner "syntax is ok" et "test is successful"

# Si erreur, vérifier le fichier de config
docker compose -f docker-compose.prod.yml exec nginx cat /etc/nginx/conf.d/downpricer-ip.conf
```

#### 4. Vérifier les logs d'erreur
```bash
# Backend
docker compose -f docker-compose.prod.yml logs backend | grep -i "upload\|error\|image"

# Nginx
docker compose -f docker-compose.prod.yml logs nginx | grep -i "error\|404\|403"
```

#### 5. Vérifier que l'URL retournée est correcte
```bash
# Dans la console du navigateur (F12)
# Lors d'un upload, vérifier la réponse de l'API :
# ✅ response.data.url doit être : "/api/uploads/filename.webp"
# ❌ NE DOIT PAS être : "http://51.210.179.212/api/uploads/filename.webp"
```

#### 6. Vérifier la console du navigateur
```bash
# Ouvrir la console (F12) et chercher :
- Erreurs 404 pour /api/uploads/*
- Erreurs CORS
- Erreurs de chargement d'image
```

## 📝 NOTES IMPORTANTES

1. **URLs relatives** : Le backend retourne maintenant des URLs relatives (`/api/uploads/filename.webp`) qui sont automatiquement résolues par le navigateur par rapport au domaine actuel.

2. **Volume partagé** : Le volume `uploads_data` est monté à la fois dans le backend (pour écrire) et dans nginx (pour servir). Les fichiers sont donc accessibles des deux côtés.

3. **Cache** : Nginx met en cache les images pendant 1 an. Si vous modifiez une image, vous devrez peut-être vider le cache du navigateur (Ctrl+Shift+R).

4. **Placeholder** : Si une image n'est pas trouvée ou invalide, le composant `SafeImage` affiche un placeholder "Pas d'image".

5. **Formats supportés** : Les images uploadées sont automatiquement converties en WebP pour optimiser la taille.

## 🚀 COMMANDES DE REDÉMARRAGE RAPIDE

Si vous avez seulement modifié la config nginx :
```bash
docker compose -f docker-compose.prod.yml restart nginx
```

Si vous avez modifié le backend :
```bash
docker compose -f docker-compose.prod.yml restart backend nginx
```

Si vous avez modifié le frontend :
```bash
docker compose -f docker-compose.prod.yml up -d --build frontend
docker compose -f docker-compose.prod.yml restart nginx
```

Pour tout reconstruire :
```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

## ✅ RÉSULTAT ATTENDU

Après déploiement, vous devriez avoir :
- ✅ Upload d'images fonctionnel (depuis l'ordi/téléphone)
- ✅ URLs externes fonctionnelles
- ✅ Images affichées partout (admin, demandes, mini-sites, vendeur)
- ✅ URLs d'images accessibles directement dans le navigateur
- ✅ Placeholder affiché si pas d'image ou image invalide

---

**Date du fix** : $(date)  
**Fichiers modifiés** : 
- `backend/server.py`
- `nginx/conf.d/downpricer-ip.conf`
- `frontend/src/utils/images.js` (nouveau)
- `frontend/src/components/SafeImage.jsx`
- `frontend/src/components/ImageUpload.jsx`
- Tous les composants qui affichent des images (Home, ArticleDetail, etc.)

