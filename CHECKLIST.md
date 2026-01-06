# Checklist de vérification - DownPricer

Cette checklist vous permet de vérifier que tout fonctionne correctement après le lancement de l'application.

## ✅ Pré-lancement

- [ ] MongoDB est démarré et accessible
- [ ] Fichier `backend/.env` créé avec toutes les variables
- [ ] Fichier `frontend/.env` créé avec `REACT_APP_BACKEND_URL`
- [ ] Dépendances backend installées (`pip install -r requirements.txt`)
- [ ] Dépendances frontend installées (`npm install`)

## ✅ Backend

- [ ] Backend démarre sans erreur (`uvicorn server:app --reload --port 8001`)
- [ ] Documentation Swagger accessible sur `http://localhost:8001/docs`
- [ ] Le dossier `backend/uploads/` existe et est accessible en écriture
- [ ] Connexion MongoDB fonctionne
- [ ] Compte administrateur créé (`python create_admin.py`)

## ✅ Frontend

- [ ] Frontend démarre sans erreur (`npm start`)
- [ ] Page d'accueil accessible sur `http://localhost:3000`
- [ ] Pas d'erreurs dans la console du navigateur
- [ ] Les appels API fonctionnent (vérifier l'onglet Network)

## ✅ Fonctionnalités principales

### Authentification
- [ ] Inscription d'un nouvel utilisateur fonctionne
- [ ] Connexion avec email/mot de passe fonctionne
- [ ] Déconnexion fonctionne
- [ ] Token JWT est stocké correctement

### Marketplace publique
- [ ] Page d'accueil affiche le catalogue
- [ ] Filtres par catégorie fonctionnent
- [ ] Recherche fonctionne
- [ ] Page de détail d'article s'affiche
- [ ] Images des articles s'affichent (ou placeholder)
- [ ] Liens externes (Vinted/Leboncoin) fonctionnent

### Demandes clients
- [ ] Formulaire de création de demande accessible
- [ ] Upload de photos fonctionne
- [ ] Création de demande avec URL d'image fonctionne
- [ ] Liste des demandes s'affiche
- [ ] Détail d'une demande s'affiche
- [ ] Annulation de demande fonctionne (quand autorisée)

### Espace vendeur
- [ ] Catalogue revendeur accessible (si rôle SELLER)
- [ ] Déclaration de vente fonctionne
- [ ] Liste des ventes s'affiche
- [ ] Statistiques s'affichent

### Mini-sites
- [ ] Création de mini-site fonctionne
- [ ] Dashboard mini-site accessible
- [ ] Page publique du mini-site accessible via slug
- [ ] Ajout d'articles au mini-site fonctionne
- [ ] Personnalisation (couleurs, polices, templates) fonctionne

### Backoffice admin
- [ ] Dashboard admin accessible (si rôle ADMIN)
- [ ] Gestion des articles fonctionne (CRUD)
- [ ] Gestion des catégories fonctionne
- [ ] Gestion des demandes fonctionne
- [ ] Gestion des ventes fonctionne
- [ ] Gestion des utilisateurs fonctionne
- [ ] Gestion des mini-sites fonctionne
- [ ] Paramètres modifiables via le panel
- [ ] Exports CSV fonctionnent

## ✅ Images et uploads

- [ ] Upload d'image via fichier fonctionne
- [ ] Upload d'image via URL fonctionne
- [ ] Images compressées en WebP
- [ ] Images accessibles via `/api/uploads/`
- [ ] Placeholder affiché si pas d'image

## ✅ Performance

- [ ] Pages se chargent rapidement (< 2s)
- [ ] Images optimisées (WebP, taille réduite)
- [ ] Pagination fonctionne
- [ ] Lazy-loading fonctionne (si implémenté)

## ✅ Responsive

- [ ] Interface fonctionne sur mobile
- [ ] Interface fonctionne sur tablette
- [ ] Interface fonctionne sur desktop

## ✅ Sécurité

- [ ] Routes protégées nécessitent authentification
- [ ] Routes admin nécessitent le rôle ADMIN
- [ ] Routes vendeur nécessitent le rôle SELLER
- [ ] CORS configuré correctement
- [ ] Mots de passe hashés (non visibles en clair dans la DB)

## ✅ Thèmes

- [ ] Thème sombre appliqué côté public/vendeur
- [ ] Thème clair appliqué côté admin

## ✅ Billing

- [ ] Mode FREE_TEST fonctionne (paiements simulés)
- [ ] Mode STRIPE_PROD affiche message si non configuré (stub)

## 🐛 Problèmes connus à vérifier

- [ ] Aucune référence à Emergent dans le code (badge, scripts)
- [ ] Chemins d'upload relatifs (pas de `/app/backend/uploads`)
- [ ] Variables d'environnement correctement chargées

## 📝 Notes

Si un élément de la checklist échoue :

1. Consultez les logs du backend (`journalctl -u downpricer-backend` en prod)
2. Consultez la console du navigateur (F12)
3. Vérifiez les variables d'environnement
4. Vérifiez la connexion MongoDB
5. Consultez la section "Dépannage" dans `RUN_LOCAL.md`

## 🚀 Prêt pour la production ?

Avant de déployer en production, assurez-vous que :

- [ ] Tous les éléments de la checklist sont validés
- [ ] `JWT_SECRET_KEY` est une clé sécurisée générée aléatoirement
- [ ] MongoDB est sécurisé (authentification activée)
- [ ] CORS est configuré avec les bons domaines
- [ ] SSL/HTTPS est configuré
- [ ] Backups MongoDB sont configurés
- [ ] Monitoring est en place (logs, alertes)

Consultez `DEPLOY_OVH.md` pour le déploiement en production.

