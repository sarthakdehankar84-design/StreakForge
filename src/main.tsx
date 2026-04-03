import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// --- START: Firebase Initialization and Imports ---
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";


// **********************************************
// YAHAN AAPKI FIREBASE CONFIGURATION HAI
// PLEASE ENSURE THESE ARE YOUR ACTUAL VALUES FROM FIREBASE CONSOLE!
// **********************************************
const firebaseConfig = {
  apiKey: "AIzaSyB2Ehtqnn8ULUdBlzguqehz7fF7Tvj475o",
  authDomain: "streakforge-1.firebaseapp.com",
  projectId: "streakforge-1",
  storageBucket: "streakforge-1.firebasestorage.app",
  messagingSenderId: "417049730799",
  appId: "1:417049730799:web:0da3c237ba090450afc51a",
  measurementId: "G-L5GZ955J2J"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// --- END: Firebase Initialization and Imports ---


// --- START: Root Component and Authentication Logic ---
const handleAuth = async (isSignUp: boolean) => {
    const emailInput = document.getElementById('auth-email') as HTMLInputElement;
    const passwordInput = document.getElementById('auth-password') as HTMLInputElement;
No response
  
