

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  // Your Firebase config object goes here.
  // This is a placeholder and should be replaced.
  "databaseURL": "https://pumppal-n1b9n-default-rtdb.firebaseio.com",
  "projectId": "pumppal-n1b9n",
  "storageBucket": "pumppal-n1b9n.appspot.com",
};

let app: FirebaseApp | null = null;
let db: Database | null = null;
let auth: Auth | null = null;

export const isFirebaseConfigured = () => {
    return firebaseConfig && firebaseConfig.projectId && !firebaseConfig.projectId.includes("YOUR_");
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
