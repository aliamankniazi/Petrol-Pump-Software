
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getAuth, type Auth } from 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    projectId: "pumppal-n1b9n",
    appId: "1:539336218754:web:1e90dd372f7615d3d33c9b",
    storageBucket: "pumppal-n1b9n.firebasestorage.app",
    apiKey: "AIzaSyCXEB6bHuRf7q9wzAGgYDdvLGqbkPVxpDY",
    authDomain: "pumppal-n1b9n.firebaseapp.com",
    measurementId: "G-N85T634MQ3",
    messagingSenderId: "539336218754",
    databaseURL: "https://pumppal-n1b9n-default-rtdb.asia-southeast1.firebasedatabase.app"
  };

// This function checks if the Firebase config has been filled out.
const isFirebaseConfigured = () => {
    // A basic check to see if the config has been populated.
    // Replace "YOUR_PROJECT_ID" with an actual check against the placeholder value.
    return firebaseConfig && firebaseConfig.projectId && firebaseConfig.projectId !== "YOUR_PROJECT_ID" && firebaseConfig.apiKey !== "YOUR_API_KEY";
};

let app: FirebaseApp | undefined;
let db: Database | undefined;
let auth: Auth | undefined;

if (isFirebaseConfigured()) {
    try {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        db = getDatabase(app);
        auth = getAuth(app);
    } catch(e) {
        console.error("Failed to initialize Firebase", e);
    }
} else {
    console.warn("Firebase is not configured. Please add your Firebase project configuration to src/lib/firebase-client.ts");
}


export { app, db, auth, isFirebaseConfigured };
