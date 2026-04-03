import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, Zap, Trophy, ShieldCheck } from "lucide-react";
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
        <LevelUpOverlay
          level={levelUp.level}
          onDismiss={() => setLevelUp(null)}
        />
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
        <XPToast
          xp={toast.xp}
          habitName={toast.name}
          onDone={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="px-4 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Welcome back,</p>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {user.name.split(" ")[0]} 👋
            </h1>
          </div>
          <Link to="/profile" className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-11 h-11 rounded-full border-2 border-forge-purple/60 object-cover"
              style={{ boxShadow: "0 0 12px rgba(147, 51, 234, 0.4)" }}
            />
            <div className="absolute -bottom-1 -right-1 bg-forge-gold text-[9px] font-black text-black rounded-full w-5 h-5 flex items-center justify-center">
              {user.level}
            </div>
          </Link>
        </div>

        {/* XP Bar */}
        <div className="mt-4 glass rounded-2xl p-4">
          <XPBar user={user} />
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 grid grid-cols-4 gap-2 mb-4">
        {[
          { icon: <Flame className="w-4 h-4 text-forge-flame" />, label: "Streak", value: `${user.streak}d`, color: "#f97316" },
          { icon: <Zap className="w-4 h-4 text-forge-gold" />, label: "Week XP", value: weekXP.toLocaleString(), color: "#f59e0b", small: true },
          { icon: <Trophy className="w-4 h-4 text-forge-cyan" />, label: "Rank", value: `#${user.rank}`, color: "#22d3ee" },
          { icon: <ShieldCheck className="w-4 h-4 text-forge-purple" />, label: "Shields", value: `${user.shields ?? 0}`, color: "#a855f7" },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-3 flex flex-col items-center gap-1">
            {stat.icon}
            <span
              className={`font-bold text-foreground ${stat.small ? "text-sm" : "text-base"}`}
              style={{ color: stat.color }}
            >
              {stat.value}
            </span>
            <span className="text-[10px] text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Today's Progress */}
      <div className="px-4 mb-4">
        <div className="glass rounded-2xl p-4 flex items-center gap-4">
          <CircularProgress value={completionPct} size={72} strokeWidth={6} />
          <div className="flex-1">
            <p className="text-muted-foreground text-xs mb-1">Today's Progress</p>
            <p className="text-foreground font-bold text-lg">
              {todayCompleted}/{totalHabits} habits
            </p>
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-2">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-forge-purple to-forge-cyan transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Week Streak Row */}
      <div className="px-4 mb-4">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-muted-foreground mb-3">This Week</p>
          <div className="flex justify-between">
            {weekDays.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    d.isToday
                      ? "bg-forge-purple text-white shadow-lg"
                      : weekStats[i]?.habitsCompleted > 0
                      ? "bg-forge-flame/20 text-forge-flame"
                      : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  {weekStats[i]?.habitsCompleted > 0 ? "🔥" : d.day}
                </div>
                <span className={`text-[10px] ${d.isToday ? "text-forge-purple font-bold" : "text-muted-foreground"}`}>
                  {d.day}
                </span>
              </div>
            ))}
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
          <h2 className="text-foreground font-display font-bold text-lg">Today's Habits</h2>
          <Link to="/habits" className="text-forge-purple text-sm font-medium flex items-center gap-1">
            See all
          </Link>
        </div>
        <div className="space-y-3">
          {habits.slice(0, 4).map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              completed={isHabitCompletedToday(habit)}
              onComplete={() => handleComplete(habit.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
