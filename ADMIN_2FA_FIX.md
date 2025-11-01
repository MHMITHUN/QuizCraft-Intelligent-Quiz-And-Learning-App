# Admin 2FA Navigation Fix

## Problem
After entering admin credentials on the Admin Login screen, the 2FA verification screen was not appearing.

## Root Cause
The `AdminLoginScreen` was attempting to conditionally render the `AdminVerificationScreen` component directly instead of using React Navigation's `navigate()` method. This approach doesn't work properly with React Navigation's stack-based routing.

```javascript
// ❌ OLD APPROACH (Incorrect)
if (showVerification) {
  return (
    <AdminVerificationScreen 
      navigation={navigation}
      route={{ params: { email: verificationEmail } }}
    />
  );
}
```

## Solution
Changed `AdminLoginScreen` to properly navigate to the `AdminVerification` screen using the navigation prop:

```javascript
// ✅ NEW APPROACH (Correct)
if (result.requiresAdminVerification) {
  console.log('[AdminLoginScreen] 2FA required, navigating to verification');
  navigation.navigate('AdminVerification', { email: result.email });
}
```

## Files Modified
- `frontend/src/screens/auth/AdminLoginScreen.js`
  - Removed conditional rendering of `AdminVerificationScreen`
  - Removed unused state variables (`showVerification`, `verificationEmail`)
  - Removed unused import of `AdminVerificationScreen`
  - Changed to use `navigation.navigate()` when 2FA is required

## How It Works Now

### Login Flow
1. User enters admin email and password on `AdminLoginScreen`
2. Backend validates credentials
3. Backend generates and sends 6-digit code via email
4. Backend returns `requiresAdminVerification: true`
5. Frontend navigates to `AdminVerification` screen with email parameter
6. User enters 6-digit code
7. Backend verifies code and issues authentication token
8. User is logged in and redirected to admin dashboard

### Navigation Registration
The `AdminVerification` screen is registered in both navigation stacks:

**AuthStack** (for unauthenticated users):
```javascript
<Stack.Screen name="AdminVerification" component={AdminVerificationScreen} />
```

**AppStack** (for authenticated users):
```javascript
<Stack.Screen 
  name="AdminVerification" 
  component={AdminVerificationScreen}
  options={{ title: 'Admin Verification', headerShown: false }}
/>
```

## Testing the Fix
1. Go to Welcome screen
2. Click the red "🔐 Admin Login" button
3. Enter admin credentials:
   - Email: (your admin email from .env)
   - Password: (your admin password from .env)
4. Click "Login as Admin"
5. **The AdminVerification screen should now appear** ✅
6. Check your email for the 6-digit code
7. Enter the code in the verification screen
8. You should be logged in as admin

## Verification Checklist
- ✅ Backend sends 2FA email with code
- ✅ Backend returns `requiresAdminVerification: true`
- ✅ Frontend receives the response correctly
- ✅ Navigation to `AdminVerification` screen works
- ✅ Email parameter is passed to verification screen
- ✅ Verification screen displays correctly
- ✅ Code verification completes login flow

## Environment Variables Required
```env
# Backend .env
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=your-secure-password
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

## Troubleshooting

### If screen still doesn't appear:
1. Check console logs for navigation errors
2. Verify `AdminVerification` is registered in navigation stack
3. Ensure backend is returning `requiresAdminVerification: true`
4. Check that email parameter is being passed correctly

### If verification fails:
1. Check that email service is configured correctly
2. Verify admin email in .env matches login email
3. Check code hasn't expired (10 minute expiration)
4. Verify backend `/auth/verify-admin-login` endpoint is working

## Related Files
- `frontend/App.js` - Navigation stack registration
- `frontend/src/screens/auth/AdminLoginScreen.js` - Admin login screen
- `frontend/src/screens/auth/AdminVerificationScreen.js` - 2FA verification screen
- `frontend/src/context/AuthContext.js` - Authentication state management
- `frontend/src/services/api.js` - API service methods
- `backend/routes/auth.js` - Authentication endpoints
- `backend/models/User.js` - User model with 2FA methods
