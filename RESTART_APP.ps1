# QuizCraft - Restart App with Network Fix
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   QuizCraft App Restart & Fix         " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get current IP
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress
Write-Host "📡 Your Network IP: $ip" -ForegroundColor Green
Write-Host ""

# Update .env file
$envPath = "M:\Program all\QuizCraft New\.env"
$content = Get-Content $envPath -Raw
$content = $content -replace "SERVER_IP=.*", "SERVER_IP=$ip"
Set-Content $envPath $content
Write-Host "✅ Updated .env with IP: $ip" -ForegroundColor Green
Write-Host ""

# Check firewall
$firewallRule = netsh advfirewall firewall show rule name="QuizCraft Backend" 2>&1
if ($firewallRule -match "No rules match") {
    Write-Host "🔒 Adding firewall rule for port 5000..." -ForegroundColor Yellow
    netsh advfirewall firewall add rule name="QuizCraft Backend" dir=in action=allow protocol=TCP localport=5000 | Out-Null
    Write-Host "✅ Firewall rule added!" -ForegroundColor Green
} else {
    Write-Host "✅ Firewall rule already exists" -ForegroundColor Green
}
Write-Host ""

# Check if backend is running
$backendRunning = Test-NetConnection -ComputerName localhost -Port 5000 -WarningAction SilentlyContinue
if (-not $backendRunning.TcpTestSucceeded) {
    Write-Host "⚠️  Backend not running! Starting backend..." -ForegroundColor Red
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'M:\Program all\QuizCraft New\backend' ; npm start"
    Write-Host "✅ Backend started in new window" -ForegroundColor Green
    Start-Sleep -Seconds 5
} else {
    Write-Host "✅ Backend is running on port 5000" -ForegroundColor Green
}
Write-Host ""

Write-Host "📱 INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "   1. In your Expo app, press 'r' to reload" -ForegroundColor White
Write-Host "   2. Or shake your device and tap 'Reload'" -ForegroundColor White
Write-Host "   3. Your phone should connect to: http://${ip}:5000" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Now try uploading a PDF again!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Keep window open
Read-Host "Press Enter to close"
