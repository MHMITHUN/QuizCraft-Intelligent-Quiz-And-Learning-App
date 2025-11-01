# QuizCraft Backend Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   QuizCraft Backend Server Startup   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
Set-Location "M:\Program all\QuizCraft New\backend"

Write-Host "📂 Current Directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies installed!" -ForegroundColor Green
    Write-Host ""
}

# Check if backend is already running
$existingProcess = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($existingProcess) {
    Write-Host "⚠️  Port 5000 is already in use!" -ForegroundColor Red
    Write-Host "   Killing existing process..." -ForegroundColor Yellow
    $pid = $existingProcess.OwningProcess
    Stop-Process -Id $pid -Force
    Start-Sleep -Seconds 2
    Write-Host "✅ Port cleared!" -ForegroundColor Green
    Write-Host ""
}

Write-Host "🚀 Starting QuizCraft Backend Server..." -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start the server
npm start
