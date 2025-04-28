import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

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

export { app, db, auth, analytics };
