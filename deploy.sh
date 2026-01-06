#!/bin/bash

# Script de déploiement automatisé pour DownPricer sur VPS OVH
# Usage: ./deploy.sh

set -e  # Arrêter en cas d'erreur

echo "=========================================="
echo "  DownPricer - Déploiement automatisé"
echo "=========================================="
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables (à modifier selon votre configuration)
DOMAIN="${DOMAIN:-downpricer.com}"
APP_USER="${APP_USER:-downpricer}"
APP_DIR="${APP_DIR:-/home/$APP_USER/downpricer}"
MONGO_URL="${MONGO_URL:-mongodb://localhost:27017}"
DB_NAME="${DB_NAME:-downpricer}"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Domaine: $DOMAIN"
echo "  Utilisateur: $APP_USER"
echo "  Dossier: $APP_DIR"
echo "  MongoDB: $MONGO_URL"
echo "  Base de données: $DB_NAME"
echo ""
read -p "Continuer avec cette configuration? (o/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    echo "Déploiement annulé."
    exit 1
fi

echo ""
echo -e "${GREEN}[1/8] Mise à jour du système...${NC}"
apt update && apt upgrade -y

echo ""
echo -e "${GREEN}[2/8] Installation des prérequis...${NC}"

# Python
if ! command -v python3 &> /dev/null; then
    apt install -y python3 python3-pip python3-venv
fi

# Node.js
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

# MongoDB
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt update
    apt install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
fi

# Nginx
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
fi

# Certbot
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi

# Autres outils
apt install -y git htop nano ufw

echo ""
echo -e "${GREEN}[3/8] Création de l'utilisateur application...${NC}"
if ! id "$APP_USER" &>/dev/null; then
    adduser --disabled-password --gecos "" $APP_USER
    usermod -aG sudo $APP_USER
    echo -e "${GREEN}Utilisateur $APP_USER créé${NC}"
else
    echo -e "${YELLOW}Utilisateur $APP_USER existe déjà${NC}"
fi

echo ""
echo -e "${GREEN}[4/8] Configuration du firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo -e "${GREEN}[5/8] Clonage/Configuration de l'application...${NC}"
if [ ! -d "$APP_DIR" ]; then
    echo "Le dossier $APP_DIR n'existe pas."
    echo "Vous devez soit:"
    echo "  1. Cloner votre repo Git dans $APP_DIR"
    echo "  2. Ou transférer les fichiers via SCP/SFTP"
    echo ""
    read -p "Voulez-vous cloner depuis un repo Git? (o/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        read -p "URL du repo Git: " GIT_REPO
        sudo -u $APP_USER git clone $GIT_REPO $APP_DIR
    else
        echo "Transférez vos fichiers dans $APP_DIR puis relancez ce script."
        exit 1
    fi
fi

# Permissions
chown -R $APP_USER:$APP_USER $APP_DIR

echo ""
echo -e "${GREEN}[6/8] Configuration du backend...${NC}"
cd $APP_DIR/backend

# Créer environnement virtuel
sudo -u $APP_USER python3 -m venv venv

# Installer dépendances
sudo -u $APP_USER ./venv/bin/pip install -r requirements.txt

# Créer .env si n'existe pas
if [ ! -f .env ]; then
    sudo -u $APP_USER cat > .env << EOF
MONGO_URL=$MONGO_URL
DB_NAME=$DB_NAME
JWT_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN
BACKEND_PUBLIC_URL=https://$DOMAIN
EOF
    echo -e "${GREEN}Fichier .env créé${NC}"
fi

# Créer dossier uploads
sudo -u $APP_USER mkdir -p uploads
chmod 755 uploads

echo ""
echo -e "${GREEN}[7/8] Configuration du frontend...${NC}"
cd $APP_DIR/frontend

# Installer dépendances
sudo -u $APP_USER npm install

# Créer .env
sudo -u $APP_USER cat > .env << EOF
REACT_APP_BACKEND_URL=https://$DOMAIN
EOF

# Build
sudo -u $APP_USER npm run build

echo ""
echo -e "${GREEN}[8/8] Configuration systemd et Nginx...${NC}"

# Service systemd pour le backend
cat > /etc/systemd/system/downpricer-backend.service << EOF
[Unit]
Description=DownPricer Backend API
After=network.target mongod.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$APP_DIR/backend/venv/bin"
ExecStart=$APP_DIR/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable downpricer-backend
systemctl start downpricer-backend

# Configuration Nginx
cat > /etc/nginx/sites-available/downpricer << EOF
# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# Frontend + Backend
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    root $APP_DIR/frontend/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Uploads
    location /api/uploads/ {
        alias $APP_DIR/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Frontend
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

ln -sf /etc/nginx/sites-available/downpricer /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Tester la config Nginx
nginx -t

echo ""
echo -e "${GREEN}Configuration terminée!${NC}"
echo ""
echo -e "${YELLOW}Prochaines étapes:${NC}"
echo "1. Configurez votre DNS pour pointer vers l'IP de ce serveur"
echo "2. Exécutez: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "3. Redémarrez Nginx: sudo systemctl reload nginx"
echo ""
echo -e "${GREEN}Déploiement terminé!${NC}"


