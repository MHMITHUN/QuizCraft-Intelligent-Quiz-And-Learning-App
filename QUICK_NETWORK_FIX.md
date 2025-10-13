# ⚡ QUICK NETWORK FIX - Do This Now!

## Your Error:
```
ERROR Guest access error: [Error: Network Error]
```

## Fix in 5 Steps (5 Minutes)

### Step 1: Test Connection (30 seconds)
```bash
node test-connection.js
```

If you see ❌ errors, continue to Step 2.
If you see ✅, your backend is running!

---

### Step 2: Start Backend (1 minute)
```bash
cd backend
npm run dev
```

**Wait for these messages:**
```
✅ Connected to MongoDB
🚀 QuizCraft Server running on port 5000
🌐 Server accessible at:
   - http://localhost:5000
   - http://192.168.0.105:5000
```

---

### Step 3: Test in Browser (30 seconds)

Open browser and visit:
```
http://192.168.0.105:5000
```

**Should see:**
```json
{
  "message": "Welcome to QuizCraft API",
  "version": "1.0.0"
}
```

**If it doesn't work:**
- Windows Firewall is blocking → See NETWORK_FIX.md
- Wrong IP address → Run `ipconfig` to get correct IP

---

### Step 4: Update Frontend Config (1 minute)

Edit `frontend/app.json`:
```json
{
  "expo": {
    "name": "QuizCraft",
    "slug": "quizcraft",
    "version": "1.0.0",
    "extra": {
      "apiUrl": "http://192.168.0.105:5000/api"
    }
  }
}
```

Make sure it matches YOUR IP address!

---

### Step 5: Restart Frontend (2 minutes)

```bash
cd frontend
npx expo start --clear
```

When app loads, check console for:
```
🌐 API_URL: http://192.168.0.105:5000/api
```

Now tap "Continue as Guest" - **IT SHOULD WORK!**

---

## Still Not Working?

### Quick Checks:

1. **Backend running?**
   ```bash
   curl http://192.168.0.105:5000
   ```
   Should return JSON, not error.

2. **Correct URL in app.json?**
   Open `frontend/app.json` and check `extra.apiUrl`

3. **Cache cleared?**
   ```bash
   npx expo start --clear
   ```

4. **Firewall?**
   - Windows Firewall → Allow Node.js
   - Or temporarily disable firewall to test

5. **Same WiFi?**
   - Phone and computer must be on same network

---

## Device Type Quick Reference

### Physical Device (You)
```json
"apiUrl": "http://192.168.0.105:5000/api"
```
Replace 192.168.0.105 with YOUR computer's IP

### Android Emulator
```json
"apiUrl": "http://10.0.2.2:5000/api"
```

### iOS Simulator
```json
"apiUrl": "http://localhost:5000/api"
```

---

## What the Logs Should Show

### Backend Terminal (Good):
```
🚀 QuizCraft Server running on port 5000
📝 Environment: development
🗄️  Database: Connected to MongoDB
🌐 Server accessible at:
   - http://localhost:5000
   - http://192.168.0.105:5000
```

### Frontend Terminal (Good):
```
🌐 API_URL: http://192.168.0.105:5000/api
📱 Constants.expoConfig: { apiUrl: 'http://192.168.0.105:5000/api' }
```

### When Tapping Guest (Good):
```
POST http://192.168.0.105:5000/api/auth/guest-access
Status: 200
✅ Guest access successful
```

---

## Common Mistakes

### ❌ Wrong:
```json
"apiUrl": "http://10.0.2.2:5000/api"  // Only for Android emulator!
```

### ✅ Correct (for physical device):
```json
"apiUrl": "http://192.168.0.105:5000/api"
```

---

### ❌ Wrong:
```json
"apiUrl": "http://localhost:5000/api"  // Won't work on physical device!
```

### ✅ Correct:
```json
"apiUrl": "http://192.168.0.105:5000/api"
```

---

## Emergency Reset

If nothing works, nuclear option:

```bash
# Terminal 1: Kill everything
taskkill /F /IM node.exe

# Terminal 2: Start backend
cd "M:\Program all\QuizCraft New\backend"
npm run dev

# Wait for "Server running"

# Terminal 3: Start frontend fresh
cd "M:\Program all\QuizCraft New\frontend"
Remove-Item -Recurse -Force node_modules/.cache
npx expo start --clear
```

---

## Need More Help?

See detailed guide: `NETWORK_FIX.md`

---

**DO THESE 5 STEPS IN ORDER AND IT WILL WORK!** ✅
