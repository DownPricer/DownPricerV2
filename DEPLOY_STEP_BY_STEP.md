# 📝 Déploiement étape par étape - DownPricer

## 🎯 Objectif

Déployer DownPricer sur votre VPS OVH en suivant mes instructions une par une.

---

## 📋 Étape 0 : Connexion au VPS

### Sur Windows (PowerShell) :

```powershell
ssh root@VOTRE_IP
```

Remplacez `VOTRE_IP` par l'IP de votre VPS (vous la trouverez dans votre espace client OVH).

**Si c'est la première connexion**, vous devrez accepter la clé SSH (tapez `yes`).

**Entrez votre mot de passe root** (celui que vous avez configuré lors de la commande du VPS).

---

## ✅ Une fois connecté, dites-moi :

**"Je suis connecté, que dois-je faire maintenant ?"**

Et je vous donnerai la prochaine commande à exécuter.

---

## 📝 Ce que je vais vous faire faire

1. ✅ Mise à jour du système
2. ✅ Installation de Python, Node.js, MongoDB, Nginx
3. ✅ Configuration de MongoDB
4. ✅ Transfert de votre code sur le VPS
5. ✅ Configuration du backend (variables d'environnement)
6. ✅ Build du frontend
7. ✅ Configuration Nginx (reverse proxy)
8. ✅ Configuration SSL (HTTPS)
9. ✅ Création du service systemd (démarrage automatique)
10. ✅ Création d'un compte admin

**Tout ça, une commande à la fois, avec mes explications !**

---

## 🚀 Prêt ?

**Connectez-vous à votre VPS et dites-moi :**

**"Je suis connecté, que dois-je faire maintenant ?"**

Et on commence ! 🎉





