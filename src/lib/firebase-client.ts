
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getAuth, type Auth } from 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
  };

// This function checks if the Firebase config has been filled out.
const isFirebaseConfigured = () => {
    // A basic check to see if the config has been populated.
    // Replace "YOUR_PROJECT_ID" with an actual check against the placeholder value.
    return firebaseConfig && firebaseConfig.projectId && firebaseConfig.projectId !== "YOUR_PROJECT_ID";
};

let app: FirebaseApp;
let db: Database;
let auth: Auth;

if (isFirebaseConfigured()) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getDatabase(app);
    auth = getAuth(app);
} else {
    // Provide mock objects or handle the unconfigured state gracefully.
    // @ts-ignore
    app = {};
    // @ts-ignore
    db = {};
    // @ts-ignore
    auth = {};
}


export { app, db, auth, isFirebaseConfigured };
