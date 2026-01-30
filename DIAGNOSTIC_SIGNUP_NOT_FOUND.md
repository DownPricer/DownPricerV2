# 🔍 Diagnostic : Signup "Not Found" - Résolution étape par étape

## ❌ PROBLÈME
La création de compte retourne "Not Found" même après les corrections.

## 🔍 DIAGNOSTIC ÉTAPE PAR ÉTAPE

### Étape 1 : Vérifier que le frontend est bien rebuildé

**Sur le VPS** :
```bash
ssh ubuntu@51.210.179.212
sudo -i
cd /opt/downpricer

# Vérifier les logs du build frontend
docker compose -f docker-compose.prod.yml logs frontend | tail -50

# Vérifier que le conteneur frontend est bien à jour
docker compose -f docker-compose.prod.yml ps frontend
```

**Si le frontend n'a pas été rebuildé**, forcez le rebuild :
```bash
# Supprimer l'image existante
docker compose -f docker-compose.prod.yml down frontend
docker rmi downpricer-frontend:latest 2>/dev/null || true

# Rebuild complètement
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend

# Attendre que le build soit terminé (peut prendre 2-3 minutes)
docker compose -f docker-compose.prod.yml logs -f frontend
```

Appuyez sur `Ctrl+C` quand vous voyez "Entrypoint script completed".

---

### Étape 2 : Vérifier la requête réelle depuis le navigateur

**Sur votre PC** :
1. Ouvrir `http://51.210.179.212/signup`
2. Ouvrir la console développeur (F12)
3. Onglet **Network** / **Réseau**
4. Essayer de créer un compte
5. Regarder la requête qui est envoyée

**Ce que vous devriez voir** :
- **Requête** : `POST http://51.210.179.212/api/auth/signup`
- **Status** : `200 OK` (si ça marche) ou `404 Not Found` (si ça ne marche pas)

**Si vous voyez** : `POST http://51.210.179.212/api/api/auth/signup` → Le frontend n'est pas rebuildé avec le nouveau code !

**Si vous voyez** : `POST http://51.210.179.212/api/auth/signup` mais `404` → Problème backend/Nginx

---

### Étape 3 : Tester directement l'API backend depuis le VPS

**Sur le VPS** :
```bash
# Test 1 : Health check
curl -i http://localhost/api/health
# Doit retourner : HTTP/1.1 200 OK {"status":"ok"}

# Test 2 : Test signup directement
curl -X POST http://localhost/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test999@example.com","password":"test123","first_name":"Test","last_name":"User"}'

# Si ça retourne 404 :
# -> Le backend ne répond pas correctement
# -> Vérifiez les logs backend

# Si ça retourne 400 "Cet email est déjà utilisé" :
# -> Le backend fonctionne ! Le problème est entre frontend et backend
```

---

### Étape 4 : Vérifier les logs backend en temps réel

**Sur le VPS** :
```bash
# Regarder les logs backend
docker compose -f docker-compose.prod.yml logs -f backend
```

**Dans un autre terminal**, testez depuis votre PC :
- Ouvrir `http://51.210.179.212/signup`
- Essayer de créer un compte

**Dans les logs backend**, vous devriez voir :
- Soit la requête arrive : `INFO: 127.0.0.1:xxxxx - "POST /api/auth/signup HTTP/1.1" 200`
- Soit rien : la requête n'arrive pas au backend (problème Nginx)
- Soit une erreur : voir le message d'erreur

---

### Étape 5 : Vérifier la configuration Nginx

**Sur le VPS** :
```bash
# Vérifier la config Nginx chargée
docker exec downpricer-nginx nginx -T 2>&1 | grep -A 10 "location /api/"

# Devrait afficher :
# location /api/ {
#     proxy_pass http://backend:8001;
#     ...
# }

# Vérifier que le backend est accessible depuis Nginx
docker exec downpricer-nginx ping -c 2 backend

# Tester depuis le conteneur Nginx vers le backend
docker exec downpricer-nginx wget -O- http://backend:8001/api/health
# Doit retourner : {"status":"ok"}
```

---

### Étape 6 : Vérifier les logs Nginx

**Sur le VPS** :
```bash
# Logs Nginx en temps réel
docker compose -f docker-compose.prod.yml logs -f nginx
```

**Dans un autre terminal**, testez depuis votre PC :
- Essayer de créer un compte

**Dans les logs Nginx**, vous devriez voir :
```
[timestamp] "POST /api/auth/signup HTTP/1.1" 404
# ou
[timestamp] "POST /api/auth/signup HTTP/1.1" 502
# ou
[timestamp] "POST /api/auth/signup HTTP/1.1" 200
```

---

## 🔧 SOLUTIONS PAR CAS

### Cas 1 : Frontend pas rebuildé (URL avec double /api/api/)

**Solution** :
```bash
cd /opt/downpricer

# Forcer le rebuild complet
docker compose -f docker-compose.prod.yml down frontend
docker rmi downpricer-frontend:latest
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend

# Attendre 2-3 minutes que le build se termine
docker compose -f docker-compose.prod.yml logs -f frontend
```

---

### Cas 2 : Backend ne répond pas (404 depuis le backend)

**Vérifier** :
```bash
# Vérifier que le backend est démarré
docker compose -f docker-compose.prod.yml ps backend

# Vérifier les logs backend
docker compose -f docker-compose.prod.yml logs --tail=100 backend

# Vérifier que la route existe
docker compose -f docker-compose.prod.yml exec backend curl http://localhost:8001/api/auth/signup
# Devrait retourner 405 Method Not Allowed (normal, c'est une route POST)
# Si 404 → le router n'est pas monté correctement
```

**Si le backend crash au démarrage** :
```bash
# Vérifier les variables d'environnement
docker compose -f docker-compose.prod.yml exec backend env | grep -E "MONGO_URL|DB_NAME|JWT"

# Vérifier la connexion MongoDB
docker compose -f docker-compose.prod.yml exec backend python -c "from motor.motor_asyncio import AsyncIOMotorClient; import os; import asyncio; async def test(): client = AsyncIOMotorClient(os.environ.get('MONGO_URL')); await client.admin.command('ping'); print('MongoDB OK'); client.close(); asyncio.run(test())"
```

---

### Cas 3 : Nginx ne proxy pas correctement (502 Bad Gateway)

**Solution** :
```bash
# Vérifier que le backend est accessible depuis Nginx
docker exec downpricer-nginx wget -O- http://backend:8001/api/health

# Si ça ne marche pas, vérifier le réseau Docker
docker network inspect downpricer_downpricer-network

# Vérifier que backend et nginx sont sur le même réseau
docker compose -f docker-compose.prod.yml ps
# Les deux doivent être "Up"
```

**Redémarrer Nginx** :
```bash
docker compose -f docker-compose.prod.yml restart nginx
docker compose -f docker-compose.prod.yml logs -f nginx
```

---

### Cas 4 : CORS bloque la requête

**Vérifier** :
```bash
# Vérifier CORS_ORIGINS dans le backend
docker compose -f docker-compose.prod.yml exec backend env | grep CORS_ORIGINS

# Doit contenir : http://51.210.179.212
```

**Si manquant ou incorrect** :
```bash
# Éditer .env sur le VPS
nano .env
# Ajouter/modifier : CORS_ORIGINS=http://51.210.179.212,http://localhost

# Redémarrer backend
docker compose -f docker-compose.prod.yml restart backend
```

---

## 🎯 SOLUTION RAPIDE (TOUT REBUILD)

Si rien ne marche, rebuild complet :

```bash
cd /opt/downpricer

# Arrêter tout
docker compose -f docker-compose.prod.yml down

# Supprimer les images (optionnel, mais recommandé)
docker rmi downpricer-frontend:latest 2>/dev/null || true
docker compose -f docker-compose.prod.yml build --no-cache

# Redémarrer
docker compose -f docker-compose.prod.yml up -d

# Attendre que tout démarre
sleep 30

# Vérifier
docker ps
docker compose -f docker-compose.prod.yml logs --tail=50
```

---

## ✅ VÉRIFICATION FINALE

**Test depuis votre PC** :

1. Ouvrir `http://51.210.179.212/signup`
2. Ouvrir la console développeur (F12) → Network
3. Remplir le formulaire et créer un compte
4. **Vérifier** :
   - ✅ Requête : `POST http://51.210.179.212/api/auth/signup`
   - ✅ Status : `200 OK`
   - ✅ Response : `{"token": "...", "user": {...}}`
   - ✅ Redirection vers `/mes-demandes`

**Si tout est ✅** : Ça marche ! 🎉

**Si ❌** : Envoyez-moi :
- La requête exacte dans Network (URL, Status, Response)
- Les logs backend : `docker compose -f docker-compose.prod.yml logs --tail=100 backend`
- Les logs nginx : `docker compose -f docker-compose.prod.yml logs --tail=100 nginx`

---

## 🚨 COMMANDES DE DIAGNOSTIC RAPIDE

```bash
# Sur le VPS, exécuter cette séquence complète :
cd /opt/downpricer

echo "=== Conteneurs ==="
docker compose -f docker-compose.prod.yml ps

echo "=== Test Backend direct ==="
curl -i http://localhost/api/health

echo "=== Test Signup direct ==="
curl -X POST http://localhost/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test'$(date +%s)'@test.com","password":"test123","first_name":"Test","last_name":"User"}'

echo "=== Logs Backend (dernières 20 lignes) ==="
docker compose -f docker-compose.prod.yml logs --tail=20 backend

echo "=== Logs Nginx (dernières 20 lignes) ==="
docker compose -f docker-compose.prod.yml logs --tail=20 nginx
```

**Copiez-collez la sortie complète** pour que je puisse diagnostiquer précisément le problème.

---

**Fin du guide** 🔍


















