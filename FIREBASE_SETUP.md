# Firebase Setup Guide

This guide explains how to configure Firebase for your thesis experiment platform to enable automatic data storage and counterbalancing.

## Features Enabled by Firebase

1. **Automatic Data Backup**: All participant responses are automatically saved to Firebase Firestore
2. **Automatic Counterbalancing**: The system fetches the last participant's group and assigns the opposite group to ensure balanced groups
3. **Real-time Monitoring**: View participant data in real-time through the Firebase console
4. **Data Export**: Export all data for analysis directly from Firebase

## Setup Steps

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Enter a project name (e.g., "thesis-experiment-platform")
4. (Optional) Enable Google Analytics
5. Click "Create project"

### 2. Register Your Web App

1. In your Firebase project, click the web icon (`</>`) to add a web app
2. Register the app with a nickname (e.g., "Experiment Platform")
3. (Optional) Set up Firebase Hosting
4. Click "Register app"

### 3. Get Firebase Configuration

After registering the app, you'll see a `firebaseConfig` object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
   ```

3. **IMPORTANT**: Never commit `.env.local` to version control!

### 5. Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (for development)
   - For production, see "Security Rules" section below
4. Select a location (e.g., `europe-west1`)
5. Click "Enable"

### 6. Configure Security Rules

For production, update your Firestore security rules:

1. Go to Firestore Database → Rules
2. Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to participants collection
    match /participants/{participantId} {
      // Allow anyone to read (for counterbalancing)
      allow read: if true;

      // Allow anyone to create new participant records
      allow create: if true;

      // Don't allow updates or deletes (data integrity)
      allow update, delete: if false;
    }
  }
}
```

**Note**: These rules allow public read access for counterbalancing. For stricter security, consider:
- Implementing Firebase Authentication
- Using Cloud Functions for counterbalancing logic
- Restricting reads to authenticated users only

## Verification

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the browser console and look for Firebase messages:
   - ✅ `Fetching group assignment from Firebase...`
   - ✅ `Group assigned via Firebase counterbalancing: A` (or B)
   - ✅ `Data successfully synced to Firebase`

3. Check Firebase Console → Firestore Database:
   - You should see a `participants` collection
   - Each document represents one participant's data

## Testing Counterbalancing

1. Complete the experiment once:
   - Note the assigned group (A or B)
   - Check Firebase Console to verify data was saved

2. Clear browser localStorage or use incognito:
   ```javascript
   // In browser console:
   localStorage.clear();
   location.reload();
   ```

3. Start a new session:
   - The system should assign the opposite group
   - Example: If first participant was Group A, second will be Group B

## Data Structure in Firebase

Each participant document contains:

```javascript
{
  participantId: "uuid-string",
  assignedGroup: "A" | "B",
  demographics: {
    age: "25-34",
    education: "Bachelor's degree",
    chartExperience: "Intermediate",
    environmentalBackground: "Some background"
  },
  taskResponses: [
    {
      taskId: "T1",
      question: "...",
      selectedAnswer: "A) Temperature",
      isCorrect: true,
      completionTime: 45000,
      metrics: {
        answerChanges: 2,
        timeToFirstInteraction: 5000,
        pauseCount: 1
      },
      layout: "overlay",
      timestamp: 1234567890
    }
    // ... more tasks
  ],
  satisfactionResponses: [
    {
      blockId: "1",
      layout: "overlay",
      ease: 4,
      wouldUse: 5,
      timestamp: 1234567890
    }
    // ... more blocks
  ],
  umuxResponse: {
    q1: 5,
    q2: 2,
    q3: 5,
    q4: 2
  },
  finalPreference: {
    preference: "overlay",
    reason: "Easier to compare..."
  },
  timestamp: Firestore.Timestamp,
  completedAt: Firestore.Timestamp (optional)
}
```

## Exporting Data from Firebase

### Method 1: Firebase Console (Manual)

1. Go to Firestore Database
2. Select `participants` collection
3. Click on each document to view data
4. Use "Export" feature for bulk export

### Method 2: Using Firebase Admin SDK (Programmatic)

Create a Node.js script:

```javascript
const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Export all participants
async function exportData() {
  const snapshot = await db.collection('participants')
    .orderBy('timestamp', 'desc')
    .get();

  const data = [];
  snapshot.forEach(doc => {
    data.push({ id: doc.id, ...doc.data() });
  });

  fs.writeFileSync('participants.json', JSON.stringify(data, null, 2));
  console.log(`Exported ${data.length} participants`);
}

exportData();
```

### Method 3: Using the Built-in Service (TypeScript)

```typescript
import { getAllParticipants, exportAllDataAsJSON } from './services/firebaseService';

// Get all participants
const participants = await getAllParticipants();
console.log(`Retrieved ${participants.length} participants`);

// Export as JSON string
const jsonData = await exportAllDataAsJSON();
// Save to file or process as needed
```

## Troubleshooting

### Error: "Firebase not properly configured"

- Check that `.env.local` exists and contains valid credentials
- Restart the development server after adding environment variables
- Verify variable names start with `VITE_` (required by Vite)

### Error: "Permission denied" when reading/writing

- Check Firestore security rules
- Ensure database is in "test mode" for development
- Verify rules allow read access for counterbalancing

### Counterbalancing not working

- Check browser console for Firebase errors
- Verify at least one participant exists in Firestore
- Try clearing localStorage: `localStorage.clear()`

### Data not syncing

- Check browser console for sync errors
- Verify internet connection
- Check Firebase Console → Firestore for new documents
- Review Firebase quotas (free tier has limits)

## Firebase Free Tier Limits

- **Firestore Reads**: 50,000 per day
- **Firestore Writes**: 20,000 per day
- **Storage**: 1 GB
- **Network**: 10 GB per month

For a typical thesis with 30 participants and 6 tasks each:
- **Writes**: ~30 participants × 1 write = 30 writes ✅
- **Reads for counterbalancing**: ~30 reads ✅
- **Storage**: ~30 KB per participant × 30 = ~900 KB ✅

The free tier is sufficient for thesis experiments.

## Production Deployment

When deploying to production:

1. **Use environment variables** in your hosting provider:
   - Vercel: Add vars in project settings
   - Netlify: Add vars in site settings
   - Firebase Hosting: Use `firebase functions:config:set`

2. **Update security rules** to restrict access

3. **Enable Firebase Authentication** for admin access

4. **Set up backup exports**:
   - Use Firebase Console → Firestore → Import/Export
   - Schedule regular exports to Cloud Storage

5. **Monitor usage** in Firebase Console → Usage and billing

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Review Firebase Console for errors
3. Verify all setup steps were completed
4. Check that your Firebase project is active and not suspended
