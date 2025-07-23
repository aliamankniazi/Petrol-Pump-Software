
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

// IMPORTANT: Replace the placeholder values with your actual Firebase project configuration.
// You can get this from your project's settings in the Firebase console.
// https://console.firebase.google.com/
const firebaseConfig = {
  "projectId": "pumppal-n1b9n",
  "appId": "1:539336218754:web:1e90dd372f7615d3d33c9b",
  "storageBucket": "pumppal-n1b9n.firebasestorage.app",
  "apiKey": "AIzaSyCXEB6bHuRf7q9wzAGgYDdvLGqbkPVxpDY",
  "authDomain": "pumppal-n1b9n.firebaseapp.com",
  "measurementId": "G-N85T634MQ3",
  "messagingSenderId": "539336218754"
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
