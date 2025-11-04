// Import the functions you need from the SDKs you need
// FIX: Use firebase/compat to support Firebase v8 syntax with a v9+ SDK installation.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

// TODO: Add your own Firebase configuration from your Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyBFMd7oZpX47QjeYsKd1A1-gTKVHmIvnBc",
  authDomain: "ad-inventory-pro-n5.firebaseapp.com",
  projectId: "ad-inventory-pro-n5",
  storageBucket: "ad-inventory-pro-n5.firebasestorage.app",
  messagingSenderId: "647173379188",
  appId: "1:647173379188:web:dc62894e192c3542bb2d21",
  measurementId: "G-V3VKNRPGTJ"

};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}


// Get Firestore and Auth instances
const db = firebase.firestore();
const auth = firebase.auth();

export { db, auth };
