import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BottomNav from "@/components/layout/BottomNav";

// Aapke pages ke components
import Dashboard from "@/pages/Dashboard";
import Habits from "@/pages/Habits";
import Timer from "@/pages/Timer";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import SkillTree from "@/pages/SkillTree";
import NotFound from "@/pages/NotFound";

// Firebase types ko import karein
import { User } from "firebase/auth"; // Firebase Auth user type
import { Firestore } from "firebase/firestore"; // Firestore type
import { Auth } from "firebase/auth"; // Auth instance type

// App component ke props ke liye interface define karein
interface AppProps {
  firebaseUser: User;    // Firebase Authentication se aaya user object
  userProfile: any;      // Firestore se fetch kiya hua app-specific user profile
  db: Firestore;         // Firestore database instance
  auth: Auth;            // Firebase Authentication instance
}

// ErrorBoundary ko waapas add kar rahe hain, kyunki ab hum routing use karenge
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          color: 'white',
          backgroundColor: '#ff4d4d',
          textAlign: 'center',
          fontFamily: 'sans-serif',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h1>Oops! Something went wrong.</h1>
          <p>Please try again or contact support.</p>
          <p style={{ fontSize: '12px', wordBreak: 'break-all', marginTop: '15px', color: '#ffeb3b' }}>
            Error Details: {this.state.error && this.state.error.message}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// App component ko props (firebaseUser, userProfile, db, auth) milenge main.tsx se
export default function App({ firebaseUser, userProfile, db, auth }: AppProps) {
  return (
    <BrowserRouter>
      {/* Logout button top par dikhega */}
      <div style={{ padding: '10px', background: '#f0No response
      
