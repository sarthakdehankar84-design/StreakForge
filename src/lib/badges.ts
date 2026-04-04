import { useAuth } from "@/hooks/useAuth";
import { awardBadge } from "@/lib/db";
import type { GameState } from "@/lib/db";
import type { Habit } from "@/types";

interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  check: (gs: GameState, habits: Habit[]) => boolean;
}

const BADGE_DEFS: BadgeDef[] = [
  {
    id: "first_habit",
    name: "First Step",
    description: "Completed your first habit",
    icon: "🌱",
    rarity: "common",
    check: (gs, habits) => habits.some((h) => h.totalCompletions > 0),
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    description: "Reached a 7-day streak",
    icon: "🔥",
    rarity: "common",
    check: (gs) => gs.streak >= 7,
  },
  {
    id: "level_5",
    name: "Apprentice",
    description: "Reached Level 5",
    icon: "⚡",
    rarity: "common",
    check: (gs) => gs.level >= 5,
  },
  {
    id: "level_10",
    name: "Scholar",
    description: "Reached Level 10",
    icon: "📚",
    rarity: "rare",
    check: (gs) => gs.level >= 10,
  },
  {
    id: "level_20",
    name: "Adept",
    description: "Reached Level 20",
    icon: "🎓",
    rarity: "epic",
    check: (gs) => gs.level >= 20,
  },
  {
    id: "streak_14",
    name: "Fortnight Fighter",
    description: "Maintained a 14-day streak",
    icon: "🌊",
    rarity: "rare",
    check: (gs) => gs.streak >= 14,
  },
  {
    id: "streak_30",
    name: "Iron Will",
    description: "Maintained a 30-day streak",
    icon: "💎",
    rarity: "epic",
    check: (gs) => gs.streak >= 30,
  },
  {
    id: "xp_1000",
    name: "XP Hunter",
    description: "Earned 1,000 total XP",
    icon: "⭐",
    rarity: "common",
    check: (gs) => gs.totalXp >= 1000,
  },
  {
    id: "xp_10000",
    name: "Pomodoro King",
    description: "Earned 10,000 total XP",
    icon: "🍅",
    rarity: "legendary",
    check: (gs) => gs.totalXp >= 10000,
  },
  {
    id: "habits_50",
    name: "Habit Machine",
    description: "Completed 50 total habit check-ins",
    icon: "🤖",
    rarity: "rare",
    check: (_, habits) => habits.reduce((s, h) => s + h.totalCompletions, 0) >= 50,
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Collected a Streak Shield",
    icon: "🦉",
    rarity: "epic",
    check: (gs) => gs.shields > 0,
  },
];

export async function awardBadgeIfEarned(userId: string, gameState: GameState, habits: Habit[]) {
  for (const badge of BADGE_DEFS) {
    if (badge.check(gameState, habits)) {
      await awardBadge(userId, badge);
    }
  }
}
