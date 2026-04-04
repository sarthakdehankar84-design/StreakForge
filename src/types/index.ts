export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  xpPerCompletion: number;
  targetMinutes?: number;
  category: HabitCategory;
  completedDates: string[]; // ISO date strings
  streak: number;
  bestStreak: number;
  totalCompletions: number;
  createdAt: string;
}

export type HabitCategory = "study" | "health" | "reading" | "coding" | "mindfulness" | "fitness";

export interface User {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXp: number;
  streak: number;
  longestStreak: number;
  shields: number;
  lastShieldAwardedAt?: string; // ISO date of last shield milestone
  rank: number;
  badges: Badge[];
  joinedAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  level: number;
  weeklyXp: number;
  streak: number;
  consistencyScore: number;
  badge?: string;
  isCurrentUser?: boolean;
}

export interface TimerSession {
  id: string;
  habitId?: string;
  habitName?: string;
  mode: "pomodoro" | "shortBreak" | "longBreak" | "freeflow";
  plannedMinutes: number;
  actualSeconds: number;
  completed: boolean;
  xpEarned: number;
  startedAt: string;
  completedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "coach";
  content: string;
  timestamp: string;
  type?: "suggestion" | "motivation" | "feedback" | "normal";
}

export interface DailyStats {
  date: string;
  habitsCompleted: number;
  totalHabits: number;
  xpEarned: number;
  focusMinutes: number;
}
