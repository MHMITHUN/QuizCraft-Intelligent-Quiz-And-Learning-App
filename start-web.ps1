# QuizCraft Web-Only Launcher
# ============================

Write-Host "🌐 Starting QuizCraft Web Version..." -ForegroundColor Cyan
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

Write-Host "🌐 Starting Web Development Server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Your full-screen web app will open at:" -ForegroundColor White
Write-Host "   🔗 http://localhost:8081" -ForegroundColor Cyan
Write-Host "   💻 Optimized for desktop/laptop screens!" -ForegroundColor Green
Write-Host ""

cd "M:\Program all\QuizCraft New\frontend"
npx expo start --web

Write-Host ""
Write-Host "🎉 QuizCraft Web is now running!" -ForegroundColor Green
Write-Host "💡 Keep both PowerShell windows open while using the app." -ForegroundColor Yellow