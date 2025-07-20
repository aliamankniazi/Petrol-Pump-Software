
import { type FirebaseOptions } from "firebase/app";
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
  // databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  // projectId: "YOUR_PROJECT_ID",
  // storageBucket: "YOUR_PROJECT_ID.appspot.com",
  // messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  // appId: "YOUR_APP_ID"
};

// We export the config directly. The useAuth hook will handle initialization.
// This simplifies the logic and prevents race conditions on app load.
