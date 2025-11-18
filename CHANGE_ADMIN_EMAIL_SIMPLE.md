# How to Change Admin Email - Simple Steps

## 📧 Your Email Setup:

- **Sender Email (Never Changes):** `teamquizcraft@gmail.com`
- **App Password (Never Changes):** `qhqb knke glrb zwhv`
- **Admin Email (You Want to Change):** Currently `mhmmithun1@gmail.com`

---

## ✅ Steps to Change Admin Email

### Step 1: Update `.env` File

Open `M:\Program all\QuizCraft New\.env` and change only `ADMIN_EMAIL`:

```env
# Admin Credentials
ADMIN_EMAIL=your-new-admin@gmail.com    ← CHANGE THIS
ADMIN_PASSWORD=sumya1234

# Email Configuration (NEVER CHANGE THESE)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USERNAME=teamquizcraft@gmail.com   ← KEEP AS IS
EMAIL_PASSWORD=       ← KEEP AS IS
EMAIL_FROM_NAME=Team QuizCraft
EMAIL_FROM_ADDRESS=teamquizcraft@gmail.com
```

### Step 2: Run This Command

```bash
cd backend
npm run promote-to-admin
```

### Step 3: Restart Backend

```bash
npm start
```

### Step 4: Done!

Login with:

- Email: `your-new-admin@gmail.com`
- Password: `sumya1234`
- 2FA code will be sent to the new admin email

---

## 📝 Example

If you want to change admin from `mhmmithun1@gmail.com` to `boss@company.com`:

1. Edit `.env`:

   ```env
   ADMIN_EMAIL=boss@company.com
   ```

2. Run:

   ```bash
   npm run promote-to-admin
   ```

3. Login with `boss@company.com` / `sumya1234`
4. Check `boss@company.com` inbox for 2FA code

---

## 🔍 What Each Email Does

| Email Type       | Example                   | Purpose                                     |
| ---------------- | ------------------------- | ------------------------------------------- |
| **Sender Email** | `teamquizcraft@gmail.com` | Sends all emails (2FA codes, verifications) |
| **Admin Email**  | `mhmmithun1@gmail.com`    | Receives 2FA codes to login as admin        |

**Think of it like:**

- `teamquizcraft@gmail.com` = The mailman (delivers messages)
- `mhmmithun1@gmail.com` = The admin's mailbox (receives 2FA codes)

You can have:

- Admin at `boss@company.com`
- Emails sent from `teamquizcraft@gmail.com`
- Both work together!

---

## ⚠️ Common Mistakes

### ❌ WRONG:

Changing `EMAIL_USERNAME` when you want to change admin

```env
EMAIL_USERNAME=newadmin@gmail.com  ← NO! This breaks email sending
```

### ✅ CORRECT:

Only change `ADMIN_EMAIL`

```env
ADMIN_EMAIL=newadmin@gmail.com     ← YES! This is what you want
EMAIL_USERNAME=teamquizcraft@gmail.com  ← Keep this always
```

---

## 🐛 Troubleshooting Current Issue

You said the app restarts after login without showing 2FA screen. Let's debug:

### Test Steps:

1. **Check backend logs** when admin logs in:

   ```bash
   # Start backend with logs visible
   cd backend
   npm start
   ```

2. **Try login** with `mhmmithun1@gmail.com` / `sumya1234`

3. **Look for these logs:**

   ```
   [AuthContext] Login started for: mhmmithun1@gmail.com
   [AuthContext] Login response: { ... }
   [AuthContext] Admin 2FA detected  ← Should see this!
   [LoginScreen] Admin 2FA required, navigating...
   ```

4. **If you see errors**, copy them and we'll fix

### Quick Fix if Email Not Sending:

Check backend terminal for:

```
Admin 2FA email error: ...
```

If you see an error, it means:

- Email password is wrong
- Gmail blocked the app password
- Need to enable "Less secure app access" in Gmail

---

## 📱 Frontend Debugging

The app should:

1. Show login screen
2. Admin enters email/password
3. **Navigate to Admin Verification screen** (6-digit code input)
4. Admin enters code from email
5. Admin is logged in

If step 3 doesn't happen, check console logs in frontend.

---

## 🔧 Quick Commands Reference

```bash
# Check who is admin now
npm run check-admins

# Change admin email (after editing .env)
npm run promote-to-admin

# See all commands
npm run
```

---

## 💡 Summary

**To change admin email:**

1. Edit `ADMIN_EMAIL` in `.env`
2. Run `npm run promote-to-admin`
3. Restart backend
4. Login with new email

**Keep `EMAIL_USERNAME` and `EMAIL_PASSWORD` as `teamquizcraft@gmail.com` always!**

That's it! 🎉
