@echo off
echo ========================================
echo   Demarrage du backend DownPricer
echo ========================================
echo.

cd /d %~dp0

REM Verifier si le fichier .env existe
if not exist .env (
    echo [ERREUR] Le fichier .env n'existe pas!
    echo.
    echo Creons-le maintenant...
    echo.
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=downpricer
        echo JWT_SECRET_KEY=changez-moi-generer-une-cle-secrete
        echo CORS_ORIGINS=http://localhost:3000,http://localhost:3001
        echo BACKEND_PUBLIC_URL=http://localhost:8001
    ) > .env
    echo Fichier .env cree. Modifiez JWT_SECRET_KEY avec une cle securisee!
    echo.
    pause
)

echo Verification des dependances...
python -m pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo Installation des dependances...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERREUR] Echec de l'installation des dependances
        pause
        exit /b 1
    )
)

echo.
echo Demarrage du serveur sur http://localhost:8001
echo Appuyez sur Ctrl+C pour arreter
echo.
python -m uvicorn server:app --reload --port 8001

pause




