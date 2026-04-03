import React from "react"; // React ko import karein
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

// Ab App component ko props (user, db, auth) milenge main.tsx se
export default function App({ user, db, auth }: AppProps) {
  return (
    <BrowserRouter>
      {/* Yeh ek simple bar hai jo user ka email aur Logout button dikhayega */}
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
        <Routes>
          {/* Har Route ko 'user', 'db', aur 'auth' props pass kar rahe hain */}
          {/* Ab aapke pages jaise Dashboard, Habits etc. in props ko receive kar payenge */}
          <Route path="/" element={<Dashboard user={user} db={db} auth={auth} />} />
          <Route path="/habits" element={<Habits user={user} db={db} auth={auth} />} />
          <Route path="/timer" element={<Timer user={user} db={db} auth={auth} />} />
          <Route path="/leaderboard" element={<Leaderboard user={user} db={db} auth={auth} />} />
          <Route path="/profile" element={<Profile user={user} db={db} auth={auth} />} />
          <Route path="/skills" element={<SkillTree user={user} db={db} auth={auth} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

