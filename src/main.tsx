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
    const authMessage = document.getElementById('auth-message') as HTMLParagraphElement;

    if (!emailInput || !passwordInput || !authMessage) {
        console.error("Auth elements not found in DOM!");
        authMessage.textContent = "Error: Authentication form elements not found.";
        return;
    }

    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        authMessage.textContent = "Please enter both email and password.";
        return;
    }
    if (password.length < 6) {
      authMessage.textContent = "Password should be at least 6 characters.";
      return;
    }

    try {
        let userCredential;
        if (isSignUp) {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const initialProfile = {
                name: email.split('@')[0] || "User",
                xp: 0,
                level: 1,
                streak: 0,
                rank: 0,
                shields: 0,
                avatar: "https://gravatar.com/avatar/?d=retro",
                badges: [],
                createdAt: new Date(),
                lastUpdated: new Date()
            };
            await setDoc(doc(db, "users", userCredential.user.uid), initialProfile);
            authMessage.textContent = "Registration successful! You are now logged in.";
        } else {
            userCredential = await signInWithEmailAndPassword(auth, email, password);
            authMessage.textContent = "Login successful!";
        }
        console.log("Auth success:", userCredential.user.uid);
    } catch (error: any) {
        const errorMessage = error.message;
        console.error("Auth error:", errorMessage);
        authMessage.textContent = `Error: ${errorMessage}`;
    }
};

const Root = () => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null); // Firebase Authentication user
    const [userProfile, setUserProfile] = useState<any | null>(null); // Firestore user profile

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = awaitNo response
              
