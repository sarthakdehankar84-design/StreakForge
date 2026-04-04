import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Zap, Trophy, ChevronRight, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getOrCreateGameState,
  updateGameState,
  fetchHabits,
  updateHabit,
  todayStr,
  type GameState,
} from "@/lib/db";
import { awardBadgeIfEarned } from "@/lib/badges";
import type { Habit } from "@/types";
import CircularProgress from "@/components/features/CircularProgress";
import XPBar from "@/components/features/XPBar";
import HabitCard from "@/components/features/HabitCard";
import XPToast from "@/components/features/XPToast";
import LevelUpOverlay from "@/components/features/LevelUpOverlay";
import ShieldModal from "@/components/features/ShieldModal";
import DailyChallenges from "@/components/features/DailyChallenges";

export default function Dashboard() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ xp: number; name: string } | null>(null);
  const [levelUp, setLevelUp] = useState<{ level: number } | null>(null);
  const [shieldModal, setShieldModal] = useState<{ streakAtRisk: number } | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [gs, hs] = await Promise.all([
      getOrCreateGameState(user.id),
      fetchHabits(user.id),
    ]);
    setGameState(gs);
    setHabits(hs);
    setLoading(false);

    // Check missed streak
    const sessionKey = `sf_shield_check_${todayStr()}_${user.id}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, "1");
      if (gs.streak > 0) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split("T")[0];
        const anyYesterday = hs.some((h) => h.completedDates.includes(yStr));
        const anyToday = hs.some((h) => h.completedDates.includes(todayStr()));
        if (!anyYesterday && !anyToday) {
          setTimeout(() => setShieldModal({ streakAtRisk: gs.streak }), 1200);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isHabitCompletedToday = (habit: Habit) => habit.completedDates.includes(todayStr());

  const todayCompleted = habits.filter(isHabitCompletedToday).length;
  const totalHabits = habits.length;
  const completionPct = totalHabits > 0 ? Math.round((todayCompleted / totalHabits) * 100) : 0;
  const shields = gameState?.shields ?? 0;

  const handleComplete = async (habitId: string) => {
    if (!user || !gameState) return;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit || isHabitCompletedToday(habit)) return;

    const today = todayStr();
    const newDates = [...habit.completedDates, today];

    // Streak calc
    let streak = 0;
    const d = new Date();
    while (newDates.includes(d.toISOString().split("T")[0])) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    const newBestStreak = Math.max(habit.bestStreak, streak);

    // Update habit
    await updateHabit(habitId, {
      completedDates: newDates,
      streak,
      bestStreak: newBestStreak,
      totalCompletions: habit.totalCompletions + 1,
    });

    // Update game state
    let { xp, level, xpToNextLevel, totalXp, streak: userStreak, longestStreak, shields: sh } = gameState;
    xp += habit.xpPerCompletion;
    totalXp += habit.xpPerCompletion;
    let leveledUp = false;
    if (xp >= xpToNextLevel) {
      xp -= xpToNextLevel;
      level += 1;
      leveledUp = true;
    }
    const newUserStreak = Math.max(userStreak, streak);
    const newLongestStreak = Math.max(longestStreak, newUserStreak);
    let newShields = sh;
    if (newUserStreak > 0 && newUserStreak % 7 === 0 && newUserStreak > (gameState.lastActiveDate ? userStreak : -1)) {
      newShields += 1;
    }

    const newGs: GameState = { ...gameState, xp, level, xpToNextLevel, totalXp, streak: newUserStreak, longestStreak: newLongestStreak, shields: newShields, lastActiveDate: today };
    setGameState(newGs);
    setHabits((prev) => prev.map((h) => h.id === habitId ? { ...h, completedDates: newDates, streak, bestStreak: newBestStreak, totalCompletions: habit.totalCompletions + 1 } : h));

    await updateGameState(user.id, { xp, level, xpToNextLevel, totalXp, streak: newUserStreak, longestStreak: newLongestStreak, shields: newShields, lastActiveDate: today });
    await awardBadgeIfEarned(user.id, newGs, habits);

    setToast({ xp: habit.xpPerCompletion, name: habit.name });
    if (leveledUp) setTimeout(() => setLevelUp({ level }), 600);
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
      hasActivity: habits.some((h) => h.completedDates.includes(d.toISOString().split("T")[0])),
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-forge-purple animate-spin" />
      </div>
    );
  }

  const fakeUser = gameState ? {
    id: user?.id ?? "",
    name: user?.username ?? "Player",
    username: user?.username ?? "Player",
    avatar: user?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`,
    level: gameState.level,
    xp: gameState.xp,
    xpToNextLevel: gameState.xpToNextLevel,
    totalXp: gameState.totalXp,
    streak: gameState.streak,
    longestStreak: gameState.longestStreak,
    shields: gameState.shields,
    rank: 1,
    badges: [],
    joinedAt: "",
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] pb-nav">
      {levelUp && <LevelUpOverlay level={levelUp.level} onDismiss={() => setLevelUp(null)} />}
      {shieldModal && (
        <ShieldModal
          missedStreak={shieldModal.streakAtRisk}
          shields={gameState?.shields ?? 0}
          onUsed={async () => {
            if (!user || !gameState) return;
            const newShields = Math.max(0, gameState.shields - 1);
            setGameState({ ...gameState, shields: newShields });
            await updateGameState(user.id, { shields: newShields });
            setShieldModal(null);
          }}
          onDecline={() => setShieldModal(null)}
        />
      )}
      {toast && <XPToast xp={toast.xp} habitName={toast.name} onDone={() => setToast(null)} />}

      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-gray-400 text-sm">Welcome back,</p>
            <h1 className="text-white font-bold text-2xl font-display">{user?.username} 👋</h1>
          </div>
          <Link to="/profile">
            <div className="relative">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                alt="avatar"
                className="w-12 h-12 rounded-full border-2 border-purple-500 object-cover"
              />
              <div className="absolute -bottom-1 -right-1 bg-purple-600 rounded-full px-1.5 py-0.5 text-[10px] text-white font-bold">
                {gameState?.level ?? 1}
              </div>
            </div>
          </Link>
        </div>
        {fakeUser && <XPBar user={fakeUser} />}
      </div>

      {/* Stats Row */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Streak", value: `${gameState?.streak ?? 0}🔥`, color: "text-orange-400" },
            { label: "Total XP", value: (gameState?.totalXp ?? 0).toLocaleString(), color: "text-purple-400" },
            { label: "Level", value: gameState?.level ?? 1, color: "text-yellow-400" },
            { label: "Shields", value: shields, color: "text-blue-400", icon: <ShieldCheck size={14} className="text-blue-400 mx-auto" /> },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-3 flex flex-col items-center">
              {stat.icon ?? null}
              <span className={`font-bold text-lg ${stat.color}`}>{stat.value}</span>
              <span className="text-gray-500 text-[10px]">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Ring */}
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
                    d.isToday ? "bg-purple-600 text-white" : d.hasActivity ? "bg-purple-600/30 text-purple-300" : "bg-white/5 text-gray-500"
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
        <DailyChallenges
          habits={habits}
          gameState={gameState}
          onXPAwarded={async (xp) => {
            if (!user || !gameState) return;
            let { xp: curXp, level, xpToNextLevel, totalXp } = gameState;
            curXp += xp;
            totalXp += xp;
            if (curXp >= xpToNextLevel) { curXp -= xpToNextLevel; level += 1; }
            const newGs = { ...gameState, xp: curXp, level, totalXp };
            setGameState(newGs);
            await updateGameState(user.id, { xp: curXp, level, totalXp });
          }}
        />
      </div>

      {/* Today's Habits */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold text-lg font-display">Today's Habits</h2>
          <Link to="/habits" className="flex items-center gap-1 text-purple-400 text-sm font-medium">
            Manage <ChevronRight size={14} />
          </Link>
        </div>
        {habits.length === 0 ? (
          <div className="text-center py-8 glass rounded-2xl">
            <div className="text-4xl mb-2">🌱</div>
            <p className="text-muted-foreground text-sm">No habits yet.</p>
            <Link to="/habits" className="text-forge-purple-light text-sm font-medium mt-1 inline-block">
              Add your first habit →
            </Link>
          </div>
        ) : (
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
        )}
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
