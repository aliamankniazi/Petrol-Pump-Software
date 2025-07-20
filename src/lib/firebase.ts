// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// ==========================================================================================
// IMPORTANT: REPLACE THE PLACEHOLDER CONFIG WITH YOUR ACTUAL FIREBASE PROJECT CONFIGURATION.
// You can get this from the Firebase console in your project's settings.
// Go to Project Settings > General > Your apps > Web app > SDK setup and configuration
// =================================e==========================================================
const firebaseConfig: FirebaseOptions = {
  // apiKey: "YOUR_API_KEY",
  // authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  // projectId: "YOUR_PROJECT_ID",
  // storageBucket: "YOUR_PROJECT_ID.appspot.com",
  // messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  // appId: "YOUR_APP_ID"
};

// A function to check if the firebaseConfig is valid
function isFirebaseConfigValid(config?: FirebaseOptions): config is FirebaseOptions {
    return !!config && !!config.apiKey && config.apiKey !== 'YOUR_API_KEY';
}

// Initialize Firebase only if the config is valid
const app = !getApps().length && isFirebaseConfigValid(firebaseConfig)
  ? initializeApp(firebaseConfig)
  : getApps().length ? getApp() : null;

// Get auth instance only if app is initialized
const auth = app ? getAuth(app) : null;

export { app, auth, isFirebaseConfigValid, firebaseConfig };
