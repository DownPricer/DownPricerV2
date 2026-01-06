# Guide GitHub → VPS : Déploiement DownPricer

## 📋 Plan d'action

### ÉTAPE 1 : Préparer le projet pour GitHub

#### 1.1 Vérifier/corriger .gitignore

Le fichier `.gitignore` doit ignorer :
- ✅ `node_modules/`
- ✅ `venv/`, `.venv/`
- ✅ `*.env`, `*.env.*`
- ✅ `backend/uploads/` (sauf structure)
- ✅ `frontend/build/`
- ✅ `.DS_Store`, `*.log`

**Vérification :**
```bash
# Dans Cursor (local)
cat .gitignore | grep -E "(node_modules|venv|\.env|uploads|build)"
```

#### 1.2 Initialiser Git (si pas déjà fait)

```bash
# Dans Cursor (local, à la racine du projet)
git init
git branch -M main
```

#### 1.3 Créer le repo GitHub

1. Aller sur https://github.com/new
2. Nom du repo : `downpricer` (ou autre)
3. **Public** ou **Private** (au choix)
4. **NE PAS** cocher "Initialize with README"
5. Cliquer "Create repository"

#### 1.4 Authentification GitHub

**Option A : Personal Access Token (recommandé pour début)**

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Scopes : cocher `repo` (tous)
4. Générer et **COPIER LE TOKEN** (ne s'affiche qu'une fois)

**Option B : SSH Key (plus sécurisé, une fois configuré)**

```bash
# Générer une clé SSH (si pas déjà)
ssh-keygen -t ed25519 -C "votre-email@example.com"
cat ~/.ssh/id_ed25519.pub
# Copier la sortie et l'ajouter dans GitHub → Settings → SSH keys
```

#### 1.5 Premier commit et push

**Avec Personal Access Token :**

```bash
# Dans Cursor (local, à la racine)
git add .
git commit -m "Initial commit: DownPricer avec Docker"

# Remplacer USERNAME et TOKEN
git remote add origin https://USERNAME:TOKEN@github.com/USERNAME/downpricer.git
git push -u origin main
```

**Avec SSH :**

```bash
git add .
git commit -m "Initial commit: DownPricer avec Docker"
git remote add origin git@github.com:USERNAME/downpricer.git
git push -u origin main
```

**⚠️ IMPORTANT :** Si vous utilisez un token, GitHub vous demandera peut-être votre username. Utilisez votre **username GitHub**, pas votre email.

---

### ÉTAPE 2 : Déployer sur le VPS

#### 2.1 Connexion SSH

```bash
ssh root@VOTRE_IP_OVH
```

#### 2.2 Installation Docker + Docker Compose

```bash
# Mise à jour
apt update && apt upgrade -y

# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh
systemctl enable docker
systemctl start docker

# Docker Compose
apt install -y docker-compose-plugin

# Vérifier
docker --version
docker compose version
```

#### 2.3 Cloner le repo

```bash
# Créer le dossier
mkdir -p /opt/downpricer
cd /opt/downpricer

# Cloner (remplacer USERNAME et TOKEN ou utiliser SSH)
git clone https://USERNAME:TOKEN@github.com/USERNAME/downpricer.git .

# OU avec SSH (si configuré)
# git clone git@github.com:USERNAME/downpricer.git .
```

#### 2.4 Configurer .env pour mode IP

**Récupérer l'IP du VPS :**
```bash
curl ifconfig.me
# Notez cette IP (exemple: 51.38.123.45)
```

**Créer le fichier .env :**
```bash
cd /opt/downpricer

# Remplacer VOTRE_IP par l'IP réelle
cat > .env << EOF
DOMAIN=
MONGO_URL=mongodb://mongo:27017
DB_NAME=downpricer
JWT_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
CORS_ORIGINS=http://$(curl -s ifconfig.me),http://localhost,http://127.0.0.1
BACKEND_PUBLIC_URL=http://$(curl -s ifconfig.me)
EOF

# Vérifier
cat .env
```

**Exemple de .env généré :**
```env
DOMAIN=
MONGO_URL=mongodb://mongo:27017
DB_NAME=downpricer
JWT_SECRET_KEY=hLrfFE4an6_TxlDomRdcYDZ4w6F6jdBIkiAVEU0s6XQ
CORS_ORIGINS=http://51.38.123.45,http://localhost,http://127.0.0.1
BACKEND_PUBLIC_URL=http://51.38.123.45
```

#### 2.5 Adapter Nginx pour IP (pas de domaine)

```bash
cd /opt/downpricer

# Éditer nginx/conf.d/downpricer.conf
nano nginx/conf.d/downpricer.conf
```

**Remplacer le contenu par :**
```nginx
server {
    listen 80;
    server_name _;  # Accepte toutes les requêtes
    
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # API Backend
    location /api/ {
        proxy_pass http://backend:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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

#### 2.6 Créer les dossiers nécessaires

```bash
cd /opt/downpricer
mkdir -p nginx/ssl nginx/conf.d
```

#### 2.7 Lancer le déploiement

```bash
cd /opt/downpricer

# Rendre le script exécutable
chmod +x deploy-docker.sh

# Option A : Utiliser le script
./deploy-docker.sh

# Option B : Commandes manuelles
docker compose -f docker-compose.prod.yml up -d --build
```

#### 2.8 Vérifier le firewall

```bash
# Vérifier que le port 80 est ouvert
ufw status

# Si pas ouvert :
ufw allow 80/tcp
ufw allow 22/tcp
ufw enable
```

---

### ÉTAPE 3 : Tests

#### 3.1 Tests en ligne de commande (sur le VPS)

```bash
# Health check backend
curl http://localhost/api/health
# Devrait retourner: {"status":"ok"}

# Frontend
curl http://localhost
# Devrait retourner du HTML

# Avec l'IP publique
VOTRE_IP=$(curl -s ifconfig.me)
curl http://$VOTRE_IP/api/health
```

#### 3.2 Test dans le navigateur

Ouvrir : `http://VOTRE_IP_OVH`

**Résultat attendu :**
- ✅ Page d'accueil DownPricer s'affiche
- ✅ Pas d'erreurs CORS dans la console
- ✅ Les appels API fonctionnent

---

### ÉTAPE 4 : Troubleshooting

#### 4.1 Voir les logs

```bash
# Tous les services
docker compose -f docker-compose.prod.yml logs -f

# Service spécifique
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f mongo
```

#### 4.2 Vérifier les conteneurs

```bash
# Liste des conteneurs
docker ps -a

# État des services
docker compose -f docker-compose.prod.yml ps
```

#### 4.3 Vérifier les ports

```bash
# Ports écoutés
netstat -tlnp | grep :80
ss -tlnp | grep :80

# Firewall
ufw status verbose
```

#### 4.4 Redémarrer un service

```bash
# Redémarrer tout
docker compose -f docker-compose.prod.yml restart

# Redémarrer un service
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart nginx
```

#### 4.5 Rebuild complet

```bash
cd /opt/downpricer
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

---

## ✅ Checklist finale

### Local (Cursor)
- [ ] `.gitignore` vérifié (ignore node_modules, venv, .env, uploads, build)
- [ ] `git init` exécuté
- [ ] Repo GitHub créé
- [ ] Token SSH ou Personal Access Token généré
- [ ] `git add .` et `git commit` effectués
- [ ] `git push` réussi

### VPS
- [ ] Docker installé (`docker --version`)
- [ ] Docker Compose installé (`docker compose version`)
- [ ] Repo cloné dans `/opt/downpricer`
- [ ] Fichier `.env` créé avec IP (pas de domaine)
- [ ] `nginx/conf.d/downpricer.conf` adapté pour IP (`server_name _`)
- [ ] `docker compose up -d --build` exécuté
- [ ] Port 80 ouvert (ufw)
- [ ] `curl http://localhost/api/health` retourne `{"status":"ok"}`
- [ ] Site accessible sur `http://VOTRE_IP` dans le navigateur

---

## 🔴 Problèmes courants

### "Permission denied" sur deploy-docker.sh
```bash
chmod +x deploy-docker.sh
```

### "Cannot connect to Docker daemon"
```bash
systemctl start docker
systemctl enable docker
```

### Erreurs CORS dans le navigateur
Vérifier que `CORS_ORIGINS` dans `.env` contient `http://VOTRE_IP`

### Le frontend ne charge pas
```bash
# Vérifier que le build est présent
docker compose -f docker-compose.prod.yml exec frontend ls -la /output
# Rebuild si nécessaire
docker compose -f docker-compose.prod.yml build frontend
```

### MongoDB ne démarre pas
```bash
# Vérifier les logs
docker compose -f docker-compose.prod.yml logs mongo
# Vérifier l'espace disque
df -h
```

---

## 📝 Commandes rapides (copier-coller)

```bash
# Sur le VPS, une fois connecté en SSH
apt update && apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh && rm get-docker.sh
apt install -y docker-compose-plugin
mkdir -p /opt/downpricer && cd /opt/downpricer
git clone https://USERNAME:TOKEN@github.com/USERNAME/downpricer.git .
VOTRE_IP=$(curl -s ifconfig.me)
cat > .env << EOF
DOMAIN=
MONGO_URL=mongodb://mongo:27017
DB_NAME=downpricer
JWT_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
CORS_ORIGINS=http://$VOTRE_IP,http://localhost,http://127.0.0.1
BACKEND_PUBLIC_URL=http://$VOTRE_IP
EOF
mkdir -p nginx/ssl nginx/conf.d
# Éditer nginx/conf.d/downpricer.conf (voir contenu ci-dessus)
chmod +x deploy-docker.sh
./deploy-docker.sh
# OU
docker compose -f docker-compose.prod.yml up -d --build
ufw allow 80/tcp && ufw allow 22/tcp && ufw enable
curl http://localhost/api/health
```


