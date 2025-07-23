
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';
import { firebaseConfig } from './firebase-config';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Database | null = null;

export const isFirebaseConfigured = () => {
    // A valid config will have a non-empty apiKey.
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
    console.warn("Firebase is not configured. The app will run in a limited, offline mode.");
}

export { app, auth, db };
