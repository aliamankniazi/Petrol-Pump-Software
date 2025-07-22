
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';
import { firebaseConfig } from './firebase';

let app: FirebaseApp;
let auth: Auth;
let db: Database;

if (firebaseConfig.apiKey && getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getDatabase(app);
} else {
  // This might happen in a server-side context where you don't want to initialize Firebase,
  // or if the config is missing.
  if (getApps().length > 0) {
    app = getApps()[0];
    auth = getAuth(app);
    db = getDatabase(app);
  } else {
    // Fallback for environments where config might not be available.
    // The UI should handle the lack of an auth instance gracefully.
    // @ts-ignore
    auth = {}; 
    // @ts-ignore
    db = {};
  }
}

export { app, auth, db };
