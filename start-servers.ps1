# Script PowerShell pour démarrer les serveurs
Write-Host "🚀 Démarrage des serveurs..." -ForegroundColor Green

# Démarrer le serveur backend
Write-Host "📡 Démarrage du serveur backend (port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start" -WindowStyle Normal

# Attendre un peu
Start-Sleep -Seconds 3

# Démarrer le serveur frontend
Write-Host "🌐 Démarrage du serveur frontend (port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev" -WindowStyle Normal

Write-Host "✅ Serveurs démarrés !" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Admin: http://localhost:3001/admin" -ForegroundColor Cyan
