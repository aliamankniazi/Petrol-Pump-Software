
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';


// Your web app's Firebase configuration
// ==========================================================================================
// IMPORTANT: REPLACE THE PLACEHOLDER CONFIG WITH YOUR ACTUAL FIREBASE PROJECT CONFIGURATION.
// You can get this from the Firebase console in your project's settings.
// Go to Project Settings > General > Your apps > Web app > SDK setup and configuration
//
// The "This domain (localhost) is not authorized" error is often caused by an
// incorrect or missing `authDomain` here.
// ==========================================================================================
export const firebaseConfig: FirebaseOptions = {
  // apiKey: "YOUR_API_KEY",
  // authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  // databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  // projectId: "YOUR_PROJECT_ID",
  // storageBucket: "YOUR_PROJECT_ID.appspot.com",
  // messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  // appId: "YOUR_APP_ID"
};

const isFirebaseConfigProvided = !!firebaseConfig.apiKey;

let auth: Auth | null = null;
let db: Database | null = null;

if (isFirebaseConfigProvided) {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getDatabase(app);
} else {
    console.warn("Firebase config not provided. App will run in offline mode.");
}

export { auth, db, isFirebaseConfigProvided };
