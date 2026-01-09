# 🚀 Commandes Rapides VPS - Fix Frontend↔Backend

**IP VPS**: `51.210.179.212`

---

## 📝 COMMANDES À EXÉCUTER SUR LE VPS

### 1. Connexion au VPS

```bash
ssh ubuntu@51.210.179.212
sudo -i
cd /opt/downpricer
```

---

### 2. Générer JWT_SECRET_KEY et créer le fichier .env

**Étape 1 : Générer la clé secrète**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copiez le résultat (exemple : `abc123xyz789...`)

**Étape 2 : Créer le fichier .env**

```bash
nano .env
```

Copiez-collez ce contenu (remplacez `VOTRE_CLE_SECRETE_ICI` par la clé générée) :
```env
VPS_IP=51.210.179.212
MONGO_URL=mongodb://mongo:27017
DB_NAME=downpricer
JWT_SECRET_KEY=VOTRE_CLE_SECRETE_ICI
CORS_ORIGINS=http://51.210.179.212,http://localhost,http://127.0.0.1
BACKEND_PUBLIC_URL=http://51.210.179.212
REACT_APP_BACKEND_URL=/api
ENV=production
```

**Générer JWT_SECRET_KEY** :
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

### 3. Vérifier que le fichier de config Nginx IP existe

```bash
ls -la nginx/conf.d/downpricer-ip.conf
```

**Si le fichier n'existe pas**, créez-le :
```bash
nano nginx/conf.d/downpricer-ip.conf
```

Voir le contenu dans `DIAGNOSTIC_VPS_FIX.md` section 3.1

---

### 4. Désactiver le fichier de config avec domaine (si présent)

```bash
mv nginx/conf.d/downpricer.conf nginx/conf.d/downpricer.conf.disabled 2>/dev/null || true
```

---

### 5. Mettre à jour depuis GitHub (si vous avez poussé les corrections)

```bash
git pull
```

---

### 6. Rebuild et redémarrer tous les services

```bash
cd /opt/downpricer

# Arrêter
docker compose -f docker-compose.prod.yml down

# Rebuild avec les nouvelles variables
docker compose -f docker-compose.prod.yml up -d --build

# Attendre 30 secondes
sleep 30

# Vérifier que tout est démarré
docker ps
```

---

### 7. Créer les comptes de test

```bash
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

---

### 8. Tests

```bash
# Test 1 : Health check
curl -i http://localhost/api/health

# Test 2 : Login
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@downpricer.com","password":"admin123"}'

# Test 3 : Vérifier les logs
docker compose -f docker-compose.prod.yml logs --tail=50 backend
docker compose -f docker-compose.prod.yml logs --tail=50 nginx
```

---

### 9. Test depuis votre PC (PowerShell)

```powershell
# Test health check
curl -i http://51.210.179.212/api/health

# Test login
curl -X POST http://51.210.179.212/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@downpricer.com\",\"password\":\"admin123\"}'
```

---

## ✅ CHECKLIST RAPIDE

- ✅ Fichier `.env` créé avec `CORS_ORIGINS=http://51.210.179.212`
- ✅ `docker-compose.prod.yml` mis à jour (REACT_APP_BACKEND_URL=/api)
- ✅ `nginx/conf.d/downpricer-ip.conf` existe
- ✅ Conteneurs rebuildés et démarrés
- ✅ Comptes de test créés
- ✅ `curl http://localhost/api/health` retourne `{"status":"ok"}`
- ✅ Site accessible : `http://51.210.179.212`

---

## 🚨 SI ÇA NE MARCHE PAS

### Vérifier les logs

```bash
docker compose -f docker-compose.prod.yml logs -f
```

Appuyez sur `Ctrl+C` pour sortir.

### Redémarrer un service spécifique

```bash
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart nginx
```

### Vérifier la config Nginx dans le conteneur

```bash
docker exec downpricer-nginx nginx -T | grep -A 30 "location /api"
```

---

**Voir `DIAGNOSTIC_VPS_FIX.md` pour plus de détails** 📖

