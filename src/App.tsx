import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import BottomNav from "@/components/layout/BottomNav";
import Dashboard from "@/pages/Dashboard";
import Habits from "@/pages/Habits";
import Timer from "@/pages/Timer";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import SkillTree from "@/pages/SkillTree";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(147,51,234,0.35), rgba(34,211,238,0.2))",
              border: "1.5px solid rgba(147,51,234,0.55)",
              boxShadow: "0 0 30px rgba(147,51,234,0.25)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          >
            <span className="text-2xl">⚡</span>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Loading StreakForge…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <div className="max-w-lg mx-auto relative min-h-screen">
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />

        {/* Protected */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/habits" element={<ProtectedRoute><Habits /></ProtectedRoute>} />
        <Route path="/timer" element={<ProtectedRoute><Timer /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/skills" element={<ProtectedRoute><SkillTree /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Only show nav when authenticated */}
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
