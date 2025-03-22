import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAf8N8d6WPa-MFofL9900238jcicU5WdOY",
    authDomain: "plantkeeper-app.firebaseapp.com",
    projectId: "plantkeeper-app",
    storageBucket: "plantkeeper-app.firebasestorage.app",
    messagingSenderId: "11583777848",
    appId: "1:11583777848:web:87b0581b3e2e20446d4acd",
    measurementId: "G-JL4WFLF3TT"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

export { app, db, auth };
