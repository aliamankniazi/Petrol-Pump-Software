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
  // apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  // authDomain: "your-project-id.firebaseapp.com",
  // projectId: "your-project-id",
  // storageBucket: "your-project-id.appspot.com",
  // messagingSenderId: "123456789012",
  // appId: "1:123456789012:web:a1b2c3d4e5f6g7h8i9j0"
};

// A function to check if the firebaseConfig is valid
function isFirebaseConfigValid(config?: FirebaseOptions): config is FirebaseOptions {
    return !!config && !!config.apiKey;
}

// Initialize Firebase only if the config is valid
const app = !getApps().length && isFirebaseConfigValid(firebaseConfig)
  ? initializeApp(firebaseConfig)
  : getApps().length ? getApp() : null;

// Get auth instance only if app is initialized
const auth = app ? getAuth(app) : null;

export { app, auth, isFirebaseConfigValid, firebaseConfig };
