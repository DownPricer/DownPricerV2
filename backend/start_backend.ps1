# Script PowerShell pour démarrer le backend DownPricer

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Démarrage du backend DownPricer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Aller dans le dossier backend
Set-Location $PSScriptRoot

# Vérifier si le fichier .env existe
if (-not (Test-Path .env)) {
    Write-Host "[ERREUR] Le fichier .env n'existe pas!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Créons-le maintenant..." -ForegroundColor Yellow
    Write-Host ""
    
    # Générer une clé secrète JWT
    $jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    
    @"
MONGO_URL=mongodb://localhost:27017
DB_NAME=downpricer
JWT_SECRET_KEY=$jwtSecret
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
BACKEND_PUBLIC_URL=http://localhost:8001
"@ | Out-File -FilePath .env -Encoding utf8
    
    Write-Host "✅ Fichier .env créé avec une clé JWT générée automatiquement!" -ForegroundColor Green
    Write-Host ""
}

# Vérifier les dépendances
Write-Host "Vérification des dépendances..." -ForegroundColor Yellow
$fastapiInstalled = python -m pip show fastapi 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installation des dépendances..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERREUR] Échec de l'installation des dépendances" -ForegroundColor Red
        Read-Host "Appuyez sur Entrée pour quitter"
        exit 1
    }
}

Write-Host ""
Write-Host "🚀 Démarrage du serveur sur http://localhost:8001" -ForegroundColor Green
Write-Host "Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Yellow
Write-Host ""

# Démarrer le serveur
python -m uvicorn server:app --reload --port 8001

















