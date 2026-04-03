import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// --- START: Firebase Initialization and Imports ---
// Firebase SDK ke imports
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore"; // getDoc bhi add kiya hai


// **********************************************
// YAHAN AAPKO APNI FIREBASE CONFIGURATION PASTE KARNI HAI
// Yeh woh 'firebaseConfig' object hai jo aapko Firebase Console se mila tha.
// PLEASE REPLACE ALL PLACEHOLDERS WITH YOUR ACTUAL VALUES FROM FIREBASE CONSOLE!
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

// Firebase ko initialize karein aur auth & db instances lein
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
            // Naye user ke liye Firestore mein entry banayein (Yeh profile Root component mein bhi set ho raha hai)
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
                // Agar user logged in hai, toh uska profile Firestore se fetch karein
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef); // Firestore se data fetch

                if (userDoc.exists()) {
                    setUserProfile(userDoc.data());
                } else {
                    // Agar profile exist nahi karta (naya sign-up hai, ya missing hai), toh ek naya banayein
                    const initialProfile = {
                        name: currentUser.email?.split('@')[0] || "User",
                        xp: 0,
                        level: 1,
                        streak: 0,
                        rank: 0, // DUMMY VALUE ABHI KE LIYE
                        shields: 0,
                        avatar: "https://gravatar.com/avatar/?d=retro", // Dummy avatar
                        badges: [],
                        createdAt: new Date(),
                        lastUpdated: new Date()
                    };
                    await setDoc(userDocRef, initialProfile); // Create profile in Firestore
                    setUserProfile(initialProfile);
                }
            } else {
                setUserProfile(null); // User logged out hai, profile bhi null
            }
            setLoading(false); // Auth state check ho gaya, ab loading khatam
        });

        // Event listeners for your buttons (jo aapne index.html mein banaye the)
        const attachEventListeners = () => {
            const signupButton = document.getElementById('signup-button');
            const loginButton = document.getElementById('login-button');

            if (signupButton) {
                signupButton.onclick = () => handleAuth(true); // Signup logic
            }
            if (loginButton) {
                loginButton.onclick = () => handleAuth(false); // Login logic
            }
        };

        const timer = setTimeout(attachEventListeners, 500); // Small delay to ensure DOM is ready

        // Cleanup subscription and event listeners on unmount
        return () => {
            unsubscribe();
            clearTimeout(timer);
            const signupButton = document.getElementById('signup-button');
            const loginButton = document.getElementById('login-button');
            if (signupButton) signupButton.onclick = null;
            if (loginButton) loginButton.onclick = null;
        };
    }, [auth, db]); // Dependencies for useEffect

    if (loading) {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '24px', color: '#555' }}>
                Loading StreakForge...
            </div>
        );
    }

    if (user && userProfile) { // Ab user logged in ho aur uska profile bhi loaded ho
        // App component ko Firebase user, Firestore profile, db aur auth objects pass kar rahe hain
        return <App firebaseUser={user} userProfile={userProfile} db={db} auth={auth} />;
    } else {
        // Agar user logged out hai, toh aapka Login/SignUp HTML form dikhaye
        return (
            <div id="auth-section" style={{
                maxWidth: '400px', margin: '50px auto', padding: '20px',
                border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                fontFamily: 'sans-serif'
            }}>
                <h2 style={{ textAlign: 'center', color: '#333' }}>Welcome to StreakForge</h2>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>Sign Up or Log In to track your habits!</p>

                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="auth-email" style={{ display: 'block', margin-bottom: '5px', color: '#555' }}>Email:</label>
                    <input
                        type="email"
                        id="auth-email"
                        placeholder="Enter your email"
                        style={{ width: 'calc(100% - 22px)', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="auth-password" style={{ display: 'block', margin-bottom: '5px', color: '#555' }}>Password:</label>
                    <input
                        type="password"
                        id="auth-password"
                        placeholder="Enter your password"
                        style={{ width: 'calc(100% - 22px)', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button
                        id="signup-button"
                        style={{
                            flex: 1, padding: '10px 15px', backgroundColor: '#4CAF50', color: 'white',
                            border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', marginRight: '10px'
                        }}
                    >
                        Sign Up
                    </button>
                    <button
                        id="login-button"
                        style={{
                            flex: 1, padding: '10px 15px', backgroundColor: '#008CBA', color: 'white',
                            border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px'
                        }}
                    >
                        Log In
                    </button>
                </div>

                <p id="auth-message" style={{ textAlign: 'center', color: 'red', marginTop: '20px', fontSize: '14px' }}></p>
            </div>
        );
    }
};
// --- END: Root Component and Authentication Logic ---


// --- START: Update ReactDOM.createRoot ---
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root /> {/* Ab yahan aapka naya Root component render hoga */}
  </React.StrictMode>,
);
// --- END: Update ReactDOM.createRoot ---
