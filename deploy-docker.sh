#!/bin/bash

# Script de déploiement Docker pour DownPricer sur VPS OVH
# Usage: ./deploy-docker.sh

set -e  # Arrêter en cas d'erreur

echo "=========================================="
echo "  DownPricer - Déploiement Docker"
echo "=========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Variables
DOMAIN="${DOMAIN:-downpricer.com}"
APP_DIR="${APP_DIR:-/opt/downpricer}"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Domaine: $DOMAIN"
echo "  Dossier: $APP_DIR"
echo ""
read -p "Continuer? (o/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    echo "Déploiement annulé."
    exit 1
fi

echo ""
echo -e "${GREEN}[1/6] Mise à jour du système...${NC}"
apt update && apt upgrade -y

echo ""
echo -e "${GREEN}[2/6] Installation de Docker et Docker Compose...${NC}"

# Installer Docker si pas présent
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Installer Docker Compose si pas présent
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    apt install -y docker-compose-plugin
fi

echo ""
echo -e "${GREEN}[3/6] Clonage/Configuration du projet...${NC}"

# Créer le dossier si nécessaire
mkdir -p $APP_DIR
cd $APP_DIR

# Si le dossier est vide, proposer de cloner
if [ ! -d "$APP_DIR/.git" ]; then
    echo "Le dossier $APP_DIR ne contient pas de repo Git."
    read -p "Voulez-vous cloner depuis un repo Git? (o/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        read -p "URL du repo Git: " GIT_REPO
        git clone $GIT_REPO .
    else
        echo "Transférez vos fichiers dans $APP_DIR puis relancez ce script."
        exit 1
    fi
else
    echo "Mise à jour du repo..."
    git pull
fi

echo ""
echo -e "${GREEN}[4/6] Configuration des variables d'environnement...${NC}"

# Générer JWT_SECRET si pas défini
if [ -z "$JWT_SECRET_KEY" ]; then
    JWT_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))" 2>/dev/null || openssl rand -base64 32)
fi

# Créer le fichier .env pour docker-compose
cat > .env << EOF
# Domaine
DOMAIN=$DOMAIN

# MongoDB (dans Docker)
MONGO_URL=mongodb://mongo:27017
DB_NAME=downpricer

# JWT Secret
JWT_SECRET_KEY=$JWT_SECRET_KEY

# CORS
CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN

# Backend URL
BACKEND_PUBLIC_URL=https://$DOMAIN
EOF

echo -e "${GREEN}Fichier .env créé${NC}"

echo ""
echo -e "${GREEN}[5/6] Build et démarrage des conteneurs...${NC}"

# Créer les dossiers nécessaires
mkdir -p nginx/ssl nginx/conf.d

# Build et démarrage
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo -e "${GREEN}[6/6] Vérification...${NC}"

# Attendre que les services soient prêts
sleep 5

# Vérifier la santé
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend répond correctement${NC}"
else
    echo -e "${YELLOW}⚠️  Backend ne répond pas encore (peut être normal au démarrage)${NC}"
fi

echo ""
echo -e "${GREEN}Déploiement terminé!${NC}"
echo ""
echo -e "${YELLOW}Prochaines étapes:${NC}"
echo "1. Configurez votre DNS pour pointer vers l'IP de ce serveur"
echo "2. Pour SSL, exécutez:"
echo "   docker run -it --rm -v $APP_DIR/nginx/ssl:/etc/letsencrypt -v $APP_DIR/nginx/conf.d:/etc/nginx/conf.d certbot/certbot certonly --webroot -w /var/www/certbot -d $DOMAIN -d www.$DOMAIN"
echo "3. Décommentez la section HTTPS dans nginx/conf.d/downpricer.conf"
echo "4. Redémarrez nginx: docker compose -f docker-compose.prod.yml restart nginx"
echo ""
echo -e "${GREEN}Commandes utiles:${NC}"
echo "  Logs: docker compose -f docker-compose.prod.yml logs -f"
echo "  Arrêter: docker compose -f docker-compose.prod.yml down"
echo "  Redémarrer: docker compose -f docker-compose.prod.yml restart"


