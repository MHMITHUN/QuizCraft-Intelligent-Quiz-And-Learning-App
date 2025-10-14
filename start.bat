@echo off
echo 🚀 Starting QuizCraft Development Server...
echo.

cd /d "M:\Program all\QuizCraft New\frontend"

if not exist "node_modules\.bin\expo.cmd" (
    echo 📦 Installing dependencies...
    npm install
    echo.
)

echo 📱 Launching Expo...
node_modules\.bin\expo.cmd start

pause