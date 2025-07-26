

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  // This is a publicly visible key, safe to be included in client-side code.
  apiKey: "YOUR_API_KEY",
  authDomain: "pumppal-n1b9n.firebaseapp.com",
  databaseURL: "https://pumppal-n1b9n-default-rtdb.firebaseio.com",
  projectId: "pumppal-n1b9n",
  storageBucket: "pumppal-n1b9n.appspot.com",
  messagingSenderId: "589332594611",
  appId: "1:589332594611:web:c084e72d2424b33537a775"
};


let app: FirebaseApp | null = null;
let db: Database | null = null;
let auth: Auth | null = null;

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
