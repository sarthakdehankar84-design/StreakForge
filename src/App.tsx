import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/layout/BottomNav";
import Dashboard from "@/pages/Dashboard";
import Habits from "@/pages/Habits";
import Timer from "@/pages/Timer";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import SkillTree from "@/pages/SkillTree";
import Coach from "@/pages/Coach";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import { Flame } from "lucide-react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forge-purple to-forge-cyan flex items-center justify-center glow-purple animate-pulse">
          <Flame className="w-7 h-7 text-white" />
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-forge-purple"
              style={{ animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forge-purple to-forge-cyan flex items-center justify-center glow-purple animate-pulse">
          <Flame className="w-7 h-7 text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto relative min-h-screen">
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/habits" element={<ProtectedRoute><Habits /></ProtectedRoute>} />
        <Route path="/timer" element={<ProtectedRoute><Timer /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/skills" element={<ProtectedRoute><SkillTree /></ProtectedRoute>} />
        <Route path="/coach" element={<ProtectedRoute><Coach /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {user && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
