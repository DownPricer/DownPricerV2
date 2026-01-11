@echo off
setlocal EnableExtensions
chcp 65001 >nul

REM === Relance dans une fenêtre qui reste ouverte (double-clic friendly) ===
if "%~1"=="" (
  start "DownPricer Push" cmd /k ""%~f0" run"
  exit /b
)

REM === Ici on est dans la fenêtre persistante ===
cd /d "%~dp0"

echo ======================================================
echo   DownPricer - Push GitHub
echo   Dossier: %cd%
echo ======================================================
echo.

REM Log dans un fichier
set "LOG=%~dp0push_github.log"
echo [START] %date% %time% > "%LOG%"

REM Vérifie repo git
git rev-parse --is-inside-work-tree >> "%LOG%" 2>&1
if errorlevel 1 (
  echo [ERREUR] Pas un dépôt Git ici. >> "%LOG%"
  echo [ERREUR] Pas un dépôt Git ici.
  echo Mets ce .bat à la racine du projet (là où il y a .git)
  echo Log: %LOG%
  goto end
)

echo --- Status ---
git status
git status >> "%LOG%" 2>&1
echo.

echo --- Pull (rebase) ---
git pull --rebase origin main >> "%LOG%" 2>&1
if errorlevel 1 (
  echo.
  echo [ERREUR] pull --rebase a échoué.
  echo Ouvre %LOG% pour voir la raison exacte.
  echo.
  echo Si conflit:
  echo   1) corrige les fichiers
  echo   2) git add .
  echo   3) git rebase --continue
  echo puis relance.
  goto end
)

echo.
echo --- Push ---
git push origin main >> "%LOG%" 2>&1
if errorlevel 1 (
  echo.
  echo [ERREUR] push a échoué.
  echo Ouvre %LOG% pour le message exact.
  goto end
)

echo.
echo ✅ OK: Pull + Push terminé.
echo --- Derniers commits ---
git log --oneline -5
git log --oneline -5 >> "%LOG%" 2>&1

:end
echo.
echo (Log complet: %LOG%)
pause
endlocal
