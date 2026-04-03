import type { Habit, User, TimerSession, ChatMessage } from "@/types";
import { mockUser, mockHabits, initialCoachMessages } from "@/lib/mockData";

const KEYS = {
  USER: "sf_user",
  HABITS: "sf_habits",
  TIMER_SESSIONS: "sf_timer_sessions",
  CHAT_MESSAGES: "sf_chat_messages",
};

// ---------------------------------------------------------------------------
// User — never auto-hydrates from localStorage; returns mock baseline only
// ---------------------------------------------------------------------------
export const getUser = (): User => {
  return { ...mockUser, shields: mockUser.shields ?? 1 };
};

export const saveUser = (user: User): void => {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
};

// ---------------------------------------------------------------------------
// Habits — never auto-hydrates from localStorage; returns mock baseline only
// ---------------------------------------------------------------------------
export const getHabits = (): Habit[] => {
  return mockHabits.map((h) => ({ ...h }));
};

export const saveHabits = (habits: Habit[]): void => {
  localStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
};

// ---------------------------------------------------------------------------
// Timer Sessions — returns empty array by default (no auto-hydration)
// ---------------------------------------------------------------------------
export const getTimerSessions = (): TimerSession[] => {
  return [];
};

export const saveTimerSession = (session: TimerSession): void => {
  localStorage.setItem(
    KEYS.TIMER_SESSIONS,
    JSON.stringify([session])
  );
};

// ---------------------------------------------------------------------------
// Chat Messages — returns initial coach messages; no localStorage read
// ---------------------------------------------------------------------------
export const getChatMessages = (): ChatMessage[] => {
  return initialCoachMessages.map((m) => ({ ...m }));
};

export const saveChatMessages = (messages: ChatMessage[]): void => {
  localStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(messages));
};

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
export const todayStr = (): string => new Date().toISOString().split("T")[0];

// ---------------------------------------------------------------------------
// Habit completion — operates on in-memory state passed in; no LS reads
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

    // Recalculate streak
    let streak = 0;
    const d = new Date();
    while (habit.completedDates.includes(d.toISOString().split("T")[0])) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    habit.streak = streak;
    habit.bestStreak = Math.max(habit.bestStreak, streak);
    habits[idx] = habit;

    // Award XP to user (from mock baseline — no LS read)
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

    // Shield milestone — write-only, never read
    if (user.streak > 0 && user.streak % 7 === 0) {
      user.shields = (user.shields ?? 0) + 1;
    }

    saveUser(user);
    return { habit, xpEarned: habit.xpPerCompletion, leveledUp, newLevel: user.level };
  }

  return { habit, xpEarned: 0, leveledUp: false, newLevel: getUser().level };
};

export const isHabitCompletedToday = (habit: Habit): boolean => {
  return habit.completedDates.includes(todayStr());
};

/** Streak-miss check — uses mock baseline; no LS hydration */
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

/** Use a shield token — write-only, operates on current runtime state */
export const useShield = (): boolean => {
  const user = getUser();
  if ((user.shields ?? 0) <= 0) return false;
  user.shields = (user.shields ?? 1) - 1;
  saveUser(user);
  return true;
};
