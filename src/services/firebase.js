import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAvWSfxED9AuoXpqw_06gSWJ8FJsV0s7N4",
  authDomain: "bhejo-f30b8.firebaseapp.com",
  databaseURL: "https://bhejo-f30b8-default-rtdb.firebaseio.com",
  projectId: "bhejo-f30b8",
  storageBucket: "bhejo-f30b8.firebasestorage.app",
  messagingSenderId: "380929875887",
  appId: "1:380929875887:web:7f42a7d269490c32d3595a",
  measurementId: "G-FD122DEC67"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const rtdb = getDatabase(app); // Initialize Realtime Database

// Enable authentication persistence
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Firebase auth persistence error:", error);
  });

// Enable offline data persistence (with error handling for multiple tabs)
const enableOfflinePersistence = async () => {
  try {
    await enableMultiTabIndexedDbPersistence(db);
    console.log("Multi-tab Firestore persistence enabled");
  } catch (error) {
    if (error.code === 'failed-precondition') {
      // Multiple tabs open, fallback to regular persistence
      try {
        await enableIndexedDbPersistence(db);
        console.log("Single-tab Firestore persistence enabled");
      } catch (err) {
        console.error("Firestore persistence error:", err);
      }
    } else if (error.code === 'unimplemented') {
      console.warn("Firestore persistence not supported by browser");
    } else {
      console.error("Firestore persistence error:", error);
    }
  }
};

// Don't wait for this promise - let it run in background
enableOfflinePersistence();

// Analytics helper function
export const logAnalyticsEvent = (eventName, eventParams = {}) => {
  try {
    logEvent(analytics, eventName, eventParams);
  } catch (error) {
    console.error("Analytics error:", error);
  }
};

// Cache size configuration for better performance
const firestoreSettings = {
  cacheSizeBytes: 50 * 1024 * 1024, // 50 MB
};

export { app, db, auth, analytics, rtdb, firestoreSettings };