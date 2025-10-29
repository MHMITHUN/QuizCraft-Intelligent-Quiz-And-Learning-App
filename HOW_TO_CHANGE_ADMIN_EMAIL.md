# How to Change Admin Email

## Quick Guide

### Step 1: Update `.env` File
Change the admin email in your `.env` file:

```env
# Old email
ADMIN_EMAIL=old-email@gmail.com
ADMIN_PASSWORD=yourpassword

# Change to new email
ADMIN_EMAIL=new-email@gmail.com
ADMIN_PASSWORD=yourpassword
```

### Step 2: Run Update Script
```bash
cd backend
npm run update-admin
```

**This script will:**
- ✅ Find existing admin account
- ✅ Update email to new address
- ✅ Update password if changed
- ✅ Preserve all admin data (history, quizzes, etc.)

### Step 3: Restart Server
```bash
npm start
```

### Step 4: Login with New Email
- Email: `new-email@gmail.com`
- Password: `yourpassword`
- Enter 2FA code sent to **new email**

---

## Detailed Options

### Option A: Update Existing Admin (Recommended)
**Use when:** You want to keep admin history and data

```bash
# 1. Update .env
ADMIN_EMAIL=newemail@example.com

# 2. Run update script
npm run update-admin
```

**Result:** Same admin user, just different email address

---

### Option B: Delete Old & Create New
**Use when:** You want a fresh admin account

```bash
# 1. Update .env
ADMIN_EMAIL=newemail@example.com

# 2. Delete old admin manually via MongoDB Compass
# OR use this command:
mongo quizcraft --eval 'db.users.deleteMany({ role: "admin" })'

# 3. Create new admin
npm run seed
```

**Result:** Brand new admin account (old history lost)

---

### Option C: Multiple Admin Accounts
**Use when:** You want multiple admins

```bash
# Method: Create additional admin via database
# 1. Login to MongoDB
# 2. Create new user with role: 'admin'
```

**Note:** All admins will have 2FA enabled

---

## Important Notes

### Email Configuration
If you change the admin email, make sure your email service is configured:

```env
ADMIN_EMAIL=newadmin@example.com          # Your new admin email
EMAIL_USERNAME=youremail@gmail.com        # Your SMTP email (can be different)
EMAIL_PASSWORD=your-app-password          # SMTP password
EMAIL_FROM_ADDRESS=youremail@gmail.com    # Sender email
```

**Key Point:** 
- `ADMIN_EMAIL` = Where 2FA codes are sent
- `EMAIL_USERNAME` = Gmail account used to send emails
- These can be **the same** or **different**

### Example Configurations

#### Configuration 1: Admin IS the sender
```env
ADMIN_EMAIL=admin@company.com
EMAIL_USERNAME=admin@company.com
EMAIL_PASSWORD=app-password-here
```

#### Configuration 2: Admin receives, service sends
```env
ADMIN_EMAIL=boss@company.com          # Boss gets 2FA codes
EMAIL_USERNAME=noreply@company.com    # Service email sends them
EMAIL_PASSWORD=service-password
```

---

## Troubleshooting

### "Admin already exists" Error
```bash
# Run the update script instead
npm run update-admin
```

### Email Not Arriving at New Address
1. Check spam folder
2. Verify `EMAIL_USERNAME` and `EMAIL_PASSWORD` in .env
3. Test email service:
   ```bash
   # Check backend logs when admin logs in
   # Should show: "[mail] Email sent to newemail@example.com"
   ```

### Old Email Still Receiving 2FA Codes
1. Restart backend server after changing .env
2. Verify .env changes were saved
3. Run `npm run update-admin` again

### Can't Login with New Email
1. Check if admin was actually updated:
   ```bash
   npm run update-admin
   # Should show: "New Email: newemail@example.com"
   ```
2. Make sure you're using the new email to login
3. Check password is correct in .env

---

## Script Commands Summary

| Command | Purpose |
|---------|---------|
| `npm run seed` | Create admin (first time only) |
| `npm run update-admin` | Update existing admin email/password |
| `npm run setup` | Setup database + create admin |

---

## What Happens During Update?

```
1. Script connects to database
2. Finds existing admin users
3. Checks if new email already exists
   - If YES → Update password if needed
   - If NO → Update first admin's email + password
4. Preserves all admin data:
   - Quiz history
   - Created quizzes
   - Permissions
   - Settings
```

---

## Security Notes

✅ **2FA continues to work** - Codes sent to new email
✅ **Old sessions invalidated** - Admin must login again
✅ **Password can be updated** - Set new password in .env
✅ **History preserved** - All admin actions remain

---

## Need Help?

1. Check backend console logs
2. Run update script: `npm run update-admin`
3. Verify .env configuration
4. Restart backend server
5. Try login with new email

**Remember:** After changing admin email, always:
1. Update `.env`
2. Run `npm run update-admin`
3. Restart server
4. Login with new email
