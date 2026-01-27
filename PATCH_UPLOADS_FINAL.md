# ✅ PATCH FINAL - Correction Upload Images (VPS)

## 📋 RÉSUMÉ

Les corrections sont **déjà appliquées** dans les fichiers suivants :

1. ✅ **docker-compose.prod.yml** : Volume `uploads_data` monté sur `/uploads:ro` pour nginx
2. ✅ **nginx/conf.d/downpricer-ip.conf** : Location `/api/uploads/` AVANT `/api/` (pour déploiement IP)
3. ✅ **nginx/conf.d/downpricer.conf** : Même configuration (pour domaine)

---

## 🚀 DÉPLOIEMENT SUR VPS (COMMANDES EXACTES)

### 1. Se connecter au VPS

```bash
ssh ubuntu@51.210.179.212
sudo -i
cd /opt/downpricer
```

### 2. Récupérer les modifications

```bash
# Option A : Si code poussé sur GitHub
git pull origin main

# Option B : Si fichiers copiés manuellement, vérifier ces fichiers :
# - docker-compose.prod.yml (ligne 67: uploads_data:/uploads:ro)
# - nginx/conf.d/downpricer-ip.conf (location /api/uploads/ avant /api/)
```

### 3. Rebuild et redémarrer

```bash
# Arrêter
docker compose -f docker-compose.prod.yml down

# Rebuild (important pour prendre en compte les changements)
docker compose -f docker-compose.prod.yml build --no-cache

# Démarrer
docker compose -f docker-compose.prod.yml up -d

# Redémarrer nginx et backend pour appliquer les changements
docker compose -f docker-compose.prod.yml restart nginx backend
```

### 4. Vérifier les logs

```bash
docker compose -f docker-compose.prod.yml logs -f --tail=50
```

---

## 🧪 TESTS OBLIGATOIRES (dans l'ordre)

### Test 1 : Vérifier que le volume est monté dans nginx

```bash
docker compose -f docker-compose.prod.yml exec nginx ls -la /uploads | tail
```

**Résultat attendu** : Liste des fichiers `.webp` (ex: `8e7d0f69-6884-479d-af26-9503e3f00229.webp`)

**Si erreur "No such file or directory"** :
- Vérifier ligne 67 de `docker-compose.prod.yml` : `- uploads_data:/uploads:ro`
- Redémarrer nginx : `docker compose -f docker-compose.prod.yml restart nginx`

### Test 2 : Tester l'accès via /api/uploads/ depuis localhost

```bash
# Prendre un nom de fichier réel de la liste ci-dessus
FILE_NAME="8e7d0f69-6884-479d-af26-9503e3f00229.webp"

# Test depuis le conteneur nginx
curl -I http://localhost/api/uploads/$FILE_NAME
```

**Résultat attendu** :
```
HTTP/1.1 200 OK
Server: nginx/...
Content-Type: image/webp
Cache-Control: public, max-age=31536000, immutable
...
```

### Test 3 : Tester depuis l'extérieur (depuis votre machine)

```bash
# Depuis votre machine locale (remplacer FILE_NAME)
curl -I http://51.210.179.212/api/uploads/8e7d0f69-6884-479d-af26-9503e3f00229.webp
```

**Résultat attendu** : `HTTP/1.1 200 OK`

### Test 4 : Test fonctionnel - Upload dans l'UI

1. **Se connecter** : http://51.210.179.212
2. **Login Admin**
3. **Créer/Modifier un article** avec upload d'image
4. **Vérifier** :
   - ✅ L'image s'affiche dans le preview après upload
   - ✅ L'image s'affiche sur la fiche article après sauvegarde
   - ✅ Console navigateur (F12) : **AUCUNE erreur 404**

### Test 5 : Vérifier la configuration Nginx

```bash
# Tester la syntaxe Nginx
docker compose -f docker-compose.prod.yml exec nginx nginx -t
```

**Résultat attendu** : `nginx: configuration file /etc/nginx/nginx.conf test is successful`

---

## 🔍 DIAGNOSTIC SI ÇA NE MARCHE PAS

### Problème : `ls: /uploads: No such file or directory` dans nginx

**Solution** :
```bash
# Vérifier le volume Docker
docker volume ls | grep uploads_data

# Vérifier docker-compose.prod.yml ligne 67
cat docker-compose.prod.yml | grep -A 10 "nginx:"

# Doit contenir : - uploads_data:/uploads:ro

# Si pas présent, corriger et redémarrer
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml restart nginx
```

### Problème : 404 sur `/api/uploads/`

**Vérifier que la location est bien AVANT `/api/`** :
```bash
docker compose -f docker-compose.prod.yml exec nginx cat /etc/nginx/conf.d/downpricer-ip.conf | grep -A 15 "location.*api"
```

**Doit afficher** :
```
location ^~ /api/uploads/ {
    alias /uploads/;
    ...
}
# API Backend
location /api/ {
    proxy_pass http://backend:8001;
    ...
}
```

### Problème : Images toujours 404 après tous les tests

**Vérifier que les fichiers existent dans le backend** :
```bash
docker compose -f docker-compose.prod.yml exec backend ls -la /app/uploads | tail
```

**Si fichiers présents dans backend mais pas dans nginx** :
- Le volume n'est pas partagé correctement
- Vérifier que `uploads_data` est bien déclaré dans la section `volumes:` de docker-compose.prod.yml

---

## ✅ VALIDATION FINALE

- [ ] Test 1 : `ls -la /uploads` dans nginx retourne les fichiers ✅
- [ ] Test 2 : `curl -I http://localhost/api/uploads/<file>` → 200 ✅
- [ ] Test 3 : `curl -I http://51.210.179.212/api/uploads/<file>` → 200 ✅
- [ ] Test 4 : Upload image dans UI → affichage immédiat ✅
- [ ] Test 5 : Aucune erreur 404 dans console navigateur ✅

---

## 📝 STRUCTURE FINALE ATTENDUE

### docker-compose.prod.yml
```yaml
nginx:
  volumes:
    - uploads_data:/uploads:ro  # ← CRITIQUE
```

### nginx/conf.d/downpricer-ip.conf
```nginx
# AVANT location /api/
location ^~ /api/uploads/ {
    alias /uploads/;  # ← Doit pointer vers /uploads (volume monté)
    try_files $uri =404;
    add_header Cache-Control "public, max-age=31536000, immutable";
}

location /api/ {
    proxy_pass http://backend:8001;
}
```

---

## 🎯 RÉSULTAT FINAL

Après ce patch, `/api/uploads/<uuid>.webp` doit retourner **200 OK** et les images doivent s'afficher partout sur le site.















