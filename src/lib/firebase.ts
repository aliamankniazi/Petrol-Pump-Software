// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// ==========================================================================================
// IMPORTANT: REPLACE THE PLACEHOLDER CONFIG WITH YOUR ACTUAL FIREBASE PROJECT CONFIGURATION.
// You can get this from the Firebase console in your project's settings.
// Go to Project Settings > General > Your apps > Web app > SDK setup and configuration
// ==========================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCXEB6bHuRf7q9wzAGgYDdvLGqbkPVxpDY",
  authDomain: "pumppal-n1b9n.firebaseapp.com",
  projectId: "pumppal-n1b9n",
  storageBucket: "pumppal-n1b9n.firebasestorage.app",
  messagingSenderId: "539336218754",
  appId: "1:539336218754:web:89d742ec01842916d33c9b"
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
