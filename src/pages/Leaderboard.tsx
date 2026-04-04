import { useState, useEffect } from "react";
import { Trophy, Flame, Zap, TrendingUp, Crown, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchLeaderboard, type LeaderboardRow } from "@/lib/db";
import { toast } from "sonner";

type Tab = "global";

function getRankBadge(rank: number): string {
  if (rank === 1) return "🏆";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function getAvatarUrl(userId: string, avatar?: string) {
  return avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&backgroundColor=b6e3f4`;
}

function PodiumCard({ entry, position, height }: { entry: LeaderboardRow; position: number; height: number }) {
  const colors: Record<number, string> = { 1: "#f59e0b", 2: "#94a3b8", 3: "#cd7c3a" };
  const color = colors[position];
  return (
    <div className="flex flex-col items-center gap-2" style={{ width: "30%" }}>
      {position === 1 && <Crown className="w-5 h-5 text-forge-gold animate-float" style={{ filter: "drop-shadow(0 0 6px rgba(245,158,11,0.8))" }} />}
      <div className="relative">
        <img src={getAvatarUrl(entry.userId, entry.avatar)} alt={entry.username}
          className="w-14 h-14 rounded-full border-2" style={{ borderColor: color, boxShadow: `0 0 16px ${color}60` }} />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black" style={{ background: color, color: "#000" }}>
          {position}
        </div>
      </div>
      <p className="text-xs font-semibold text-center truncate w-full">{entry.username}</p>
      <div className="w-full rounded-t-2xl flex items-center justify-center" style={{ height, background: `linear-gradient(180deg, ${color}30, ${color}10)`, border: `1px solid ${color}40` }}>
        <div className="text-center">
          <p className="text-xs font-bold" style={{ color }}>{(entry.totalXp / 1000).toFixed(1)}k</p>
          <p className="text-[9px] text-muted-foreground">XP</p>
        </div>
      </div>
    </div>
  );
}

function RankRow({ entry, isCurrentUser }: { entry: LeaderboardRow & { rank: number }; isCurrentUser: boolean }) {
  return (
    <div className={`glass rounded-2xl p-3 flex items-center gap-3 transition-all duration-200 ${isCurrentUser ? "border border-forge-purple/40" : "hover:bg-white/5"}`}
      style={isCurrentUser ? { boxShadow: "0 0 15px rgba(147,51,234,0.15)" } : undefined}>
      <span className="text-sm text-muted-foreground w-7 text-center font-bold flex-shrink-0">{getRankBadge(entry.rank)}</span>
      <img src={getAvatarUrl(entry.userId, entry.avatar)} alt={entry.username} className="w-9 h-9 rounded-full flex-shrink-0"
        style={isCurrentUser ? { border: "2px solid #9333ea" } : undefined} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isCurrentUser ? "text-forge-purple-light" : ""}`}>
          {entry.username} {isCurrentUser && "(You)"}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground">Lv {entry.level}</span>
          <div className="flex items-center gap-0.5">
            <Flame className="w-3 h-3 text-forge-flame" />
            <span className="text-[10px] text-muted-foreground">{entry.streak}d</span>
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-forge-gold-light">{entry.totalXp.toLocaleString()}</p>
        <p className="text-[10px] text-muted-foreground">Total XP</p>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [board, setBoard] = useState<(LeaderboardRow & { rank: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard().then((data) => {
      const ranked = data.map((entry, i) => ({ ...entry, rank: i + 1 }));
      setBoard(ranked);
      setLoading(false);
    });
  }, []);

  const topThree = board.slice(0, 3);
  const rest = board.slice(3);
  const currentUser = board.find((e) => e.userId === user?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-forge-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] pb-nav">
      <div className="px-4 pt-14 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold">Leaderboard</h1>
            <p className="text-muted-foreground text-sm">All-time XP ranking</p>
          </div>
          <Trophy className="w-7 h-7 text-forge-gold" style={{ filter: "drop-shadow(0 0 8px rgba(245,158,11,0.5))" }} />
        </div>
      </div>

      {board.length === 0 ? (
        <div className="px-4 text-center py-20">
          <div className="text-5xl mb-3">🏆</div>
          <p className="text-white font-semibold mb-1">No players yet!</p>
          <p className="text-muted-foreground text-sm">Start earning XP to be the first on the board.</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {topThree.length >= 3 && (
            <div className="px-4 mb-6">
              <div className="flex items-end justify-center gap-3">
                <PodiumCard entry={topThree[1]} position={2} height={100} />
                <PodiumCard entry={topThree[0]} position={1} height={130} />
                <PodiumCard entry={topThree[2]} position={3} height={80} />
              </div>
            </div>
          )}

          {/* Current user highlight */}
          {currentUser && currentUser.rank > 3 && (
            <div className="px-4 mb-3">
              <div className="glass rounded-2xl p-3 border border-forge-purple/40" style={{ boxShadow: "0 0 20px rgba(147,51,234,0.2)" }}>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-6 text-center font-bold">#{currentUser.rank}</span>
                  <img src={getAvatarUrl(currentUser.userId, currentUser.avatar)} alt={currentUser.username} className="w-9 h-9 rounded-full border-2 border-forge-purple/60" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-forge-purple-light">You · {currentUser.username}</p>
                    <p className="text-xs text-muted-foreground">Level {currentUser.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-forge-gold-light">{currentUser.totalXp.toLocaleString()} XP</p>
                    <p className="text-xs text-muted-foreground">{currentUser.streak}d streak</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rankings */}
          <div className="px-4 space-y-2">
            {(topThree.length < 3 ? board : rest).map((entry) => (
              <RankRow key={entry.userId} entry={entry} isCurrentUser={entry.userId === user?.id} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
