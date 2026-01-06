# Checklist de déploiement - DownPricer

## ✅ Fichiers créés/modifiés

### Docker
- ✅ `backend/Dockerfile` - Image backend avec uvicorn
- ✅ `frontend/Dockerfile` - Build React + copie dans volume
- ✅ `docker-compose.prod.yml` - Services: mongo, backend, frontend, nginx

### Configuration
- ✅ `nginx/conf.d/downpricer.conf` - Reverse proxy + frontend
- ✅ `backend/env.example` - Variables d'environnement dev
- ✅ `backend/env.prod.example` - Variables d'environnement prod
- ✅ `frontend/env.example` - Variables d'environnement dev
- ✅ `frontend/env.prod.example` - Variables d'environnement prod

### Scripts et documentation
- ✅ `deploy-docker.sh` - Script de déploiement automatisé
- ✅ `DEPLOY_OVH_SIMPLE.md` - Guide de déploiement complet
- ✅ Route `/health` ajoutée au backend

## 🔴 À vérifier avant déploiement

1. **DNS configuré** : `downpricer.com` pointe vers l'IP du VPS
2. **Variables d'environnement** : `.env` créé avec les bonnes valeurs
3. **JWT_SECRET_KEY** : Clé sécurisée générée
4. **Ports ouverts** : 80 et 443 (22 pour SSH)

## 📋 Commandes de déploiement (copier-coller)

### Sur le VPS OVH (Ubuntu/Debian)

```bash
# 1. Mise à jour système
apt update && apt upgrade -y

# 2. Installation Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh
systemctl enable docker
systemctl start docker

# 3. Installation Docker Compose
apt install -y docker-compose-plugin

# 4. Cloner le repo
cd /opt
git clone https://github.com/votre-repo/downpricer.git
cd downpricer

# 5. Créer le fichier .env
cat > .env << 'EOF'
DOMAIN=downpricer.com
MONGO_URL=mongodb://mongo:27017
DB_NAME=downpricer
JWT_SECRET_KEY=GENERER_UNE_CLE_SECURISEE_ICI
CORS_ORIGINS=https://downpricer.com,https://www.downpricer.com
BACKEND_PUBLIC_URL=https://downpricer.com
EOF

# Générer JWT_SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
# Copier la sortie et remplacer dans .env

# 6. Créer les dossiers nginx
mkdir -p nginx/ssl nginx/conf.d

# 7. Build et démarrage
docker compose -f docker-compose.prod.yml up -d --build

# 8. Vérifier les logs
docker compose -f docker-compose.prod.yml logs -f

# 9. Tester la santé
curl http://localhost/api/health
# Devrait retourner: {"status":"ok"}
```

### Configuration SSL (après DNS configuré)

```bash
cd /opt/downpricer

# Installer certbot
apt install -y certbot

# Obtenir le certificat
certbot certonly --standalone -d downpricer.com -d www.downpricer.com

# Copier les certificats
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/downpricer.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/downpricer.com/privkey.pem nginx/ssl/

# Éditer nginx/conf.d/downpricer.conf
# Décommenter la section HTTPS
# Commenter la redirection HTTP

# Redémarrer nginx
docker compose -f docker-compose.prod.yml restart nginx
```

### Renouvellement automatique SSL

```bash
# Ajouter au crontab
crontab -e

# Ajouter cette ligne:
0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/downpricer.com/*.pem /opt/downpricer/nginx/ssl/ && docker compose -f /opt/downpricer/docker-compose.prod.yml restart nginx
```

## 🧪 Tests locaux (dans Cursor)

### Frontend
```bash
cd frontend
npm install
npm run build
# Vérifier que build/ est créé
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001
# Dans un autre terminal:
curl http://localhost:8001/health
# Devrait retourner: {"status":"ok"}
```

### Docker (si Docker Desktop installé)
```bash
# Build
docker compose -f docker-compose.prod.yml build

# Démarrer
docker compose -f docker-compose.prod.yml up -d

# Tester
curl http://localhost/api/health
curl http://localhost

# Arrêter
docker compose -f docker-compose.prod.yml down
```

## 📊 État des composants

| Composant | Status | Port | Notes |
|-----------|--------|------|-------|
| MongoDB | ✅ | 27017 (interne) | Volume `mongo_data` |
| Backend | ✅ | 8001 (interne) | Route `/health` disponible |
| Frontend | ✅ | - | Build dans volume `frontend_build` |
| Nginx | ✅ | 80, 443 | Reverse proxy + serveur statique |

## 🔧 Commandes de maintenance

```bash
# Voir les logs
docker compose -f docker-compose.prod.yml logs -f [service]

# Redémarrer un service
docker compose -f docker-compose.prod.yml restart [service]

# Rebuild
docker compose -f docker-compose.prod.yml up -d --build

# Arrêter tout
docker compose -f docker-compose.prod.yml down

# Voir les volumes
docker volume ls

# Sauvegarder MongoDB
docker run --rm -v downpricer_mongo_data:/data -v $(pwd):/backup alpine tar czf /backup/mongo-$(date +%Y%m%d).tar.gz /data
```

## ⚠️ Points d'attention

1. **JWT_SECRET_KEY** : Doit être unique et sécurisé
2. **CORS_ORIGINS** : Doit contenir le domaine exact
3. **Volumes** : Les données sont persistantes dans les volumes Docker
4. **SSL** : Renouvellement automatique configuré via cron
5. **Firewall** : Ouvrir uniquement 22, 80, 443

## ✅ Checklist finale

- [ ] Docker installé
- [ ] Docker Compose installé
- [ ] Repo cloné dans `/opt/downpricer`
- [ ] Fichier `.env` créé avec les bonnes valeurs
- [ ] DNS configuré (downpricer.com → IP VPS)
- [ ] `docker compose up -d --build` exécuté
- [ ] `/api/health` répond `{"status":"ok"}`
- [ ] Frontend accessible sur `http://downpricer.com`
- [ ] SSL configuré (certbot)
- [ ] HTTPS fonctionne
- [ ] Renouvellement SSL automatique configuré

## 🎯 Résultat attendu

- ✅ Site accessible sur `https://downpricer.com`
- ✅ API accessible sur `https://downpricer.com/api`
- ✅ Images uploadées accessibles sur `https://downpricer.com/api/uploads/`
- ✅ MongoDB persistant (volume Docker)
- ✅ Uploads persistants (volume Docker)
- ✅ SSL/TLS actif avec renouvellement automatique


