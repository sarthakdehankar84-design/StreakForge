import type { Habit, User, TimerSession, ChatMessage } from "@/types";

// ---------------------------------------------------------------------------
// All persistence is disabled. This file is kept for compatibility only.
// All real data goes through src/lib/db.ts (Supabase).
// ---------------------------------------------------------------------------

export const todayStr = (): string => new Date().toISOString().split("T")[0];

export const isHabitCompletedToday = (habit: Habit): boolean =>
  habit.completedDates.includes(todayStr());

export const getUser = (): User => ({
  id: "",
  name: "Player",
  avatar: "",
  level: 1,
  xp: 0,
  xpToNextLevel: 500,
  totalXp: 0,
  streak: 0,
  longestStreak: 0,
  shields: 0,
  rank: 1,
  badges: [],
  joinedAt: new Date().toISOString(),
});

export const saveUser = (_user: User): void => {};
export const getHabits = (): Habit[] => [];
export const saveHabits = (_habits: Habit[]): void => {};
export const getTimerSessions = (): TimerSession[] => [];
export const saveTimerSession = (_session: TimerSession): void => {};
export const getChatMessages = (): ChatMessage[] => [];
export const saveChatMessages = (_messages: ChatMessage[]): void => {};

export const completeHabit = (_habitId: string) => ({
  habit: {} as Habit,
  xpEarned: 0,
  leveledUp: false,
  newLevel: 1,
});

export const getMissedStreakInfo = () => ({ missed: false, streakAtRisk: 0 });
export const useShield = (): boolean => false;
