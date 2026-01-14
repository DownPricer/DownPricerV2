@echo off
echo ========================================
echo   DownPricer - Demarrage automatique
echo ========================================
echo.

cd /d %~dp0

echo [1/4] Verification des fichiers...
if not exist backend\.env (
    echo [ERREUR] Le fichier backend\.env n'existe pas!
    echo.
    echo Creation du fichier backend\.env...
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=downpricer
        echo JWT_SECRET_KEY=ma-cle-secrete-12345678901234567890
        echo CORS_ORIGINS=http://localhost:3000
        echo BACKEND_PUBLIC_URL=http://localhost:8001
    ) > backend\.env
    echo Fichier cree! Modifiez JWT_SECRET_KEY si besoin.
    echo.
    timeout /t 3
)

if not exist frontend\.env (
    echo Creation du fichier frontend\.env...
    echo REACT_APP_BACKEND_URL=http://localhost:8001 > frontend\.env
)

echo [2/4] Installation des dependances backend...
cd backend
python -m pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo Installation en cours (cela peut prendre 1-2 minutes)...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERREUR] Echec de l'installation des dependances backend
        pause
        exit /b 1
    )
)

echo [3/4] Installation des dependances frontend...
cd ..\frontend
if not exist node_modules (
    echo Installation en cours (cela peut prendre 2-3 minutes)...
    call npm install
    if errorlevel 1 (
        echo [ERREUR] Echec de l'installation des dependances frontend
        pause
        exit /b 1
    )
)

echo.
echo [4/4] Demarrage des serveurs...
echo.
echo ========================================
echo   IMPORTANT:
echo ========================================
echo.
echo Deux fenetres vont s'ouvrir:
echo   1. Backend (http://localhost:8001)
echo   2. Frontend (http://localhost:3000)
echo.
echo NE FERMEZ PAS CES FENETRES!
echo.
echo Pour arreter: Appuyez sur Ctrl+C dans chaque fenetre
echo.
timeout /t 5

echo Demarrage du backend...
start "DownPricer Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn server:app --reload --port 8001"

timeout /t 3

echo Demarrage du frontend...
start "DownPricer Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo   Demarrage termine!
echo ========================================
echo.
echo Le navigateur devrait s'ouvrir automatiquement.
echo Si ce n'est pas le cas, allez sur: http://localhost:3000
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause >nul










