# Guide de dépannage - DownPricer

## Problème : "Connexion non autorisée" sur http://localhost:8001/

### Causes possibles et solutions

### 1. Le backend n'est pas démarré

**Symptôme** : Impossible d'accéder à `http://localhost:8001/` ou `http://localhost:8001/docs`

**Solution** :
```bash
cd backend
uvicorn server:app --reload --port 8001
```

Vous devriez voir :
```
INFO:     Uvicorn running on http://127.0.0.1:8001 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
```

### 2. Le fichier `.env` n'existe pas ou est mal configuré

**Symptôme** : Erreur au démarrage du backend mentionnant `MONGO_URL` ou `DB_NAME`

**Solution** :

1. Vérifiez que le fichier `backend/.env` existe :
```bash
cd backend
# Sur Windows (PowerShell)
Test-Path .env
# Sur Linux/Mac
ls -la .env
```

2. Si le fichier n'existe pas, créez-le avec ce contenu :
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=downpricer
JWT_SECRET_KEY=votre-cle-secrete-changez-moi
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
BACKEND_PUBLIC_URL=http://localhost:8001
```

3. **Important** : Remplacez `votre-cle-secrete-changez-moi` par une clé générée :
```python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. MongoDB n'est pas démarré

**Symptôme** : Erreur de connexion MongoDB au démarrage du backend

**Solution** :

#### Sur Windows :
```powershell
# Vérifier si MongoDB est installé
mongod --version

# Démarrer MongoDB (si installé en service)
net start MongoDB

# Ou démarrer manuellement
mongod --dbpath C:\data\db
```

#### Sur Linux/Mac :
```bash
# Vérifier le statut
sudo systemctl status mongod

# Démarrer MongoDB
sudo systemctl start mongod

# Ou démarrer manuellement
mongod --dbpath /path/to/data
```

#### Alternative : MongoDB Atlas (cloud)
Si vous utilisez MongoDB Atlas, vérifiez que :
- Votre IP est autorisée dans les paramètres réseau
- L'URL de connexion est correcte dans `MONGO_URL`

### 4. Le port 8001 est déjà utilisé

**Symptôme** : Erreur `Address already in use` ou `port is already in use`

**Solution** :

#### Trouver le processus qui utilise le port :
```bash
# Sur Windows (PowerShell)
netstat -ano | findstr :8001

# Sur Linux/Mac
lsof -i :8001
```

#### Tuer le processus ou utiliser un autre port :
```bash
# Option 1 : Tuer le processus (remplacez PID par le numéro trouvé)
# Sur Windows
taskkill /PID <PID> /F

# Sur Linux/Mac
kill -9 <PID>

# Option 2 : Utiliser un autre port
uvicorn server:app --reload --port 8002
# Puis mettez à jour frontend/.env avec REACT_APP_BACKEND_URL=http://localhost:8002
```

### 5. Erreur CORS (Cross-Origin Resource Sharing)

**Symptôme** : Le frontend ne peut pas appeler l'API, erreur CORS dans la console

**Solution** :

1. Vérifiez `CORS_ORIGINS` dans `backend/.env` :
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

2. Si vous utilisez un autre port pour le frontend, ajoutez-le :
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

3. Redémarrez le backend après modification

### 6. Erreur de permissions (dossier uploads)

**Symptôme** : Erreur lors de l'upload d'images

**Solution** :

```bash
cd backend
# Créer le dossier s'il n'existe pas
mkdir uploads

# Vérifier les permissions (Linux/Mac)
chmod 755 uploads
```

## Vérification étape par étape

### Étape 1 : Vérifier que MongoDB fonctionne

```bash
# Tester la connexion MongoDB
mongosh mongodb://localhost:27017
# ou
mongo mongodb://localhost:27017
```

Si ça fonctionne, vous devriez voir le prompt MongoDB.

### Étape 2 : Vérifier le fichier .env

```bash
cd backend

# Sur Windows (PowerShell)
Get-Content .env

# Sur Linux/Mac
cat .env
```

Vérifiez que toutes les variables sont présentes :
- ✅ MONGO_URL
- ✅ DB_NAME
- ✅ JWT_SECRET_KEY
- ✅ CORS_ORIGINS
- ✅ BACKEND_PUBLIC_URL

### Étape 3 : Tester le démarrage du backend

```bash
cd backend
python -c "from dotenv import load_dotenv; import os; from pathlib import Path; load_dotenv(Path('.') / '.env'); print('MONGO_URL:', os.environ.get('MONGO_URL')); print('DB_NAME:', os.environ.get('DB_NAME'))"
```

Si ça affiche les valeurs, le fichier .env est correctement chargé.

### Étape 4 : Démarrer le backend et vérifier les logs

```bash
cd backend
uvicorn server:app --reload --port 8001
```

**Messages attendus** :
- ✅ `INFO:     Uvicorn running on http://127.0.0.1:8001`
- ✅ `INFO:     Application startup complete`
- ✅ `✅ Connexion MongoDB configurée : downpricer`

**Messages d'erreur courants** :
- ❌ `MONGO_URL n'est pas défini` → Créez/modifiez `backend/.env`
- ❌ `Connection refused` → MongoDB n'est pas démarré
- ❌ `Address already in use` → Le port 8001 est occupé

### Étape 5 : Tester l'accès au backend

Ouvrez votre navigateur et allez sur :
- `http://localhost:8001/docs` → Devrait afficher la documentation Swagger
- `http://localhost:8001/api/settings/public` → Devrait retourner du JSON

## Messages d'erreur courants

### "MONGO_URL n'est pas défini"
→ Créez le fichier `backend/.env` avec toutes les variables nécessaires

### "Connection refused" ou "Cannot connect to MongoDB"
→ MongoDB n'est pas démarré. Démarrez-le avec `mongod` ou `sudo systemctl start mongod`

### "Address already in use"
→ Le port 8001 est déjà utilisé. Tuez le processus ou utilisez un autre port

### "CORS policy: No 'Access-Control-Allow-Origin' header"
→ Vérifiez `CORS_ORIGINS` dans `backend/.env` et redémarrez le backend

### "Token invalide ou expiré"
→ C'est normal pour les routes protégées. Connectez-vous d'abord via `/api/auth/login`

## Besoin d'aide supplémentaire ?

1. Vérifiez les logs du backend dans le terminal où vous l'avez lancé
2. Vérifiez la console du navigateur (F12) pour les erreurs frontend
3. Consultez `RUN_LOCAL.md` pour les instructions complètes
4. Vérifiez que tous les prérequis sont installés (Python, Node.js, MongoDB)

## Commandes utiles de diagnostic

```bash
# Vérifier la version Python
python --version

# Vérifier la version Node.js
node --version

# Vérifier si MongoDB est installé
mongod --version

# Vérifier les processus en cours
# Sur Windows
tasklist | findstr python
tasklist | findstr node

# Sur Linux/Mac
ps aux | grep python
ps aux | grep node
```
























