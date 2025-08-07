
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
// Auth is no longer used, but we keep the import to avoid breaking other files if they reference it.
// It will be tree-shaken by the bundler in production.
import { getAuth, type Auth } from 'firebase/auth';

// =================================================================================
// IMPORTANT: REPLACE THIS ENTIRE OBJECT WITH YOUR FIREBASE PROJECT CONFIG
// =================================================================================
// To get this:
// 1. Go to the Firebase Console: https://console.firebase.google.com/
// 2. Select your project.
// 3. Click the gear icon (Project settings) in the top-left corner.
// 4. In the "Your apps" card, select your web app.
// 5. In the "SDK setup and configuration" section, choose "Config".
// 6. Copy the entire `firebaseConfig` object and paste it here.
// =================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCXEB6bHuRf7q9wzAGgYDdvLGqbkPVxpDY",
  authDomain: "pumppal-n1b9n.firebaseapp.com",
  databaseURL: "https://pumppal-n1b9n-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pumppal-n1b9n",
  storageBucket: "pumppal-n1b9n.appspot.com",
  messagingSenderId: "539336218754",
  appId: "1:539336218754:web:1e90dd372f7615d3d33c9b",
  measurementId: "G-N85T634MQ3"
};


// This function checks if the placeholder values have been replaced.
export const isFirebaseConfigured = () => {
    return firebaseConfig && firebaseConfig.projectId && firebaseConfig.apiKey && firebaseConfig.projectId !== 'pumppal-n1b9n';
}

let app: FirebaseApp;
if (isFirebaseConfigured() && getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else if(isFirebaseConfigured()) {
  app = getApps()[0];
}

// @ts-ignore
const db: Database = isFirebaseConfigured() ? getDatabase(app) : null;
// @ts-ignore
const auth: Auth = isFirebaseConfigured() ? getAuth(app) : null; // Auth is not used but kept for type consistency if needed


// @ts-ignore
export { app, db, auth };
