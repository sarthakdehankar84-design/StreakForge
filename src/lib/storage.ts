import type { Habit, User, TimerSession, ChatMessage } from "@/types";
import { mockUser, mockHabits, initialCoachMessages } from "@/lib/mockData";

const KEYS = {
  USER: "sf_user",
  HABITS: "sf_habits",
  TIMER_SESSIONS: "sf_timer_sessions",
  CHAT_MESSAGES: "sf_chat_messages",
};

export const getUser = (): User => {
  const stored = localStorage.getItem(KEYS.USER);
  if (stored) {
    const u: User = JSON.parse(stored);
    // Backfill shields for existing users
    if (typeof u.shields !== "number") u.shields = 1;
    return u;
  }
  const fresh = { ...mockUser, shields: 1 };
  localStorage.setItem(KEYS.USER, JSON.stringify(fresh));
  return fresh;
};

export const saveUser = (user: User): void => {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const getHabits = (): Habit[] => {
  const stored = localStorage.getItem(KEYS.HABITS);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(KEYS.HABITS, JSON.stringify(mockHabits));
  return mockHabits;
};

export const saveHabits = (habits: Habit[]): void => {
  localStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
};

export const getTimerSessions = (): TimerSession[] => {
  const stored = localStorage.getItem(KEYS.TIMER_SESSIONS);
  return stored ? JSON.parse(stored) : [];
};

export const saveTimerSession = (session: TimerSession): void => {
  const sessions = getTimerSessions();
  sessions.push(session);
  localStorage.setItem(KEYS.TIMER_SESSIONS, JSON.stringify(sessions));
};

export const getChatMessages = (): ChatMessage[] => {
  const stored = localStorage.getItem(KEYS.CHAT_MESSAGES);
  if (stored) return JSON.parse(stored);
  return initialCoachMessages;
};

export const saveChatMessages = (messages: ChatMessage[]): void => {
  localStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(messages));
};

export const todayStr = (): string => new Date().toISOString().split("T")[0];

export const completeHabit = (habitId: string): { habit: Habit; xpEarned: number; leveledUp: boolean; newLevel: number } => {
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
    saveHabits(habits);

    // Award XP to user
    const user = getUser();
    user.xp += habit.xpPerCompletion;
    user.totalXp += habit.xpPerCompletion;
    let leveledUp = false;
    if (user.xp >= user.xpToNextLevel) {
      user.xp -= user.xpToNextLevel;
      user.level += 1;
      leveledUp = true;
    }
    // Update user streak from habit streaks
    const allHabits = habits; // already saved above
    const maxHabitStreak = Math.max(...allHabits.map((h) => h.streak), 0);
    user.streak = Math.max(user.streak, maxHabitStreak);
    user.longestStreak = Math.max(user.longestStreak, user.streak);
    // Award a shield at every 7-day streak milestone
    if (user.streak > 0 && user.streak % 7 === 0) {
      const milestoneKey = `sf_shield_milestone_${user.streak}`;
      if (!localStorage.getItem(milestoneKey)) {
        localStorage.setItem(milestoneKey, "1");
        user.shields = (user.shields ?? 0) + 1;
      }
    }
    saveUser(user);
    return { habit, xpEarned: habit.xpPerCompletion, leveledUp, newLevel: user.level };
  }
  return { habit, xpEarned: 0, leveledUp: false, newLevel: getUser().level };
};

export const isHabitCompletedToday = (habit: Habit): boolean => {
  return habit.completedDates.includes(todayStr());
};

/** Check if the user missed yesterday (streak > 0 but no habit done yesterday, and no shield already used today) */
export const getMissedStreakInfo = (): { missed: boolean; streakAtRisk: number } => {
  const user = getUser();
  if (user.streak === 0) return { missed: false, streakAtRisk: 0 };
  // Already used a shield today?
  const shieldUsedToday = !!localStorage.getItem(`sf_shield_used_${todayStr()}`);
  if (shieldUsedToday) return { missed: false, streakAtRisk: 0 };
  // Check if yesterday was completed for any habit
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split("T")[0];
  const habits = getHabits();
  const anyYesterday = habits.some((h) => h.completedDates.includes(yStr));
  const anyToday = habits.some((h) => h.completedDates.includes(todayStr()));
  // Missed = streak > 0, no completion yesterday, and haven't done anything today yet
  const missed = !anyYesterday && !anyToday && user.streak > 0;
  return { missed, streakAtRisk: user.streak };
};

/** Use a shield token to restore streak */
export const useShield = (): boolean => {
  const user = getUser();
  if (user.shields <= 0) return false;
  user.shields -= 1;
  localStorage.setItem(`sf_shield_used_${todayStr()}`, "1");
  saveUser(user);
  return true;
};
