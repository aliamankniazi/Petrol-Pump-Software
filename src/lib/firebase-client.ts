
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';
import { firebaseConfig } from './firebase';

let app: FirebaseApp;
let auth: Auth;
let db: Database;

// This check is a safeguard to remind you to fill in your Firebase configuration.
// The "Firebase: Error (auth/invalid-api-key)" error is caused by an
// incorrect or missing configuration below.
if (!firebaseConfig || !firebaseConfig.apiKey) {
  console.error(`
    ****************************************************************************
    *  Your Firebase configuration is missing or using placeholder values!     *
    *  Please open 'src/lib/firebase.ts' and replace the placeholder           *
    *  configuration with your actual Firebase project credentials.            *
    *  You can find these credentials in your Firebase project settings.       *
    ****************************************************************************
  `);
}


if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getDatabase(app);

export { app, auth, db };
