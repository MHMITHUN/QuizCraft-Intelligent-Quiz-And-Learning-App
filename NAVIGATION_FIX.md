# Navigation Initialization Fix

## Problem
Users were experiencing navigation errors when logging in:
1. "Invalid or expired token" error on startup
2. "The 'navigation' object hasn't been initialized yet" errors
3. Unable to navigate to dashboard after login (student, teacher, or guest)

## Root Causes

### 1. Token Error Handling
The app was showing "Invalid or expired token" errors on every startup when the stored token was expired. This is normal behavior but was being displayed as an error to users.

### 2. Navigation Timing Issues
The `NavigationStateHandler` was trying to navigate before the navigation container was fully initialized. React Navigation needs time to mount before navigation actions can be performed.

### 3. Race Conditions
Multiple navigation resets were being triggered simultaneously without proper guards, causing conflicts.

## Solutions Implemented

### 1. Improved Token Error Handling (`src/context/AuthContext.js`)
- Added try-catch around profile loading
- Silent handling of 401 (expired token) errors on startup
- Only show user-facing errors for actual problems, not expired tokens

```javascript
// Don't set error state for expired tokens on startup - just silently log out
if (err?.response?.status === 401) {
  console.log('[AuthContext] Token expired, user needs to log in again');
}
```

### 2. Navigation Timing Guards (`App.js`)
Added multiple safety checks to ensure navigation is ready:

**a) Added `isReady()` check:**
```javascript
if (!navigationRef.isReady()) {
  return;
}
```

**b) Added small delay for navigation reset:**
```javascript
setTimeout(() => {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: targetRoute }],
    });
  }
}, 100);
```

**c) Added navigation tracking:**
```javascript
const hasNavigatedRef = React.useRef(false);
// Prevents duplicate navigation attempts
```

### 3. Centralized Navigation Utilities (`src/utils/navigationRef.js`)
Created a centralized navigation reference file following React Navigation best practices:
- Single source of truth for navigation ref
- Built-in `isReady()` checks
- Warning logs when navigation is attempted before ready

### 4. AppStack Safety Check
Added user validation before rendering AppStack:
```javascript
if (!user) {
  return <LoadingView />;
}
```

### 5. Render Delay on RootNavigator
Added small delay to ensure NavigationContainer is mounted:
```javascript
const [renderDelay, setRenderDelay] = React.useState(true);
React.useEffect(() => {
  const timer = setTimeout(() => setRenderDelay(false), 50);
  return () => clearTimeout(timer);
}, []);
```

## Testing

After these changes, test the following scenarios:

1. **Student Login:**
   - Enter student credentials
   - Should navigate to MainTabs (Home screen) without errors

2. **Teacher Login:**
   - Enter teacher credentials
   - Should navigate to TeacherDashboard without errors

3. **Guest Access:**
   - Click "Continue as Guest" button
   - Should navigate to MainTabs without errors

4. **App Restart with Expired Token:**
   - Close and reopen app with an expired token
   - Should show Welcome screen without error messages
   - Previous "Invalid or expired token" error should not appear

5. **Admin Login:**
   - Use admin credentials
   - Should navigate to AdminDashboard without errors

## Files Modified

1. `frontend/App.js`
   - Imported centralized navigationRef
   - Added navigation timing guards
   - Added delay before navigation reset
   - Added safety check in AppStack

2. `frontend/src/context/AuthContext.js`
   - Improved token error handling
   - Silent handling of expired tokens on startup

3. `frontend/src/screens/auth/LoginScreen.js`
   - Added comment about automatic navigation

4. `frontend/src/utils/navigationRef.js` (NEW)
   - Centralized navigation reference
   - Safe navigation utilities

## Key Principles

1. **Always check `navigationRef.isReady()` before navigation**
2. **Allow time for navigation container to mount**
3. **Silent handling of expected errors (like expired tokens)**
4. **Use refs to track navigation state**
5. **Prevent duplicate navigation attempts**

## References
- React Navigation docs: https://reactnavigation.org/docs/navigating-without-navigation-prop#handling-initialization
