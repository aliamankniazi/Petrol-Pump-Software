
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';
import { firebaseConfig } from './firebase';

let app: FirebaseApp;
let auth: Auth;
let db: Database;

// This ensures that we initialize the app only once.
if (getApps().length === 0) {
  // The initializeApp function will throw a helpful error if the config is missing any required fields.
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getDatabase(app);

export { app, auth, db };
