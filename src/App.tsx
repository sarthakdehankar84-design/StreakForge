import { BrowserRouter, Routes, Route } from "react-router-dom";
import BottomNav from "@/components/layout/BottomNav";
import Dashboard from "@/pages/Dashboard";
import Habits from "@/pages/Habits";
import Timer from "@/pages/Timer";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import SkillTree from "@/pages/SkillTree";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <div className="max-w-lg mx-auto relative min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/timer" element={<Timer />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/skills" element={<SkillTree />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
