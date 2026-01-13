# 🚀 Guide Ultra-Simple - Faire fonctionner DownPricer

## Objectif : Voir le frontend fonctionner en 5 minutes

---

## ÉTAPE 1 : Démarrer MongoDB

**Ouvrez un terminal PowerShell** (Windows + X → Terminal)

```powershell
# Vérifier si MongoDB est installé
mongod --version
```

### Si MongoDB n'est PAS installé :

**Option A : Installer MongoDB localement**
1. Téléchargez depuis : https://www.mongodb.com/try/download/community
2. Installez-le
3. Redémarrez votre terminal

**Option B : Utiliser MongoDB Atlas (gratuit, recommandé)**
1. Allez sur https://www.mongodb.com/cloud/atlas/register
2. Créez un compte gratuit
3. Créez un cluster gratuit (M0)
4. Cliquez sur "Connect" → "Connect your application"
5. Copiez la connection string (elle ressemble à : `mongodb+srv://...`)

---

## ÉTAPE 2 : Configurer le Backend

**Dans le même terminal PowerShell :**

```powershell
cd C:\Users\ironi\Desktop\DownPricer\backend
```

### Créer le fichier .env

**Copiez-collez cette commande complète :**

```powershell
@"
MONGO_URL=mongodb://localhost:27017
DB_NAME=downpricer
JWT_SECRET_KEY=ma-cle-secrete-12345678901234567890
CORS_ORIGINS=http://localhost:3000
BACKEND_PUBLIC_URL=http://localhost:8001
"@ | Out-File -FilePath .env -Encoding utf8
```

**Si vous utilisez MongoDB Atlas**, remplacez la première ligne par votre connection string :
```powershell
@"
MONGO_URL=mongodb+srv://votre-username:votre-password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=downpricer
JWT_SECRET_KEY=ma-cle-secrete-12345678901234567890
CORS_ORIGINS=http://localhost:3000
BACKEND_PUBLIC_URL=http://localhost:8001
"@ | Out-File -FilePath .env -Encoding utf8
```

### Installer les dépendances Python

```powershell
pip install -r requirements.txt
```

**Attendez que ça finisse** (peut prendre 1-2 minutes)

### Démarrer le backend

```powershell
python -m uvicorn server:app --reload --port 8001
```

**✅ Vous devriez voir :**
```
INFO:     Uvicorn running on http://127.0.0.1:8001
INFO:     Application startup complete
```

**⚠️ IMPORTANT : Laissez ce terminal ouvert !** Ne le fermez pas.

---

## ÉTAPE 3 : Démarrer le Frontend

**Ouvrez un NOUVEAU terminal PowerShell** (Windows + X → Terminal)

```powershell
cd C:\Users\ironi\Desktop\DownPricer\frontend
```

### Créer le fichier .env

```powershell
"REACT_APP_BACKEND_URL=http://localhost:8001" | Out-File -FilePath .env -Encoding utf8
```

### Installer les dépendances Node

```powershell
npm install
```

**Attendez que ça finisse** (peut prendre 2-3 minutes)

### Démarrer le frontend

```powershell
npm start
```

**✅ Votre navigateur devrait s'ouvrir automatiquement sur http://localhost:3000**

---

## ✅ Vérification

Vous devriez maintenant avoir :

1. **Terminal 1** : Backend qui tourne (http://localhost:8001)
2. **Terminal 2** : Frontend qui tourne (http://localhost:3000)
3. **Navigateur** : Page DownPricer qui s'affiche

---

## 🎯 Créer un compte admin (optionnel)

**Dans un NOUVEAU terminal :**

```powershell
cd C:\Users\ironi\Desktop\DownPricer\backend
python create_admin.py
```

Suivez les instructions à l'écran.

---

## ❌ Si ça ne marche pas

### Erreur : "mongod : command not found"
→ MongoDB n'est pas installé. Utilisez MongoDB Atlas (Option B de l'ÉTAPE 1)

### Erreur : "ModuleNotFoundError"
→ Dans le terminal backend, faites : `pip install -r requirements.txt`

### Erreur : "Port 8001 already in use"
→ Un autre programme utilise le port. Fermez-le ou changez le port :
```powershell
python -m uvicorn server:app --reload --port 8002
```
Puis changez `REACT_APP_BACKEND_URL=http://localhost:8002` dans `frontend/.env`

### Le frontend ne se connecte pas au backend
→ Vérifiez que le backend tourne toujours dans le Terminal 1

---

## 🚀 Une fois que ça marche localement

Consultez **[DEPLOY_OVH.md](DEPLOY_OVH.md)** pour déployer sur votre VPS OVH.

Le déploiement sur OVH sera beaucoup plus simple une fois que vous avez vu que ça fonctionne en local !

---

## 📝 Résumé des commandes (copier-coller)

### Terminal 1 - Backend
```powershell
cd C:\Users\ironi\Desktop\DownPricer\backend
@"
MONGO_URL=mongodb://localhost:27017
DB_NAME=downpricer
JWT_SECRET_KEY=ma-cle-secrete-12345678901234567890
CORS_ORIGINS=http://localhost:3000
BACKEND_PUBLIC_URL=http://localhost:8001
"@ | Out-File -FilePath .env -Encoding utf8
pip install -r requirements.txt
python -m uvicorn server:app --reload --port 8001
```

### Terminal 2 - Frontend
```powershell
cd C:\Users\ironi\Desktop\DownPricer\frontend
"REACT_APP_BACKEND_URL=http://localhost:8001" | Out-File -FilePath .env -Encoding utf8
npm install
npm start
```

**C'est tout !** 🎉









