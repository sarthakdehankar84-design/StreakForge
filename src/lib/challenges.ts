import type { Habit } from "@/types";
import type { GameState } from "@/lib/db";
import { todayStr } from "@/lib/db";

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: "habit_completions" | "pomodoro" | "streak" | "xp_earned" | "focus_minutes" | "all_habits" | "categories";
  target: number;
  progress: number;
  completed: boolean;
  xpReward: number;
  rewardClaimed: boolean;
}

const CHALLENGE_POOL: Omit<DailyChallenge, "progress" | "completed" | "rewardClaimed">[] = [
  { id: "c1", title: "Habit Trio", description: "Complete 3 habits today", icon: "✅", type: "habit_completions", target: 3, xpReward: 75 },
  { id: "c2", title: "Full House", description: "Complete all your habits today", icon: "🏆", type: "all_habits", target: 1, xpReward: 150 },
  { id: "c3", title: "Pomo Power", description: "Finish a Pomodoro session", icon: "🍅", type: "pomodoro", target: 1, xpReward: 60 },
  { id: "c4", title: "On Fire", description: "Maintain a 5-day streak", icon: "🔥", type: "streak", target: 5, xpReward: 80 },
  { id: "c5", title: "XP Grinder", description: "Earn 150 XP today", icon: "⭐", type: "xp_earned", target: 150, xpReward: 75 },
  { id: "c6", title: "Deep Focus", description: "Accumulate 30 min of focus time", icon: "🧠", type: "focus_minutes", target: 30, xpReward: 80 },
  { id: "c7", title: "Marathon Mind", description: "Accumulate 60 min of focus time", icon: "🎯", type: "focus_minutes", target: 60, xpReward: 120 },
  { id: "c8", title: "Diverse Learner", description: "Complete habits in 3 categories", icon: "🌈", type: "categories", target: 3, xpReward: 90 },
  { id: "c9", title: "Daily Devotion", description: "Earn 200 XP from habits today", icon: "💎", type: "xp_earned", target: 200, xpReward: 100 },
  { id: "c10", title: "Legend Streak", description: "Maintain a 14-day streak", icon: "⚡", type: "streak", target: 14, xpReward: 200 },
  { id: "c11", title: "Hat-Trick", description: "Complete 3 habits in a row", icon: "🎩", type: "habit_completions", target: 3, xpReward: 70 },
  { id: "c12", title: "Double Pomo", description: "Complete 2 Pomodoro sessions", icon: "⏱️", type: "pomodoro", target: 2, xpReward: 100 },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function dateSeed(dateStr: string): number {
  return dateStr.split("-").reduce((acc, n) => acc * 31 + parseInt(n), 0);
}

function pickChallenges(dateStr: string): Omit<DailyChallenge, "progress" | "completed" | "rewardClaimed">[] {
  const rand = seededRandom(dateSeed(dateStr));
  const pool = [...CHALLENGE_POOL];
  const picked: typeof pool = [];
  while (picked.length < 3 && pool.length > 0) {
    const idx = Math.floor(rand() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

// In-memory claim registry
const sessionClaims: Record<string, boolean> = {};

function computeProgressFromData(
  challenge: Omit<DailyChallenge, "progress" | "completed" | "rewardClaimed">,
  habits: Habit[],
  gameState: GameState
): number {
  const today = todayStr();
  switch (challenge.type) {
    case "habit_completions":
      return habits.filter((h) => h.completedDates.includes(today)).length;
    case "all_habits": {
      const total = habits.length;
      const done = habits.filter((h) => h.completedDates.includes(today)).length;
      return total > 0 && done === total ? 1 : 0;
    }
    case "pomodoro":
      return 0; // Timer sessions not in scope here without async; returns 0
    case "streak":
      return gameState.streak;
    case "xp_earned": {
      const habitXP = habits.filter((h) => h.completedDates.includes(today)).reduce((s, h) => s + h.xpPerCompletion, 0);
      return habitXP;
    }
    case "focus_minutes":
      return 0; // Timer sessions tracked separately
    case "categories": {
      const done = habits.filter((h) => h.completedDates.includes(today));
      return new Set(done.map((h) => h.category)).size;
    }
    default:
      return 0;
  }
}

export function getDailyChallengesFromData(habits: Habit[], gameState: GameState): DailyChallenge[] {
  const today = todayStr();
  const templates = pickChallenges(today);
  return templates.map((tmpl) => {
    const progress = computeProgressFromData(tmpl, habits, gameState);
    const completed = progress >= tmpl.target;
    const rewardClaimed = sessionClaims[tmpl.id] ?? false;
    return { ...tmpl, progress, completed, rewardClaimed };
  });
}

export function claimChallengeRewardFromData(challengeId: string, xpReward: number): number {
  if (sessionClaims[challengeId]) return 0;
  sessionClaims[challengeId] = true;
  return xpReward;
}

// Legacy exports for backward compatibility
export const getDailyChallenges = () => [] as DailyChallenge[];
export const claimChallengeReward = (id: string, xp: number) => claimChallengeRewardFromData(id, xp);
