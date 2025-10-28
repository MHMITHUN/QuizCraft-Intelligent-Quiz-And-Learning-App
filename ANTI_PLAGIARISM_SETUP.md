# Quick Setup Guide - Anti-Plagiarism System

## 🚀 Quick Start

The anti-plagiarism system is **already integrated** into your QuizCraft app! Follow these steps to test and configure it.

---

## ✅ What's Already Done

✅ **Frontend:**
- Custom hook created: `useAntiPlagiarism.js`
- Warning modal: `AntiPlagiarismWarning.js`
- Violation badge: `ViolationBadge.js`
- Integrated into: `TakeQuizScreen.js`

✅ **Backend:**
- Database schema updated: `QuizAttempt.js`
- API endpoint added: `POST /api/quiz/:id/log-violation`
- Submit endpoint updated to accept proctoring data
- API service methods: `logViolation()` and updated `submit()`

---

## 🧪 Testing the System

### Test on Web (Easiest)

1. **Start your app:**
   ```bash
   npm run web
   ```

2. **Take a quiz:**
   - Login/register
   - Start any quiz
   - Notice the green "Protected" badge in the header

3. **Trigger violations:**
   - **Switch tabs:** Open a new tab → Warning appears! ⚠️
   - **Copy text:** Select and copy question text → Violation logged
   - **Paste:** Try to paste → Violation logged
   - **Right-click:** Try right-click (if strict mode enabled)

4. **Observe behavior:**
   - Badge changes color: Green → Yellow → Orange → Red
   - Warning modal pops up with shake animation
   - After 3 violations → Quiz auto-submits

### Test on Mobile (iOS/Android)

1. **Start app on device/emulator:**
   ```bash
   npm run android
   # or
   npm run ios
   ```

2. **Take a quiz:**
   - Start quiz on mobile app
   - Notice the "Protected" badge

3. **Trigger violations:**
   - **Switch apps:** Press home button or switch to another app
   - **Background app:** Pull down notification center
   - Return to app → Warning modal appears!

4. **Observe behavior:**
   - Same as web (badge color, warnings, auto-submit)

---

## ⚙️ Configuration

### Change Maximum Violations

Edit `frontend/src/screens/quiz/TakeQuizScreen.js`:

```javascript
const MAX_VIOLATIONS = 5;  // Change from 3 to 5
```

### Disable Anti-Plagiarism

Edit `frontend/src/screens/quiz/TakeQuizScreen.js`:

```javascript
const PROCTORING_ENABLED = false;  // Set to false
```

### Enable Strict Mode (Web Only)

Edit `frontend/src/screens/quiz/TakeQuizScreen.js`:

```javascript
strictMode: true,  // Enable for all platforms
// or
strictMode: Platform.OS === 'web',  // Only on web (default)
```

**Strict mode adds:**
- Window blur detection
- Right-click prevention
- More sensitive monitoring

---

## 🎨 Customization

### Change Violation Colors

Edit `frontend/src/components/quiz/ViolationBadge.js`:

```javascript
const getColor = () => {
  const ratio = violationCount / maxViolations;
  if (ratio >= 1) return '#DC2626';   // Red (change this)
  if (ratio >= 0.66) return '#F59E0B'; // Orange (change this)
  if (ratio >= 0.33) return '#FBBF24'; // Yellow (change this)
  return '#10B981';                    // Green (change this)
};
```

### Customize Warning Message

Edit `frontend/src/components/quiz/AntiPlagiarismWarning.js`:

```javascript
// Line 89-93 - Customize the message
<Text style={styles.message}>
  Your custom warning message here!
</Text>
```

### Change Animation Duration

Edit `frontend/src/components/quiz/AntiPlagiarismWarning.js`:

```javascript
// Line 27-31 - Adjust shake animation
Animated.timing(shakeAnim, { 
  toValue: 10, 
  duration: 50,  // Change duration (milliseconds)
  useNativeDriver: true 
})
```

---

## 🔍 Debugging

### View Violation Logs (Console)

Open browser console or React Native debugger. You'll see:

```
✅ Anti-plagiarism monitoring started
🚨 Anti-Plagiarism Violation: TAB_SWITCH {type: "TAB_SWITCH", ...}
🚨 Proctoring violation - User: 123..., Quiz: 456..., Type: TAB_SWITCH
```

### Check Backend Logs

In your backend console:

```bash
cd backend
npm run dev
```

Look for:
```
🚨 Proctoring violation - User: <userId>, Quiz: <quizId>, Type: <type>
```

### Database Inspection

Check MongoDB for proctoring data:

```javascript
// In MongoDB shell or Compass
db.quizhistories.find({ "proctoring.enabled": true })
db.quizhistories.find({ "proctoring.flaggedForReview": true })
```

---

## 📊 View Results

### For Students
Students will see warnings during the quiz but won't see their violation count in results (this is intentional).

### For Instructors
Instructors can query flagged attempts:

```javascript
// Backend route (add this to your admin routes)
router.get('/admin/flagged-attempts', async (req, res) => {
  const flagged = await QuizHistory.find({
    'proctoring.flaggedForReview': true
  }).populate('user quiz');
  
  res.json({ success: true, data: flagged });
});
```

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot find module 'useAntiPlagiarism'"

**Fix:** Make sure the hook file exists:
```bash
ls frontend/src/hooks/useAntiPlagiarism.js
```

If missing, the file should be at:
`frontend/src/hooks/useAntiPlagiarism.js`

### Issue: Warning modal not showing

**Fix:** Check that `PROCTORING_ENABLED = true` in TakeQuizScreen.js

### Issue: Badge not visible

**Fix:** Check browser console for errors. Make sure ViolationBadge component is imported correctly.

### Issue: Violations not saving to database

**Fix:** 
1. Check backend logs for errors
2. Ensure QuizAttempt model has proctoring fields
3. Restart backend server
4. Check MongoDB connection

### Issue: Too many false positives

**Fix:** Adjust debounce time or increase max violations:

```javascript
// In useAntiPlagiarism.js, line 40
if (timeSinceLastViolation < 5000) {  // Increase from 2000 to 5000
  return;
}
```

---

## 🎯 Testing Checklist

Before going live, test these scenarios:

- [ ] Web: Switch tab → Violation detected
- [ ] Web: Copy text → Violation detected  
- [ ] Web: Right-click → Blocked (if strict mode)
- [ ] Mobile: Switch app → Violation detected
- [ ] Mobile: Background app → Violation detected
- [ ] Badge shows correct color
- [ ] Warning modal appears
- [ ] Modal dismisses with "I Understand"
- [ ] 3 violations → Auto-submit
- [ ] Backend receives violation data
- [ ] Flagged attempts show in database
- [ ] Normal usage doesn't trigger violations

---

## 📱 Platform-Specific Notes

### Web
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Page Visibility API is widely supported
- Copy/paste detection works great
- Right-click can be prevented in strict mode

### iOS
- AppState API works perfectly
- App switch detection is reliable
- Background detection works when pulling notification center
- No false positives in normal usage

### Android
- AppState API works well
- Detects app switching
- May have slight delay compared to iOS
- Works with split-screen mode

---

## 🚀 Going Live

### Before Enabling for Students:

1. **Test thoroughly** on all platforms
2. **Inform students** about the monitoring
3. **Set reasonable limits** (recommend 3-5 violations)
4. **Review flagged attempts manually** (don't auto-fail)
5. **Have a process** for students to appeal

### Recommended Settings:

```javascript
// For high-stakes exams
const PROCTORING_ENABLED = true;
const MAX_VIOLATIONS = 3;
strictMode: Platform.OS === 'web'

// For practice quizzes
const PROCTORING_ENABLED = false;  // Or set to true with higher limit
const MAX_VIOLATIONS = 10;
```

---

## 💡 Tips

1. **Start lenient:** Begin with 5 violations, reduce if needed
2. **Monitor patterns:** Look for repeat offenders vs. one-time incidents
3. **Consider context:** Technical issues can cause false positives
4. **Communicate clearly:** Tell students what will be monitored
5. **Use as deterrent:** Often just showing the badge prevents cheating

---

## 📞 Need Help?

- Check console logs (browser DevTools or React Native debugger)
- Review `ANTI_PLAGIARISM_GUIDE.md` for detailed documentation
- Test on different devices and browsers
- Check backend API responses

---

**That's it! Your anti-plagiarism system is ready to use! 🎉**

Test it out and adjust settings as needed. The system is designed to be flexible and configurable.
