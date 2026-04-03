import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, Zap, Trophy, ChevronRight, Star, TrendingUp, Swords, ShieldCheck } from "lucide-react";
import { getUser, getHabits, completeHabit, isHabitCompletedToday, todayStr, getMissedStreakInfo } from "@/lib/storage";
import { mockDailyStats } from "@/lib/mockData";
import type { User, Habit } from "@/types";
import CircularProgress from "@/components/features/CircularProgress";
import XPBar from "@/components/features/XPBar";
import HabitCard from "@/components/features/HabitCard";
import XPToast from "@/components/features/XPToast";
import LevelUpOverlay from "@/components/features/LevelUpOverlay";
import ShieldModal from "@/components/features/ShieldModal";
import DailyChallenges from "@/components/features/DailyChallenges";

export default function Dashboard() {
  const [user, setUser] = useState<User>(getUser());
  const [habits, setHabits] = useState<Habit[]>(getHabits());
  const [toast, setToast] = useState<{ xp: number; name: string } | null>(null);
  const [levelUp, setLevelUp] = useState<{ level: number } | null>(null);
  const [shieldModal, setShieldModal] = useState<{ streakAtRisk: number } | null>(null);

  // Check for missed streak once per day session
  useEffect(() => {
    const sessionKey = `sf_shield_check_${todayStr()}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, "1");
      const { missed, streakAtRisk } = getMissedStreakInfo();
      if (missed && streakAtRisk > 0) {
        setTimeout(() => setShieldModal({ streakAtRisk }), 800);
      }
    }
  }, []);

  const todayStats = mockDailyStats[mockDailyStats.length - 1];
  const completedToday = habits.filter(h => isHabitCompletedToday(h)).length;
  const totalHabits = habits.length;
  const completionPct = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  const xpToNextLevel = user.level * 100;
  const xpProgress = Math.min(user.xp % xpToNextLevel, xpToNextLevel);

  const handleComplete = (habit: Habit) => {
    const prevLevel = user.level;
    const result = completeHabit(habit.id);
    if (!result) return;
    const updated = getUser();
    setUser(updated);
    setHabits(getHabits());
    setToast({ xp: result.xpEarned, name: habit.name });
    if (updated.level > prevLevel) {
      setTimeout(() => setLevelUp({ level: updated.level }), 600);
    }
  };

  const handleShieldUsed = () => {
    setUser(getUser());
    setShieldModal(null);
  };

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/30 to-gray-950 pb-nav">
      {toast && (
        <XPToast xp={toast.xp} habitName={toast.name} onDone={() => setToast(null)} />
      )}
      {levelUp && (
        <LevelUpOverlay level={levelUp.level} onDone={() => setLevelUp(null)} />
      )}
      {shieldModal && (
        <ShieldModal
          streakAtRisk={shieldModal.streakAtRisk}
          onUseShield={handleShieldUsed}
          onClose={() => setShieldModal(null)}
        />
      )}

      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-gray-400 text-sm font-medium">{greeting},</p>
            <h1 className="text-white text-2xl font-bold tracking-tight">{user.name} 👋</h1>
          </div>
          <Link to="/profile">
            <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-purple-500/40 hover:ring-purple-400 transition-all">
              <img
                src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=streak"}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
        </div>

        {/* XP Bar */}
        <XPBar xp={xpProgress} maxXp={xpToNextLevel} level={user.level} />
      </div>

      {/* Stats Row */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/10">
            <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
            <p className="text-white font-bold text-lg leading-none">{user.streak}</p>
            <p className="text-gray-500 text-xs mt-1">Streak</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/10">
            <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-white font-bold text-lg leading-none">{user.xp}</p>
            <p className="text-gray-500 text-xs mt-1">Total XP</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/10">
            <Trophy className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <p className="text-white font-bold text-lg leading-none">#{user.rank}</p>
            <p className="text-gray-500 text-xs mt-1">Rank</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/10">
            <ShieldCheck className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-white font-bold text-lg leading-none">{user.shields ?? 0}</p>
            <p className="text-gray-500 text-xs mt-1">Shields</p>
          </div>
        </div>
      </div>

      {/* Today's Progress */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/30 rounded-3xl p-4 border border-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-white font-bold text-lg">Today's Progress</h2>
              <p className="text-gray-400 text-sm">{completedToday} of {totalHabits} habits done</p>
            </div>
            <CircularProgress value={completionPct} size={64} strokeWidth={6} color="#a855f7" />
          </div>

          {/* Habit mini-cards */}
          <div className="flex gap-2 flex-wrap">
            {habits.slice(0, 4).map(habit => {
              const done = isHabitCompletedToday(habit);
              return (
                <div
                  key={habit.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    done
                      ? "bg-green-500/20 text-green-300 border border-green-500/30"
                      : "bg-white/5 text-gray-400 border border-white/10"
                  }`}
                >
                  <span>{habit.icon}</span>
                  <span>{habit.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Daily Challenges */}
      <div className="px-4 mb-4">
        <DailyChallenges onXPEarned={() => setUser(getUser())} />
      </div>

      {/* Today's Habits */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Today's Habits
          </h2>
          <Link to="/habits" className="text-purple-400 text-sm flex items-center gap-1 hover:text-purple-300 transition-colors">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {habits.slice(0, 4).map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onComplete={handleComplete}
              completed={isHabitCompletedToday(habit)}
            />
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <Link to="/timer">
            <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/30 rounded-2xl p-4 border border-blue-500/20 hover:border-blue-400/40 transition-all">
              <TrendingUp className="w-6 h-6 text-blue-400 mb-2" />
              <p className="text-white font-semibold text-sm">Focus Timer</p>
              <p className="text-gray-500 text-xs mt-0.5">Start a session</p>
            </div>
          </Link>
          <Link to="/leaderboard">
            <div className="bg-gradient-to-br from-orange-900/40 to-red-900/30 rounded-2xl p-4 border border-orange-500/20 hover:border-orange-400/40 transition-all">
              <Swords className="w-6 h-6 text-orange-400 mb-2" />
              <p className="text-white font-semibold text-sm">Leaderboard</p>
              <p className="text-gray-500 text-xs mt-0.5">#{user.rank} globally</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
