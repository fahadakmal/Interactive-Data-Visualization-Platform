# Firebase Data Saving Verification Guide

## Current Status

✅ **Firebase Integration Code Review Complete**

The codebase has proper Firebase integration implemented:
- Automatic data sync on experiment completion
- Error handling and status indicators
- Environment variable configuration
- All necessary data fields included

## Firebase Configuration

**Project Details** (from .env.local):
- Project ID: `visualization-909dc`
- Auth Domain: `visualization-909dc.firebaseapp.com`
- Collection Name: `participants`

**Firebase Console URL**: https://console.firebase.google.com/project/visualization-909dc/firestore

## How to Verify Firebase is Saving Data

### Step 1: Complete a Test Experiment Session

1. Open the application: http://localhost:5173/ (or your deployment URL)
2. Click "Start Experiment"
3. Fill in demographics form with test data:
   - Age: 25
   - Education: Bachelor's Degree
   - Chart Experience: Moderate
   - Environmental Background: No
4. Click "Continue" through instructions
5. Complete all 6 tasks in the test block
6. Fill out the UMUX questionnaire
7. **Watch for Firebase sync status** on the completion screen

### Step 2: Check Completion Screen Status

On the ExperimentCompletion screen, you should see one of these alerts:

**✅ SUCCESS (Green Alert)**:
```
Data successfully synced to Firebase
Your responses have been securely saved. Thank you for participating!
```

**❌ ERROR (Red Alert)**:
```
Failed to sync data to Firebase: [error message]
Your responses are saved locally. Please contact the researcher.
```

**⚠️ DISABLED (Yellow Alert)**:
```
Firebase sync disabled (development mode)
Data saved locally only. Enable Firebase in production.
```

### Step 3: Verify Data in Firebase Console

1. Go to: https://console.firebase.google.com/project/visualization-909dc/firestore
2. Navigate to: **Firestore Database** → **Data** tab
3. Look for the `participants` collection
4. You should see a new document with:
   - Auto-generated document ID
   - Timestamp (when the data was saved)

### Step 4: Inspect Saved Data Structure

Click on the document to see the saved fields:

```javascript
{
  participantId: "abc123-def456-...",        // UUID
  assignedGroup: "A" or "B",                  // Random assignment
  timestamp: Timestamp,                        // Auto-generated
  demographics: {
    age: "25",
    education: "Bachelor's Degree",
    chartExperience: "Moderate",
    environmentalBackground: "No"
  },
  taskResponses: [
    {
      taskId: "task-temperature-identify",
      question: "What is the highest temperature...",
      userAnswer: "8.5",
      correctAnswer: "8.5",
      isCorrect: true,
      responseTime: 5432,
      layout: "overlay",
      // ... more fields
    },
    // ... 5 more tasks
  ],
  satisfactionResponses: [
    {
      taskId: "task-temperature-identify",
      rating: 5,
      // ... more fields
    },
    // ... 5 more ratings
  ],
  umuxResponse: {
    q1_capabilities: 7,
    q2_ease: 6,
    q3_learning: 7,
    q4_efficient: 6,
    umuxScore: 80.83
  },
  finalPreference: {
    // Same as umuxResponse
  }
}
```

## Console Logs to Watch

### During Experiment Completion:

**SUCCESS Pattern**:
```
📤 Syncing participant data to Firebase...
✅ Participant data saved to Firebase with ID: abc123xyz
✅ Data successfully synced to Firebase
```

**ERROR Pattern**:
```
📤 Syncing participant data to Firebase...
❌ Error saving participant data to Firebase: [error details]
❌ Failed to sync data to Firebase: [error message]
```

**DISABLED Pattern**:
```
⚠️ Firebase not configured - skipping automatic sync
```

## Troubleshooting

### Issue 1: "Firebase sync disabled (development mode)"

**Cause**: Environment variables not loaded properly

**Solution**:
1. Check `.env.local` file exists in project root
2. Verify it contains all required variables:
   ```
   VITE_FIREBASE_API_KEY=AIzaSyD1nZSsuxDo8-dMOUzCos0fYnWXIzkrVHg
   VITE_FIREBASE_AUTH_DOMAIN=visualization-909dc.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=visualization-909dc
   VITE_FIREBASE_STORAGE_BUCKET=visualization-909dc.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=175896856437
   VITE_FIREBASE_APP_ID=1:175896856437:web:2646aa8ee8139148d4753c
   ```
3. Restart the development server: `npm run dev`

### Issue 2: "Failed to sync data to Firebase: Missing or insufficient permissions"

**Cause**: Firestore security rules not configured

**Solution**:
1. Go to: https://console.firebase.google.com/project/visualization-909dc/firestore/rules
2. Set rules to allow writes:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /participants/{document=**} {
         allow read, write: if true; // For testing only!
       }
     }
   }
   ```
3. Click "Publish"

**⚠️ Security Warning**: The above rules allow anyone to write to your database. For production, implement proper authentication and rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /participants/{participantId} {
      allow create: if true; // Allow creating new participant records
      allow read: if false;  // Prevent reading other participants' data
      allow update, delete: if false; // Prevent modifications
    }
  }
}
```

### Issue 3: "Failed to sync data to Firebase: Network request failed"

**Cause**: Firewall, network issues, or Firebase project doesn't exist

**Solution**:
1. Check internet connection
2. Verify Firebase project exists: https://console.firebase.google.com/project/visualization-909dc
3. Check if Firestore is enabled (not Realtime Database)
4. Check browser console for CORS errors

### Issue 4: Data saves but with incorrect structure

**Cause**: Code changes not matching expected schema

**Solution**:
1. Check `src/services/firebaseService.ts:84-98` for saveParticipantData function
2. Verify data being passed matches ParticipantData interface
3. Check console logs for data structure before saving

## Verifying Automatic Counterbalancing

Firebase also handles automatic counterbalancing (equal distribution of Group A and B).

### How to Test:
1. Complete 2-3 test sessions
2. Check Firebase console
3. Verify `assignedGroup` alternates between "A" and "B"
4. First participant should be Group B (odd UUID last digit)
5. Second participant should be Group A (even UUID last digit)

**Note**: Counterbalancing is based on the participant's UUID last character parity, not sequential in Firebase.

## Expected Behavior Summary

| Stage | Expected Behavior | Firebase Console |
|-------|------------------|------------------|
| Welcome Screen | Participant ID and Group assigned | No data yet |
| Demographics | Data collected locally | No data yet |
| Test Block | Responses recorded locally | No data yet |
| UMUX | Satisfaction recorded locally | No data yet |
| Completion Screen | **Automatic Firebase sync** | ✅ New document created |

## Quick Verification Checklist

- [ ] Development server running
- [ ] `.env.local` file exists with Firebase credentials
- [ ] Complete a test experiment session (all 6 tasks + UMUX)
- [ ] See green "Data successfully synced" alert on completion screen
- [ ] Check Firebase console → Firestore Database → participants collection
- [ ] Verify new document exists with correct structure
- [ ] Check console logs for "✅ Participant data saved to Firebase with ID: ..."

## Files Implementing Firebase Integration

1. **src/config/firebase.ts** - Firebase initialization and configuration
2. **src/services/firebaseService.ts** - All Firebase operations (save, fetch, counterbalancing)
3. **src/components/ExperimentCompletion.tsx:81-129** - Automatic sync on completion
4. **src/contexts/VisualizationContext.tsx** - Data collection and state management

## Production Deployment Notes

When deploying to production (Netlify, Vercel, etc.):

1. Add environment variables to deployment platform:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

2. Update Firebase security rules for production (see Issue 2 above)

3. Test with a real participant session before going live

## Contact Support

If you encounter issues not covered in this guide:
1. Check browser console for error messages
2. Check Firebase Console → Logs for backend errors
3. Verify all files are saved (especially .env.local)
4. Restart development server after .env.local changes

---

**Last Updated**: 2025-10-12
**Firebase Project**: visualization-909dc
**Collection**: participants
