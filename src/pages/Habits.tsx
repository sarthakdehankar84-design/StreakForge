import { useState } from "react";
import { Plus, X, Flame, Zap, TrendingUp } from "lucide-react";
import { getHabits, saveHabits, completeHabit, getUser, saveUser, isHabitCompletedToday } from "@/lib/storage";
import { HABIT_CATEGORIES } from "@/constants";
import type { Habit, HabitCategory } from "@/types";
import HabitCard from "@/components/features/HabitCard";
import XPToast from "@/components/features/XPToast";
import LevelUpOverlay from "@/components/features/LevelUpOverlay";
import CircularProgress from "@/components/features/CircularProgress";

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>(getHabits());
  const [toast, setToast] = useState<{ xp: number; name: string } | null>(null);
  const [levelUp, setLevelUp] = useState<{ level: number } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: "", category: "study" as HabitCategory, icon: "📚", targetMinutes: 30 });

  const todayDone = habits.filter(isHabitCompletedToday).length;

  const handleComplete = (habitId: string) => {
    const result = completeHabit(habitId);
    if (result.xpEarned > 0) {
      setHabits(getHabits());
      setToast({ xp: result.xpEarned, name: result.habit.name });
      if (result.leveledUp) {
        setTimeout(() => setLevelUp({ level: result.newLevel }), 600);
      }
    }
  };

  const handleAddHabit = () => {
    if (!newHabit.name.trim()) return;
    const cat = HABIT_CATEGORIES.find((c) => c.id === newHabit.category);
    const habit: Habit = {
      id: `h_${Date.now()}`,
      name: newHabit.name.trim(),
      icon: cat?.icon || "⭐",
      color: cat?.color || "#9333ea",
      xpPerCompletion: 50,
      targetMinutes: newHabit.targetMinutes,
      category: newHabit.category,
      completedDates: [],
      streak: 0,
      bestStreak: 0,
      totalCompletions: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = [...habits, habit];
    saveHabits(updated);
    setHabits(updated);
    setShowAdd(false);
    setNewHabit({ name: "", category: "study", icon: "📚", targetMinutes: 30 });
  };

  const handleDelete = (id: string) => {
    const updated = habits.filter((h) => h.id !== id);
    saveHabits(updated);
    setHabits(updated);
  };

  const totalXP = habits.reduce((s, h) => s + (isHabitCompletedToday(h) ? h.xpPerCompletion : 0), 0);
  const possibleXP = habits.reduce((s, h) => s + h.xpPerCompletion, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] pb-nav">
      {levelUp && (
        <LevelUpOverlay
          level={levelUp.level}
          onDismiss={() => setLevelUp(null)}
        />
      )}
      {toast && <XPToast xp={toast.xp} habitName={toast.name} onDone={() => setToast(null)} />}

      {/* Header */}
      <div className="px-4 pt-14 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-display font-bold">My Habits</h1>
            <p className="text-muted-foreground text-sm">{habits.length} habits tracked</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="w-10 h-10 rounded-2xl bg-forge-purple flex items-center justify-center glow-purple transition-transform hover:scale-105"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass rounded-2xl p-3 col-span-1 flex flex-col items-center justify-center gap-2">
            <CircularProgress
              percentage={habits.length > 0 ? Math.round((todayDone / habits.length) * 100) : 0}
              size={64}
              strokeWidth={5}
              color="#9333ea"
            >
              <span className="text-xs font-bold">{todayDone}/{habits.length}</span>
            </CircularProgress>
            <p className="text-[10px] text-muted-foreground">Today</p>
          </div>

          <div className="glass rounded-2xl p-3 flex flex-col gap-2 col-span-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-forge-gold" />
              <span className="text-sm font-semibold">Today's XP</span>
            </div>
            <p className="text-2xl font-display font-black text-forge-gold-light">
              {totalXP} <span className="text-sm text-muted-foreground font-normal">/ {possibleXP}</span>
            </p>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-forge-gold to-forge-flame transition-all duration-500"
                style={{ width: `${possibleXP > 0 ? (totalXP / possibleXP) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Habits list */}
      <div className="px-4 space-y-3">
        {habits.map((habit) => (
          <div key={habit.id} className="relative group">
            <HabitCard habit={habit} onComplete={handleComplete} />
            <button
              onClick={() => handleDelete(habit.id)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {habits.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🌱</div>
            <p className="text-muted-foreground">No habits yet. Start your journey!</p>
          </div>
        )}
      </div>

      {/* Add habit modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 w-full max-w-md border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-display font-bold">New Habit</h2>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Habit Name</label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  placeholder="e.g. Read 30 minutes"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-forge-purple/60 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {HABIT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setNewHabit({ ...newHabit, category: cat.id as HabitCategory })}
                      className={`rounded-xl p-2.5 flex flex-col items-center gap-1 transition-all duration-200 ${
                        newHabit.category === cat.id
                          ? "border-2 bg-white/10"
                          : "border border-white/10 hover:bg-white/5"
                      }`}
                      style={{
                        borderColor: newHabit.category === cat.id ? cat.color : undefined,
                        boxShadow: newHabit.category === cat.id ? `0 0 10px ${cat.color}40` : undefined,
                      }}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-[10px] text-foreground font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                  Daily Target: {newHabit.targetMinutes} min
                </label>
                <input
                  type="range"
                  min={5}
                  max={120}
                  step={5}
                  value={newHabit.targetMinutes}
                  onChange={(e) => setNewHabit({ ...newHabit, targetMinutes: parseInt(e.target.value) })}
                  className="w-full accent-forge-purple"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>5 min</span>
                  <span>2 hours</span>
                </div>
              </div>

              <button
                onClick={handleAddHabit}
                disabled={!newHabit.name.trim()}
                className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-forge-purple to-forge-cyan disabled:opacity-40 transition-all duration-200 hover:opacity-90 glow-purple"
              >
                Add Habit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
