
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
// Auth is no longer used, but we keep the import to avoid breaking other files if they reference it.
// It will be tree-shaken by the bundler in production.
import { getAuth, type Auth } from 'firebase/auth';

// =================================================================================
// IMPORTANT: REPLACE THIS ENTIRE OBJECT WITH YOUR FIREBASE PROJECT CONFIG
// =================================================================================
// To get this:
// 1. Go to the Firebase Console: https://console.firebase.google.com/
// 2. Select your project.
// 3. Click the gear icon (Project settings) in the top-left corner.
// 4. In the "Your apps" card, select your web app.
// 5. In the "SDK setup and configuration" section, choose "Config".
// 6. Copy the entire `firebaseConfig` object and paste it here.
// =================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCXEB6bHuRf7q9wzAGgYDdvLGqbkPVxpDY",
  authDomain: "pumppal-n1b9n.firebaseapp.com",
  databaseURL: "https://pumppal-n1b9n-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pumppal-n1b9n",
  storageBucket: "pumppal-n1b9n.appspot.com",
  messagingSenderId: "539336218754",
  appId: "1:539336218754:web:1e90dd372f7615d3d33c9b",
  measurementId: "G-N85T634MQ3"
};


let app: FirebaseApp | null = null;
let db: Database | null = null;
let auth: Auth | null = null; // Auth is no longer initialized or used

// This function checks if the placeholder values have been replaced.
export const isFirebaseConfigured = () => {
    return firebaseConfig && firebaseConfig.projectId && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("YOUR_");
}

if (isFirebaseConfigured()) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    db = getDatabase(app);
    // Do not initialize auth
    // auth = getAuth(app);
} else {
    console.warn("Firebase is not configured. The app will run in a limited, offline mode. Please update src/lib/firebase-client.ts with your project credentials.");
}

export { app, db, auth };
