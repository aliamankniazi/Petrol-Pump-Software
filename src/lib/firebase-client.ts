
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';
import { firebaseConfig } from './firebase';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Database | null = null;

// Only initialize Firebase if the config appears to be valid.
// This prevents the app from crashing if the user hasn't configured it yet.
if (firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('AIzaSy')) {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  if (app) {
    auth = getAuth(app);
    db = getDatabase(app);
  }
} else {
    console.warn(`
    ****************************************************************************
    *  Firebase is not configured! Please add your project credentials to:     *
    *  src/lib/firebase.ts                                                     *
    *                                                                          *
    *  Authentication and database features will be disabled.                  *
    ****************************************************************************
    `);
}


export { app, auth, db };
