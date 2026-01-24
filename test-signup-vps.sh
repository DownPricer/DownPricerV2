#!/bin/bash
# Script de diagnostic rapide pour le problème Signup "Not Found"

echo "=========================================="
echo "🔍 DIAGNOSTIC SIGNUP NOT FOUND"
echo "=========================================="
echo ""

echo "1️⃣ Vérification des conteneurs..."
docker compose -f docker-compose.prod.yml ps
echo ""

echo "2️⃣ Test Backend Health Check..."
curl -i http://localhost/api/health 2>&1 | head -5
echo ""

echo "3️⃣ Test Backend Signup (direct)..."
curl -X POST http://localhost/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test'$(date +%s)'@test.com","password":"test123","first_name":"Test","last_name":"User","phone":""}' \
  2>&1 | head -20
echo ""

echo "4️⃣ Vérification Backend depuis Nginx..."
docker exec downpricer-nginx wget -q -O- http://backend:8001/api/health 2>&1 | head -3
echo ""

echo "5️⃣ Logs Backend (dernières 30 lignes)..."
docker compose -f docker-compose.prod.yml logs --tail=30 backend | grep -E "(signup|POST|ERROR|WARN)" || echo "Pas de logs signup récents"
echo ""

echo "6️⃣ Vérification CORS_ORIGINS..."
docker compose -f docker-compose.prod.yml exec backend env | grep CORS_ORIGINS || echo "CORS_ORIGINS non défini"
echo ""

echo "7️⃣ Vérification Frontend Build..."
docker compose -f docker-compose.prod.yml exec nginx ls -la /usr/share/nginx/html/static/js/ | head -5 || echo "Pas de fichiers JS trouvés"
echo ""

echo "8️⃣ Test depuis l'extérieur (simulation)..."
echo "Testez depuis votre navigateur :"
echo "  URL: http://51.210.179.212/api/auth/signup"
echo "  Méthode: POST"
echo "  Body: {\"email\":\"test@example.com\",\"password\":\"test123\",\"first_name\":\"Test\",\"last_name\":\"User\"}"
echo ""

echo "=========================================="
echo "✅ DIAGNOSTIC TERMINÉ"
echo "=========================================="












