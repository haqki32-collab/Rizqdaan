
import { initializeApp, getApps, getApp } from "firebase/app";
import * as firebaseAuth from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const { getAuth, GoogleAuthProvider } = firebaseAuth;

// ==================================================================
// CONFIGURATION LOADED
// Keys have been applied from your Firebase Console screenshot.
// ==================================================================

const firebaseConfig = {
  apiKey: "AIzaSyAfv3SjVOWJCbS-RB_cuHKSrQ0uv4kJ__s",
  authDomain: "rizqdaan.firebaseapp.com",
  projectId: "rizqdaan",
  storageBucket: "rizqdaan.firebasestorage.app",
  messagingSenderId: "6770003964",
  appId: "1:6770003964:web:3e47e1d4e4ba724c446c79"
};

// Initialize Firebase
let app;
let auth: any = null;
let db: any = null;
const googleProvider = new GoogleAuthProvider();

// Helper to check if config is valid
export const isFirebaseConfigured = () => {
  // Check if the placeholder text has been removed/replaced
  return firebaseConfig.apiKey !== "PASTE_YOUR_API_KEY_HERE";
};

try {
    // We initialize only if the keys look valid (not the default placeholder)
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "PASTE_YOUR_API_KEY_HERE") {
        
        // 1. Robust App Initialization
        // Check if firebase app is already initialized to avoid "App already exists" errors during hot reload
        if (!getApps().length) {
            app = initializeApp(firebaseConfig);
        } else {
            app = getApp();
        }

        auth = getAuth(app);
        
        // 2. Robust Firestore Initialization
        // We use initializeFirestore to enforce long polling which fixes the "Backend didn't respond" error
        // on restricted networks (like StackBlitz, corporate firewalls, specific mobile carriers).
        try {
            db = initializeFirestore(app, {
                experimentalForceLongPolling: true,
            });
        } catch (e: any) {
            // If Firestore was already initialized (e.g. by a previous HMR cycle or another component),
            // we just retrieve the existing instance.
            db = getFirestore(app);
        }
        
        console.log("Firebase connected successfully to project:", firebaseConfig.projectId);
    } else {
        console.warn("Firebase keys are missing. Using mock mode.");
    }
} catch (error: any) {
    // Log only the message string to avoid "Converting circular structure to JSON" errors
    const errorMessage = error?.message || String(error);
    console.error("Firebase initialization error: " + errorMessage);
}

// We no longer export 'storage' because we are using Cloudinary
export { auth, db, googleProvider };
