# QuizCraft PC Development Launcher
# ==================================

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

Write-Host "🖥️ Starting QuizCraft for PC Development..." -ForegroundColor Cyan
Write-Host ""

# Setup PATH for current session
Set-NodePath

# Check if Node.js and npm are available
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js or npm not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Cyan

# Start backend in a new window
$pathString = Get-NodePathString
Start-Process powershell -ArgumentList @(
    "-Command", 
    "& {`$env:Path='$pathString'; cd 'M:\Program all\QuizCraft New\backend'; Write-Host '🚀 Backend Starting...' -ForegroundColor Green; npm run dev; Read-Host 'Backend stopped. Press Enter to close'}"
)

# Wait a bit for backend to start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "📱 Starting Frontend..." -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Choose how you want to run QuizCraft:" -ForegroundColor White
Write-Host "   [1] 🌐 Full-Screen Web App (Recommended for PC)" -ForegroundColor Yellow  
Write-Host "   [2] 🤖 Android Emulator (if installed)" -ForegroundColor Yellow
Write-Host "   [3] 📱 Expo Go (scan QR with phone)" -ForegroundColor Yellow
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

cd "M:\Program all\QuizCraft New\frontend"

# Ensure PATH is set for current session
Set-NodePath

switch ($choice) {
    "1" { 
        Write-Host "🌐 Opening full-screen web version..." -ForegroundColor Green
        Write-Host "   🔗 App will open at: http://localhost:8081" -ForegroundColor Cyan
        Write-Host "   💻 Full-screen experience optimized for PC!" -ForegroundColor Green
        npm run web
    }
    "2" { 
        Write-Host "🤖 Starting Android emulator version..." -ForegroundColor Green
        npm run android
    }
    "3" { 
        Write-Host "📱 Starting Expo development server..." -ForegroundColor Green
        Write-Host "   Scan the QR code with Expo Go app on your phone!" -ForegroundColor Cyan
        npm run start
    }
    default { 
        Write-Host "📱 Starting Expo development server (default)..." -ForegroundColor Green
        npm run start
    }
}

Write-Host ""
Write-Host "🎉 QuizCraft is now running!" -ForegroundColor Green
Write-Host "💡 Keep both PowerShell windows open while using the app." -ForegroundColor Yellow