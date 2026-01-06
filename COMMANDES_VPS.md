# Commandes exactes pour déploiement VPS (mode IP)

## 🔴 IMPORTANT : Remplacer avant d'exécuter
- `USERNAME` = votre username GitHub
- `TOKEN` = votre Personal Access Token GitHub
- `VOTRE_IP` = sera détecté automatiquement

---

## 📋 Commandes dans l'ordre (copier-coller)

### 1. Installation Docker

```bash
apt update && apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh
systemctl enable docker
systemctl start docker
apt install -y docker-compose-plugin
```

**Vérification :**
```bash
docker --version
docker compose version
```

---

### 2. Cloner le repo

```bash
mkdir -p /opt/downpricer
cd /opt/downpricer
git clone https://USERNAME:TOKEN@github.com/USERNAME/downpricer.git .
```

**⚠️ Remplacez USERNAME et TOKEN par vos valeurs réelles**

---

### 3. Créer le fichier .env

```bash
cd /opt/downpricer
VOTRE_IP=$(curl -s ifconfig.me)
cat > .env << EOF
DOMAIN=
MONGO_URL=mongodb://mongo:27017
DB_NAME=downpricer
JWT_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
CORS_ORIGINS=http://$VOTRE_IP,http://localhost,http://127.0.0.1
BACKEND_PUBLIC_URL=http://$VOTRE_IP
EOF
```

**Vérifier :**
```bash
cat .env
echo "IP détectée: $VOTRE_IP"
```

---

### 4. Configurer Nginx pour IP

```bash
cd /opt/downpricer

# Copier la config IP
cp nginx/conf.d/downpricer-ip.conf nginx/conf.d/downpricer.conf

# OU créer manuellement
cat > nginx/conf.d/downpricer.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    location /api/ {
        proxy_pass http://backend:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/uploads/ {
        alias /usr/share/nginx/html/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF
```

---

### 5. Créer les dossiers nécessaires

```bash
cd /opt/downpricer
mkdir -p nginx/ssl nginx/conf.d
```

---

### 6. Lancer le déploiement

**Option A : Script automatisé**
```bash
cd /opt/downpricer
chmod +x deploy-docker.sh
./deploy-docker.sh
```

**Option B : Commandes manuelles**
```bash
cd /opt/downpricer
docker compose -f docker-compose.prod.yml up -d --build
```

---

### 7. Configurer le firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

---

### 8. Tests

```bash
# Récupérer l'IP
VOTRE_IP=$(curl -s ifconfig.me)

# Test health check
curl http://localhost/api/health
# Devrait retourner: {"status":"ok"}

# Test avec IP publique
curl http://$VOTRE_IP/api/health

# Test frontend
curl http://localhost | head -20
```

**Dans le navigateur :**
Ouvrir `http://VOTRE_IP` (remplacer par l'IP réelle)

---

## 🔍 Troubleshooting

### Voir les logs

```bash
# Tous les services
docker compose -f docker-compose.prod.yml logs -f

# Service spécifique
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f mongo
```

### Vérifier les conteneurs

```bash
docker ps -a
docker compose -f docker-compose.prod.yml ps
```

### Vérifier les ports

```bash
netstat -tlnp | grep :80
ss -tlnp | grep :80
```

### Redémarrer un service

```bash
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart nginx
```

### Rebuild complet

```bash
cd /opt/downpricer
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

---

## ✅ Checklist de vérification

- [ ] Docker installé et fonctionnel
- [ ] Docker Compose installé
- [ ] Repo cloné dans `/opt/downpricer`
- [ ] Fichier `.env` créé avec IP (pas de domaine)
- [ ] `nginx/conf.d/downpricer.conf` configuré avec `server_name _`
- [ ] `docker compose up -d --build` exécuté sans erreur
- [ ] Port 80 ouvert (ufw)
- [ ] `curl http://localhost/api/health` retourne `{"status":"ok"}`
- [ ] Site accessible sur `http://VOTRE_IP` dans le navigateur
- [ ] Pas d'erreurs CORS dans la console du navigateur


