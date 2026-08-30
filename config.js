import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  updatePassword, 
  onAuthStateChanged,
  verifyBeforeUpdateEmail 
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import { 
  getFirestore, 
  setDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBWgwMBxUcLqFy1H5qOvytHBvOCo04jYXo",
  authDomain: "femhack-frontend.firebaseapp.com",
  projectId: "femhack-frontend",
  storageBucket: "femhack-frontend.firebasestorage.app",
  messagingSenderId: "977125930646",
  appId: "1:977125930646:web:adacdcd02f2df3087db4b7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged,
  verifyBeforeUpdateEmail,
  setDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
};