import React from "react"; // React ko import karein (pehle se ho sakta hai)
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

// Firebase types ko import karein, yeh types main.tsx se mil rahe hain
import { User } from "firebase/auth";
import { Firestore } from "firebase/firestore";
import { Auth } from "firebase/auth"; 

// App component ke props ke liye interface define karein
// Yeh batata hai ki App component ko kaunse data milenge
interface AppProps {
  user: User;    // Current logged-in user object
  db: Firestore; // Firestore database instance
  auth: Auth;    // Firebase Authentication instance
}

// --- START: Error Boundary Component (naya code) ---
// Yeh component app mein aane wale errors ko pakdega aur screen par dikhayega
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Aap is error ko kisi logging service ko bhi bhej sakte hain
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Yahan hum error message ko screen par dikha rahe hain
      return (
        <div style={{
          padding: '20px',
          color: 'white',
          backgroundColor: '#ff4d4d', // Red background
          textAlign: 'center',
          fontFamily: 'sans-serif',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h1>Oops! Something went wrong.</h1>
          <p>We are trying to fix it. Please try again later.</p>
          <p style={{ fontSize: '12px', wordBreak: 'break-all', marginTop: '15px', color: '#ffeb3b' }}>
            Error Details: {this.state.error && this.state.error.message}
          </p>
          {/* Agar zyada details chahiye to yahan this.state.error.stack bhi dikha sakte hain */}
        </div>
      );
    }

    return this.props.children;
  }
}
// --- END: Error Boundary Component ---


// Ab App component ko props (user, db, auth) milenge main.tsx se
export default function App({ user, db, auth }: AppProps) {
  return (
    <BrowserRouter>
      {/* Yeh Logout button top par dikhega */}
      <div style={{ padding: '10px', background: '#f0f0f0', borderBottom: '1px solid #ccc', textAlign: 'right' }}>
        <span style={{ marginRight: '15px' }}>Logged in as: {user.email}</span>
        <button
          onClick={async () => {
            try {
              await auth.signOut(); // User ko logout karein
              alert("Logged out successfully!");
            } catch (error) {
              console.error("Logout error:", error);
              alert("Error logging out.");
            }
          }}
          style={{
            padding: '8px 12px',
            backgroundColor: '#f44336', // Red color for logout
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Logout
        </button>
      </div>

      <div className="max-w-lg mx-auto relative min-h-screen">
        {/* Error Boundary ko Routes ke charon taraf wrap karein */}
        <ErrorBoundary>
            <Routes>
              {/* Har Route ko 'user', 'db', aur 'auth' props pass kar rahe hain */}
              <Route path="/" element={<Dashboard user={user} db={db} auth={auth} />} />
              <Route path="/habits" element={<Habits user={user} db={db} auth={auth} />} />
              <Route path="/timer" element={<Timer user={user} db={db} auth={auth} />} />
              <Route path="/leaderboard" element={<Leaderboard user={user} db={db} auth={auth} />} />
              <Route path="/profile" element={<Profile user={user} db={db} auth={auth} />} />
              <Route path="/skills" element={<SkillTree user={user} db={db} auth={auth} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
        </ErrorBoundary>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
