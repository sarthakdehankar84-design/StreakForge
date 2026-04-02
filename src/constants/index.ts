export const XP_PER_LEVEL = 500;
export const POMODORO_WORK = 25;
export const POMODORO_SHORT_BREAK = 5;
export const POMODORO_LONG_BREAK = 15;
export const XP_PER_POMODORO = 50;
export const XP_PER_FREE_MINUTE = 1.5;

export const LEVEL_TITLES: Record<number, string> = {
  1: "Novice",
  5: "Apprentice",
  10: "Scholar",
  20: "Adept",
  30: "Expert",
  40: "Master",
  50: "Grandmaster",
  75: "Legend",
  100: "Sage",
};

export const getLevelTitle = (level: number): string => {
  const keys = Object.keys(LEVEL_TITLES)
    .map(Number)
    .sort((a, b) => b - a);
  for (const key of keys) {
    if (level >= key) return LEVEL_TITLES[key];
  }
  return "Novice";
};

export const HABIT_CATEGORIES = [
  { id: "study", label: "Study", icon: "📚", color: "#9333ea" },
  { id: "health", label: "Health", icon: "💊", color: "#22c55e" },
  { id: "reading", label: "Reading", icon: "📖", color: "#f59e0b" },
  { id: "coding", label: "Coding", icon: "💻", color: "#22d3ee" },
  { id: "mindfulness", label: "Mindfulness", icon: "🧘", color: "#ec4899" },
  { id: "fitness", label: "Fitness", icon: "🏋️", color: "#f97316" },
];

export const RARITY_COLORS = {
  common: "#94a3b8",
  rare: "#22d3ee",
  epic: "#a78bfa",
  legendary: "#f59e0b",
};
