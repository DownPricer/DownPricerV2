# 🔧 Guide de Diagnostic et Correction Frontend↔Backend sur VPS

**IP VPS**: `51.210.179.212`  
**Problème**: Frontend ne communique pas avec le backend (pas de données, login ne fonctionne pas)

---

## 📋 PLAN DE DIAGNOSTIC ET CORRECTION

### Étape 1 : Diagnostic sur le VPS
### Étape 2 : Correction configuration Docker Compose
### Étape 3 : Correction configuration Nginx
### Étape 4 : Création comptes de test
### Étape 5 : Tests finaux

---

## 🔍 ÉTAPE 1 : DIAGNOSTIC SUR LE VPS

Connectez-vous au VPS :
```bash
ssh ubuntu@51.210.179.212
sudo -i
cd /opt/downpricer
```

### 1.1 Vérifier les conteneurs

```bash
docker ps
docker compose -f docker-compose.prod.yml ps
```

**Résultat attendu** : 4 conteneurs en cours d'exécution (mongo, backend, frontend, nginx)

---

### 1.2 Vérifier les logs

```bash
# Logs Nginx (100 dernières lignes)
docker compose -f docker-compose.prod.yml logs --tail=100 nginx

# Logs Backend (100 dernières lignes)
docker compose -f docker-compose.prod.yml logs --tail=100 backend

# Logs Frontend (100 dernières lignes)
docker compose -f docker-compose.prod.yml logs --tail=100 frontend
```

**Recherchez** :
- ❌ Erreurs de connexion MongoDB
- ❌ Erreurs CORS
- ❌ Erreurs 502/503/504
- ❌ Erreurs "Connection refused"

---

### 1.3 Tester l'API depuis le VPS (local)

```bash
# Test health check (devrait retourner {"status":"ok"})
curl -i http://localhost/api/health

# Test avec /health aussi
curl -i http://localhost/health

# Test docs API
curl -i http://localhost/api/docs
```

**Si ça ne marche pas** : problème Nginx reverse proxy

---

### 1.4 Tester depuis l'extérieur (depuis votre PC Windows)

Ouvrez PowerShell sur votre PC et testez :
```powershell
# Test health check depuis l'extérieur
curl -i http://51.210.179.212/api/health
```

**Si ça ne répond pas** :
- ❌ Firewall bloque le port 80
- ❌ Nginx ne bind pas sur 0.0.0.0:80
- ❌ Problème de routage réseau

---

### 1.5 Vérifier quel fichier Nginx est utilisé

```bash
# Lister les fichiers de config Nginx montés dans le conteneur
docker exec downpricer-nginx ls -la /etc/nginx/conf.d/

# Vérifier la config Nginx chargée
docker exec downpricer-nginx nginx -T | grep -A 20 "server {"
```

**Important** : Le fichier `downpricer-ip.conf` doit être présent et actif pour fonctionner avec l'IP.

---

## 🔧 ÉTAPE 2 : CORRECTION DOCKER COMPOSE

### 2.1 Vérifier/créer le fichier .env à la racine

```bash
cd /opt/downpricer

# Créer ou éditer le fichier .env
nano .env
```

**Contenu du fichier `.env`** (remplacer `51.210.179.212` par votre IP réelle si différente) :

```env
# IP du VPS
VPS_IP=51.210.179.212

# MongoDB (dans Docker, utilisez le nom du service)
MONGO_URL=mongodb://mongo:27017
DB_NAME=downpricer

# JWT Secret Key (générer une nouvelle si nécessaire)
# Commande pour générer: python3 -c "import secrets; print(secrets.token_urlsafe(32))"
JWT_SECRET_KEY=CHANGEZ-MOI-PAR-UNE-CLE-SECURISEE-TRES-LONGUE-ALEATOIRE

# CORS Origins (TRÈS IMPORTANT : inclure l'IP du VPS)
CORS_ORIGINS=http://51.210.179.212,http://localhost,http://127.0.0.1

# Backend Public URL (utiliser l'IP)
BACKEND_PUBLIC_URL=http://51.210.179.212

# Frontend Backend URL (doit être /api pour passer par Nginx)
REACT_APP_BACKEND_URL=/api
```

**Sauvegarder** : `Ctrl+X`, puis `Y`, puis `Enter`

---

### 2.2 Vérifier docker-compose.prod.yml

```bash
cat docker-compose.prod.yml
```

**Vérifications importantes** :

1. **Backend CORS_ORIGINS** (ligne ~28) :
   ```yaml
   - CORS_ORIGINS=${CORS_ORIGINS:-http://51.210.179.212}
   ```

2. **Frontend REACT_APP_BACKEND_URL** (ligne ~49) :
   ```yaml
   args:
     - REACT_APP_BACKEND_URL=/api
   ```

**Si ces valeurs sont incorrectes**, éditez le fichier :
```bash
nano docker-compose.prod.yml
```

**Corrigez** :
- Ligne 28 : `CORS_ORIGINS=${CORS_ORIGINS:-http://51.210.179.212}`
- Ligne 49 : `REACT_APP_BACKEND_URL=/api` (pas vide !)

---

## 🔧 ÉTAPE 3 : CORRECTION NGINX

### 3.1 Vérifier que le bon fichier de config est utilisé

```bash
# Vérifier quel fichier est monté
ls -la nginx/conf.d/

# Il doit y avoir : downpricer-ip.conf (pour IP sans domaine)
```

**Si `downpricer-ip.conf` n'existe pas**, créez-le :

```bash
nano nginx/conf.d/downpricer-ip.conf
```

**Contenu** :
```nginx
# Configuration Nginx pour déploiement avec IP (sans domaine)
server {
    listen 80;
    server_name _;  # Accepte toutes les requêtes (IP ou domaine)
    
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # API Backend - IMPORTANT : proxy_pass sans slash final pour conserver /api/
    location /api/ {
        proxy_pass http://backend:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Uploads
    location /api/uploads/ {
        alias /usr/share/nginx/html/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Sauvegarder** : `Ctrl+X`, puis `Y`, puis `Enter`

---

### 3.2 Désactiver le fichier de config avec domaine (si présent)

```bash
# Renommer (pas supprimer, au cas où)
mv nginx/conf.d/downpricer.conf nginx/conf.d/downpricer.conf.disabled 2>/dev/null || true
```

---

## 🔧 ÉTAPE 4 : CRÉATION COMPTES DE TEST

### 4.1 Vérifier que seed_users.py fonctionne

Le script `backend/seed_users.py` existe déjà. Il faut juste s'assurer qu'il charge les variables d'environnement Docker.

**Vérifiez le contenu** :
```bash
cat backend/seed_users.py | head -45
```

**Si ligne 39 n'a pas `mongo_url` défini**, le script est OK (il utilise `os.environ.get('MONGO_URL')` qui récupère depuis Docker).

---

### 4.2 Exécuter le script de seed

```bash
# S'assurer que le backend est en cours d'exécution
docker compose -f docker-compose.prod.yml ps backend

# Exécuter le script de seed
docker compose -f docker-compose.prod.yml exec backend python seed_users.py
```

**Résultat attendu** :
```
=== Création des comptes de test ===

MongoDB URL: mongodb://mongo:27017
Database: downpricer

✅ Créé: admin@downpricer.com (rôles: ADMIN, CLIENT)
✅ Créé: vendeur@downpricer.com (rôles: SELLER, CLIENT)
✅ Créé: test@downpricer.com (rôles: CLIENT)

=== Résumé ===
✅ Créés: 3
🔄 Mis à jour: 0

💡 Comptes de test disponibles:
   Admin:  admin@downpricer.com / admin123
   Vendeur: vendeur@downpricer.com / vendeur123
   Client:  test@downpricer.com / test123
```

**Si erreur** : vérifiez les logs backend

---

## 🔧 ÉTAPE 5 : REDÉMARRAGE ET TESTS

### 5.1 Rebuild et redémarrage

```bash
cd /opt/downpricer

# Arrêter tous les conteneurs
docker compose -f docker-compose.prod.yml down

# Rebuild avec les nouvelles variables
docker compose -f docker-compose.prod.yml up -d --build

# Attendre 30 secondes que tout démarre
sleep 30

# Vérifier les conteneurs
docker ps
```

---

### 5.2 Vérifier les logs après redémarrage

```bash
# Logs Backend (vérifier démarrage OK)
docker compose -f docker-compose.prod.yml logs --tail=50 backend

# Logs Nginx (vérifier pas d'erreurs)
docker compose -f docker-compose.prod.yml logs --tail=50 nginx
```

---

### 5.3 Tests depuis le VPS

```bash
# Test 1 : Health check local
curl -i http://localhost/api/health

# Test 2 : Test avec token (si vous avez créé les comptes)
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@downpricer.com","password":"admin123"}'

# Devrait retourner un token JWT
```

---

### 5.4 Tests depuis votre PC (navigateur)

1. **Ouvrir le site** : `http://51.210.179.212`

2. **Ouvrir la console développeur** (F12) :
   - Onglet **Network** / **Réseau**
   - Recharger la page (F5)
   - Vérifier que les requêtes vers `/api/...` sont présentes
   - Vérifier le statut HTTP : doit être `200 OK` (pas `CORS error`, pas `404`, pas `502`)

3. **Tester le login** :
   - Aller sur la page de connexion
   - Essayer de se connecter avec : `admin@downpricer.com` / `admin123`
   - Vérifier dans la console développeur si la requête `/api/auth/login` fonctionne

---

## ✅ CHECKLIST DE VÉRIFICATION

Cocher chaque point après vérification :

### Configuration Docker
- ✅ Fichier `.env` créé à la racine avec `CORS_ORIGINS=http://51.210.179.212`
- ✅ `docker-compose.prod.yml` ligne 28 : `CORS_ORIGINS=${CORS_ORIGINS:-http://51.210.179.212}`
- ✅ `docker-compose.prod.yml` ligne 49 : `REACT_APP_BACKEND_URL=/api` (pas vide !)
- ✅ Conteneurs démarrés : `docker ps` montre 4 conteneurs (mongo, backend, frontend, nginx)

### Configuration Nginx
- ✅ Fichier `nginx/conf.d/downpricer-ip.conf` existe
- ✅ `proxy_pass http://backend:8001;` (sans slash final)
- ✅ `location /api/` est bien configuré
- ✅ Fichier `downpricer.conf` (avec domaine) renommé en `.disabled`

### Backend
- ✅ `curl http://localhost/api/health` retourne `{"status":"ok"}`
- ✅ Logs backend ne montrent pas d'erreurs CORS
- ✅ MongoDB connecté (pas d'erreur dans les logs)

### Frontend
- ✅ Frontend buildé avec `REACT_APP_BACKEND_URL=/api`
- ✅ Le build est dans le volume `frontend_build`
- ✅ Nginx sert les fichiers statiques correctement

### Comptes de test
- ✅ Script `seed_users.py` exécuté sans erreur
- ✅ Comptes créés : admin, vendeur, client
- ✅ Login fonctionne avec `admin@downpricer.com` / `admin123`

### Tests finaux
- ✅ Depuis navigateur : `http://51.210.179.212` s'affiche
- ✅ Console développeur : requêtes `/api/...` apparaissent
- ✅ Pas d'erreurs CORS dans la console
- ✅ Login fonctionne depuis l'interface web

---

## 🚨 PROBLÈMES COURANTS ET SOLUTIONS

### Problème : `curl http://localhost/api/health` retourne 502 Bad Gateway

**Solution** :
```bash
# Vérifier que le backend est démarré
docker compose -f docker-compose.prod.yml ps backend

# Vérifier les logs backend
docker compose -f docker-compose.prod.yml logs backend

# Vérifier la connexion MongoDB
docker compose -f docker-compose.prod.yml exec backend python -c "from motor.motor_asyncio import AsyncIOMotorClient; import asyncio; import os; client = AsyncIOMotorClient(os.environ.get('MONGO_URL')); print('MongoDB OK')"
```

---

### Problème : Erreur CORS dans le navigateur

**Solution** :
1. Vérifier `.env` : `CORS_ORIGINS=http://51.210.179.212`
2. Redémarrer le backend :
   ```bash
   docker compose -f docker-compose.prod.yml restart backend
   ```
3. Vérifier les logs backend pour confirmer la valeur de CORS_ORIGINS chargée

---

### Problème : Le frontend charge mais pas de données

**Solution** :
1. Ouvrir la console développeur (F12)
2. Onglet Network / Réseau
3. Vérifier si les requêtes `/api/...` sont envoyées
4. Si 404 : problème Nginx reverse proxy
5. Si CORS : problème CORS_ORIGINS
6. Si timeout : problème de connexion réseau

---

### Problème : `seed_users.py` échoue

**Solution** :
```bash
# Vérifier que MongoDB est accessible depuis le backend
docker compose -f docker-compose.prod.yml exec backend python -c "import os; print('MONGO_URL:', os.environ.get('MONGO_URL'))"

# Vérifier la connexion
docker compose -f docker-compose.prod.yml exec backend python -c "from motor.motor_asyncio import AsyncIOMotorClient; import asyncio; import os; async def test(): client = AsyncIOMotorClient(os.environ.get('MONGO_URL')); await client.admin.command('ping'); print('MongoDB OK'); client.close(); asyncio.run(test())"
```

---

## 📞 COMMANDES DE TEST RAPIDES

**Une fois tout configuré, testez rapidement** :

```bash
# 1. Health check
curl http://localhost/api/health

# 2. Test login (depuis VPS)
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@downpricer.com","password":"admin123"}'

# 3. Test depuis PC (PowerShell)
curl -i http://51.210.179.212/api/health

# 4. Logs en temps réel
docker compose -f docker-compose.prod.yml logs -f
```

---

## 🎯 RÉSULTAT ATTENDU

Une fois toutes les corrections appliquées :

1. ✅ Le site s'affiche : `http://51.210.179.212`
2. ✅ Le catalogue se charge (même vide)
3. ✅ Le login fonctionne avec les comptes de test
4. ✅ Pas d'erreurs CORS dans la console développeur
5. ✅ Les requêtes API partent vers `/api` et retournent des données

---

## 📝 NOTES IMPORTANTES

- **Ne pas utiliser HTTPS** pour l'instant (pas de certificat SSL)
- **L'IP 51.210.179.212** doit être dans `CORS_ORIGINS`
- **REACT_APP_BACKEND_URL doit être `/api`** (pas une URL externe)
- **Toujours rebuild le frontend** si vous changez `REACT_APP_BACKEND_URL`

---

**Fin du guide** 🎉

