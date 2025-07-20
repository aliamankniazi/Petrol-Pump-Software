// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// ==========================================================================================
// IMPORTANT: REPLACE THE PLACEHOLDER CONFIG WITH YOUR ACTUAL FIREBASE PROJECT CONFIGURATION.
// You can get this from the Firebase console in your project's settings.
// Go to Project Settings > General > Your apps > Web app > SDK setup and configuration
// ==========================================================================================
const firebaseConfig: FirebaseOptions = {
  // apiKey: "YOUR_API_KEY",
  // authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  // projectId: "YOUR_PROJECT_ID",
  // storageBucket: "YOUR_PROJECT_ID.appspot.com",
  // messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  // appId: "YOUR_APP_ID"
};

// A function to check if the firebaseConfig placeholder values have been replaced.
function isConfigProvided(config?: FirebaseOptions): config is FirebaseOptions {
    return !!config && !!config.apiKey && config.apiKey.includes('AIza');
}


// Initialize Firebase
let app;
let auth;
const isFirebaseConfigured = isConfigProvided(firebaseConfig);

if (isFirebaseConfigured) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
} else {
    app = null;
    auth = null;
}

export { app, auth, firebaseConfig, isFirebaseConfigured };
