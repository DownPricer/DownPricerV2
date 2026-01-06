# Guide de déploiement Docker - DownPricer sur VPS OVH

## Architecture

```
Internet
   │
   ▼
Nginx (port 80/443)
   │
   ├──► Frontend (build React, servi par Nginx)
   │
   └──► Backend (FastAPI, port 8001 interne)
           │
           └──► MongoDB (port 27017 interne)
```

## Prérequis

- VPS OVH avec Ubuntu 22.04 LTS ou Debian 12
- Domaine pointant vers l'IP du VPS (downpricer.com)
- Accès root ou sudo

## Déploiement rapide

### 1. Connexion SSH

```bash
ssh root@votre-ip-ovh
```

### 2. Exécuter le script de déploiement

```bash
# Cloner le repo (si pas déjà fait)
cd /opt
git clone https://github.com/votre-repo/downpricer.git
cd downpricer

# Rendre le script exécutable
chmod +x deploy-docker.sh

# Exécuter le déploiement
./deploy-docker.sh
```

Le script va :
- Installer Docker et Docker Compose
- Cloner/mettre à jour le repo
- Créer le fichier `.env` avec les variables d'environnement
- Builder et démarrer tous les services

### 3. Configuration SSL avec Let's Encrypt

Une fois le DNS configuré et le site accessible en HTTP :

```bash
cd /opt/downpricer

# Installer certbot dans un conteneur temporaire
docker run -it --rm \
  -v $(pwd)/nginx/ssl:/etc/letsencrypt \
  -v $(pwd)/nginx/conf.d:/etc/nginx/conf.d \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  -d downpricer.com \
  -d www.downpricer.com
```

**OU** utiliser le plugin nginx (plus simple) :

```bash
# Installer certbot sur le host
apt install -y certbot

# Obtenir le certificat
certbot certonly --nginx -d downpricer.com -d www.downpricer.com

# Copier les certificats dans le dossier nginx/ssl
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/downpricer.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/downpricer.com/privkey.pem nginx/ssl/
```

### 4. Activer HTTPS dans Nginx

Éditer `nginx/conf.d/downpricer.conf` et décommenter la section HTTPS, puis commenter la redirection HTTP.

Redémarrer nginx :

```bash
docker compose -f docker-compose.prod.yml restart nginx
```

### 5. Renouvellement automatique SSL

Créer un cron job :

```bash
crontab -e
```

Ajouter :

```cron
0 3 * * * certbot renew --quiet && docker compose -f /opt/downpricer/docker-compose.prod.yml restart nginx
```

## Commandes utiles

### Voir les logs

```bash
# Tous les services
docker compose -f docker-compose.prod.yml logs -f

# Un service spécifique
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx
```

### Redémarrer les services

```bash
# Tous
docker compose -f docker-compose.prod.yml restart

# Un service
docker compose -f docker-compose.prod.yml restart backend
```

### Arrêter/Démarrer

```bash
# Arrêter
docker compose -f docker-compose.prod.yml down

# Démarrer
docker compose -f docker-compose.prod.yml up -d

# Rebuild et redémarrer
docker compose -f docker-compose.prod.yml up -d --build
```

### Vérifier la santé

```bash
# Backend
curl http://localhost/api/health

# Frontend
curl http://localhost
```

## Structure des fichiers

```
/opt/downpricer/
├── backend/
│   ├── Dockerfile
│   ├── server.py
│   └── ...
├── frontend/
│   ├── Dockerfile
│   └── ...
├── nginx/
│   └── conf.d/
│       └── downpricer.conf
├── docker-compose.prod.yml
├── .env
└── deploy-docker.sh
```

## Variables d'environnement

Le fichier `.env` à la racine contient :

```env
DOMAIN=downpricer.com
MONGO_URL=mongodb://mongo:27017
DB_NAME=downpricer
JWT_SECRET_KEY=votre-cle-secrete
CORS_ORIGINS=https://downpricer.com,https://www.downpricer.com
BACKEND_PUBLIC_URL=https://downpricer.com
```

## Volumes persistants

Les données sont stockées dans des volumes Docker :

- `mongo_data` : Base de données MongoDB
- `uploads_data` : Images uploadées
- `frontend_build` : Build du frontend React

Pour sauvegarder :

```bash
# MongoDB
docker run --rm -v downpricer_mongo_data:/data -v $(pwd):/backup alpine tar czf /backup/mongo-backup.tar.gz /data

# Uploads
docker run --rm -v downpricer_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz /data
```

## Dépannage

### Le backend ne démarre pas

```bash
# Vérifier les logs
docker compose -f docker-compose.prod.yml logs backend

# Vérifier la connexion MongoDB
docker compose -f docker-compose.prod.yml exec mongo mongosh
```

### Les images ne s'affichent pas

```bash
# Vérifier les permissions du volume uploads
docker compose -f docker-compose.prod.yml exec backend ls -la /app/uploads
```

### Le frontend ne se charge pas

```bash
# Vérifier que le build est présent
docker compose -f docker-compose.prod.yml exec frontend ls -la /output

# Rebuild le frontend
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

### Erreurs CORS

Vérifier que `CORS_ORIGINS` dans `.env` contient bien votre domaine.

## Mise à jour de l'application

```bash
cd /opt/downpricer

# Pull les dernières modifications
git pull

# Rebuild et redémarrer
docker compose -f docker-compose.prod.yml up -d --build
```

## Création du compte admin

```bash
docker compose -f docker-compose.prod.yml exec backend python create_admin.py
```

## Ports exposés

- **80** : HTTP (Nginx)
- **443** : HTTPS (Nginx)

Les autres ports (8001 backend, 27017 MongoDB) sont **internes au réseau Docker** et ne sont pas exposés publiquement.

## Sécurité

- ✅ MongoDB n'est pas exposé publiquement
- ✅ Backend n'est accessible que via Nginx
- ✅ SSL/TLS avec Let's Encrypt
- ✅ Firewall recommandé (UFW) : ports 22, 80, 443 uniquement

## Support

Pour toute question, consultez les logs et la documentation.


