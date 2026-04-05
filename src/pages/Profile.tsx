import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Flame, Zap, Clock, Trophy, Star, Share2, Copy, Check,
  Timer, Target, TrendingUp, Crown, ChevronRight, Swords, LogOut, Loader2, Camera,
  Pencil, X, Save,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { fetchHabits, fetchTimerSessions, fetchUserBadges, getOrCreateGameState, updateUserProfile, type GameState } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { getLevelTitle, RARITY_COLORS } from "@/constants";
import type { Badge } from "@/types";
import XPBar from "@/components/features/XPBar";
import CircularProgress from "@/components/features/CircularProgress";
import { toast } from "sonner";

const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 };
const RARITY_LABELS: Record<Badge["rarity"], string> = { legendary: "Legendary", epic: "Epic", rare: "Rare", common: "Common" };
const RARITY_BG: Record<Badge["rarity"], string> = {
  legendary: "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.08))",
  epic: "linear-gradient(135deg, rgba(167,139,250,0.25), rgba(167,139,250,0.08))",
  rare: "linear-gradient(135deg, rgba(34,211,238,0.25), rgba(34,211,238,0.08))",
  common: "linear-gradient(135deg, rgba(148,163,184,0.15), rgba(148,163,184,0.05))",
};
const RARITY_BORDER: Record<Badge["rarity"], string> = {
  legendary: "rgba(245,158,11,0.55)", epic: "rgba(167,139,250,0.55)", rare: "rgba(34,211,238,0.55)", common: "rgba(148,163,184,0.25)",
};

function HabitHeatmap({ habits }: { habits: { completedDates: string[] }[] }) {
  const DAYS = 91;
  const today = new Date();

  const cells = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (DAYS - 1 - i));
    const dateStr = d.toISOString().split("T")[0];
    const completed = habits.filter((h) => h.completedDates.includes(dateStr)).length;
    const total = habits.length;
    const ratio = total > 0 ? completed / total : 0;
    return { date: dateStr, completed, total, ratio, xp: completed * 55 };
  });

  function heatColor(ratio: number) {
    if (ratio <= 0) return "rgba(255,255,255,0.055)";
    if (ratio < 0.25) return "rgba(147,51,234,0.20)";
    if (ratio < 0.5) return "rgba(147,51,234,0.42)";
    if (ratio < 0.75) return "rgba(147,51,234,0.65)";
    return "#9333ea";
  }

  const firstDate = new Date(cells[0].date);
  const startDow = firstDate.getDay();
  const padded: (typeof cells[0] | null)[] = [...Array(startDow).fill(null), ...cells];
  while (padded.length < 13 * 7) padded.push(null);

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="font-display font-semibold mb-1">Habit Heatmap</h3>
      <p className="text-xs text-muted-foreground mb-3">Last 3 months</p>
      <div className="flex gap-[3px]">
        {Array.from({ length: 13 }, (_, col) => (
          <div key={col} className="flex flex-col flex-1 gap-[3px]">
            {Array.from({ length: 7 }, (_, row) => {
              const cell = padded[col * 7 + row];
              return (
                <div key={row} className="rounded-[3px] transition-transform hover:scale-125" title={cell ? `${cell.date}: ${cell.completed}/${cell.total}` : ""}
                  style={{ aspectRatio: "1", background: cell ? heatColor(cell.ratio) : "transparent", opacity: cell ? 1 : 0 }} />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 border border-white/10 text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-bold text-forge-purple-light">+{payload[0].value} XP</p>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut, refreshUser } = useAuth();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [habits, setHabits] = useState<{ completedDates: string[]; totalCompletions: number }[]>([]);
  const [sessions, setSessions] = useState<{ actualSeconds: number }[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getOrCreateGameState(user.id),
      fetchHabits(user.id),
      fetchTimerSessions(user.id),
      fetchUserBadges(user.id),
    ]).then(([gs, hs, ss, bs]) => {
      setGameState(gs);
      setHabits(hs);
      setSessions(ss);
      setBadges(bs as Badge[]);
      setLoading(false);
    });
  }, [user]);

  const openEditProfile = () => {
    setEditUsername(user?.username ?? "");
    setEditFullName(user?.fullName ?? "");
    setUsernameStatus("idle");
    setEditingProfile(true);
  };

  // Debounced username availability check
  useEffect(() => {
    if (!editingProfile) return;
    const trimmed = editUsername.trim();

    // Same as current username — always valid
    if (trimmed === (user?.username ?? "")) {
      setUsernameStatus("idle");
      return;
    }

    // Basic format validation
    if (trimmed.length < 3) {
      setUsernameStatus(trimmed.length === 0 ? "idle" : "invalid");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("username", trimmed)
        .neq("id", user?.id ?? "")
        .maybeSingle();
      setUsernameStatus(data ? "taken" : "available");
    }, 500);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [editUsername, editingProfile, user?.username, user?.id]);

  const handleSaveProfile = async () => {
    if (!user) return;
    const trimmedUsername = editUsername.trim();
    const trimmedFullName = editFullName.trim();
    if (!trimmedUsername) {
      toast.error("Username cannot be empty");
      return;
    }
    if (usernameStatus === "taken") {
      toast.error("That username is already taken");
      return;
    }
    if (usernameStatus === "invalid") {
      toast.error("Username contains invalid characters");
      return;
    }
    setSavingProfile(true);
    await updateUserProfile(user.id, {
      username: trimmedUsername,
      fullName: trimmedFullName || undefined,
    });
    await refreshUser();
    toast.success("Profile updated!");
    setSavingProfile(false);
    setEditingProfile(false);
  };

  const canSave = useMemo(() => {
    const trimmed = editUsername.trim();
    if (!trimmed) return false;
    if (usernameStatus === "taken" || usernameStatus === "invalid" || usernameStatus === "checking") return false;
    return true;
  }, [editUsername, usernameStatus]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { toast.error("Upload failed"); setUploadingAvatar(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await updateUserProfile(user.id, { avatarUrl: publicUrl });
    await refreshUser();
    toast.success("Profile photo updated!");
    setUploadingAvatar(false);
  };

  const handleSignOut = async () => { await signOut(); navigate("/login"); };

  // Build XP history from heatmap-style data (completedDates)
  const xpHistory = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 29 + i);
    const dateStr = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en", { month: "short", day: "numeric" });
    const xp = habits.filter((h) => h.completedDates.includes(dateStr)).length * 55;
    return { date: label, xp };
  });

  const totalXPLast30 = xpHistory.reduce((s, d) => s + d.xp, 0);
  const bestDayXP = Math.max(...xpHistory.map((d) => d.xp), 0);
  const activeDays = xpHistory.filter((d) => d.xp > 0).length;
  const avgDailyXP = Math.round(totalXPLast30 / 30);
  const totalCompletions = habits.reduce((s, h) => s + h.totalCompletions, 0);
  const focusMinutes = sessions.reduce((s, ss) => s + Math.floor(ss.actualSeconds / 60), 0);
  const focusHours = Math.floor(focusMinutes / 60);
  const sortedBadges = [...badges].sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]);
  const levelPct = gameState ? Math.round((gameState.xp / gameState.xpToNextLevel) * 100) : 0;

  const fakeUser = gameState ? {
    id: user?.id ?? "", name: user?.fullName || user?.username || "Player",
    username: user?.username ?? "Player",
    avatar: user?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`,
    level: gameState.level, xp: gameState.xp, xpToNextLevel: gameState.xpToNextLevel,
    totalXp: gameState.totalXp, streak: gameState.streak, longestStreak: gameState.longestStreak,
    shields: gameState.shields, rank: 1, badges: [], joinedAt: "",
  } : null;

  const handleCopyShare = () => {
    if (!gameState || !user) return;
    const text = `🔥 StreakForge Stats — ${user.username}
━━━━━━━━━━━━━━━━
⚡ Level ${gameState.level} ${getLevelTitle(gameState.level)}
🔥 Best Streak: ${gameState.longestStreak} days
⏱️ Focus Hours: ${focusHours}h
✅ Habits Done: ${totalCompletions}
━━━━━━━━━━━━━━━━
Build habits. Level up. Dominate. StreakForge 🚀`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-forge-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] pb-nav">
      <div className="px-4 pt-12 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-display font-bold">Profile</h1>
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 rounded-xl glass text-muted-foreground hover:text-red-400 transition-colors text-sm">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Hero card */}
      <div className="px-4 mt-3 mb-4">
        <div className="rounded-3xl p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(147,51,234,0.18), rgba(34,211,238,0.10))", border: "1px solid rgba(147,51,234,0.35)", boxShadow: "0 0 40px rgba(147,51,234,0.15)" }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #9333ea, transparent)" }} />
          <div className="relative flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <CircularProgress percentage={levelPct} size={86} strokeWidth={5} color="#9333ea" bgColor="rgba(147,51,234,0.15)">
                <div className="relative">
                  <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} alt={user?.username}
                    className="w-16 h-16 rounded-full" style={{ boxShadow: "0 0 16px rgba(147,51,234,0.5)" }} />
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
              </CircularProgress>
              <button onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-forge-purple flex items-center justify-center" title="Change photo">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              <div className="absolute -bottom-1 -right-8 min-w-[28px] h-7 rounded-full flex items-center justify-center text-xs font-black text-black px-1.5"
                style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", boxShadow: "0 0 10px rgba(245,158,11,0.6)" }}>
                {gameState?.level ?? 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-lg font-display font-bold truncate">{user?.username}</h2>
                <Crown className="w-4 h-4 text-forge-gold flex-shrink-0" />
                <button
                  onClick={openEditProfile}
                  className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-forge-purple-light hover:bg-forge-purple/15 transition-all flex-shrink-0"
                  title="Edit profile"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-sm text-forge-purple-light font-semibold mb-2">
                {gameState ? `${getLevelTitle(gameState.level)} · Level ${gameState.level}` : ""}
              </p>
              {fakeUser && <XPBar user={fakeUser} compact />}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { icon: <Flame className="w-3.5 h-3.5 text-forge-flame" />, value: `${gameState?.streak ?? 0}d`, label: "Streak" },
              { icon: <Trophy className="w-3.5 h-3.5 text-forge-cyan" />, value: `${badges.length} 🏅`, label: "Badges" },
              { icon: <Zap className="w-3.5 h-3.5 text-forge-gold" />, value: (gameState?.totalXp ?? 0).toLocaleString(), label: "Total XP" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl px-2 py-2.5 flex flex-col items-center gap-1">
                {s.icon}
                <p className="text-sm font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inline Edit Profile */}
      {editingProfile && (
        <div className="px-4 mb-4">
          <div
            className="rounded-2xl p-4"
            style={{
              background: "linear-gradient(135deg, rgba(147,51,234,0.12), rgba(34,211,238,0.06))",
              border: "1px solid rgba(147,51,234,0.40)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-forge-purple-light" />
                <span className="text-sm font-display font-bold">Edit Profile</span>
              </div>
              <button
                onClick={() => setEditingProfile(false)}
                className="w-7 h-7 rounded-lg glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="your_username"
                    maxLength={32}
                    className="w-full px-3 py-2.5 pr-9 rounded-xl text-sm font-medium text-white placeholder:text-white/25 outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${
                        usernameStatus === "available" ? "rgba(34,197,94,0.6)"
                        : usernameStatus === "taken" || usernameStatus === "invalid" ? "rgba(239,68,68,0.6)"
                        : "rgba(147,51,234,0.35)"
                      }`,
                    }}
                    onFocus={(e) => {
                      if (usernameStatus === "idle" || usernameStatus === "checking") {
                        e.currentTarget.style.borderColor = "rgba(147,51,234,0.7)";
                      }
                    }}
                    onBlur={(e) => {
                      if (usernameStatus === "idle" || usernameStatus === "checking") {
                        e.currentTarget.style.borderColor = "rgba(147,51,234,0.35)";
                      }
                    }}
                  />
                  {/* Status indicator */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {usernameStatus === "checking" && (
                      <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    )}
                    {usernameStatus === "available" && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.5)" }}>
                        <Check className="w-3 h-3 text-green-400" />
                      </div>
                    )}
                    {(usernameStatus === "taken" || usernameStatus === "invalid") && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)" }}>
                        <X className="w-3 h-3 text-red-400" />
                      </div>
                    )}
                  </div>
                </div>
                {/* Hint text */}
                <div className="mt-1.5 min-h-[16px]">
                  {usernameStatus === "taken" && (
                    <p className="text-[11px] text-red-400">Username is already taken</p>
                  )}
                  {usernameStatus === "invalid" && (
                    <p className="text-[11px] text-red-400">Only letters, numbers, _ . - allowed (min 3 chars)</p>
                  )}
                  {usernameStatus === "available" && (
                    <p className="text-[11px] text-green-400">Username is available!</p>
                  )}
                  {usernameStatus === "checking" && (
                    <p className="text-[11px] text-muted-foreground">Checking availability…</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Full Name <span className="text-white/20">(optional)</span></label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Your full name"
                  maxLength={64}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white placeholder:text-white/25 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(147,51,234,0.35)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(147,51,234,0.7)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(147,51,234,0.35)")}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingProfile(false)}
                className="flex-1 py-2.5 rounded-xl glass text-sm font-semibold text-muted-foreground hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile || !canSave}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #9333ea, #7c3aed)", boxShadow: "0 0 18px rgba(147,51,234,0.4)" }}
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingProfile ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="px-4 mb-4"><HabitHeatmap habits={habits} /></div>

      {/* XP History */}
      <div className="px-4 mb-4">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-display font-semibold">XP History</h3>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-forge-gold-light">{totalXPLast30.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">total XP</p>
            </div>
          </div>
          <div className="flex gap-4 mb-4 mt-3">
            {[{ label: "Avg/day", value: `${avgDailyXP} XP`, color: "#a78bfa" }, { label: "Best day", value: `${bestDayXP} XP`, color: "#f59e0b" }, { label: "Active days", value: `${activeDays}/30`, color: "#22d3ee" }].map((m) => (
              <div key={m.label} className="flex-1 text-center">
                <p className="text-sm font-bold" style={{ color: m.color }}>{m.value}</p>
                <p className="text-[9px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={xpHistory} margin={{ top: 4, right: 2, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} interval={6} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(147,51,234,0.3)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="xp" stroke="#9333ea" strokeWidth={2} fill="url(#xpGradient)" dot={false} activeDot={{ r: 4, fill: "#a78bfa" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Skill Tree shortcut */}
      <div className="px-4 mb-4">
        <Link to="/skills" className="flex items-center gap-4 rounded-2xl p-4 transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, rgba(147,51,234,0.18), rgba(34,211,238,0.10))", border: "1px solid rgba(147,51,234,0.35)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(147,51,234,0.2)", border: "1px solid rgba(147,51,234,0.4)" }}>
            <Swords className="w-5 h-5 text-forge-purple-light" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-display font-bold">Skill Tree</p>
            <p className="text-xs text-muted-foreground">View attribute upgrades</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      </div>

      {/* All-Time Stats */}
      <div className="px-4 mb-4">
        <h3 className="font-display font-semibold mb-3">All-Time Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Timer className="w-5 h-5 text-forge-purple-light" />, label: "Focus Hours", value: `${focusHours}h`, sub: `${focusMinutes} min total`, color: "#9333ea" },
            { icon: <Target className="w-5 h-5 text-forge-cyan" />, label: "Habits Done", value: totalCompletions.toString(), sub: `${habits.length} active habits`, color: "#22d3ee" },
            { icon: <Flame className="w-5 h-5 text-forge-flame" />, label: "Best Streak", value: `${gameState?.longestStreak ?? 0}d`, sub: `Current: ${gameState?.streak ?? 0} days`, color: "#f97316" },
            { icon: <TrendingUp className="w-5 h-5 text-forge-green" />, label: "Sessions", value: sessions.length.toString(), sub: "Pomodoro + Free Flow", color: "#22c55e" },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-4" style={{ boxShadow: `0 0 20px ${stat.color}10` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${stat.color}20`, border: `1px solid ${stat.color}30` }}>
                {stat.icon}
              </div>
              <p className="text-xl font-display font-black mb-0.5">{stat.value}</p>
              <p className="text-xs font-semibold mb-0.5">{stat.label}</p>
              <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display font-semibold">Badges</h3>
              <p className="text-xs text-muted-foreground">{badges.length} earned</p>
            </div>
            <Star className="w-4 h-4 text-forge-gold" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {sortedBadges.map((badge) => (
              <button key={badge.id} onClick={() => setSelectedBadge(badge)}
                className="glass rounded-2xl p-4 flex items-center gap-3 text-left transition-all duration-200 hover:scale-[1.02] group"
                style={{ border: `1px solid ${RARITY_BORDER[badge.rarity]}`, background: RARITY_BG[badge.rarity] }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: `${RARITY_COLORS[badge.rarity]}15`, border: `1px solid ${RARITY_COLORS[badge.rarity]}40` }}>
                  {badge.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{badge.name}</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: RARITY_COLORS[badge.rarity], background: `${RARITY_COLORS[badge.rarity]}20` }}>
                    {RARITY_LABELS[badge.rarity]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {badges.length === 0 && (
        <div className="px-4 mb-4">
          <div className="glass rounded-2xl p-6 text-center">
            <div className="text-4xl mb-2">🏅</div>
            <p className="text-muted-foreground text-sm">Complete habits to earn badges!</p>
          </div>
        </div>
      )}

      {/* Share */}
      <div className="px-4 mb-4">
        <h3 className="font-display font-semibold mb-3">Share Your Stats</h3>
        <div className="flex gap-3">
          <button onClick={handleCopyShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl glass border border-white/10 text-sm font-semibold hover:border-forge-purple/40 transition-all">
            {copied ? <><Check className="w-4 h-4 text-forge-green" /><span className="text-forge-green">Copied!</span></> : <><Copy className="w-4 h-4" />Copy Stats</>}
          </button>
          <button onClick={() => navigator.share ? navigator.share({ title: "StreakForge Stats", text: `Level ${gameState?.level}, ${gameState?.longestStreak}-day best streak! 🔥`, url: window.location.origin }) : handleCopyShare()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-white text-sm hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #9333ea, #22d3ee)", boxShadow: "0 0 20px rgba(147,51,234,0.4)" }}>
            <Share2 className="w-4 h-4" />Share
          </button>
        </div>
      </div>

      {/* Badge detail modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSelectedBadge(null)}>
          <div className="rounded-3xl p-6 w-full max-w-xs text-center relative overflow-hidden"
            style={{ background: RARITY_BG[selectedBadge.rarity], border: `1.5px solid ${RARITY_BORDER[selectedBadge.rarity]}`, boxShadow: `0 0 40px ${RARITY_COLORS[selectedBadge.rarity]}30` }}
            onClick={(e) => e.stopPropagation()}>
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-4"
              style={{ background: `${RARITY_COLORS[selectedBadge.rarity]}15`, border: `2px solid ${RARITY_COLORS[selectedBadge.rarity]}50`, animation: "float 3s ease-in-out infinite" }}>
              {selectedBadge.icon}
            </div>
            <span className="inline-block text-xs font-black px-3 py-1 rounded-full mb-3"
              style={{ color: RARITY_COLORS[selectedBadge.rarity], background: `${RARITY_COLORS[selectedBadge.rarity]}20` }}>
              ✦ {RARITY_LABELS[selectedBadge.rarity].toUpperCase()}
            </span>
            <h3 className="text-xl font-display font-bold mb-2">{selectedBadge.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{selectedBadge.description}</p>
            <button onClick={() => setSelectedBadge(null)} className="w-full py-3 rounded-2xl font-semibold text-white text-sm hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${RARITY_COLORS[selectedBadge.rarity]}, ${RARITY_COLORS[selectedBadge.rarity]}99)` }}>
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
