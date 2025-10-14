# QuizCraft Web-Only Launcher
# ============================

# Function to setup Node.js PATH
function Set-NodePath {
    $commonNodePaths = @(
        "C:\nodejs",
        "C:\Program Files\nodejs",
        "$env:USERPROFILE\AppData\Roaming\npm",
        "$env:ProgramFiles\nodejs",
        "${env:ProgramFiles(x86)}\nodejs"
    )
    $env:Path = ($commonNodePaths -join ";") + ";" + $env:Path
}

# Function to create PATH string for new processes
function Get-NodePathString {
    $commonNodePaths = @(
        "C:\nodejs",
        "C:\Program Files\nodejs",
        "$env:USERPROFILE\AppData\Roaming\npm",
        "$env:ProgramFiles\nodejs",
        "${env:ProgramFiles(x86)}\nodejs"
    )
    return ($commonNodePaths -join ";") + ";" + $env:Path
}

Write-Host "🌐 Starting QuizCraft Web Version..." -ForegroundColor Cyan
Write-Host ""

# Setup PATH for current session
Set-NodePath

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
    $pathString = Get-NodePathString
    Start-Process powershell -ArgumentList "-Command", "& {`$env:Path='$pathString'; cd 'M:\Program all\QuizCraft New\backend'; npm run dev; Read-Host 'Press Enter to close'}"
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
npm run web

Write-Host ""
Write-Host "🎉 QuizCraft Web is now running!" -ForegroundColor Green
Write-Host "💡 Keep both PowerShell windows open while using the app." -ForegroundColor Yellow