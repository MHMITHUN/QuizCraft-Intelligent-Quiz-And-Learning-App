# QuizCraft Development Startup Script
# This script starts both backend and frontend servers in separate terminal windows

Write-Host "🚀 Starting QuizCraft Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend Server
Write-Host "📦 Starting Backend Server..." -ForegroundColor Yellow
$backendPath = Join-Path $scriptDir "backend"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🔧 Backend Server' -ForegroundColor Green; npm start"

# Wait a bit for backend to start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start Frontend Server  
Write-Host "📱 Starting Frontend Server..." -ForegroundColor Yellow
$frontendPath = Join-Path $scriptDir "frontend"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '🎨 Frontend Server' -ForegroundColor Green; npm start"

Write-Host ""
Write-Host "✅ Development servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Two terminal windows should have opened:" -ForegroundColor Cyan
Write-Host "   1. Backend Server (port 5000)" -ForegroundColor White
Write-Host "   2. Frontend Server (Expo)" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Once Expo starts, press 'w' for web or scan QR for mobile" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Keep both terminal windows open while developing!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this launcher..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
