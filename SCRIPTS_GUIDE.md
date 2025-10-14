# 🚀 QuizCraft Development Scripts Guide

## 📱 Available PowerShell Scripts

### **🎯 Quick Commands:**
```powershell
# From frontend directory - RECOMMENDED
cd frontend
npm run start      # Start Expo development server
npm run web        # Start web version only
npm run android    # Start Android emulator version
npm run ios        # Start iOS simulator version

# From root directory - Using PowerShell scripts
.\start-mobile.ps1  # Mobile development (Android/iOS/Expo Go)
.\start-pc.ps1     # PC development with options
.\start-web.ps1    # Web-only development
.\update-ip.ps1    # Update network IP in .env file
```

## 📋 Script Details

### **1. start-mobile.ps1** 📱
**Purpose:** Mobile development with multiple platform options
- **Option 1:** Expo Go (scan QR with phone)
- **Option 2:** Android Emulator
- **Option 3:** iOS Simulator
- **Auto-starts:** Backend server if not running

### **2. start-pc.ps1** 🖥️
**Purpose:** PC development with desktop-optimized options
- **Option 1:** Full-screen web app (recommended for PC)
- **Option 2:** Android emulator
- **Option 3:** Expo Go with QR code
- **Auto-starts:** Backend server if not running

### **3. start-web.ps1** 🌐
**Purpose:** Web-only development
- Starts backend automatically
- Opens web version at http://localhost:8081
- Optimized for desktop/laptop screens

### **4. update-ip.ps1** 🔧
**Purpose:** Updates your WiFi IP address in .env file
- Auto-detects current WiFi IP
- Updates SERVER_IP in .env
- Shows restart instructions

## 🎯 **RECOMMENDED Usage:**

### **For Mobile Development:**
```powershell
# Go to frontend folder and use npm directly
cd frontend
npm run start    # Then scan QR code with Expo Go app
```

### **For Web Development:**
```powershell
# Go to frontend folder and use npm directly
cd frontend  
npm run web      # Opens in browser automatically
```

### **For Multiple Options:**
```powershell
# Use PowerShell scripts from root directory
.\start-mobile.ps1   # Mobile with options
.\start-pc.ps1      # PC with options
```

## 🔧 **Why This Setup:**

- **npm run commands** are more reliable than npx
- **PowerShell scripts** handle backend startup automatically
- **Direct npm commands** are faster for simple development
- **Scripts provide options** when you need multiple platforms

## ✅ **Everything Works Now:**
- ✅ Language toggles work properly
- ✅ npm run start works without npx issues
- ✅ All scripts updated to use npm run commands
- ✅ Duplicate scripts removed
- ✅ Backend auto-starts when needed