import { useState } from "react";
import { Trophy, Flame, Zap, TrendingUp, Crown, Users, Swords } from "lucide-react";
import { mockLeaderboard } from "@/lib/mockData";
import type { LeaderboardEntry } from "@/types";
import { toast } from "sonner";

type Tab = "global" | "friends";

const FRIENDS_IDS = ["user-1", "u3", "u5", "u7", "u9", "u10"];

const FRIENDS_EXTRA: Record<string, { weeklyXpHistory: number[]; mutualHabits: string }> = {
  "u3":    { weeklyXpHistory: [1800, 2100, 2400, 2650], mutualHabits: "Study, Reading" },
  "u5":    { weeklyXpHistory: [1500, 1900, 2100, 2280], mutualHabits: "Coding, Fitness" },
  "u7":    { weeklyXpHistory: [1200, 1500, 1700, 1950], mutualHabits: "Meditation" },
  "u9":    { weeklyXpHistory: [980, 1300, 1500, 1680],  mutualHabits: "Study, Coding" },
  "u10":   { weeklyXpHistory: [900, 1100, 1400, 1590],  mutualHabits: "Reading" },
  "user-1":{ weeklyXpHistory: [180, 240, 290, 320],     mutualHabits: "All habits" },
};

const friendsLeaderboard = mockLeaderboard
  .filter((e) => FRIENDS_IDS.includes(e.userId))
  .sort((a, b) => b.weeklyXp - a.weeklyXp)
  .map((e, i) => ({ ...e, friendRank: i + 1 }));

const MAX_FRIEND_XP = Math.max(...friendsLeaderboard.map((f) => f.weeklyXp));

export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>("global");
  const [nudged, setNudged] = useState<Set<string>>(new Set());

  const data = mockLeaderboard;
  const topThree = data.slice(0, 3);
  const rest = data.slice(3);
  const currentUser = data.find((e) => e.isCurrentUser);

  const handleNudge = (name: string, userId: string) => {
    if (nudged.has(userId)) return;
    setNudged((prev) => new Set(prev).add(userId));
    toast.success(`+5 XP challenge sent to ${name}! 🔥`, {
      description: "They'll get notified to step up their game.",
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] pb-nav">
      <div className="px-4 pt-14 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Leaderboard</h1>
            <p className="text-muted-foreground text-sm">Weekly ranking — resets Monday</p>
          </div>
          <Trophy className="w-7 h-7 text-forge-gold" style={{ filter: "drop-shadow(0 0 8px rgba(245,158,11,0.5))" }} />
        </div>

        {/* Tab */}
        <div className="glass rounded-2xl p-1 flex mb-6">
          {(["global", "friends"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                tab === t
                  ? "bg-forge-purple/30 text-forge-purple-light border border-forge-purple/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "global" ? "🌍 Global" : "👥 Friends"}
            </button>
          ))}
        </div>
      </div>

      {tab === "global" ? (
        <>
          {/* Podium */}
          <div className="px-4 mb-6">
            <div className="flex items-end justify-center gap-3">
              <PodiumCard entry={topThree[1]} position={2} height={100} />
              <PodiumCard entry={topThree[0]} position={1} height={130} />
              <PodiumCard entry={topThree[2]} position={3} height={80} />
            </div>
          </div>

          {/* Current user highlight */}
          {currentUser && currentUser.rank > 3 && (
            <div className="px-4 mb-3">
              <div className="glass rounded-2xl p-3 border border-forge-purple/40" style={{ boxShadow: "0 0 20px rgba(147,51,234,0.2)" }}>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-6 text-center font-bold">#{currentUser.rank}</span>
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-9 h-9 rounded-full border-2 border-forge-purple/60" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-forge-purple-light">You · {currentUser.name}</p>
                    <p className="text-xs text-muted-foreground">Level {currentUser.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-forge-gold-light">{currentUser.weeklyXp.toLocaleString()} XP</p>
                    <p className="text-xs text-muted-foreground">{currentUser.streak}d streak</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rankings list */}
          <div className="px-4 space-y-2">
            {rest.map((entry) => (
              <RankRow key={entry.userId} entry={entry} />
            ))}
          </div>
        </>
      ) : (
        /* ─── Friends Tab ─────────────────────────── */
        <div className="px-4 space-y-3">
          {/* Friends summary header */}
          <div
            className="rounded-2xl p-4 flex items-center gap-4 mb-2"
            style={{
              background: "linear-gradient(135deg, rgba(147,51,234,0.12), rgba(34,211,238,0.07))",
              border: "1px solid rgba(147,51,234,0.28)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(147,51,234,0.2)", border: "1px solid rgba(147,51,234,0.4)" }}
            >
              <Users className="w-5 h-5 text-forge-purple-light" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-display font-bold text-foreground">{friendsLeaderboard.length} Friends competing</p>
              <p className="text-xs text-muted-foreground">Nudge them to keep up the grind ⚡</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-forge-cyan">
                {friendsLeaderboard.find((f) => f.isCurrentUser)?.friendRank ?? "?"}<span className="text-xs font-normal text-muted-foreground">/{friendsLeaderboard.length}</span>
              </p>
              <p className="text-[10px] text-muted-foreground">Your rank</p>
            </div>
          </div>

          {friendsLeaderboard.map((friend, idx) => (
            <FriendCard
              key={friend.userId}
              friend={friend as LeaderboardEntry & { friendRank: number }}
              extra={FRIENDS_EXTRA[friend.userId]}
              maxXP={MAX_FRIEND_XP}
              nudged={nudged.has(friend.userId)}
              onNudge={() => handleNudge(friend.name.split(" ")[0], friend.userId)}
              animDelay={idx * 80}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PodiumCard({ entry, position, height }: { entry: LeaderboardEntry; position: number; height: number }) {
  if (!entry) return null;
  const colors: Record<number, string> = { 1: "#f59e0b", 2: "#94a3b8", 3: "#cd7c3a" };
  const color = colors[position];

  return (
    <div className="flex flex-col items-center gap-2" style={{ width: "30%" }}>
      {position === 1 && <Crown className="w-5 h-5 text-forge-gold animate-float" style={{ filter: "drop-shadow(0 0 6px rgba(245,158,11,0.8))" }} />}
      <div className="relative">
        <img
          src={entry.avatar}
          alt={entry.name}
          className="w-14 h-14 rounded-full border-2"
          style={{ borderColor: color, boxShadow: `0 0 16px ${color}60` }}
        />
        <div
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
          style={{ background: color, color: "#000" }}
        >
          {position}
        </div>
      </div>
      <p className="text-xs font-semibold text-center text-foreground truncate w-full text-center">{entry.name}</p>
      <div
        className="w-full rounded-t-2xl flex items-center justify-center"
        style={{ height, background: `linear-gradient(180deg, ${color}30, ${color}10)`, border: `1px solid ${color}40` }}
      >
        <div className="text-center">
          <p className="text-xs font-bold" style={{ color }}>{(entry.weeklyXp / 1000).toFixed(1)}k</p>
          <p className="text-[9px] text-muted-foreground">XP</p>
        </div>
      </div>
    </div>
  );
}

function RankRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div
      className={`glass rounded-2xl p-3 flex items-center gap-3 transition-all duration-200 ${
        entry.isCurrentUser ? "border border-forge-purple/40" : "hover:bg-white/5"
      }`}
      style={entry.isCurrentUser ? { boxShadow: "0 0 15px rgba(147,51,234,0.15)" } : undefined}
    >
      <span className="text-sm text-muted-foreground w-7 text-center font-bold flex-shrink-0">
        {entry.badge || `#${entry.rank}`}
      </span>

      <img
        src={entry.avatar}
        alt={entry.name}
        className="w-9 h-9 rounded-full flex-shrink-0"
        style={entry.isCurrentUser ? { border: "2px solid #9333ea" } : undefined}
      />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${entry.isCurrentUser ? "text-forge-purple-light" : "text-foreground"}`}>
          {entry.name} {entry.isCurrentUser && "(You)"}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground">Lv {entry.level}</span>
          <div className="flex items-center gap-0.5">
            <Flame className="w-3 h-3 text-forge-flame" />
            <span className="text-[10px] text-muted-foreground">{entry.streak}d</span>
          </div>
          <div className="flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3 text-forge-green" />
            <span className="text-[10px] text-muted-foreground">{entry.consistencyScore}%</span>
          </div>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-forge-gold-light">{entry.weeklyXp.toLocaleString()}</p>
        <p className="text-[10px] text-muted-foreground">XP this week</p>
      </div>
    </div>
  );
}

// ─── Friend Card ──────────────────────────────────────────────────────────────
function FriendCard({
  friend,
  extra,
  maxXP,
  nudged,
  onNudge,
  animDelay,
}: {
  friend: LeaderboardEntry & { friendRank: number };
  extra: { weeklyXpHistory: number[]; mutualHabits: string };
  maxXP: number;
  nudged: boolean;
  onNudge: () => void;
  animDelay: number;
}) {
  const xpPct = Math.round((friend.weeklyXp / maxXP) * 100);
  const isYou = friend.isCurrentUser;
  const rankColors: Record<number, string> = { 1: "#f59e0b", 2: "#94a3b8", 3: "#cd7c3a" };
  const rankColor = rankColors[friend.friendRank] ?? (isYou ? "#9333ea" : "rgba(255,255,255,0.3)");

  // XP trend: compare last two weeks
  const hist = extra.weeklyXpHistory;
  const trend = hist.length >= 2 ? hist[hist.length - 1] - hist[hist.length - 2] : 0;

  return (
    <div
      className="rounded-2xl p-4 transition-all duration-300"
      style={{
        background: isYou
          ? "linear-gradient(135deg, rgba(147,51,234,0.18), rgba(147,51,234,0.06))"
          : "rgba(255,255,255,0.04)",
        border: isYou ? "1px solid rgba(147,51,234,0.45)" : "1px solid rgba(255,255,255,0.08)",
        boxShadow: isYou ? "0 0 20px rgba(147,51,234,0.15)" : undefined,
        animationDelay: `${animDelay}ms`,
      }}
    >
      {/* Top row: rank + avatar + name + nudge */}
      <div className="flex items-center gap-3 mb-3">
        {/* Rank badge */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
          style={{
            background: `${rankColor}20`,
            border: `1.5px solid ${rankColor}60`,
            color: rankColor,
            boxShadow: friend.friendRank <= 3 ? `0 0 8px ${rankColor}40` : undefined,
          }}
        >
          {friend.friendRank <= 3 ? ["🥇","🥈","🥉"][friend.friendRank - 1] : `#${friend.friendRank}`}
        </div>

        {/* Avatar with level ring */}
        <div className="relative flex-shrink-0">
          <img
            src={friend.avatar}
            alt={friend.name}
            className="w-11 h-11 rounded-full"
            style={{
              border: `2px solid ${isYou ? "#9333ea" : rankColor}`,
              boxShadow: `0 0 10px ${isYou ? "rgba(147,51,234,0.4)" : rankColor + "40"}`,
            }}
          />
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-black"
            style={{ background: isYou ? "#9333ea" : rankColor }}
          >
            {friend.level}
          </div>
        </div>

        {/* Name + mutual habits */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={`text-sm font-bold truncate ${isYou ? "text-forge-purple-light" : "text-foreground"}`}>
              {friend.name}{isYou && " (You)"}
            </p>
            {/* Streak flame */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Flame
                className="w-3.5 h-3.5"
                style={{
                  color: friend.streak >= 14 ? "#f97316" : friend.streak >= 7 ? "#f59e0b" : "rgba(255,255,255,0.3)",
                  filter: friend.streak >= 7 ? "drop-shadow(0 0 3px rgba(249,115,22,0.6))" : undefined,
                }}
              />
              <span
                className="text-[10px] font-bold"
                style={{ color: friend.streak >= 7 ? "#f97316" : "rgba(255,255,255,0.4)" }}
              >
                {friend.streak}d
              </span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">{extra.mutualHabits}</p>
        </div>

        {/* Nudge button */}
        {!isYou && (
          <button
            onClick={onNudge}
            disabled={nudged}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95"
            style={{
              background: nudged
                ? "rgba(255,255,255,0.06)"
                : "linear-gradient(135deg, rgba(147,51,234,0.3), rgba(34,211,238,0.2))",
              border: nudged
                ? "1px solid rgba(255,255,255,0.1)"
                : "1px solid rgba(147,51,234,0.5)",
              color: nudged ? "rgba(255,255,255,0.35)" : "#a78bfa",
              boxShadow: nudged ? undefined : "0 0 10px rgba(147,51,234,0.25)",
            }}
          >
            <Swords className="w-3 h-3" />
            {nudged ? "Sent!" : "+5 XP"}
          </button>
        )}
      </div>

      {/* XP bar + stats row */}
      <div>
        {/* Weekly XP bar */}
        <div className="flex items-center gap-2 mb-1.5">
          <Zap className="w-3 h-3 text-forge-gold flex-shrink-0" />
          <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${xpPct}%`,
                background: isYou
                  ? "linear-gradient(90deg, #9333ea, #a78bfa)"
                  : friend.friendRank === 1
                  ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                  : "linear-gradient(90deg, rgba(147,51,234,0.5), rgba(34,211,238,0.5))",
                boxShadow: isYou ? "0 0 6px rgba(147,51,234,0.6)" : undefined,
              }}
            />
          </div>
          <span className="text-[10px] font-bold text-forge-gold-light flex-shrink-0 w-16 text-right">
            {friend.weeklyXp.toLocaleString()} XP
          </span>
        </div>

        {/* Trend + consistency */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <TrendingUp
              className="w-3 h-3"
              style={{ color: trend >= 0 ? "#22c55e" : "#ef4444" }}
            />
            <span
              className="text-[10px] font-semibold"
              style={{ color: trend >= 0 ? "#22c55e" : "#ef4444" }}
            >
              {trend >= 0 ? "+" : ""}{trend.toLocaleString()} vs last week
            </span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <span className="text-[10px] text-muted-foreground">
            {friend.consistencyScore}% consistent
          </span>
        </div>
      </div>
    </div>
  );
}
