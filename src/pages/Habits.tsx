import { useState, useEffect, useCallback } from "react";
import { Plus, X, Zap, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchHabits, createHabit, deleteHabit, updateHabit, updateGameState, getOrCreateGameState, type GameState } from "@/lib/db";
import { awardBadgeIfEarned } from "@/lib/badges";
import { HABIT_CATEGORIES } from "@/constants";
import type { Habit, HabitCategory } from "@/types";
import HabitCard from "@/components/features/HabitCard";
import XPToast from "@/components/features/XPToast";
import LevelUpOverlay from "@/components/features/LevelUpOverlay";
import CircularProgress from "@/components/features/CircularProgress";
import { todayStr } from "@/lib/db";
import { toast } from "sonner";

export default function Habits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [xpToast, setXpToast] = useState<{ xp: number; name: string } | null>(null);
  const [levelUp, setLevelUp] = useState<{ level: number } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: "", category: "study" as HabitCategory, targetMinutes: 30 });

  const loadData = useCallback(async () => {
    if (!user) return;
    const [hs, gs] = await Promise.all([fetchHabits(user.id), getOrCreateGameState(user.id)]);
    setHabits(hs);
    setGameState(gs);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const isCompleted = (h: Habit) => h.completedDates.includes(todayStr());
  const todayDone = habits.filter(isCompleted).length;

  const handleComplete = async (habitId: string) => {
    if (!user || !gameState) return;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit || isCompleted(habit)) return;

    const today = todayStr();
    const newDates = [...habit.completedDates, today];
    let streak = 0;
    const d = new Date();
    while (newDates.includes(d.toISOString().split("T")[0])) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    const newBestStreak = Math.max(habit.bestStreak, streak);
    const newTotalCompletions = habit.totalCompletions + 1;

    await updateHabit(habitId, { completedDates: newDates, streak, bestStreak: newBestStreak, totalCompletions: newTotalCompletions });

    let { xp, level, xpToNextLevel, totalXp, streak: us, longestStreak, shields } = gameState;
    xp += habit.xpPerCompletion;
    totalXp += habit.xpPerCompletion;
    let leveledUp = false;
    if (xp >= xpToNextLevel) { xp -= xpToNextLevel; level += 1; leveledUp = true; }
    const newUserStreak = Math.max(us, streak);
    const newLongestStreak = Math.max(longestStreak, newUserStreak);
    let newShields = shields;
    if (newUserStreak > 0 && newUserStreak % 7 === 0) newShields += 1;

    const newGs = { ...gameState, xp, level, xpToNextLevel, totalXp, streak: newUserStreak, longestStreak: newLongestStreak, shields: newShields };
    setGameState(newGs);
    setHabits((prev) => prev.map((h) => h.id === habitId ? { ...h, completedDates: newDates, streak, bestStreak: newBestStreak, totalCompletions: newTotalCompletions } : h));

    await updateGameState(user.id, { xp, level, totalXp, streak: newUserStreak, longestStreak: newLongestStreak, shields: newShields });
    const updatedHabits = habits.map((h) => h.id === habitId ? { ...h, completedDates: newDates, totalCompletions: newTotalCompletions } : h);
    await awardBadgeIfEarned(user.id, newGs, updatedHabits);

    setXpToast({ xp: habit.xpPerCompletion, name: habit.name });
    if (leveledUp) setTimeout(() => setLevelUp({ level }), 600);
  };

  const handleAddHabit = async () => {
    if (!user || !newHabit.name.trim()) return;
    setSaving(true);
    const cat = HABIT_CATEGORIES.find((c) => c.id === newHabit.category);
    const created = await createHabit(user.id, {
      name: newHabit.name.trim(),
      icon: cat?.icon || "⭐",
      color: cat?.color || "#9333ea",
      xpPerCompletion: 50,
      targetMinutes: newHabit.targetMinutes,
      category: newHabit.category,
    });
    if (created) {
      setHabits((prev) => [...prev, created]);
      setShowAdd(false);
      setNewHabit({ name: "", category: "study", targetMinutes: 30 });
      toast.success("Habit created!");
    } else {
      toast.error("Failed to create habit");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await deleteHabit(id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
    toast.success("Habit removed");
  };

  const totalXP = habits.filter(isCompleted).reduce((s, h) => s + h.xpPerCompletion, 0);
  const possibleXP = habits.reduce((s, h) => s + h.xpPerCompletion, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-forge-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] pb-nav">
      {levelUp && <LevelUpOverlay level={levelUp.level} onDismiss={() => setLevelUp(null)} />}
      {xpToast && <XPToast xp={xpToast.xp} habitName={xpToast.name} onDone={() => setXpToast(null)} />}

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

      <div className="px-4 space-y-3">
        {habits.map((habit) => (
          <div key={habit.id} className="relative group">
            <HabitCard habit={habit} completed={isCompleted(habit)} onComplete={handleComplete} />
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
                        newHabit.category === cat.id ? "border-2 bg-white/10" : "border border-white/10 hover:bg-white/5"
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
                disabled={!newHabit.name.trim() || saving}
                className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-forge-purple to-forge-cyan disabled:opacity-40 transition-all duration-200 hover:opacity-90 glow-purple flex items-center justify-center gap-2"
              >
                {saving ? <><span className="animate-spin">⏳</span> Saving...</> : "Add Habit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
