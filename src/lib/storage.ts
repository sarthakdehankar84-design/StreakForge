import type { Habit, User, TimerSession, ChatMessage } from "@/types";
import { mockUser, mockHabits, initialCoachMessages } from "@/lib/mockData";

// ---------------------------------------------------------------------------
// All persistence is disabled. No localStorage reads or writes occur.
// Every getter returns a fresh copy of the mock baseline.
// Every saver is a deliberate no-op.
// ---------------------------------------------------------------------------

export const getUser = (): User => ({ ...mockUser, shields: mockUser.shields ?? 1 });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const saveUser = (_user: User): void => { /* no-op: persistence disabled */ };

export const getHabits = (): Habit[] => mockHabits.map((h) => ({ ...h }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const saveHabits = (_habits: Habit[]): void => { /* no-op: persistence disabled */ };

export const getTimerSessions = (): TimerSession[] => [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const saveTimerSession = (_session: TimerSession): void => { /* no-op: persistence disabled */ };

export const getChatMessages = (): ChatMessage[] => initialCoachMessages.map((m) => ({ ...m }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const saveChatMessages = (_messages: ChatMessage[]): void => { /* no-op: persistence disabled */ };

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
export const todayStr = (): string => new Date().toISOString().split("T")[0];

// ---------------------------------------------------------------------------
// Habit completion — pure in-memory; no storage reads or writes
// ---------------------------------------------------------------------------
export const completeHabit = (
  habitId: string
): { habit: Habit; xpEarned: number; leveledUp: boolean; newLevel: number } => {
  const habits = getHabits();
  const idx = habits.findIndex((h) => h.id === habitId);
  if (idx === -1) throw new Error("Habit not found");

  const today = todayStr();
  const habit = habits[idx];

  if (!habit.completedDates.includes(today)) {
    habit.completedDates.push(today);
    habit.totalCompletions += 1;

    let streak = 0;
    const d = new Date();
    while (habit.completedDates.includes(d.toISOString().split("T")[0])) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    habit.streak = streak;
    habit.bestStreak = Math.max(habit.bestStreak, streak);

    const user = getUser();
    user.xp += habit.xpPerCompletion;
    user.totalXp += habit.xpPerCompletion;
    let leveledUp = false;
    if (user.xp >= user.xpToNextLevel) {
      user.xp -= user.xpToNextLevel;
      user.level += 1;
      leveledUp = true;
    }

    const maxHabitStreak = Math.max(...habits.map((h) => h.streak), 0);
    user.streak = Math.max(user.streak, maxHabitStreak);
    user.longestStreak = Math.max(user.longestStreak, user.streak);

    if (user.streak > 0 && user.streak % 7 === 0) {
      user.shields = (user.shields ?? 0) + 1;
    }

    // saveUser intentionally omitted — no persistence
    return { habit, xpEarned: habit.xpPerCompletion, leveledUp, newLevel: user.level };
  }

  return { habit, xpEarned: 0, leveledUp: false, newLevel: getUser().level };
};

export const isHabitCompletedToday = (habit: Habit): boolean =>
  habit.completedDates.includes(todayStr());

export const getMissedStreakInfo = (): { missed: boolean; streakAtRisk: number } => {
  const user = getUser();
  if (user.streak === 0) return { missed: false, streakAtRisk: 0 };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split("T")[0];
  const habits = getHabits();
  const anyYesterday = habits.some((h) => h.completedDates.includes(yStr));
  const anyToday = habits.some((h) => h.completedDates.includes(todayStr()));
  const missed = !anyYesterday && !anyToday && user.streak > 0;
  return { missed, streakAtRisk: user.streak };
};

export const useShield = (): boolean => {
  const user = getUser();
  if ((user.shields ?? 0) <= 0) return false;
  // No write — shield use is session-only
  return true;
};
