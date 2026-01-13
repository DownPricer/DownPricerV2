# 🚨 FIX IMMÉDIAT : Signup "Not Found"

## ❌ PROBLÈME
Le code est correct mais le frontend sur le VPS n'a pas été rebuildé avec les nouvelles modifications.

## ✅ SOLUTION RAPIDE (5 minutes)

### Sur le VPS - Exécutez ces commandes dans l'ordre :

```bash
ssh ubuntu@51.210.179.212
sudo -i
cd /opt/downpricer

# Étape 1 : Mettre à jour le code depuis GitHub
git pull

# Étape 2 : Forcer le rebuild complet du frontend (SANS CACHE)
docker compose -f docker-compose.prod.yml stop frontend
docker compose -f docker-compose.prod.yml rm -f frontend
docker rmi downpricer-frontend:latest 2>/dev/null || true

# Étape 3 : Rebuild avec --no-cache pour être sûr
docker compose -f docker-compose.prod.yml build --no-cache frontend

# Étape 4 : Redémarrer le frontend
docker compose -f docker-compose.prod.yml up -d frontend

# Étape 5 : Attendre que le build se termine (2-3 minutes)
echo "⏳ Attente du build (2-3 minutes)..."
docker compose -f docker-compose.prod.yml logs -f frontend
```

**Appuyez sur `Ctrl+C` quand vous voyez** :
```
Entrypoint script completed
```

**Ou** attendez 2-3 minutes puis vérifiez :
```bash
docker compose -f docker-compose.prod.yml logs frontend | tail -10
```

---

## ✅ VÉRIFICATION

### Test 1 : Vérifier que le build est terminé

```bash
docker compose -f docker-compose.prod.yml ps frontend
# Doit afficher "Up" (pas "Up (health: starting)")
```

### Test 2 : Vérifier que le nouveau code est bien compilé

```bash
# Vérifier un fichier JS compilé
docker compose -f docker-compose.prod.yml exec nginx cat /usr/share/nginx/html/static/js/main.*.js | grep -o "auth/signup" | head -1

# Si ça affiche "auth/signup" → Le code est bien compilé ✅
# Si rien → Le build n'est pas bon ❌
```

### Test 3 : Test depuis votre PC

1. Ouvrir `http://51.210.179.212/signup`
2. Ouvrir la console développeur (F12)
3. Onglet **Network**
4. Remplir le formulaire et cliquer "Créer mon compte"
5. **Vérifier la requête** :
   - ✅ URL : `POST http://51.210.179.212/api/auth/signup` (PAS `/api/api/auth/signup`)
   - ✅ Status : `200 OK`
   - ✅ Response : `{"token": "...", "user": {...}}`

---

## 🔧 SI ÇA NE MARCHE TOUJOURS PAS

### Option A : Rebuild complet de tout

```bash
cd /opt/downpricer

# Arrêter tout
docker compose -f docker-compose.prod.yml down

# Rebuild tout sans cache
docker compose -f docker-compose.prod.yml build --no-cache

# Redémarrer
docker compose -f docker-compose.prod.yml up -d

# Attendre 30 secondes
sleep 30

# Vérifier
docker ps
docker compose -f docker-compose.prod.yml logs --tail=50
```

### Option B : Vérifier que le backend fonctionne

```bash
# Test direct backend
curl -X POST http://localhost/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test'$(date +%s)'@test.com","password":"test123","first_name":"Test","last_name":"User","phone":""}'

# Si ça retourne 200 avec un token → Backend OK ✅
# Si ça retourne 404 → Problème backend ❌
```

### Option C : Vérifier Nginx

```bash
# Test depuis Nginx vers Backend
docker exec downpricer-nginx wget -q -O- http://backend:8001/api/health

# Si ça retourne {"status":"ok"} → Nginx peut joindre le backend ✅
# Sinon → Problème réseau Docker ❌
```

---

## 🎯 CHECKLIST FINALE

- ✅ Code mis à jour : `git pull`
- ✅ Frontend rebuildé : `docker compose build --no-cache frontend`
- ✅ Frontend démarré : `docker compose ps frontend` → "Up"
- ✅ Test backend direct : `curl ... /api/auth/signup` → 200 OK
- ✅ Test depuis navigateur : Console Network → `/api/auth/signup` (pas `/api/api/...`)

---

## 📞 SI RIEN NE FONCTIONNE

Exécutez ce script de diagnostic complet :

```bash
cd /opt/downpricer
chmod +x test-signup-vps.sh
./test-signup-vps.sh
```

**Puis envoyez-moi la sortie complète** pour que je puisse diagnostiquer précisément.

---

**Cette solution devrait résoudre le problème dans 95% des cas** ✅



