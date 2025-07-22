
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';
import { firebaseConfig } from './firebase';

let app: FirebaseApp;
let auth: Auth;
let db: Database;

if (getApps().length === 0) {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
  } else {
    // This case should ideally not be reached if the config is present.
    // We throw an error to make it clear that the app cannot function without configuration.
    // This helps in debugging during setup.
    console.error("Firebase config is missing. The application cannot be initialized.");
    // In a real app, you might want to show a user-friendly message
    // instead of throwing an error, but for development, this is clearer.
    // We'll assign empty objects to satisfy TypeScript, but the app will not be functional.
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Database;
  }
} else {
  // If the app is already initialized, just get the existing instances.
  app = getApps()[0];
  auth = getAuth(app);
  db = getDatabase(app);
}

export { app, auth, db };
