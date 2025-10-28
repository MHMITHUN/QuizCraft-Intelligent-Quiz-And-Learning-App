# Anti-Plagiarism System - QuizCraft

## 🛡️ Overview

This document describes the comprehensive anti-plagiarism system implemented in QuizCraft to prevent cheating during quiz attempts. The system works on **both mobile apps and web platforms**.

---

## ✨ Features

### 1. **App State Monitoring (Mobile)**
- Detects when users minimize the app or switch to another app
- Tracks background/inactive states on iOS and Android
- Real-time violation recording

### 2. **Tab Switching Detection (Web)**
- Uses Page Visibility API to detect tab switches
- Monitors when browser window loses focus
- Tracks attempts to open new tabs/windows

### 3. **Copy/Paste Prevention (Web)**
- Detects and blocks copy attempts
- Prevents pasting external content
- Logs all clipboard-related violations

### 4. **Right-Click Prevention (Web - Strict Mode)**
- Disables context menu during quiz
- Prevents "Search Google" and similar actions
- Optional strict mode for enhanced security

### 5. **Violation Tracking**
- Real-time violation counter with visual feedback
- Configurable maximum violations (default: 3)
- Color-coded warning system (green → yellow → orange → red)

### 6. **Auto-Submit on Max Violations**
- Automatically submits quiz when max violations reached
- Flags attempt for instructor review
- Sends complete violation log to backend

### 7. **Beautiful UI Components**
- Animated warning modals with shake effects
- Gradient-based severity indicators
- Real-time violation badge in quiz header

---

## 🏗️ Architecture

### Frontend Components

#### 1. **`useAntiPlagiarism` Hook**
Location: `frontend/src/hooks/useAntiPlagiarism.js`

**Responsibilities:**
- Monitor app/tab state changes
- Record violations with timestamps
- Trigger callbacks on violations
- Manage warning visibility

**Configuration Options:**
```javascript
{
  enabled: true,              // Enable/disable monitoring
  maxViolations: 3,           // Max violations before action
  onViolation: (violation, count) => {},  // Callback per violation
  onMaxViolations: (violations) => {},    // Callback when max reached
  strictMode: false,          // Enable strict monitoring (web)
}
```

**Violation Types:**
- `APP_SWITCH` - Mobile: User switched away from app
- `TAB_SWITCH` - Web: User switched to another tab
- `WINDOW_BLUR` - Web: Browser window lost focus
- `COPY_ATTEMPT` - Web: User attempted to copy text
- `PASTE_ATTEMPT` - Web: User attempted to paste text
- `RIGHT_CLICK` - Web: User attempted right-click

#### 2. **UI Components**

**`AntiPlagiarismWarning`** (`frontend/src/components/quiz/AntiPlagiarismWarning.js`)
- Full-screen modal with shake animation
- Gradient background based on severity
- Shows remaining chances
- "I Understand" button for dismissal

**`ViolationBadge`** (`frontend/src/components/quiz/ViolationBadge.js`)
- Small badge in quiz header
- Color-coded: Green → Yellow → Orange → Red
- Shows current violations vs. max allowed
- Pulse animation on new violations

#### 3. **Integration in TakeQuizScreen**
Location: `frontend/src/screens/quiz/TakeQuizScreen.js`

**Key Features:**
- Starts monitoring when quiz loads
- Stops monitoring on unmount or submit
- Logs violations to backend in real-time
- Auto-submits on max violations
- Includes proctoring data in submission

---

### Backend Components

#### 1. **Database Schema Updates**
Location: `backend/models/QuizAttempt.js`

**New Fields Added:**
```javascript
proctoring: {
  enabled: Boolean,
  violations: [{
    type: String,           // Type of violation
    timestamp: Date,        // When it occurred
    timeFromStart: Number,  // Seconds from quiz start
    platform: String,       // 'ios', 'android', 'web'
    description: String,    // Human-readable description
    details: Mixed          // Additional data
  }],
  violationCount: Number,
  maxViolationsReached: Boolean,
  flaggedForReview: Boolean,
  autoSubmitted: Boolean
}
```

#### 2. **API Endpoints**
Location: `backend/routes/quiz.js`

**New Endpoints:**

1. **`POST /api/quiz/:id/log-violation`**
   - Logs individual violations in real-time
   - Used for monitoring/analytics
   - Returns success confirmation

2. **`POST /api/quiz/:id/submit` (Updated)**
   - Now accepts `proctoring` data in request body
   - Stores violations with quiz attempt
   - Flags suspicious attempts for review

**Request Format:**
```javascript
{
  answers: [...],
  timeTaken: 180,
  proctoring: {
    violations: [...],
    violationCount: 2,
    maxViolationsReached: false,
    flaggedForReview: true,
    autoSubmitted: false
  }
}
```

#### 3. **API Service**
Location: `frontend/src/services/api.js`

**New Methods:**
```javascript
quizAPI.logViolation(id, violation)
quizAPI.submit(id, answers, timeTaken, proctoring)
```

---

## 🚀 Usage

### Enable/Disable Anti-Plagiarism

In `TakeQuizScreen.js`:
```javascript
const PROCTORING_ENABLED = true;  // Set to false to disable
const MAX_VIOLATIONS = 3;         // Customize max violations
```

### Customize Severity

Edit `useAntiPlagiarism.js`:
```javascript
strictMode: Platform.OS === 'web'  // Enable/disable strict mode
```

### Access Violation Data

Instructors can view violation data in quiz attempt records:
```javascript
const attempt = await QuizAttempt.findById(attemptId);
console.log(attempt.proctoring.violations);
console.log(attempt.proctoring.flaggedForReview);
```

---

## 🎨 User Experience Flow

### Normal Flow (No Violations)
1. User starts quiz
2. Green "Protected" badge shows in header
3. User completes quiz normally
4. Quiz submits successfully

### Violation Flow
1. User starts quiz
2. User switches tab/app
3. **Violation detected instantly**
4. Warning modal appears with shake animation
5. Badge updates to show 1/3 violations (yellow)
6. User clicks "I Understand"
7. Modal dismisses
8. If 3 violations → Auto-submit with flag

### Auto-Submit Flow
1. Max violations (3) reached
2. Alert: "Maximum Violations Reached"
3. Quiz auto-submits immediately
4. Attempt flagged for review
5. Instructor can see all violations

---

## 🔧 Configuration

### For Admins/Instructors

You can configure the system per quiz or globally:

```javascript
// Global configuration
const ANTI_PLAGIARISM_CONFIG = {
  enabled: true,
  maxViolations: 3,
  strictModeWeb: true,
  autoSubmitEnabled: true,
  logToBackend: true,
};
```

### Platform-Specific Features

| Feature | Mobile (iOS/Android) | Web |
|---------|---------------------|-----|
| App Switch Detection | ✅ | ❌ |
| Tab Switch Detection | ❌ | ✅ |
| Copy Prevention | ❌ | ✅ |
| Paste Prevention | ❌ | ✅ |
| Right-Click Block | ❌ | ✅ (strict mode) |
| Window Blur | ❌ | ✅ (strict mode) |

---

## 📊 Analytics & Reporting

### View Violations (Backend)

```javascript
// Get all flagged attempts
const flaggedAttempts = await QuizAttempt.find({
  'proctoring.flaggedForReview': true
});

// Get violation statistics
const violationStats = await QuizAttempt.aggregate([
  { $match: { 'proctoring.enabled': true } },
  { $group: {
    _id: '$proctoring.violationCount',
    count: { $sum: 1 }
  }}
]);
```

### Common Violation Patterns

1. **Single Tab Switch**: Usually accidental, not concerning
2. **Multiple Tab Switches**: Likely searching for answers
3. **Copy Attempts**: Attempting to copy questions for external help
4. **Mixed Violations**: High likelihood of cheating

---

## 🛠️ Troubleshooting

### Issue: False Positives on Mobile
**Solution:** Adjust debounce time in `useAntiPlagiarism.js`:
```javascript
if (timeSinceLastViolation < 2000 && violations.length > 0) {
  return; // Prevent duplicates within 2 seconds
}
```

### Issue: Users Complaining About Sensitivity
**Solution:** Increase max violations or disable strict mode:
```javascript
const MAX_VIOLATIONS = 5;  // More lenient
strictMode: false          // Disable strict checking
```

### Issue: Not Working on Web
**Solution:** Check browser compatibility:
- Page Visibility API supported in all modern browsers
- May not work in very old browsers (IE9 and below)

---

## 🔐 Privacy & Ethics

### Data Collection
- Only violation events are logged (no screen recording)
- No personal data beyond violation timestamps
- Data used solely for academic integrity

### Student Rights
- Students are informed about monitoring
- Visual indicators (badge) show active monitoring
- Violations are reviewable by instructors

### Best Practices
1. Inform students before quiz starts
2. Set reasonable max violation limits
3. Review flagged attempts manually
4. Consider context (technical issues, etc.)
5. Use as one factor, not sole determinant

---

## 📝 Future Enhancements

Possible additions for future versions:

1. **Webcam Proctoring** (Optional)
   - Face detection
   - Eye tracking
   - Multiple person detection

2. **Screen Recording**
   - Optional screen capture
   - Review suspicious sessions

3. **Browser Lock Mode**
   - Full-screen enforcement
   - Keyboard shortcut blocking

4. **AI Behavior Analysis**
   - Pattern detection
   - Anomaly scoring
   - Risk assessment

5. **Mobile Proctoring**
   - Front camera monitoring
   - Screen recording on mobile

---

## 📞 Support

For issues or questions:
- Check console logs for violation events
- Review backend logs for API errors
- Test on multiple platforms (iOS, Android, Web)
- Ensure backend models are migrated

---

## ✅ Testing Checklist

- [ ] Mobile: App switch triggers violation
- [ ] Web: Tab switch triggers violation
- [ ] Web: Copy/paste triggers violation (strict mode)
- [ ] Warning modal appears on violation
- [ ] Badge updates color correctly
- [ ] Auto-submit works at max violations
- [ ] Backend receives violation data
- [ ] Quiz submission includes proctoring data
- [ ] Violations persist in database
- [ ] No false positives on normal usage

---

## 🎓 Credits

Developed for QuizCraft by the engineering team.
Designed to maintain academic integrity while respecting student privacy.

---

**Last Updated:** 2025-10-22
**Version:** 1.0.0
