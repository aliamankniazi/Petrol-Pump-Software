
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getAuth, type Auth } from 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCXEB6bHuRf7q9wzAGgYDdvLGqbkPVxpDY",
    authDomain: "pumppal-n1b9n.firebaseapp.com",
    databaseURL: "https://pumppal-n1b9n-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "pumppal-n1b9n",
    storageBucket: "pumppal-n1b9n.firebasestorage.app",
    messagingSenderId: "539336218754",
    appId: "1:539336218754:web:1e90dd372f7615d3d33c9b",
    measurementId: "G-N85T634MQ3"
  };

// This function checks if the Firebase config has been filled out.
const isFirebaseConfigured = () => {
    // A basic check to see if the config has been populated.
    // Replace "YOUR_PROJECT_ID" with an actual check against the placeholder value.
    return firebaseConfig && firebaseConfig.projectId && firebaseConfig.projectId !== "pumppal-n1b9n";
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
