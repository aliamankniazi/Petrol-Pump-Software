
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getAuth, type Auth } from 'firebase/auth';

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

let app: FirebaseApp;
let db: Database;
let auth: Auth;

if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Firebase initialization error", error);
  }
} else {
  app = getApps()[0];
}

const isFirebaseConfigured = () => {
    return firebaseConfig && firebaseConfig.projectId && firebaseConfig.apiKey && firebaseConfig.projectId !== 'pumppal-n1b9n';
}

if (isFirebaseConfigured()) {
    try {
        db = getDatabase(app);
        auth = getAuth(app);
    } catch(e) {
        console.error("Error getting database or auth instance", e);
    }
} else {
    console.warn("Firebase is not configured. Skipping database and auth initialization.");
}

// @ts-ignore
export { app, db, auth, isFirebaseConfigured };
