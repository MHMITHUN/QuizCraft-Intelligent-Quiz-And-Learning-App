# QuizCraft Web Version Launcher
# ===============================

Write-Host "🚀 Starting QuizCraft Web Version..." -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
$backendRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        $backendRunning = $true
        Write-Host "✅ Backend server is already running!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend server is not running." -ForegroundColor Yellow
}

if (-not $backendRunning) {
    Write-Host "🔧 Starting backend server..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-Command", "cd 'M:\Program all\QuizCraft New\backend'; npm start; Read-Host 'Press Enter to close'"
    Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

Write-Host "🌐 Starting web frontend..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Your app will open in the browser at:" -ForegroundColor White
Write-Host "   http://localhost:19006" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 If the web version has issues, try:" -ForegroundColor Yellow
Write-Host "   1. Using Android Emulator (recommended)" -ForegroundColor White
Write-Host "   2. Installing Expo Go on your phone and scanning QR" -ForegroundColor White
Write-Host ""

# Start the web version
cd "M:\Program all\QuizCraft New\frontend"
npx expo start --web