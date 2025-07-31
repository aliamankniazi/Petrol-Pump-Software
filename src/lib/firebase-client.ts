
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getAuth, type Auth } from 'firebase/auth';

// IMPORTANT: REPLACE WITH YOUR FIREBASE PROJECT CONFIG
// To get this, go to the Firebase Console, open your project,
// go to Project Settings (gear icon), and under "Your apps",
// find your Web app and copy the firebaseConfig object.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};


let app: FirebaseApp | null = null;
let db: Database | null = null;
let auth: Auth | null = null;

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
    auth = getAuth(app);
} else {
    console.warn("Firebase is not configured. The app will run in a limited, offline mode. Please update src/lib/firebase-client.ts with your project credentials.");
}

export { app, db, auth };
