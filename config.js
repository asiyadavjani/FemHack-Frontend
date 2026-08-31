import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Aapki Firebase Configuration Credentials
const firebaseConfig = {
  apiKey: "AIzaSyBWgwMBxUcLqFy1H5qOvytHBvOCo04jYXo",
  authDomain: "femhack-frontend.firebaseapp.com",
  projectId: "femhack-frontend",
  storageBucket: "femhack-frontend.firebasestorage.app",
  messagingSenderId: "977125930646",
  appId: "1:977125930646:web:adacdcd02f2df3087db4b7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Single Clean Export Block
export {
  auth,
  db,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  serverTimestamp
};