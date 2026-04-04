import { supabase } from "@/lib/supabase";
import type { Habit, TimerSession, ChatMessage } from "@/types";

// ── Game State ──────────────────────────────────────────────────────────────

export interface GameState {
  id: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXp: number;
  streak: number;
  longestStreak: number;
  shields: number;
  lastActiveDate: string | null;
}

export const DEFAULT_GAME_STATE: Omit<GameState, "id"> = {
  level: 1,
  xp: 0,
  xpToNextLevel: 500,
  totalXp: 0,
  streak: 0,
  longestStreak: 0,
  shields: 0,
  lastActiveDate: null,
};

export async function getOrCreateGameState(userId: string): Promise<GameState> {
  const { data, error } = await supabase
    .from("game_state")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    const { data: created } = await supabase
      .from("game_state")
      .insert({ id: userId, ...DEFAULT_GAME_STATE })
      .select()
      .single();
    return {
      id: userId,
      level: created?.level ?? 1,
      xp: created?.xp ?? 0,
      xpToNextLevel: created?.xp_to_next_level ?? 500,
      totalXp: created?.total_xp ?? 0,
      streak: created?.streak ?? 0,
      longestStreak: created?.longest_streak ?? 0,
      shields: created?.shields ?? 0,
      lastActiveDate: created?.last_active_date ?? null,
    };
  }

  return {
    id: data.id,
    level: data.level,
    xp: data.xp,
    xpToNextLevel: data.xp_to_next_level,
    totalXp: data.total_xp,
    streak: data.streak,
    longestStreak: data.longest_streak,
    shields: data.shields,
    lastActiveDate: data.last_active_date,
  };
}

export async function updateGameState(userId: string, updates: Partial<Omit<GameState, "id">>) {
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.level !== undefined) dbUpdates.level = updates.level;
  if (updates.xp !== undefined) dbUpdates.xp = updates.xp;
  if (updates.xpToNextLevel !== undefined) dbUpdates.xp_to_next_level = updates.xpToNextLevel;
  if (updates.totalXp !== undefined) dbUpdates.total_xp = updates.totalXp;
  if (updates.streak !== undefined) dbUpdates.streak = updates.streak;
  if (updates.longestStreak !== undefined) dbUpdates.longest_streak = updates.longestStreak;
  if (updates.shields !== undefined) dbUpdates.shields = updates.shields;
  if (updates.lastActiveDate !== undefined) dbUpdates.last_active_date = updates.lastActiveDate;

  await supabase.from("game_state").update(dbUpdates).eq("id", userId);
}

// ── Habits ──────────────────────────────────────────────────────────────────

export async function fetchHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((h) => ({
    id: h.id,
    name: h.name,
    icon: h.icon,
    color: h.color,
    xpPerCompletion: h.xp_per_completion,
    targetMinutes: h.target_minutes,
    category: h.category,
    completedDates: h.completed_dates ?? [],
    streak: h.streak,
    bestStreak: h.best_streak,
    totalCompletions: h.total_completions,
    createdAt: h.created_at,
  }));
}

export async function createHabit(userId: string, habit: Omit<Habit, "id" | "createdAt" | "completedDates" | "streak" | "bestStreak" | "totalCompletions">): Promise<Habit | null> {
  const { data, error } = await supabase
    .from("habits")
    .insert({
      user_id: userId,
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      xp_per_completion: habit.xpPerCompletion,
      target_minutes: habit.targetMinutes,
      category: habit.category,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("createHabit error:", error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    icon: data.icon,
    color: data.color,
    xpPerCompletion: data.xp_per_completion,
    targetMinutes: data.target_minutes,
    category: data.category,
    completedDates: data.completed_dates ?? [],
    streak: data.streak,
    bestStreak: data.best_streak,
    totalCompletions: data.total_completions,
    createdAt: data.created_at,
  };
}

export async function updateHabit(habitId: string, updates: Partial<Pick<Habit, "completedDates" | "streak" | "bestStreak" | "totalCompletions">>) {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.completedDates !== undefined) dbUpdates.completed_dates = updates.completedDates;
  if (updates.streak !== undefined) dbUpdates.streak = updates.streak;
  if (updates.bestStreak !== undefined) dbUpdates.best_streak = updates.bestStreak;
  if (updates.totalCompletions !== undefined) dbUpdates.total_completions = updates.totalCompletions;

  const { error } = await supabase.from("habits").update(dbUpdates).eq("id", habitId);
  if (error) console.error("updateHabit error:", error);
}

export async function deleteHabit(habitId: string) {
  await supabase.from("habits").delete().eq("id", habitId);
}

// ── Timer Sessions ──────────────────────────────────────────────────────────

export async function fetchTimerSessions(userId: string): Promise<TimerSession[]> {
  const { data, error } = await supabase
    .from("timer_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((s) => ({
    id: s.id,
    habitId: s.habit_id,
    habitName: s.habit_name,
    mode: s.mode,
    plannedMinutes: s.planned_minutes,
    actualSeconds: s.actual_seconds,
    completed: s.completed,
    xpEarned: s.xp_earned,
    startedAt: s.started_at,
    completedAt: s.completed_at,
  }));
}

export async function createTimerSession(userId: string, session: Omit<TimerSession, "id">): Promise<void> {
  await supabase.from("timer_sessions").insert({
    user_id: userId,
    habit_id: session.habitId || null,
    habit_name: session.habitName || null,
    mode: session.mode,
    planned_minutes: session.plannedMinutes,
    actual_seconds: session.actualSeconds,
    completed: session.completed,
    xp_earned: session.xpEarned,
    started_at: session.startedAt,
    completed_at: session.completedAt || null,
  });
}

// ── Chat Messages ───────────────────────────────────────────────────────────

export async function fetchChatMessages(userId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error || !data) return [];

  return data.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: m.created_at,
    type: m.message_type,
  }));
}

export async function saveChatMessage(userId: string, msg: ChatMessage): Promise<void> {
  await supabase.from("chat_messages").insert({
    user_id: userId,
    role: msg.role,
    content: msg.content,
    message_type: msg.type || "normal",
  });
}

export async function clearChatMessages(userId: string): Promise<void> {
  await supabase.from("chat_messages").delete().eq("user_id", userId);
}

// ── Badges ──────────────────────────────────────────────────────────────────

export async function fetchUserBadges(userId: string) {
  const { data, error } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: true });

  if (error || !data) return [];

  return data.map((b) => ({
    id: b.badge_id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    rarity: b.rarity,
    unlockedAt: b.unlocked_at,
  }));
}

export async function awardBadge(userId: string, badge: { id: string; name: string; description: string; icon: string; rarity: string }) {
  // Check if already awarded
  const { data } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_id", badge.id)
    .single();

  if (data) return; // Already awarded

  await supabase.from("user_badges").insert({
    user_id: userId,
    badge_id: badge.id,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    rarity: badge.rarity,
  });
}

// ── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardRow {
  userId: string;
  username: string;
  avatar?: string;
  level: number;
  totalXp: number;
  streak: number;
}

export async function fetchLeaderboard(): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from("game_state")
    .select("id, level, total_xp, streak")
    .order("total_xp", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  // Fetch profiles for these users
  const ids = data.map((r) => r.id);
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, username, avatar_url")
    .in("id", ids);

  const profileMap: Record<string, { username: string; avatar?: string }> = {};
  for (const p of profiles ?? []) {
    profileMap[p.id] = { username: p.username || p.id.slice(0, 8), avatar: p.avatar_url };
  }

  return data.map((r) => ({
    userId: r.id,
    username: profileMap[r.id]?.username ?? "Player",
    avatar: profileMap[r.id]?.avatar,
    level: r.level,
    totalXp: r.total_xp,
    streak: r.streak,
  }));
}

// ── Profile Update ──────────────────────────────────────────────────────────

export async function updateUserProfile(userId: string, updates: { username?: string; fullName?: string; avatarUrl?: string; bio?: string }) {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.username) dbUpdates.username = updates.username;
  if (updates.fullName) dbUpdates.full_name = updates.fullName;
  if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
  if (updates.bio) dbUpdates.bio = updates.bio;

  await supabase.from("user_profiles").update(dbUpdates).eq("id", userId);
  await supabase.auth.updateUser({ data: { username: updates.username, avatar_url: updates.avatarUrl, full_name: updates.fullName } });
}

export const todayStr = (): string => new Date().toISOString().split("T")[0];
