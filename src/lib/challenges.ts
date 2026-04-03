import { getHabits, getTimerSessions, getUser, todayStr } from "@/lib/storage";

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
  { id: "c3", title: "Pomo Power", description: "Finish a 25-min Pomodoro session", icon: "🍅", type: "pomodoro", target: 1, xpReward: 60 },
  { id: "c4", title: "Double Pomo", description: "Complete 2 Pomodoro sessions", icon: "⏱️", type: "pomodoro", target: 2, xpReward: 100 },
  { id: "c5", title: "On Fire", description: "Maintain a 5-day streak", icon: "🔥", type: "streak", target: 5, xpReward: 80 },
  { id: "c6", title: "Legend Streak", description: "Maintain a 14-day streak", icon: "⚡", type: "streak", target: 14, xpReward: 200 },
  { id: "c7", title: "XP Grinder", description: "Earn 150 XP today", icon: "⭐", type: "xp_earned", target: 150, xpReward: 75 },
  { id: "c8", title: "Deep Focus", description: "Accumulate 30 minutes of focus time", icon: "🧠", type: "focus_minutes", target: 30, xpReward: 80 },
  { id: "c9", title: "Marathon Mind", description: "Accumulate 60 minutes of focus time", icon: "🎯", type: "focus_minutes", target: 60, xpReward: 120 },
  { id: "c10", title: "Diverse Learner", description: "Complete habits in 3 different categories", icon: "🌈", type: "categories", target: 3, xpReward: 90 },
  { id: "c11", title: "Hat-Trick", description: "Complete exactly 3 habits in a row", icon: "🎩", type: "habit_completions", target: 3, xpReward: 70 },
  { id: "c12", title: "Daily Devotion", description: "Earn 200 XP from habits today", icon: "💎", type: "xp_earned", target: 200, xpReward: 100 },
];


/** Seeded pseudo-random — deterministic per date so same 3 challenges all day */
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

// In-memory claim registry — session only, no persistence
const sessionClaims: Record<string, boolean> = {};

/** Compute live progress for each challenge */
function computeProgress(challenge: Omit<DailyChallenge, "progress" | "completed" | "rewardClaimed">): number {
  const today = todayStr();
  const habits = getHabits();
  const user = getUser();
  const sessions = getTimerSessions();

  switch (challenge.type) {
    case "habit_completions": {
      return habits.filter((h) => h.completedDates.includes(today)).length;
    }
    case "all_habits": {
      const total = habits.length;
      const done = habits.filter((h) => h.completedDates.includes(today)).length;
      return total > 0 && done === total ? 1 : 0;
    }
    case "pomodoro": {
      return sessions.filter((s) => s.mode === "pomodoro" && s.completed && s.completedAt?.startsWith(today)).length;
    }
    case "streak": {
      return user.streak;
    }
    case "xp_earned": {
      // XP from habits completed today (xpPerCompletion) + timer sessions today
      const habitXP = habits
        .filter((h) => h.completedDates.includes(today))
        .reduce((sum, h) => sum + h.xpPerCompletion, 0);
      const timerXP = sessions
        .filter((s) => s.completedAt?.startsWith(today))
        .reduce((sum, s) => sum + s.xpEarned, 0);
      return habitXP + timerXP;
    }
    case "focus_minutes": {
      const secs = sessions
        .filter((s) => s.completedAt?.startsWith(today) && (s.mode === "pomodoro" || s.mode === "freeflow"))
        .reduce((sum, s) => sum + s.actualSeconds, 0);
      return Math.floor(secs / 60);
    }
    case "categories": {
      const done = habits.filter((h) => h.completedDates.includes(today));
      return new Set(done.map((h) => h.category)).size;
    }
    default:
      return 0;
  }
}

/** Get today's 3 daily challenges with live progress */
export function getDailyChallenges(): DailyChallenge[] {
  const today = todayStr();
  const store = loadStore();


  const templates = pickChallenges(today);
  return templates.map((tmpl) => {
    const progress = computeProgress(tmpl);
    const completed = progress >= tmpl.target;
    const rewardClaimed = sessionClaims[tmpl.id] ?? false;
    return { ...tmpl, progress, completed, rewardClaimed };
  });
}

/** Claim XP reward for a completed challenge. Returns XP awarded (0 if already claimed). */
export function claimChallengeReward(challengeId: string, xpReward: number): number {
  if (sessionClaims[challengeId]) return 0;

  // Mark claimed in session memory only — no localStorage write
  sessionClaims[challengeId] = true;

  // XP is applied to in-memory state only; no persistence
  const user = getUser();
  user.xp += xpReward;
  user.totalXp += xpReward;
  if (user.xp >= user.xpToNextLevel) {
    user.xp -= user.xpToNextLevel;
    user.level += 1;
  }
  // saveUser intentionally omitted
  return xpReward;
}
