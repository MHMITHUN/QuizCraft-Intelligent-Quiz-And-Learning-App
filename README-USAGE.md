# 🚀 QuizCraft - Complete Usage Guide

## ✅ **FIXED: Both Web & Mobile Now Work!**

The error you encountered (`java.io.IOException: Failed to download remote update`) has been resolved. Here's how to use both versions:

---

## 🌐 **For Web Browser (Full-Screen PC Experience)**

### **Quick Start:**
```powershell
.\start-web.ps1
```
Then open: **http://localhost:8081** in your browser

### **What You Get:**
- ✅ Full-screen desktop experience
- ✅ Responsive design for PC screens
- ✅ All features working in browser
- ✅ No mobile app conflicts

---

## 📱 **For Mobile (Expo Go App)**

### **Quick Start:**
```powershell
.\start-mobile.ps1
```
Choose option **1** and scan the QR code with Expo Go app

### **What You Get:**
- ✅ Native mobile experience
- ✅ Works with Expo Go app
- ✅ All mobile features
- ✅ No web conflicts

---

## 🔧 **What Was Fixed:**

1. **Platform-Specific Imports** - Web CSS only loads on web
2. **Safe Environment Loading** - No crashes when .env is missing
3. **Mobile-Friendly Wrapper** - Different styles for mobile vs web
4. **Separate Launch Scripts** - No platform conflicts

---

## 📋 **Available Launch Options:**

| Script | Purpose | Best For |
|--------|---------|----------|
| `.\start-web.ps1` | Web-only version | PC/Desktop users |
| `.\start-mobile.ps1` | Mobile-only version | Phone/Tablet users |
| `.\start-pc.ps1` | Choose web/mobile | General usage |
| `.\update-ip.ps1` | Update IP address | Network changes |

---

## 🛠️ **Troubleshooting:**

### **If Mobile Still Shows Error:**
1. Close Expo Go app completely
2. Run `.\start-mobile.ps1`
3. Scan the NEW QR code
4. Make sure phone and PC are on same WiFi

### **If Web Doesn't Fill Screen:**
1. Press **F11** for full-screen mode
2. Try different browser (Chrome/Firefox)
3. Clear browser cache and reload

### **If Network Changes:**
1. Run `.\update-ip.ps1`
2. Restart both backend and frontend

---

## 🎯 **Quick Commands:**

```powershell
# For Web Experience (Recommended for PC)
.\start-web.ps1

# For Mobile Experience  
.\start-mobile.ps1

# Update IP when changing networks
.\update-ip.ps1

# Stop all servers
# Press Ctrl+C in both PowerShell windows
```

---

## ✨ **Features Available in Both Versions:**

- 🎯 Quiz Creation & Taking
- 👤 User Management  
- 📊 Analytics & History
- 🔍 Search & Categories
- 📱 Responsive Design
- 🤖 AI-Powered Quiz Generation
- 👩‍🏫 Teacher Features
- 🛡️ Admin Dashboard

**Both versions now work perfectly!** 🎉