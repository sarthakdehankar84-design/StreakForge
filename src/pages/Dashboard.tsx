import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, Zap, Trophy, ChevronRight, Star, TrendingUp, Swords, ShieldCheck } from "lucide-react";
import { getUser, getHabits, completeHabit, isHabitCompletedToday, todayStr, getMissedStreakInfo } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
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
  const { user: authUser } = useAuth();
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
              src={authUser?.avatarUrl || user.avatar}
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

      {/* Stats row — 4 cols including shield */}
      <div className="px-4 grid grid-cols-4 gap-2 mb-4">
        {[
          { icon: <Flame className="w-4 h-4 text-forge-flame" />, label: "Streak", value: `${user.streak}d`, color: "#f97316" },
          { icon: <Zap className="w-4 h-4 text-forge-gold" />, label: "Week XP", value: weekXP.toLocaleString(), color: "#f59e0b", small: true },
          { icon: <Trophy className="w-4 h-4 text-forge-cyan" />, label: "Rank", value: `#${user.rank}`, color: "#22d3ee" },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-3 flex flex-col items-center gap-1">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${(stat as any).color}20` }}
            >
              {stat.icon}
            </div>
            <p className={`font-bold text-foreground ${(stat as any).small ? "text-sm" : "text-base"}`}>
              {stat.value}
            </p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}

        {/* Shield stat — clickable to open modal */}
        <button
          onClick={() => setShieldModal({ streakAtRisk: user.streak })}
          className="glass rounded-2xl p-3 flex flex-col items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95 relative"
          style={{
            border: shields > 0 ? "1px solid rgba(147,51,234,0.45)" : undefined,
            boxShadow: shields > 0 ? "0 0 14px rgba(147,51,234,0.18)" : undefined,
          }}
          title={`${shields} Streak Shield${shields !== 1 ? "s" : ""} — earned every 7-day milestone`}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center relative"
            style={{ background: shields > 0 ? "rgba(167,139,250,0.18)" : "rgba(255,255,255,0.06)" }}
          >
            <ShieldCheck
              className="w-4 h-4"
              style={{
                color: shields > 0 ? "#a78bfa" : "rgba(255,255,255,0.28)",
                filter: shields > 0 ? "drop-shadow(0 0 5px rgba(167,139,250,0.8))" : undefined,
              }}
            />
            {shields > 0 && (
              <div
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white animate-shield-badge"
                style={{
                  background: "linear-gradient(135deg, #9333ea, #a78bfa)",
                  boxShadow: "0 0 6px rgba(147,51,234,0.7)",
                }}
              >
                {shields}
              </div>
            )}
          </div>
          <p className="text-base font-bold text-foreground">{shields}</p>
          <p className="text-[10px] text-muted-foreground">Shields</p>
        </button>
      </div>

      {/* Today's Progress Ring */}
      <div className="px-4 mb-4">
        <div className="glass rounded-2xl p-5 flex items-center gap-5">
          <CircularProgress
            percentage={completionPct}
            size={100}
            strokeWidth={8}
            color="#9333ea"
          >
            <p className="text-xl font-display font-black text-foreground">{completionPct}%</p>
            <p className="text-[9px] text-muted-foreground leading-none">done</p>
          </CircularProgress>
          <div className="flex-1">
            <h2 className="text-lg font-display font-bold mb-1">Today's Progress</h2>
            <p className="text-muted-foreground text-sm mb-2">
              {todayCompleted} of {totalHabits} habits completed
            </p>
            {completionPct === 100 ? (
              <span className="text-xs text-forge-gold font-bold bg-forge-gold/15 px-3 py-1 rounded-full">
                🎉 Perfect Day!
              </span>
            ) : (
              <span className="text-xs text-forge-purple-light font-semibold bg-forge-purple/15 px-3 py-1 rounded-full">
                {totalHabits - todayCompleted} remaining
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Shield earn hint — shown only if user has 0 shields and has a streak */}
      {shields === 0 && user.streak > 0 && (
        <div className="px-4 mb-4">
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{
              background: "rgba(147,51,234,0.07)",
              border: "1px dashed rgba(147,51,234,0.28)",
            }}
          >
            <ShieldCheck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Reach a <span className="text-forge-purple-light font-semibold">7-day streak milestone</span> to earn a Streak Shield that protects you from missing a day.
            </p>
          </div>
        </div>
      )}

      {/* Weekly Activity */}
      <div className="px-4 mb-4">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold">Weekly Activity</h2>
            <TrendingUp className="w-4 h-4 text-forge-cyan" />
          </div>
          <div className="flex items-end gap-2 h-16">
            {weekDays.map((d, i) => {
              const stat = mockDailyStats.find((s) => s.date === d.date);
              const pct = stat ? stat.habitsCompleted / 5 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: 48 }}>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${Math.max(pct * 100, 8)}%`,
                        background: d.isToday
                          ? "linear-gradient(180deg, #9333ea, #22d3ee)"
                          : pct > 0.6
                          ? "rgba(147, 51, 234, 0.5)"
                          : "rgba(255,255,255,0.08)",
                        boxShadow: d.isToday ? "0 0 8px rgba(147, 51, 234, 0.5)" : undefined,
                      }}
                    />
                  </div>
                  <span className={`text-[10px] font-medium ${d.isToday ? "text-forge-purple-light" : "text-muted-foreground"}`}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Daily Challenges */}
      <div className="px-4 mb-4">
        <DailyChallenges onXPAwarded={() => setUser(getUser())} />
      </div>

      {/* Today's Habits */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-lg">Today's Habits</h2>
          <Link
            to="/habits"
            className="text-xs text-forge-purple-light flex items-center gap-1 hover:gap-2 transition-all"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="space-y-3">
          {habits.slice(0, 4).map((habit) => (
            <HabitCard key={habit.id} habit={habit} onComplete={handleComplete} />
          ))}
        </div>
      </div>

      {/* Skill Tree teaser */}
      <div className="px-4 mt-4">
        <Link
          to="/skills"
          className="glass rounded-2xl p-4 flex items-center gap-4 hover:border-forge-purple/40 hover:bg-forge-purple/5 transition-all duration-200 group"
          style={{ borderColor: "rgba(147,51,234,0.25)" }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(147,51,234,0.25), rgba(34,211,238,0.15))",
              border: "1px solid rgba(147,51,234,0.4)",
              boxShadow: "0 0 14px rgba(147,51,234,0.25)",
            }}
          >
            <Swords className="w-5 h-5 text-forge-purple-light" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-display font-bold text-foreground">Skill Tree</p>
            <p className="text-xs text-muted-foreground">Track your 5 attribute upgrades</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              {["🎯","📚","⚔️","💪","✨"].map((e, i) => (
                <span key={i} className="text-sm" style={{ filter: "drop-shadow(0 0 3px rgba(147,51,234,0.5))" }}>{e}</span>
              ))}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-forge-purple-light group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
      </div>

      {/* Badges preview */}
      <div className="px-4 mt-4">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold">Your Badges</h2>
            <Star className="w-4 h-4 text-forge-gold" />
          </div>
          <div className="flex gap-3 flex-wrap">
            {user.badges.map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center gap-1 cursor-pointer group"
                title={badge.description}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-200 group-hover:scale-110"
                  style={{
                    background:
                      badge.rarity === "legendary"
                        ? "linear-gradient(135deg, rgba(245,158,11,0.3), rgba(245,158,11,0.1))"
                        : badge.rarity === "epic"
                        ? "linear-gradient(135deg, rgba(167,139,250,0.3), rgba(167,139,250,0.1))"
                        : badge.rarity === "rare"
                        ? "linear-gradient(135deg, rgba(34,211,238,0.3), rgba(34,211,238,0.1))"
                        : "rgba(255,255,255,0.08)",
                    border: `1px solid ${
                      badge.rarity === "legendary" ? "rgba(245,158,11,0.5)"
                      : badge.rarity === "epic" ? "rgba(167,139,250,0.5)"
                      : badge.rarity === "rare" ? "rgba(34,211,238,0.5)"
                      : "rgba(255,255,255,0.15)"
                    }`,
                  }}
                >
                  {badge.icon}
                </div>
                <span className="text-[9px] text-muted-foreground text-center leading-tight max-w-[48px]">
                  {badge.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
