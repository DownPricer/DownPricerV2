# Guide de lancement local - DownPricer

Ce guide vous explique comment lancer l'application DownPricer en local sur votre machine.

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** (version 18 ou supérieure) et **npm** ou **yarn**
- **Python** (version 3.9 ou supérieure) et **pip**
- **MongoDB** (version 5.0 ou supérieure) - en local ou via MongoDB Atlas

### Vérification des prérequis

```bash
node --version
npm --version
python --version
pip --version
mongod --version  # Si MongoDB est installé localement
```

## Configuration

### 1. Configuration du Backend

Créez un fichier `.env` dans le dossier `backend/` avec le contenu suivant :

```env
# Configuration MongoDB
MONGO_URL=mongodb://localhost:27017
DB_NAME=downpricer

# JWT Secret Key (générez une clé sécurisée)
JWT_SECRET_KEY=your-secret-key-change-in-production

# CORS Origins (séparés par des virgules)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# URL publique du backend (pour les URLs d'images)
BACKEND_PUBLIC_URL=http://localhost:8001
```

**Note importante** : Remplacez `your-secret-key-change-in-production` par une clé secrète générée aléatoirement. Vous pouvez en générer une avec :

```python
import secrets
print(secrets.token_urlsafe(32))
```

### 2. Configuration du Frontend

Créez un fichier `.env` dans le dossier `frontend/` avec le contenu suivant :

```env
# URL du backend API
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Installation des dépendances

### Backend

```bash
cd backend
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
# ou
yarn install
```

## Lancement de l'application

### 1. Démarrer MongoDB

Si MongoDB est installé localement :

```bash
# Sur Windows (PowerShell)
mongod

# Sur Linux/Mac
sudo systemctl start mongod
# ou
mongod --dbpath /path/to/data
```

Si vous utilisez MongoDB Atlas, assurez-vous que votre URL de connexion est correcte dans le fichier `.env` du backend.

### 2. Démarrer le Backend

```bash
cd backend
uvicorn server:app --reload --port 8001
```

Le backend sera accessible sur `http://localhost:8001`

Vous pouvez vérifier que le backend fonctionne en visitant `http://localhost:8001/docs` (documentation Swagger automatique).

### 3. Démarrer le Frontend

Dans un nouveau terminal :

```bash
cd frontend
npm start
# ou
yarn start
```

Le frontend sera accessible sur `http://localhost:3000`

## Création d'un compte administrateur

Par défaut, aucun compte administrateur n'existe. Pour créer un admin, vous avez plusieurs options :

### Option 1 : Via MongoDB directement

1. Connectez-vous à MongoDB :
```bash
mongosh mongodb://localhost:27017/downpricer
```

2. Créez un utilisateur avec le rôle ADMIN :
```javascript
db.users.insertOne({
  id: "admin-001",
  email: "admin@downpricer.com",
  password_hash: "$2b$12$...", // Hash bcrypt du mot de passe
  first_name: "Admin",
  last_name: "User",
  roles: ["ADMIN", "CLIENT"],
  created_at: new Date().toISOString()
})
```

Pour générer le hash du mot de passe, utilisez Python :

```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
print(pwd_context.hash("votre-mot-de-passe"))
```

### Option 2 : Via l'API (après création d'un compte normal)

1. Créez un compte normal via l'interface d'inscription
2. Connectez-vous à MongoDB et ajoutez le rôle ADMIN :
```javascript
db.users.updateOne(
  { email: "votre-email@example.com" },
  { $set: { roles: ["ADMIN", "CLIENT"] } }
)
```

### Option 3 : Script Python (recommandé)

Créez un fichier `backend/create_admin.py` :

```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from auth import get_password_hash
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def create_admin():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    email = input("Email de l'admin: ")
    password = input("Mot de passe: ")
    first_name = input("Prénom: ")
    last_name = input("Nom: ")
    
    existing = await db.users.find_one({"email": email})
    if existing:
        print(f"L'utilisateur {email} existe déjà.")
        response = input("Voulez-vous lui ajouter le rôle ADMIN? (o/n): ")
        if response.lower() == 'o':
            await db.users.update_one(
                {"email": email},
                {"$set": {"roles": ["ADMIN", "CLIENT"]}}
            )
            print("Rôle ADMIN ajouté avec succès!")
        return
    
    user_doc = {
        "id": f"admin-{email.split('@')[0]}",
        "email": email,
        "password_hash": get_password_hash(password),
        "first_name": first_name,
        "last_name": last_name,
        "roles": ["ADMIN", "CLIENT"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    print(f"Admin créé avec succès: {email}")
    client.close()

if __name__ == "__main__":
    from datetime import datetime, timezone
    asyncio.run(create_admin())
```

Puis exécutez :

```bash
cd backend
python create_admin.py
```

## Vérification que tout fonctionne

1. **Backend** : Visitez `http://localhost:8001/docs` - vous devriez voir la documentation Swagger
2. **Frontend** : Visitez `http://localhost:3000` - vous devriez voir la page d'accueil
3. **Connexion** : Connectez-vous avec votre compte admin
4. **Test des fonctionnalités** :
   - ✅ Catalogue d'articles
   - ✅ Création de demande
   - ✅ Espace vendeur
   - ✅ Mini-site
   - ✅ Panel admin

## Dépannage

### ⚠️ Problème : "Connexion non autorisée" sur http://localhost:8001/

Si vous voyez ce message, consultez le guide complet de dépannage : **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

**Solutions rapides** :

1. **Vérifiez que le backend est démarré** :
   ```bash
   cd backend
   uvicorn server:app --reload --port 8001
   ```

2. **Vérifiez que le fichier `.env` existe** dans `backend/` avec toutes les variables :
   ```env
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=downpricer
   JWT_SECRET_KEY=votre-cle-secrete
   CORS_ORIGINS=http://localhost:3000
   BACKEND_PUBLIC_URL=http://localhost:8001
   ```

3. **Vérifiez que MongoDB est démarré** :
   ```bash
   # Sur Windows
   net start MongoDB
   # ou
   mongod
   
   # Sur Linux/Mac
   sudo systemctl start mongod
   ```

### Autres problèmes courants

### Le backend ne démarre pas

- Vérifiez que MongoDB est bien démarré
- Vérifiez que le fichier `.env` existe dans `backend/` et contient toutes les variables
- Vérifiez que le port 8001 n'est pas déjà utilisé
- Consultez les messages d'erreur dans le terminal - ils indiquent maintenant clairement ce qui manque

### Le frontend ne peut pas se connecter au backend

- Vérifiez que `REACT_APP_BACKEND_URL` dans `frontend/.env` pointe vers `http://localhost:8001`
- Vérifiez que le backend est bien démarré (vous devriez voir `INFO: Uvicorn running`)
- Vérifiez les erreurs CORS dans la console du navigateur
- Vérifiez que `CORS_ORIGINS` dans `backend/.env` contient `http://localhost:3000`

### Les images ne s'affichent pas

- Vérifiez que le dossier `backend/uploads/` existe
- Vérifiez que `BACKEND_PUBLIC_URL` dans `backend/.env` est correct
- Vérifiez que les images sont bien servies sur `http://localhost:8001/api/uploads/`

### Erreur de connexion MongoDB

- Vérifiez que MongoDB est démarré
- Vérifiez que `MONGO_URL` dans `backend/.env` est correct
- Si vous utilisez MongoDB Atlas, vérifiez que votre IP est autorisée

**Pour plus de détails, consultez [TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

## Structure des dossiers

```
DownPricer/
├── backend/
│   ├── .env                    # Configuration (à créer)
│   ├── server.py               # Serveur FastAPI
│   ├── requirements.txt        # Dépendances Python
│   ├── uploads/                # Images uploadées
│   └── ...
├── frontend/
│   ├── .env                    # Configuration (à créer)
│   ├── package.json            # Dépendances Node
│   ├── src/                    # Code source React
│   └── ...
└── README.md
```

## Commandes utiles

### Backend

```bash
# Démarrer en mode développement (avec rechargement automatique)
uvicorn server:app --reload --port 8001

# Démarrer en mode production
uvicorn server:app --host 0.0.0.0 --port 8001

# Vérifier les erreurs de syntaxe
python -m py_compile server.py
```

### Frontend

```bash
# Démarrer en mode développement
npm start

# Build pour la production
npm run build

# Tester le build localement
npm install -g serve
serve -s build
```

## Prochaines étapes

Une fois que l'application fonctionne en local, vous pouvez :

1. Consulter `DEPLOY_OVH.md` pour déployer sur OVH
2. Configurer Stripe (actuellement en mode FREE_TEST)
3. Personnaliser les paramètres via le panel admin

