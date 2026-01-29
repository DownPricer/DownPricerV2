# Démarrage rapide - DownPricer

## 🚀 Démarrage en 3 étapes

### Étape 1 : Vérifier MongoDB

**Sur Windows** :
```powershell
# Vérifier si MongoDB est installé
mongod --version

# Si installé, démarrer MongoDB
net start MongoDB
```

Si MongoDB n'est pas installé, vous pouvez :
- L'installer depuis [mongodb.com](https://www.mongodb.com/try/download/community)
- Ou utiliser MongoDB Atlas (gratuit) : [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

### Étape 2 : Configurer le backend

**Option A : Script automatique (recommandé)**

Double-cliquez sur `backend/start_backend.bat` ou exécutez :
```powershell
cd backend
.\start_backend.ps1
```

**Option B : Manuel**

1. Créez le fichier `backend/.env` :
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=downpricer
JWT_SECRET_KEY=votre-cle-secrete-ici
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
BACKEND_PUBLIC_URL=http://localhost:8001
```

2. Générez une clé secrète JWT :
```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

3. Remplacez `votre-cle-secrete-ici` par la clé générée

4. Installez les dépendances :
```powershell
cd backend
pip install -r requirements.txt
```

5. Démarrez le backend :
```powershell
uvicorn server:app --reload --port 8001
```

### Étape 3 : Démarrer le frontend

Dans un **nouveau terminal** :

```powershell
cd frontend

# Créer le fichier .env si nécessaire
if (-not (Test-Path .env)) {
    "REACT_APP_BACKEND_URL=http://localhost:8001" | Out-File -FilePath .env -Encoding utf8
}

# Installer les dépendances (première fois seulement)
npm install

# Démarrer le frontend
npm start
```

## ✅ Vérification

Une fois démarré, vous devriez pouvoir accéder à :

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:8001/docs (documentation Swagger)

## ❌ Problème : ERR_CONNECTION_REFUSED

Si vous voyez "ERR_CONNECTION_REFUSED" sur `http://localhost:8001`, cela signifie que **le backend n'est pas démarré**.

### Solution rapide :

1. **Ouvrez un terminal PowerShell**
2. **Allez dans le dossier backend** :
   ```powershell
   cd C:\Users\ironi\Desktop\DownPricer\backend
   ```
3. **Vérifiez que le fichier .env existe** :
   ```powershell
   Test-Path .env
   ```
4. **Si le fichier n'existe pas, créez-le** :
   ```powershell
   @"
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=downpricer
   JWT_SECRET_KEY=changez-moi-generer-une-cle
   CORS_ORIGINS=http://localhost:3000
   BACKEND_PUBLIC_URL=http://localhost:8001
   "@ | Out-File -FilePath .env -Encoding utf8
   ```
5. **Démarrez le backend** :
   ```powershell
   python -m uvicorn server:app --reload --port 8001
   ```

Vous devriez voir :
```
INFO:     Uvicorn running on http://127.0.0.1:8001
INFO:     Application startup complete
```

## 📝 Commandes utiles

### Vérifier si le backend tourne

```powershell
netstat -ano | findstr :8001
```

Si rien n'apparaît, le backend n'est pas démarré.

### Arrêter le backend

Dans le terminal où il tourne, appuyez sur `Ctrl+C`

### Vérifier MongoDB

```powershell
mongosh mongodb://localhost:27017
```

Si ça fonctionne, vous verrez le prompt MongoDB.

## 🔧 Besoin d'aide ?

Consultez :
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** pour les problèmes détaillés
- **[RUN_LOCAL.md](RUN_LOCAL.md)** pour le guide complet























