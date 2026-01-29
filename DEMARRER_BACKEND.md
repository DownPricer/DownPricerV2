# 🚀 Comment démarrer le backend - Guide simple

## Le problème : ERR_CONNECTION_REFUSED

Cette erreur signifie que **le backend n'est pas démarré**. Il faut le lancer dans un terminal.

## Solution en 3 étapes

### Étape 1 : Ouvrir un terminal PowerShell

Appuyez sur `Windows + X` et choisissez "Terminal" ou "PowerShell"

### Étape 2 : Aller dans le dossier backend

```powershell
cd C:\Users\ironi\Desktop\DownPricer\backend
```

### Étape 3 : Démarrer le backend

**Option A : Script automatique (le plus simple)**

Double-cliquez sur le fichier `start_backend.bat` dans le dossier `backend/`

**Option B : Commande manuelle**

```powershell
# 1. Installer les dépendances (première fois seulement)
pip install -r requirements.txt

# 2. Démarrer le serveur
python -m uvicorn server:app --reload --port 8001
```

## ✅ Vérification

Quand le backend démarre, vous devriez voir :

```
INFO:     Uvicorn running on http://127.0.0.1:8001 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
✅ Connexion MongoDB configurée : downpricer
INFO:     Application startup complete.
```

**Maintenant, vous pouvez accéder à :**
- http://localhost:8001/docs (documentation API)
- http://localhost:8001/api/settings/public (test API)

## ⚠️ Si ça ne démarre pas

### Erreur : "ModuleNotFoundError: No module named 'dotenv'"

```powershell
pip install -r requirements.txt
```

### Erreur : "MONGO_URL n'est pas défini"

Vérifiez que le fichier `backend/.env` existe et contient :

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=downpricer
JWT_SECRET_KEY=votre-cle-secrete
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
BACKEND_PUBLIC_URL=http://localhost:8001
```

### Erreur : "Connection refused" MongoDB

MongoDB n'est pas démarré. Démarrez-le :

```powershell
net start MongoDB
```

Ou installez MongoDB depuis [mongodb.com](https://www.mongodb.com/try/download/community)

## 📝 Important

**Le backend doit rester ouvert dans le terminal** pendant que vous utilisez l'application.

Pour arrêter le backend, appuyez sur `Ctrl+C` dans le terminal.

## 🎯 Prochaines étapes

Une fois le backend démarré :

1. Ouvrez un **nouveau terminal** pour le frontend
2. Allez dans `frontend/`
3. Lancez `npm start`

Consultez **[QUICK_START.md](QUICK_START.md)** pour le guide complet.























