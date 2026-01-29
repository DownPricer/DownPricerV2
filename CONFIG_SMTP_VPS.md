# 🔐 Configuration SMTP sur le VPS

## ⚠️ IMPORTANT : SÉCURITÉ

**NE JAMAIS** :
- ❌ Commiter le fichier `.env` avec le mot de passe
- ❌ Partager le mot de passe publiquement
- ❌ Le mettre dans un fichier versionné

**Le fichier `.env` est déjà dans `.gitignore`** - vous êtes protégé ✅

---

## 🚀 CONFIGURATION SUR LE VPS

### 1. Se connecter au VPS

```bash
ssh ubuntu@51.210.179.212
sudo -i
cd /opt/downpricer
```

### 2. Éditer le fichier .env du backend

```bash
nano backend/.env
```

### 3. Ajouter/Modifier les variables SMTP

Ajoutez ou modifiez ces lignes dans le fichier `.env` :

```bash
# SMTP Configuration (OVH Zimbra)
SMTP_HOST=smtp.mail.ovh.net
SMTP_PORT=587
SMTP_USER=noreply@downpricer.com
SMTP_PASS=qZqt6Zm!!g4JTNh
SMTP_FROM=noreply@downpricer.com
SMTP_TLS_MODE=starttls

# Email notifications (désactivé par défaut, activable depuis l'admin)
EMAIL_NOTIF_ENABLED=false
ADMIN_NOTIF_EMAIL=contact@downpricer.com
```

**Actions dans nano** :
- Pour sauvegarder : `Ctrl + O` puis `Enter`
- Pour quitter : `Ctrl + X`

### 4. Redémarrer le backend

```bash
cd /opt/downpricer
docker compose -f docker-compose.prod.yml restart backend

# Vérifier que ça a redémarré
docker compose -f docker-compose.prod.yml ps backend
```

### 5. Vérifier les logs (optionnel)

```bash
docker compose -f docker-compose.prod.yml logs backend | tail -20
```

**Résultat attendu** : Pas d'erreur, le backend démarre normalement.

---

## 🧪 TESTER LA CONFIGURATION

### Option 1 : Depuis l'admin UI (recommandé)

1. **Se connecter** : http://51.210.179.212
2. **Login Admin**
3. **Aller dans** : Admin > Paramètres > Onglet "Notifications email"
4. **Activer** le toggle "Activer les notifications email"
5. **Configurer** l'email admin (ex: contact@downpricer.com)
6. **Cliquer** sur "Envoyer un email de test"
7. **Vérifier** : Email reçu ✅

### Option 2 : Test rapide depuis le VPS (pour diagnostiquer)

```bash
# Tester la connexion SMTP manuellement
docker compose -f docker-compose.prod.yml exec backend python3 -c "
import smtplib
try:
    server = smtplib.SMTP('smtp.mail.ovh.net', 587)
    server.starttls()
    server.login('noreply@downpricer.com', 'qZqt6Zm!!g4JTNh')
    server.quit()
    print('✅ Connexion SMTP OK')
except Exception as e:
    print(f'❌ Erreur: {e}')
"
```

**Si ça fonctionne** : Vous verrez `✅ Connexion SMTP OK`

**Si erreur d'authentification** : Vérifier le mot de passe et l'utilisateur

**Si erreur de connexion** : Vérifier le firewall/port (587)

---

## ✅ VALIDATION

Après configuration, vous devez pouvoir :
- ✅ Activer les notifications depuis l'admin
- ✅ Envoyer un email de test depuis l'admin
- ✅ Recevoir l'email de test
- ✅ Les notifications automatiques fonctionnent (demandes, ventes)

---

## 🔍 SI ÇA NE MARCHE PAS

### Erreur : "SMTPAuthenticationError"

**Causes possibles** :
- Mot de passe incorrect
- Utilisateur incorrect (doit être `noreply@downpricer.com`)
- Compte email bloqué ou désactivé sur OVH

**Solution** : Vérifier les identifiants dans l'interface OVH Zimbra

### Erreur : "Connection timeout" ou "Connection refused"

**Causes possibles** :
- Port 587 bloqué par le firewall
- Mauvais serveur SMTP

**Solution** : Essayer le port 465 avec SSL :
```bash
SMTP_PORT=465
SMTP_TLS_MODE=ssl
```

### Les emails partent mais arrivent en spam

**Solutions** :
1. Vérifier les DNS SPF/DKIM sur OVH
2. S'assurer que `SMTP_FROM=noreply@downpricer.com` correspond au domaine
3. Attendre quelques heures après la première configuration

---

## 📝 NOTES

- **Port 587 (STARTTLS)** : Recommandé, plus compatible
- **Port 465 (SSL)** : Alternative si 587 bloqué
- **Mot de passe** : Stocké uniquement dans `.env` sur le VPS (jamais dans Git)
- **Activation** : Les notifications peuvent être activées/désactivées depuis l'admin sans redémarrer
















