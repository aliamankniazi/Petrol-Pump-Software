
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';
import { firebaseConfig } from './firebase';

// ==========================================================================================
// CRITICAL: This is a pre-emptive check to ensure you've configured your Firebase project.
// If you see the error "Your Firebase configuration is missing...", it means you need to
// update the `src/lib/firebase.ts` file with your actual project credentials.
// ==========================================================================================
if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('AIzaSy')) {
  throw new Error(`
    ****************************************************************************
    *  Your Firebase configuration is missing or using placeholder values!     *
    *  Please open 'src/lib/firebase.ts' and replace the placeholder           *
    *  configuration with your actual Firebase project credentials.            *
    *  You can find these credentials in your Firebase project settings.       *
    ****************************************************************************
  `);
}

let app: FirebaseApp;
let auth: Auth;
let db: Database;

// This ensures that we initialize the app only once.
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getDatabase(app);

export { app, auth, db };
