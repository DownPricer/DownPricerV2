# Guide de déploiement sur OVH - DownPricer

Ce guide vous explique comment déployer l'application DownPricer sur OVH.

## 🚀 Démarrage rapide

**Pour un déploiement guidé étape par étape, consultez :**
- **[DEPLOY_GUIDE_SIMPLE.md](DEPLOY_GUIDE_SIMPLE.md)** - Guide simple avec 3 méthodes
- **[DEPLOY_STEP_BY_STEP.md](DEPLOY_STEP_BY_STEP.md)** - Guide étape par étape avec assistance

**Pour un déploiement automatisé :**
- Utilisez le script `deploy.sh` (voir ci-dessous)

## Recommandation : VPS OVH

Pour une application comme DownPricer avec MongoDB et plusieurs mini-sites, nous recommandons **un VPS OVH** plutôt qu'un hébergement web classique, car :

- ✅ Contrôle total sur l'environnement
- ✅ Installation de MongoDB directement sur le serveur
- ✅ Meilleure performance pour les applications full-stack
- ✅ Flexibilité pour configurer Nginx, systemd, etc.
- ✅ Coût raisonnable (à partir de ~5€/mois)

**Configuration VPS recommandée** :
- **RAM** : 4 Go minimum (8 Go recommandé, 12 Go optimal)
- **CPU** : 2 vCores minimum (6 vCores optimal)
- **Stockage** : 50 Go SSD minimum (100 Go SSD NVMe recommandé)
- **OS** : Ubuntu 22.04 LTS ou Debian 12
- **Backup** : Automatisé recommandé

💡 **Exemple de config optimale :** VPS-2 OVH (6 vCores / 12 GB / 100 GB NVMe) ~9€/mois

## Architecture de déploiement

```
Internet
   │
   ▼
Nginx (reverse proxy, port 80/443)
   │
   ├──► Frontend (build React, servi par Nginx)
   │
   └──► Backend (FastAPI via uvicorn, port 8001)
           │
           └──► MongoDB (port 27017)
```

## Préparation du serveur

### 1. Connexion SSH

```bash
ssh root@votre-ip-ovh
```

### 2. Mise à jour du système

```bash
apt update && apt upgrade -y
```

### 3. Installation des prérequis

```bash
# Python et pip
apt install -y python3 python3-pip python3-venv

# Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org

# Nginx
apt install -y nginx

# Certbot pour SSL
apt install -y certbot python3-certbot-nginx

# Git
apt install -y git

# Outils utiles
apt install -y htop nano ufw
```

### 4. Configuration de MongoDB

```bash
# Démarrer MongoDB
systemctl start mongod
systemctl enable mongod

# Vérifier que MongoDB fonctionne
systemctl status mongod
```

**Sécurisation MongoDB** (recommandé) :

```bash
mongosh
use admin
db.createUser({
  user: "downpricer_admin",
  pwd: "VOTRE_MOT_DE_PASSE_SECURISE",
  roles: ["root"]
})
exit
```

Puis modifiez `/etc/mongod.conf` pour activer l'authentification :

```yaml
security:
  authorization: enabled
```

Redémarrez MongoDB :

```bash
systemctl restart mongod
```

### 5. Configuration du firewall

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

## Déploiement de l'application

### 1. Création d'un utilisateur pour l'application

```bash
adduser downpricer
usermod -aG sudo downpricer
su - downpricer
```

### 2. Clonage du projet

```bash
cd /home/downpricer
git clone https://github.com/votre-repo/downpricer.git
# ou téléchargez votre code via SCP/SFTP
cd downpricer
```

### 3. Configuration du Backend

```bash
cd backend

# Créer un environnement virtuel
python3 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env
nano .env
```

Contenu du fichier `.env` :

```env
# MongoDB (avec authentification si configuré)
MONGO_URL=mongodb://downpricer_admin:VOTRE_MOT_DE_PASSE@localhost:27017/downpricer?authSource=admin
# ou sans authentification (déconseillé en production)
# MONGO_URL=mongodb://localhost:27017/downpricer

DB_NAME=downpricer

# JWT Secret Key (générez une clé sécurisée)
JWT_SECRET_KEY=VOTRE_CLE_SECRETE_TRES_LONGUE_ET_ALEATOIRE

# CORS Origins (votre domaine)
CORS_ORIGINS=https://downpricer.com,https://www.downpricer.com

# URL publique du backend
BACKEND_PUBLIC_URL=https://api.downpricer.com
# ou si vous utilisez le même domaine
# BACKEND_PUBLIC_URL=https://downpricer.com
```

**Générer une clé secrète JWT** :

```python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 4. Création du service systemd pour le backend

```bash
sudo nano /etc/systemd/system/downpricer-backend.service
```

Contenu :

```ini
[Unit]
Description=DownPricer Backend API
After=network.target mongod.service

[Service]
Type=simple
User=downpricer
WorkingDirectory=/home/downpricer/downpricer/backend
Environment="PATH=/home/downpricer/downpricer/backend/venv/bin"
ExecStart=/home/downpricer/downpricer/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Activer et démarrer le service :

```bash
sudo systemctl daemon-reload
sudo systemctl enable downpricer-backend
sudo systemctl start downpricer-backend
sudo systemctl status downpricer-backend
```

### 5. Build du Frontend

```bash
cd /home/downpricer/downpricer/frontend

# Créer le fichier .env
nano .env
```

Contenu :

```env
REACT_APP_BACKEND_URL=https://api.downpricer.com
# ou si vous utilisez le même domaine
# REACT_APP_BACKEND_URL=https://downpricer.com
```

Build :

```bash
npm install
npm run build
```

Le build sera dans `frontend/build/`

### 6. Configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/downpricer
```

Configuration (avec sous-domaine séparé pour l'API) :

```nginx
# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name downpricer.com www.downpricer.com;
    return 301 https://$server_name$request_uri;
}

# Frontend
server {
    listen 443 ssl http2;
    server_name downpricer.com www.downpricer.com;

    ssl_certificate /etc/letsencrypt/live/downpricer.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/downpricer.com/privkey.pem;

    root /home/downpricer/downpricer/frontend/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Servir les fichiers statiques
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache pour les assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# API Backend
server {
    listen 80;
    server_name api.downpricer.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.downpricer.com;

    ssl_certificate /etc/letsencrypt/live/api.downpricer.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.downpricer.com/privkey.pem;

    # Proxy vers le backend
    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Servir les uploads directement
    location /api/uploads/ {
        alias /home/downpricer/downpricer/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

**Alternative : même domaine** (si vous préférez tout sur `downpricer.com`) :

```nginx
server {
    listen 443 ssl http2;
    server_name downpricer.com www.downpricer.com;

    ssl_certificate /etc/letsencrypt/live/downpricer.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/downpricer.com/privkey.pem;

    root /home/downpricer/downpricer/frontend/build;
    index index.html;

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads
    location /api/uploads/ {
        alias /home/downpricer/downpricer/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Frontend
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

Activer la configuration :

```bash
sudo ln -s /etc/nginx/sites-available/downpricer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Configuration SSL avec Let's Encrypt

```bash
# Pour le domaine principal
sudo certbot --nginx -d downpricer.com -d www.downpricer.com

# Pour le sous-domaine API (si vous utilisez api.downpricer.com)
sudo certbot --nginx -d api.downpricer.com

# Renouvellement automatique
sudo certbot renew --dry-run
```

### 8. Création du compte admin

```bash
cd /home/downpricer/downpricer/backend
source venv/bin/activate
python create_admin.py
```

## Vérification du déploiement

1. **Backend** : `https://api.downpricer.com/docs` (ou `https://downpricer.com/api/docs`)
2. **Frontend** : `https://downpricer.com`
3. **Connexion** : Testez avec votre compte admin
4. **Upload d'images** : Vérifiez que les images s'affichent correctement

## Maintenance

### Logs

```bash
# Logs backend
sudo journalctl -u downpricer-backend -f

# Logs Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Logs MongoDB
sudo tail -f /var/log/mongodb/mongod.log
```

### Redémarrage des services

```bash
# Backend
sudo systemctl restart downpricer-backend

# Nginx
sudo systemctl restart nginx

# MongoDB
sudo systemctl restart mongod
```

### Mise à jour de l'application

```bash
cd /home/downpricer/downpricer

# Pull les dernières modifications
git pull

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart downpricer-backend

# Frontend
cd ../frontend
npm install
npm run build
sudo systemctl reload nginx
```

### Sauvegarde MongoDB

```bash
# Créer un script de sauvegarde
sudo nano /usr/local/bin/backup-mongodb.sh
```

Contenu :

```bash
#!/bin/bash
BACKUP_DIR="/home/downpricer/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mongodump --out $BACKUP_DIR/downpricer_$DATE
# Garder seulement les 7 derniers backups
find $BACKUP_DIR -type d -name "downpricer_*" -mtime +7 -exec rm -rf {} +
```

Rendre exécutable :

```bash
sudo chmod +x /usr/local/bin/backup-mongodb.sh
```

Ajouter au cron (sauvegarde quotidienne à 2h du matin) :

```bash
sudo crontab -e
# Ajouter :
0 2 * * * /usr/local/bin/backup-mongodb.sh
```

## Optimisations

### 1. Compression des images (déjà fait dans le code)

Le backend compresse automatiquement les images en WebP. Vérifiez que cela fonctionne.

### 2. Cache Nginx

La configuration Nginx inclut déjà le cache pour les assets statiques.

### 3. Monitoring

Installez un outil de monitoring simple :

```bash
# htop pour surveiller les ressources
apt install -y htop

# ou installez Prometheus + Grafana pour un monitoring avancé
```

## Dépannage

### Le backend ne démarre pas

```bash
# Vérifier les logs
sudo journalctl -u downpricer-backend -n 50

# Vérifier que MongoDB fonctionne
sudo systemctl status mongod

# Vérifier les permissions
ls -la /home/downpricer/downpricer/backend/uploads
```

### Les images ne s'affichent pas

```bash
# Vérifier les permissions du dossier uploads
sudo chown -R downpricer:downpricer /home/downpricer/downpricer/backend/uploads
sudo chmod -R 755 /home/downpricer/downpricer/backend/uploads

# Vérifier la configuration Nginx
sudo nginx -t
```

### Erreurs CORS

Vérifiez que `CORS_ORIGINS` dans `backend/.env` contient bien votre domaine.

### Certificat SSL expiré

```bash
sudo certbot renew
sudo systemctl reload nginx
```

## Coûts estimés OVH

- **VPS Starter** (1 vCore, 4 Go RAM, 80 Go SSD) : ~5-6€/mois (pour tester)
- **VPS Value** (2 vCores, 8 Go RAM, 160 Go SSD) : ~10-12€/mois ⭐ **recommandé**
- **VPS Elite** (4 vCores, 16 Go RAM, 320 Go SSD) : ~20-25€/mois (pour grandir)
- **Domaine** : ~10-15€/an (~1€/mois)
- **Total recommandé** : ~11-13€/mois

📋 **Pour une recommandation détaillée, consultez [RECOMMANDATION_VPS_OVH.md](RECOMMANDATION_VPS_OVH.md)**

## Alternative : MongoDB Atlas (cloud)

Si vous préférez utiliser MongoDB Atlas au lieu d'une installation locale :

1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un cluster gratuit (M0 - 512 Mo)
3. Configurez les IP autorisées (IP de votre VPS)
4. Utilisez la connection string dans `MONGO_URL`

Avantages :
- ✅ Pas besoin d'installer/maintenir MongoDB
- ✅ Sauvegardes automatiques
- ✅ Monitoring intégré

Inconvénients :
- ❌ Coût supplémentaire pour les clusters plus grands
- ❌ Dépendance à un service externe

## Conclusion

Avec cette configuration, votre application DownPricer sera :
- ✅ Accessible via HTTPS
- ✅ Performante (Nginx + compression)
- ✅ Sécurisée (firewall, SSL, MongoDB auth)
- ✅ Maintenable (systemd, logs, backups)
- ✅ Scalable (prêt pour plus de trafic)

Pour toute question, consultez les logs et la documentation OVH.

