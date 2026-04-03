import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, Zap, Trophy, ChevronRight, ShieldCheck } from "lucide-react";
import { getUser, getHabits, completeHabit, isHabitCompletedToday, todayStr, getMissedStreakInfo } from "@/lib/storage";
import { mockDailyStats } from "@/lib/mockData";
import type { Habit } from "@/types";
import CircularProgress from "@/components/features/CircularProgress";
import XPBar from "@/components/features/XPBar";
import HabitCard from "@/components/features/HabitCard";
import XPToast from "@/components/features/XPToast";
import LevelUpOverlay from "@/components/features/LevelUpOverlay";
import ShieldModal from "@/components/features/ShieldModal";
import DailyChallenges from "@/components/features/DailyChallenges";

export default function Dashboard() {
  const [user, setUser] = useState(getUser());
  const [habits, setHabits] = useState<Habit[]>(getHabits());
  const [toast, setToast] = useState<{ xp: number; name: string } | null>(null);
  const [levelUp, setLevelUp] = useState<{ level: number } | null>(null);
  const [shieldModal, setShieldModal] = useState<{ streakAtRisk: number } | null>(null);

  useEffect(() => {
    const sessionKey = `sf_shield_check_${todayStr()}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, "1");
      const { missed, streakAtRisk } = getMissedStreakInfo();
      if (missed && streakAtRisk > 0) {
        setTimeout(() => setShieldModal({ streakAtRisk }), 1200);
      }
    }
  }, []);

  const todayCompleted = habits.filter(isHabitCompletedToday).length;
  const totalHabits = habits.length;
  const completionPct = totalHabits > 0 ? Math.round((todayCompleted / totalHabits) * 100) : 0;

  const weekStats = mockDailyStats.slice(-7);
  const weekXP = weekStats.reduce((s, d) => s + d.xpEarned, 0);
  const shields = user.shields ?? 0;

  const handleComplete = (habitId: string) => {
    const result = completeHabit(habitId);
    if (result.xpEarned > 0) {
      setHabits(getHabits());
      setUser(getUser());
      setToast({ xp: result.xpEarned, name: result.habit.name });
      if (result.leveledUp) {
        setTimeout(() => setLevelUp({ level: result.newLevel }), 600);
      }
    }
  };

  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - 6 + i);
    return {
      day: dayNames[d.getDay()],
      date: d.toISOString().split("T")[0],
      isToday: d.toISOString().split("T")[0] === todayStr(),
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] pb-nav">
      {levelUp && (
        <LevelUpOverlay level={levelUp.level} onDismiss={() => setLevelUp(null)} />
      )}
      {shieldModal && (
        <ShieldModal
          missedStreak={shieldModal.streakAtRisk}
          onUsed={() => {
            setShieldModal(null);
            setUser(getUser());
          }}
          onDecline={() => setShieldModal(null)}
        />
      )}
      {toast && (
        <XPToast xp={toast.xp} habitName={toast.name} onDone={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-gray-400 text-sm">Welcome back,</p>
            <h1 className="text-white font-bold text-2xl font-display">{user.username} 👋</h1>
          </div>
          <Link to="/profile">
            <div className="relative">
              <img
                src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=streak"}
                alt="avatar"
                className="w-12 h-12 rounded-full border-2 border-purple-500 object-cover"
              />
              <div className="absolute -bottom-1 -right-1 bg-purple-600 rounded-full px-1.5 py-0.5 text-[10px] text-white font-bold">
                {user.level}
              </div>
            </div>
          </Link>
        </div>
        <XPBar xp={user.xp} level={user.level} />
      </div>

      {/* Stats Row */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Streak", value: `${user.streak}🔥`, color: "text-orange-400" },
            { label: "Week XP", value: weekXP, color: "text-purple-400" },
            { label: "Level", value: user.level, color: "text-yellow-400" },
            { label: "Shields", value: shields, color: "text-blue-400", icon: <ShieldCheck size={14} className="text-blue-400 mx-auto" /> },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-3 flex flex-col items-center">
              {stat.icon ? stat.icon : null}
              <span className={`font-bold text-lg ${stat.color}`}>{stat.value}</span>
              <span className="text-gray-500 text-[10px]">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Progress Ring */}
      <div className="px-4 mb-4">
        <div className="glass rounded-3xl p-4 flex items-center gap-4">
          <CircularProgress percentage={completionPct} size={80} />
          <div className="flex-1">
            <h3 className="text-white font-semibold text-base">Today's Progress</h3>
            <p className="text-gray-400 text-sm">{todayCompleted}/{totalHabits} habits done</p>
            <div className="flex gap-1 mt-2">
              {weekDays.map((d) => (
                <div
                  key={d.date}
                  className={`flex-1 rounded-full text-center text-[9px] py-1 font-medium transition-all ${
                    d.isToday
                      ? "bg-purple-600 text-white"
                      : "bg-white/5 text-gray-500"
                  }`}
                >
                  {d.day}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Challenges */}
      <div className="px-4 mb-4">
        <DailyChallenges />
      </div>

      {/* Today's Habits */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold text-lg font-display">Today's Habits</h2>
          <Link to="/habits" className="flex items-center gap-1 text-purple-400 text-sm font-medium">
            Manage <ChevronRight size={14} />
          </Link>
        </div>
        <div className="space-y-3">
          {habits.slice(0, 4).map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              completed={isHabitCompletedToday(habit)}
              onComplete={handleComplete}
            />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <Link to="/timer">
            <div className="glass rounded-2xl p-4 flex items-center gap-3 border border-purple-500/20 hover:border-purple-500/50 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
                <Zap size={20} className="text-purple-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Focus Timer</p>
                <p className="text-gray-500 text-xs">Start session</p>
              </div>
            </div>
          </Link>
          <Link to="/leaderboard">
            <div className="glass rounded-2xl p-4 flex items-center gap-3 border border-yellow-500/20 hover:border-yellow-500/50 transition-all">
              <div className="w-10 h-10 rounded-xl bg-yellow-600/20 flex items-center justify-center">
                <Trophy size={20} className="text-yellow-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Leaderboard</p>
                <p className="text-gray-500 text-xs">See rankings</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
