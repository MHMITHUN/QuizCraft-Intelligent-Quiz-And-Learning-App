# QuizCraft Mobile Development Launcher
# ====================================

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

Write-Host "📱 Starting QuizCraft for Mobile Development..." -ForegroundColor Cyan
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

Write-Host "📱 Starting Mobile Development Server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Choose your mobile option:" -ForegroundColor White
Write-Host "   [1] 📱 Expo Go (Scan QR with phone)" -ForegroundColor Yellow
Write-Host "   [2] 🤖 Android Emulator" -ForegroundColor Yellow
Write-Host "   [3] 🍎 iOS Simulator" -ForegroundColor Yellow
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

cd "M:\Program all\QuizCraft New\frontend"

switch ($choice) {
    "1" { 
        Write-Host "📱 Starting Expo Go development server..." -ForegroundColor Green
        Write-Host "   📲 Scan the QR code with Expo Go app on your phone!" -ForegroundColor Cyan
        Write-Host "   📶 Make sure your phone and PC are on the same WiFi network!" -ForegroundColor Yellow
        npm run start -- --tunnel
    }
    "2" { 
        Write-Host "🤖 Starting Android emulator..." -ForegroundColor Green
        npm run android
    }
    "3" { 
        Write-Host "🍎 Starting iOS simulator..." -ForegroundColor Green
        npm run ios
    }
    default { 
        Write-Host "📱 Starting Expo Go development server (default)..." -ForegroundColor Green
        npm run start
    }
}

Write-Host ""
Write-Host "🎉 QuizCraft Mobile is now running!" -ForegroundColor Green
Write-Host "💡 Keep both PowerShell windows open while using the app." -ForegroundColor Yellow