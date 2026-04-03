import React, { useEffect, useState } from 'react'; // React hooks import karein
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // Aapka main application component
import './index.css'; // Aapki global CSS file

// --- START: Firebase Initialization and Imports ---
// Firebase SDK ke imports
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, User } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore"; // setDoc ki zaroorat naye user ke liye

// **********************************************
// YAHAN AAPKO APNI FIREBASE CONFIGURATION PASTE KARNI HAI
// Yeh woh 'firebaseConfig' object hai jo aapko Firebase Console se mila tha.
// PLEASE REPLACE ALL PLACEHOLDERS WITH YOUR ACTUAL VALUES FROM FIREBASE CONSOLE!
// **********************************************
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_FROM_FIREBASE_CONSOLE", // <--- Apni asli API Key daalein
    authDomain: "YOUR_AUTH_DOMAIN_FROM_FIREBASE_CONSOLE", // <--- Apni asli Auth Domain daalein
    projectId: "streakforge-1", // Yeh same hona chahiye aapke project ID se
    storageBucket: "YOUR_STORAGE_BUCKET_FROM_FIREBASE_CONSOLE",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID_FROM_FIREBASE_CONSOLE",
    appId: "YOUR_APP_ID_FROM_FIREBASE_CONSOLE",
    measurementId: "YOUR_MEASUREMENT_ID_FROM_FIREBASE_CONSOLE" // Agar Analytics enable hai, iski value hogi
};

// Firebase ko initialize karein aur auth & db instances lein
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// --- END: Firebase Initialization and Imports ---


// --- START: Root Component and Authentication Logic ---
// Login/Signup logic function
const handleAuth = async (isSignUp: boolean) => {
    const emailInput = document.getElementById('auth-email') as HTMLInputElement;
    const passwordInput = document.getElementById('auth-password') as HTMLInputElement;
    const authMessage = document.getElementById('auth-message') as HTMLParagraphElement;

    if (!emailInput || !passwordInput || !authMessage) {
        console.error("Auth elements not found in DOM!");
        // Optional: you might want to render an error in the UI here
        return;
    }

    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        authMessage.textContent = "Please enter both email and password.";
        return;
    }
    // Password strength check (optional but recommended)
    if (password.length < 6) {
      authMessage.textContent = "Password should be at least 6 characters.";
      return;
    }

    try {
        let userCredential;
        if (isSignUp) {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Naye user ke liye Firestore mein entry banayein
            await setDoc(doc(db, "users", userCredential.user.uid), {
                name: email.split('@')[0], // Ya user se naam pooch sakte hain
                score: 0,
                createdAt: new Date(),
                lastUpdated: new Date()
            });
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
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
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

        // DOM elements ke render hone ke baad listeners attach karein
        const timer = setTimeout(attachEventListeners, 500); // 500ms delay to ensure DOM is ready

        // Cleanup subscription and event listeners on unmount
        return () => {
            unsubscribe();
            clearTimeout(timer); // Clear the timeout if component unmounts early
            const signupButton = document.getElementById('signup-button');
            const loginButton = document.getElementById('login-button');
            if (signupButton) signupButton.onclick = null;
            if (loginButton) loginButton.onclick = null;
        };
    }, []); // Empty dependency array means this runs once on mount

    if (loading) {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '24px', color: '#555' }}>
                Loading StreakForge...
            </div>
        );
    }

    if (user) {
        // Agar user logged in hai, toh aapka main App component dikhaye
        // App component ko user, db, auth objects as props pass kar rahe hain
        return <App user={user} db={db} auth={auth} />;
    } else {
        // Agar user logged out hai, toh aapka Login/SignUp HTML form dikhaye
        // Yeh woh HTML hai jo aapne index.html mein paste kiya tha
        return (
            <div id="auth-section" style={{
                maxWidth: '400px', margin: '50px auto', padding: '20px',
                border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                fontFamily: 'sans-serif'
            }}>
                <h2 style={{ textAlign: 'center', color: '#333' }}>Welcome to StreakForge</h2>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>Sign Up or Log In to track your habits!</p>

                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="auth-email" style={{ display: 'block', marginBottom: '5px', color: '#555' }}>Email:</label>
                    <input
                        type="email"
                        id="auth-email"
                        placeholder="Enter your email"
                        style={{ width: 'calc(100% - 22px)', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="auth-password" style={{ display: 'block', marginBottom: '5px', color: '#555' }}>Password:</label>
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
  </ReactMode>,
);
// --- END: Update ReactDOM.createRoot ---

