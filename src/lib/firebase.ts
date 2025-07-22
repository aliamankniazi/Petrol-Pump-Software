import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Your Firebase project configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyCXEB6bHuRf7q9wzAGgYDdvLGqbkPVxpDY",
  authDomain: "pumppal-n1b9n.firebaseapp.com",
  databaseURL: "https://pumppal-n1b9n-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pumppal-n1b9n",
  storageBucket: "pumppal-n1b9n.appspot.com", // ✅ Corrected bucket
  messagingSenderId: "539336218754",
  appId: "1:539336218754:web:1e90dd372f7615d3d33c9b"
};

// Helper to validate config
function isFirebaseConfigValid(config?: FirebaseOptions): config is FirebaseOptions {
  return (
    !!config &&
    typeof config.apiKey === "string" &&
    config.apiKey.trim() !== "" &&
    !config.apiKey.startsWith("YOUR_FIREBASE_API_KEY")
  );
}

// Initialize Firebase app (only once)
const app: FirebaseApp | null = (() => {
  if (!getApps().length && isFirebaseConfigValid(firebaseConfig)) {
    return initializeApp(firebaseConfig);
  } else if (getApps().length) {
    return getApp();
  } else {
    console.warn("Firebase config is invalid or missing.");
    return null;
  }
})();

// Initialize services
const auth: Auth | null = app ? getAuth(app) : null;
const db: Database | null = app ? getDatabase(app) : null;
const storage: FirebaseStorage | null = app ? getStorage(app) : null;

// Export everything
export {
  app,
  auth,
  db,
  storage,
  firebaseConfig,
  isFirebaseConfigValid
};
