# 📋 Résumé : Déploiement DownPricer avec IP (sans domaine)

## ✅ Checklist complète

### ÉTAPE 1 : GitHub (local dans Cursor)

- [ ] **Vérifier .gitignore** : ignore `node_modules/`, `venv/`, `*.env`, `backend/uploads/*`, `frontend/build/`
- [ ] **Initialiser Git** : `git init && git branch -M main`
- [ ] **Créer repo GitHub** : https://github.com/new (public ou private)
- [ ] **Générer Personal Access Token** : GitHub → Settings → Developer settings → Personal access tokens → Generate (scope: `repo`)
- [ ] **Premier commit** : `git add . && git commit -m "Initial commit"`
- [ ] **Push** : `git remote add origin https://USERNAME:TOKEN@github.com/USERNAME/downpricer.git && git push -u origin main`

### ÉTAPE 2 : VPS (SSH root@IP)

- [ ] **Installer Docker** : `curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh && rm get-docker.sh`
- [ ] **Installer Docker Compose** : `apt install -y docker-compose-plugin`
- [ ] **Cloner repo** : `mkdir -p /opt/downpricer && cd /opt/downpricer && git clone https://USERNAME:TOKEN@github.com/USERNAME/downpricer.git .`
- [ ] **Créer .env avec IP** : (voir commande ci-dessous)
- [ ] **Configurer Nginx pour IP** : `cp nginx/conf.d/downpricer-ip.conf nginx/conf.d/downpricer.conf`
- [ ] **Lancer déploiement** : `docker compose -f docker-compose.prod.yml up -d --build`
- [ ] **Ouvrir port 80** : `ufw allow 80/tcp && ufw enable`
- [ ] **Tester** : `curl http://localhost/api/health` → doit retourner `{"status":"ok"}`

---

## 🔴 Commandes exactes (copier-coller)

### Sur le VPS (une fois connecté en SSH)

```bash
# 1. Installation Docker
apt update && apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh && rm get-docker.sh
systemctl enable docker && systemctl start docker
apt install -y docker-compose-plugin

# 2. Cloner le repo (REMPLACER USERNAME et TOKEN)
mkdir -p /opt/downpricer && cd /opt/downpricer
git clone https://USERNAME:TOKEN@github.com/USERNAME/downpricer.git .

# 3. Créer .env avec IP
VOTRE_IP=$(curl -s ifconfig.me)
cat > .env << EOF
DOMAIN=
MONGO_URL=mongodb://mongo:27017
DB_NAME=downpricer
JWT_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
CORS_ORIGINS=http://$VOTRE_IP,http://localhost,http://127.0.0.1
BACKEND_PUBLIC_URL=http://$VOTRE_IP
EOF

# 4. Configurer Nginx pour IP
cp nginx/conf.d/downpricer-ip.conf nginx/conf.d/downpricer.conf
mkdir -p nginx/ssl nginx/conf.d

# 5. Lancer le déploiement
docker compose -f docker-compose.prod.yml up -d --build

# 6. Ouvrir le firewall
ufw allow 22/tcp && ufw allow 80/tcp && ufw --force enable

# 7. Tests
curl http://localhost/api/health
echo "IP du VPS: $VOTRE_IP"
echo "Accéder au site: http://$VOTRE_IP"
```

---

## 📝 Exemple de .env généré

```env
DOMAIN=
MONGO_URL=mongodb://mongo:27017
DB_NAME=downpricer
JWT_SECRET_KEY=hLrfFE4an6_TxlDomRdcYDZ4w6F6jdBIkiAVEU0s6XQ
CORS_ORIGINS=http://51.38.123.45,http://localhost,http://127.0.0.1
BACKEND_PUBLIC_URL=http://51.38.123.45
```

**⚠️ Remplacez `51.38.123.45` par votre IP réelle**

---

## 🔍 Troubleshooting

### Voir les logs
```bash
docker compose -f docker-compose.prod.yml logs -f [service]
```

### Vérifier les conteneurs
```bash
docker ps -a
docker compose -f docker-compose.prod.yml ps
```

### Vérifier les ports
```bash
netstat -tlnp | grep :80
ufw status
```

### Redémarrer un service
```bash
docker compose -f docker-compose.prod.yml restart [service]
```

### Rebuild complet
```bash
cd /opt/downpricer
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 📚 Documentation créée

- **GUIDE_GITHUB_VPS.md** : Guide complet GitHub → VPS
- **COMMANDES_VPS.md** : Commandes exactes pour le VPS
- **nginx/conf.d/downpricer-ip.conf** : Config Nginx pour IP
- **backend/env.ip.example** : Exemple .env pour mode IP

---

## ✅ Résultat attendu

- ✅ Site accessible sur `http://VOTRE_IP`
- ✅ API accessible sur `http://VOTRE_IP/api`
- ✅ Health check : `http://VOTRE_IP/api/health` → `{"status":"ok"}`
- ✅ Pas d'erreurs CORS dans le navigateur
- ✅ Images uploadées accessibles

---

## 🔴 Points d'attention

1. **Personal Access Token** : Ne pas le commiter dans le repo
2. **.env** : Ne jamais commiter (déjà dans .gitignore)
3. **IP** : Utiliser `curl -s ifconfig.me` pour détecter automatiquement
4. **Firewall** : Ouvrir le port 80 avant de tester
5. **Nginx** : Utiliser `server_name _` pour accepter toutes les requêtes

---

## 🎯 Prochaines étapes (quand vous aurez un domaine)

1. Configurer le DNS (A record vers l'IP)
2. Modifier `.env` : remplacer IP par domaine
3. Modifier `nginx/conf.d/downpricer.conf` : utiliser `server_name downpricer.com`
4. Installer SSL avec certbot
5. Redémarrer nginx

**Mais pour l'instant, tout fonctionne en HTTP avec l'IP ! ✅**


