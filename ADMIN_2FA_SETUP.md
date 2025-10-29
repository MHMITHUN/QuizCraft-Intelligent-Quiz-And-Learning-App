# Admin 2FA (Two-Factor Authentication) Setup Guide

## Overview
Admin accounts now require **two-factor authentication (2FA)** for every login to ensure maximum security. When an admin logs in with their credentials, they must also verify their identity using a 6-digit code sent to their email.

## How It Works

### 1. **Admin Login Flow**
```
Admin enters email + password
         ↓
System validates credentials
         ↓
System sends 6-digit code to admin email
         ↓
Admin enters code within 10 minutes
         ↓
Admin is logged in
```

### 2. **Key Features**
- ✅ 2FA required for **every admin login** (not just first time)
- ✅ Admin email doesn't need verification like student/teacher accounts
- ✅ 6-digit code expires in **10 minutes**
- ✅ Beautiful email template with security warnings
- ✅ Frontend UI with countdown timer
- ✅ If code expires, admin must login again

## Setup Instructions

### Step 1: Configure Environment Variables
Add these to your `.env` file:

```env
# Admin Credentials
ADMIN_EMAIL=admin@quizcraft.com
ADMIN_PASSWORD=YourSecurePassword123!

# Email Configuration (Required for 2FA)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=QuizCraft Security
EMAIL_FROM_ADDRESS=your-email@gmail.com

# App URL (for email links)
APP_URL=http://localhost:3000
API_URL=http://localhost:5000
```

### Step 2: Create/Update Admin Account
Run the seed script to create the admin account:

```bash
cd backend
npm run seed
```

This creates an admin user with:
- Email: `ADMIN_EMAIL` from .env
- Password: `ADMIN_PASSWORD` from .env
- Role: `admin`
- Email already verified: `true`

### Step 3: Test the 2FA Flow

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Login as admin:**
   - Open the app
   - Enter admin email and password
   - You'll see: "Admin verification code sent to your email"

4. **Check your email:**
   - Look for email: "🔐 QuizCraft Admin Login Verification"
   - Copy the 6-digit code

5. **Enter verification code:**
   - You'll be redirected to Admin Verification screen
   - Enter the 6-digit code
   - Press "Verify & Login"
   - You're now logged in!

## Security Features

### Email Template
The admin receives a beautiful, professional email with:
- 🔐 Security badge and branding
- Large, clear 6-digit code
- 10-minute expiration notice
- Warning message if login wasn't authorized
- Social media links
- Branded footer

### Frontend Verification Screen
The verification screen includes:
- 🔐 Security icon
- Admin email display
- Live countdown timer (10 minutes)
- Large input for 6-digit code
- Timer turns red when < 1 minute remaining
- "Back to Login" option
- Security notice warning

### Backend Security
- Codes are 6-digit random numbers
- Codes expire after 10 minutes
- Codes are cleared after successful verification
- Failed attempts show clear error messages
- Admin role validation on every request

## API Endpoints

### 1. Login (with 2FA trigger)
```
POST /api/auth/login
Body: { email, password }

Response for admin:
{
  "success": true,
  "requiresAdminVerification": true,
  "message": "Admin verification code sent to your email",
  "data": {
    "email": "admin@example.com",
    "codeExpiresAt": "2024-01-01T12:10:00Z"
  }
}
```

### 2. Verify Admin Login
```
POST /api/auth/verify-admin-login
Body: { email, code }

Response on success:
{
  "success": true,
  "message": "Admin verification successful",
  "data": {
    "user": { ...adminUserObject },
    "token": "jwt-token-here"
  }
}
```

## Database Schema Updates

### User Model - New Fields:
```javascript
{
  adminLoginCode: String,           // 6-digit code
  adminLoginCodeExpires: Date,      // Expiration timestamp
}
```

### User Model - New Methods:
```javascript
user.generateAdminLoginCode()  // Generates 6-digit code, sets expiry
```

## Troubleshooting

### Email Not Sending
1. Check EMAIL_USERNAME and EMAIL_PASSWORD in .env
2. For Gmail: Use an [App Password](https://support.google.com/accounts/answer/185833)
3. Check backend console for email errors
4. Verify EMAIL_HOST and EMAIL_PORT settings

### Code Expired
- Codes expire after 10 minutes
- Admin must return to login screen and enter credentials again
- A new code will be sent

### Wrong Code Error
- Ensure you're entering the latest code from email
- Check for typos
- Code is exactly 6 digits (numbers only)

### Admin Can't Login
1. Verify admin account exists: Check MongoDB users collection
2. Verify EMAIL is correct in .env
3. Check if email service is configured properly
4. Review backend logs for errors

## Testing Tips

### For Development:
You can extend code expiry time in `backend/models/User.js`:
```javascript
// Change from 10 minutes to 30 minutes for testing
this.adminLoginCodeExpires = Date.now() + 30 * 60 * 1000;
```

### Manual Testing Checklist:
- ✅ Admin login triggers 2FA email
- ✅ Email arrives with correct code
- ✅ Code verification works
- ✅ Timer countdown works correctly
- ✅ Expired codes are rejected
- ✅ Wrong codes show error message
- ✅ Back button returns to login
- ✅ Successful login grants access

## Production Considerations

1. **Email Service**: Use a reliable email service (SendGrid, AWS SES, etc.)
2. **Rate Limiting**: Add rate limiting to prevent code spam
3. **Code Storage**: Codes are hashed in database (consider encryption)
4. **Logging**: Log all admin login attempts for security audit
5. **Notifications**: Consider adding SMS 2FA as backup option
6. **IP Tracking**: Log admin login IPs for security monitoring

## Benefits

✅ **Enhanced Security**: Admin accounts have extra protection layer
✅ **No Email Verification**: Admin doesn't need to verify email like students
✅ **Every Login Protected**: 2FA required for every login session
✅ **Professional UX**: Beautiful emails and smooth verification flow
✅ **Configurable**: Admin credentials managed via environment variables
✅ **Audit Trail**: All admin logins can be tracked and monitored

## Support

For issues or questions:
1. Check backend console logs
2. Check frontend console logs  
3. Verify .env configuration
4. Review this documentation
5. Check email spam folder

---

**Remember**: Admin 2FA is triggered every time an admin logs in, providing continuous security protection!
