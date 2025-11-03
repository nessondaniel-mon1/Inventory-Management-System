// Import the functions you need from the SDKs you need
// FIX: Use firebase/compat to support Firebase v8 syntax with a v9+ SDK installation.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

// TODO: Add your own Firebase configuration from your Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyBEYt04rq-fkBmEuU7C5RWzAzDEq33KGpQ",
  authDomain: "ad-inventory-manager.firebaseapp.com",
  projectId: "ad-inventory-manager",
  storageBucket: "ad-inventory-manager.firebasestorage.app",
  messagingSenderId: "263895413323",
  appId: "1:263895413323:web:52137d440b3458b4be53ce",
  measurementId: "G-822KTTHXMX"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}


// Get Firestore and Auth instances
const db = firebase.firestore();
const auth = firebase.auth();

export { db, auth };
