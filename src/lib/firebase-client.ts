
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';
import { firebaseConfig } from './firebase';

let app: FirebaseApp;
let auth: Auth;
let db: Database;

export const isFirebaseConfigured = () => {
    return firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("AIzaSy");
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
    console.warn("Firebase is not configured. The app will run in offline mode.");
}


// @ts-ignore
export { app, auth, db };
