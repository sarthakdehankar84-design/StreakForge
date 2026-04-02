import type { User, Habit, LeaderboardEntry, DailyStats, ChatMessage } from "@/types";

export const mockUser: User = {
  id: "user-1",
  name: "Alex Chen",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4",
  level: 14,
  xp: 320,
  xpToNextLevel: 500,
  totalXp: 6820,
  streak: 12,
  longestStreak: 28,
  rank: 47,
  joinedAt: "2026-01-15",
  badges: [
    { id: "b1", name: "Week Warrior", description: "7-day streak", icon: "🔥", rarity: "common", unlockedAt: "2026-02-01" },
    { id: "b2", name: "Study God", description: "100 study sessions", icon: "📚", rarity: "rare", unlockedAt: "2026-02-20" },
    { id: "b3", name: "Night Owl", description: "50 late-night sessions", icon: "🦉", rarity: "epic", unlockedAt: "2026-03-01" },
    { id: "b4", name: "Pomodoro King", description: "500 pomodoros", icon: "🍅", rarity: "legendary", unlockedAt: "2026-03-10" },
  ],
};

export const mockHabits: Habit[] = [
  {
    id: "h1",
    name: "Deep Study",
    icon: "📚",
    color: "#9333ea",
    xpPerCompletion: 80,
    targetMinutes: 90,
    category: "study",
    completedDates: ["2026-03-14", "2026-03-15", "2026-03-16", "2026-03-17", "2026-03-18", "2026-03-19", "2026-03-20", "2026-03-21", "2026-03-22", "2026-03-23", "2026-03-24", "2026-03-25"],
    streak: 12,
    bestStreak: 28,
    totalCompletions: 67,
    createdAt: "2026-01-15",
  },
  {
    id: "h2",
    name: "Code Practice",
    icon: "💻",
    color: "#22d3ee",
    xpPerCompletion: 70,
    targetMinutes: 60,
    category: "coding",
    completedDates: ["2026-03-20", "2026-03-21", "2026-03-22", "2026-03-23", "2026-03-24", "2026-03-25"],
    streak: 6,
    bestStreak: 14,
    totalCompletions: 42,
    createdAt: "2026-02-01",
  },
  {
    id: "h3",
    name: "Daily Reading",
    icon: "📖",
    color: "#f59e0b",
    xpPerCompletion: 50,
    targetMinutes: 30,
    category: "reading",
    completedDates: ["2026-03-22", "2026-03-23", "2026-03-24", "2026-03-25"],
    streak: 4,
    bestStreak: 20,
    totalCompletions: 38,
    createdAt: "2026-02-10",
  },
  {
    id: "h4",
    name: "Meditation",
    icon: "🧘",
    color: "#ec4899",
    xpPerCompletion: 40,
    targetMinutes: 15,
    category: "mindfulness",
    completedDates: ["2026-03-18", "2026-03-20", "2026-03-22", "2026-03-24", "2026-03-25"],
    streak: 2,
    bestStreak: 10,
    totalCompletions: 29,
    createdAt: "2026-02-15",
  },
  {
    id: "h5",
    name: "Morning Workout",
    icon: "🏋️",
    color: "#f97316",
    xpPerCompletion: 60,
    targetMinutes: 45,
    category: "fitness",
    completedDates: ["2026-03-23", "2026-03-25"],
    streak: 1,
    bestStreak: 8,
    totalCompletions: 18,
    createdAt: "2026-03-01",
  },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: "u1", name: "Sarah K.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=ffd5dc", level: 28, weeklyXp: 3240, streak: 45, consistencyScore: 98, badge: "🏆" },
  { rank: 2, userId: "u2", name: "Marcus L.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c0aede", level: 24, weeklyXp: 2890, streak: 31, consistencyScore: 95, badge: "🥈" },
  { rank: 3, userId: "u3", name: "Ji-woo P.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jiwoo&backgroundColor=b6e3f4", level: 22, weeklyXp: 2650, streak: 28, consistencyScore: 93, badge: "🥉" },
  { rank: 4, userId: "u4", name: "Emma R.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=ffd5dc", level: 20, weeklyXp: 2410, streak: 22, consistencyScore: 90 },
  { rank: 5, userId: "u5", name: "Carlos M.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos&backgroundColor=d1f4d1", level: 19, weeklyXp: 2280, streak: 18, consistencyScore: 88 },
  { rank: 6, userId: "u6", name: "Priya S.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=ffecd1", level: 18, weeklyXp: 2100, streak: 20, consistencyScore: 86 },
  { rank: 7, userId: "u7", name: "Kai T.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kai&backgroundColor=c0aede", level: 17, weeklyXp: 1950, streak: 15, consistencyScore: 84 },
  { rank: 8, userId: "u8", name: "Nora H.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nora&backgroundColor=b6e3f4", level: 16, weeklyXp: 1820, streak: 14, consistencyScore: 82 },
  { rank: 9, userId: "u9", name: "Dev A.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dev&backgroundColor=d1f4d1", level: 15, weeklyXp: 1680, streak: 13, consistencyScore: 80 },
  { rank: 10, userId: "u10", name: "Yuki N.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki&backgroundColor=ffd5dc", level: 15, weeklyXp: 1590, streak: 12, consistencyScore: 78 },
  { rank: 47, userId: "user-1", name: "Alex Chen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4", level: 14, weeklyXp: 320, streak: 12, consistencyScore: 72, isCurrentUser: true },
];

export const mockDailyStats: DailyStats[] = Array.from({ length: 84 }, (_, i) => {
  const date = new Date("2026-01-01");
  date.setDate(date.getDate() + i);
  const dateStr = date.toISOString().split("T")[0];
  const rand = Math.random();
  const completed = rand > 0.25 ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 2);
  return {
    date: dateStr,
    habitsCompleted: completed,
    totalHabits: 5,
    xpEarned: completed * 55 + Math.floor(Math.random() * 40),
    focusMinutes: completed > 3 ? Math.floor(Math.random() * 120) + 60 : Math.floor(Math.random() * 60),
  };
});

export const initialCoachMessages: ChatMessage[] = [
  {
    id: "cm1",
    role: "coach",
    content: "Hey Alex! 👋 I'm Forge, your AI study coach. I've been watching your progress and I'm genuinely impressed — 12-day streak is no joke! You're clearly building momentum. What are you focusing on today?",
    timestamp: new Date(Date.now() - 60000).toISOString(),
    type: "normal",
  },
];

export const coachResponses: Record<string, ChatMessage[]> = {
  default: [
    {
      id: "",
      role: "coach",
      content: "Great question! Based on your recent patterns, you tend to perform best between 9am–1pm. Try scheduling your Deep Study session during that window today — you'll likely hit a new personal record. 🎯",
      timestamp: "",
      type: "suggestion",
    },
    {
      id: "",
      role: "coach",
      content: "Your consistency score is sitting at 72% this week. The gap? Your coding sessions have dropped. Just 2 more sessions and you'll unlock the 'Comeback Kid' badge. You're closer than you think. 💪",
      timestamp: "",
      type: "feedback",
    },
    {
      id: "",
      role: "coach",
      content: "I analyzed your study patterns: you complete 89% of habits when you do your first one before 11am. Miss that window and it drops to 41%. Want me to set a morning anchor habit? ⚡",
      timestamp: "",
      type: "suggestion",
    },
    {
      id: "",
      role: "coach",
      content: "You're on a 12-day streak — that's already in the top 15% of all users this month. Keep it going and you'll hit the 'Fortnight Fighter' badge in 2 days. Each day now is harder to break than the last. 🔥",
      timestamp: "",
      type: "motivation",
    },
  ],
};
