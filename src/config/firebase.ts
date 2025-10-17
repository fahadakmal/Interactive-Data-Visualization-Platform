import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase Configuration
 *
 * IMPORTANT: Replace these values with your actual Firebase project credentials
 *
 * To get your Firebase config:
 * 1. Go to https://console.firebase.google.com/
 * 2. Select your project (or create a new one)
 * 3. Go to Project Settings (gear icon)
 * 4. Scroll down to "Your apps" section
 * 5. Click on the web app icon (</>)
 * 6. Copy the firebaseConfig object
 *
 * For security in production:
 * - Use environment variables (Vite uses import.meta.env)
 * - Never commit real credentials to version control
 * - Set up Firebase security rules to protect your database
 */


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
