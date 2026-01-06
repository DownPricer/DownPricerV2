# DownPricer

Application web full-stack de marketplace avec système de demandes clients, espace vendeur, mini-sites personnalisables et backoffice administrateur.

## 🚀 Démarrage rapide

**Pour démarrer rapidement :**
1. **Double-cliquez sur `start_all.bat`** (le plus simple !)
2. Ou consultez **[GUIDE_SIMPLE.md](GUIDE_SIMPLE.md)** pour les instructions étape par étape

**Pour déployer sur OVH :** Consultez **[DEPLOY_OVH.md](DEPLOY_OVH.md)**

## 🚀 Fonctionnalités

### Marketplace publique
- Catalogue d'articles avec filtres et recherche
- Détails d'articles avec photos, prix, remises
- Liens externes (Vinted, Leboncoin)
- Option remise en main propre

### Système de demandes clients
- Formulaire de demande avec upload de photos ou URLs
- Suivi des demandes avec statuts
- Annulation verrouillée après proposition trouvée
- Gestion des acomptes et paiements

### Espace vendeur
- Catalogue revendeur
- Workflow de ventes (déclaration → validation → paiement → expédition)
- Statistiques de ventes
- Gestion des paiements en attente

### Mini-sites
- Création de pages publiques personnalisables
- Plans tarifaires (1€ / 10€ / 15€)
- Templates, polices et couleurs personnalisables
- Dashboard et statistiques
- Option d'affichage dans le catalogue revendeur (plan 10€+)

### Backoffice administrateur
- Gestion complète (articles, catégories, demandes, ventes, paiements, expéditions)
- Gestion des mini-sites et abonnements
- Gestion des utilisateurs
- Paramètres configurables
- Exports CSV

## 🛠️ Stack technique

- **Backend** : FastAPI (Python)
- **Frontend** : React + TailwindCSS
- **Base de données** : MongoDB
- **Authentification** : JWT
- **Paiements** : Stripe (stub prêt, intégration réelle à venir)

## 📋 Prérequis

- Node.js 18+ et npm/yarn
- Python 3.9+ et pip
- MongoDB 5.0+ (local ou Atlas)

## 🚀 Démarrage rapide

### 1. Cloner le projet

```bash
git clone https://github.com/votre-repo/downpricer.git
cd downpricer
```

### 2. Configuration Backend

```bash
cd backend
cp .env.example .env  # Créez votre fichier .env
# Éditez .env avec vos paramètres MongoDB
pip install -r requirements.txt
```

### 3. Configuration Frontend

```bash
cd frontend
cp .env.example .env  # Créez votre fichier .env
# Éditez .env avec l'URL du backend
npm install
```

### 4. Démarrer l'application

**Terminal 1 - Backend** :
```bash
cd backend
uvicorn server:app --reload --port 8001
```

**Terminal 2 - Frontend** :
```bash
cd frontend
npm start
```

L'application sera accessible sur `http://localhost:3000`

### 5. Créer un compte administrateur

```bash
cd backend
python create_admin.py
```

## 📚 Documentation

- **[RUN_LOCAL.md](RUN_LOCAL.md)** : Guide complet pour lancer l'application en local
- **[DEPLOY_OVH.md](DEPLOY_OVH.md)** : Guide de déploiement sur OVH

## 🔧 Configuration

### Variables d'environnement Backend

Voir `backend/.env.example` pour la liste complète. Principales variables :

- `MONGO_URL` : URL de connexion MongoDB
- `DB_NAME` : Nom de la base de données
- `JWT_SECRET_KEY` : Clé secrète pour les tokens JWT
- `CORS_ORIGINS` : Origines autorisées (séparées par des virgules)
- `BACKEND_PUBLIC_URL` : URL publique du backend (pour les images)

### Variables d'environnement Frontend

Voir `frontend/.env.example` pour la liste complète. Principales variables :

- `REACT_APP_BACKEND_URL` : URL du backend API

## 🏗️ Structure du projet

```
DownPricer/
├── backend/              # API FastAPI
│   ├── server.py        # Serveur principal
│   ├── models.py        # Modèles Pydantic
│   ├── auth.py          # Authentification JWT
│   ├── dependencies.py  # Dépendances FastAPI
│   ├── billing_provider.py  # Gestion des paiements
│   ├── create_admin.py  # Script création admin
│   ├── uploads/         # Images uploadées
│   └── requirements.txt
├── frontend/            # Application React
│   ├── src/
│   │   ├── pages/       # Pages de l'application
│   │   ├── components/  # Composants réutilisables
│   │   └── utils/       # Utilitaires (API, auth)
│   ├── public/
│   └── package.json
├── RUN_LOCAL.md         # Guide lancement local
├── DEPLOY_OVH.md       # Guide déploiement OVH
└── README.md           # Ce fichier
```

## 🎨 Thèmes

- **Public/Vendeur** : Thème sombre (noir/orange/rouge)
- **Admin** : Thème clair (bleu/blanc)

## 💳 Modes de facturation

- **FREE_TEST** : Mode gratuit simulé (par défaut)
- **STRIPE_PROD** : Mode Stripe (stub prêt, intégration réelle à venir)

## 🔒 Sécurité

- Authentification JWT
- Hash des mots de passe avec bcrypt
- CORS configurable
- Validation des données avec Pydantic
- Gestion des rôles et permissions

## 📝 Notes importantes

- Le projet est maintenant **100% autonome**, sans dépendance à Emergent
- Les images sont automatiquement compressées en WebP
- Support upload fichier OU URL externe pour toutes les images
- Placeholder automatique si pas d'image
- Optimisations mobile-first avec pagination et lazy-loading

## 🐛 Dépannage

Consultez la section "Dépannage" dans [RUN_LOCAL.md](RUN_LOCAL.md) pour les problèmes courants.

## 📄 Licence

[À définir]

## 👥 Contribution

[À définir]
