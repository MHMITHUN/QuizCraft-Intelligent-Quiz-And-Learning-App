# 🔧 Network Error Fix - QuizCraft

## Your Current Error

```
ERROR  Guest access error: [Error: Network Error]
```

This means the frontend **cannot connect** to the backend API.

## Quick Diagnosis (Run This First)

```bash
# From project root
node test-connection.js
```

This will test all backend URLs and show which ones work.

## Root Causes & Solutions

### 1. Backend Not Running ⚠️

**Check if backend is running:**

```bash
# Terminal 1: Start backend
cd backend
npm run dev
```

**You should see:**
```
🚀 QuizCraft Server running on port 5000
📝 Environment: development
🗄️  Database: Connected to MongoDB
```

**If backend won't start:**
- Check MongoDB connection in `.env`
- Ensure port 5000 is not in use
- Run: `npm install` in backend folder first

---

### 2. Wrong API URL Configuration 🌐

Your IP is **192.168.0.105**. The app needs to use this.

**Option A: For Physical Device (Recommended)**

Update `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://192.168.0.105:5000/api"
    }
  }
}
```

**Option B: For Android Emulator**

Update `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://10.0.2.2:5000/api"
    }
  }
}
```

**After changing, restart:**
```bash
npx expo start --clear
```

---

### 3. Windows Firewall Blocking 🛡️

**Allow Node.js through firewall:**

1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find "Node.js" in the list
4. Check both "Private" and "Public" boxes
5. If Node.js not in list:
   - Click "Allow another app"
   - Browse to Node.js installation
   - Add it

**Quick Test:**
```bash
# From another terminal
curl http://192.168.0.105:5000
# Should return JSON, not timeout
```

---

### 4. Computer and Phone on Different Networks 📱

**For Physical Device:**
- Phone and computer MUST be on same WiFi
- Both must be on 2.4GHz or both on 5GHz
- Some routers have "AP Isolation" - disable it

**Test:**
```bash
# On your computer, find IP
ipconfig

# Look for "Wireless LAN adapter Wi-Fi"
# IPv4 Address should match what you're using
```

---

### 5. HTTPS/HTTP Mismatch 🔒

Make sure you're using `http://` not `https://`

**Correct:**
```javascript
"apiUrl": "http://192.168.0.105:5000/api"
```

**Wrong:**
```javascript
"apiUrl": "https://192.168.0.105:5000/api"  // ❌ Backend not using HTTPS
```

---

## Step-by-Step Fix (Do This Now)

### Step 1: Test Backend is Running

```bash
# Terminal 1
cd "M:\Program all\QuizCraft New\backend"
npm run dev
```

**Wait for:**
```
✅ Connected to MongoDB
🚀 QuizCraft Server running on port 5000
```

### Step 2: Test Backend Accessible

**Open browser and visit:**
```
http://192.168.0.105:5000
```

**Should see:**
```json
{
  "message": "Welcome to QuizCraft API",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

**If browser shows connection error:**
- Firewall is blocking
- Backend not listening on 0.0.0.0
- Wrong IP address

### Step 3: Update app.json

```json
{
  "expo": {
    "name": "QuizCraft",
    "extra": {
      "apiUrl": "http://192.168.0.105:5000/api"
    }
  }
}
```

### Step 4: Clear Cache & Restart

```bash
# Terminal 2
cd "M:\Program all\QuizCraft New\frontend"
npx expo start --clear
```

### Step 5: Check Logs

When you tap "Continue as Guest", check Metro bundler logs:

**Should see:**
```
🌐 API_URL: http://192.168.0.105:5000/api
Making request to: http://192.168.0.105:5000/api/auth/guest-access
```

**If you see different URL:**
- Config not updated properly
- Need to restart with --clear

---

## Backend Server Configuration Fix

Make sure backend listens on all interfaces, not just localhost.

**File: `backend/server.js`**

Find this line:
```javascript
app.listen(PORT, () => {
```

Change to:
```javascript
app.listen(PORT, '0.0.0.0', () => {
```

This makes backend accessible from other devices on network.

---

## Testing the API Manually

**1. Test Health Endpoint:**
```bash
curl http://192.168.0.105:5000/health
```

**2. Test Guest Access:**
```bash
curl -X POST http://192.168.0.105:5000/api/auth/guest-access
```

**Should return:**
```json
{
  "success": true,
  "message": "Guest access granted",
  "data": {
    "user": { ... },
    "token": "..."
  }
}
```

---

## Common Error Messages & Fixes

### "ECONNREFUSED"
- Backend not running
- Wrong port number
- Firewall blocking

**Fix:** Start backend, check firewall

### "ETIMEDOUT"
- Wrong IP address
- Phone and computer on different networks
- Router AP isolation enabled

**Fix:** Verify IP with `ipconfig`, check WiFi

### "Network request failed"
- General connectivity issue
- Could be any of the above

**Fix:** Follow step-by-step guide above

---

## Device-Specific Configuration

### 📱 Physical Device (Your Case)
```json
"apiUrl": "http://192.168.0.105:5000/api"
```

### 🤖 Android Emulator
```json
"apiUrl": "http://10.0.2.2:5000/api"
```

### 🍎 iOS Simulator
```json
"apiUrl": "http://localhost:5000/api"
```

### 🌐 Web Browser
```json
"apiUrl": "http://localhost:5000/api"
```

---

## Verification Checklist

Run through this checklist:

- [ ] Backend is running (`npm run dev` in backend folder)
- [ ] Can access `http://192.168.0.105:5000` in browser
- [ ] `app.json` has correct `apiUrl`
- [ ] Cleared Expo cache (`npx expo start --clear`)
- [ ] Phone and computer on same WiFi
- [ ] Windows Firewall allows Node.js
- [ ] See "🌐 API_URL:" log when app starts

---

## Quick Debug Commands

```bash
# Check if backend is running
curl http://192.168.0.105:5000

# Check if API endpoint works
curl http://192.168.0.105:5000/api/auth/guest-access -X POST

# Check your IP address
ipconfig | findstr "IPv4"

# Test connection from Node
node test-connection.js

# Check what's using port 5000
netstat -ano | findstr "5000"
```

---

## If Nothing Works

### Nuclear Option: Use Different Port

**1. Change backend port:**

`backend/.env`:
```
PORT=3000
```

**2. Change frontend config:**

`frontend/app.json`:
```json
"apiUrl": "http://192.168.0.105:3000/api"
```

**3. Restart everything:**
```bash
# Kill all Node processes
taskkill /F /IM node.exe

# Restart backend
cd backend
npm run dev

# Restart frontend
cd frontend
npx expo start --clear
```

---

## Expected Working State

### Backend Terminal:
```
🚀 QuizCraft Server running on port 5000
📝 Environment: development
🗄️  Database: Connected to MongoDB
🤖 AI: Google Gemini gemini-2.5-pro
```

### Frontend Terminal (When app starts):
```
🌐 API_URL: http://192.168.0.105:5000/api
📱 Constants.expoConfig: { apiUrl: 'http://192.168.0.105:5000/api' }
```

### When Tapping Guest Access:
```
POST http://192.168.0.105:5000/api/auth/guest-access
Status: 200 OK
Response: { success: true, ... }
```

---

## Still Getting Error?

1. **Run connection test:**
   ```bash
   node test-connection.js
   ```

2. **Check backend logs** - Any errors in backend terminal?

3. **Check frontend logs** - What URL is it trying to connect to?

4. **Try in browser** - Visit `http://192.168.0.105:5000/api/auth/guest-access` directly

5. **Check MongoDB** - Is it connected?

---

**Last Updated:** 2025-10-08  
**Status:** Follow step-by-step guide above
