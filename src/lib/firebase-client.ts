
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

// IMPORTANT: Replace the placeholder values with your actual Firebase project configuration.
// You can get this from your project's settings in the Firebase console.
// https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  databaseURL: 'YOUR_DATABASE_URL',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Database | null = null;

export const isFirebaseConfigured = () => {
    // A valid config will have a non-empty apiKey that isn't a placeholder.
    return firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("YOUR_");
}

if (isFirebaseConfigured()) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    auth = getAuth(app);
    db = getDatabase(app);
} else {
    console.warn("Firebase is not configured. The app will run in a limited, offline mode. Please update src/lib/firebase-client.ts with your project credentials.");
}

export { app, auth, db };
