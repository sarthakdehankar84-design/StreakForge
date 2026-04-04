import { useState, useEffect, useCallback } from "react";
import { Zap, CheckCircle2, Trophy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { type DailyChallenge, getDailyChallengesFromData, claimChallengeRewardFromData } from "@/lib/challenges";
import ConfettiBurst from "@/components/features/ConfettiBurst";
import type { Habit } from "@/types";
import type { GameState } from "@/lib/db";

interface DailyChallengesProps {
  habits: Habit[];
  gameState: GameState | null;
  onXPAwarded: (xp: number) => void;
}

export default function DailyChallenges({ habits, gameState, onXPAwarded }: DailyChallengesProps) {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [allDoneNotified, setAllDoneNotified] = useState(false);

  const refresh = useCallback(() => {
    if (!gameState) return;
    setChallenges(getDailyChallengesFromData(habits, gameState));
  }, [habits, gameState]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const allDone = challenges.length === 3 && challenges.every((c) => c.completed);
    const allClaimed = challenges.every((c) => c.rewardClaimed);
    if (allDone && allClaimed && !allDoneNotified) {
      setAllDoneNotified(true);
      setShowConfetti(true);
    }
  }, [challenges, allDoneNotified]);

  const handleClaim = (challenge: DailyChallenge) => {
    if (!challenge.completed || challenge.rewardClaimed) return;
    const xp = claimChallengeRewardFromData(challenge.id, challenge.xpReward);
    if (xp > 0) {
      refresh();
      onXPAwarded(xp);
      toast.success(`+${xp} XP — "${challenge.title}" complete! 🎯`, { description: challenge.description, duration: 3000 });
    }
  };

  const completedCount = challenges.filter((c) => c.completed).length;
  const totalXP = challenges.reduce((s, c) => s + c.xpReward, 0);
  const claimedXP = challenges.filter((c) => c.rewardClaimed).reduce((s, c) => s + c.xpReward, 0);

  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const hoursLeft = Math.floor((midnight.getTime() - now.getTime()) / 3_600_000);
  const minsLeft = Math.floor(((midnight.getTime() - now.getTime()) % 3_600_000) / 60_000);

  if (challenges.length === 0) return null;

  return (
    <>
      {showConfetti && <ConfettiBurst onDone={() => setShowConfetti(false)} />}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="px-4 pt-4 pb-3" style={{ background: "linear-gradient(135deg, rgba(147,51,234,0.12), rgba(34,211,238,0.06))", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(147,51,234,0.3), rgba(34,211,238,0.15))", border: "1px solid rgba(147,51,234,0.45)" }}>
                <Trophy className="w-4 h-4 text-forge-purple-light" />
              </div>
              <div>
                <h2 className="text-sm font-display font-bold leading-tight">Daily Challenges</h2>
                <p className="text-[9px] text-muted-foreground">Resets in {hoursLeft}h {minsLeft}m</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {challenges.map((c, i) => (
                  <div key={i} className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{ background: c.rewardClaimed ? "#22c55e" : c.completed ? "#f59e0b" : "rgba(255,255,255,0.15)", boxShadow: c.completed ? (c.rewardClaimed ? "0 0 4px #22c55e" : "0 0 4px #f59e0b") : undefined }} />
                ))}
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-forge-gold">{claimedXP}/{totalXP} XP</p>
                <p className="text-[9px] text-muted-foreground">{completedCount}/3 done</p>
              </div>
              <button onClick={refresh} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground" style={{ background: "rgba(255,255,255,0.05)" }}>
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(completedCount / 3) * 100}%`, background: completedCount === 3 ? "linear-gradient(90deg, #22c55e, #4ade80)" : "linear-gradient(90deg, #9333ea, #22d3ee)" }} />
            </div>
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          {challenges.map((challenge, idx) => (
            <ChallengeRow key={challenge.id} challenge={challenge} index={idx} onClaim={() => handleClaim(challenge)} />
          ))}
        </div>
        {challenges.every((c) => c.rewardClaimed) && (
          <div className="px-4 py-3 text-center" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.05))", borderTop: "1px solid rgba(34,197,94,0.2)" }}>
            <p className="text-xs font-bold text-green-400">🎉 All challenges complete! Come back tomorrow.</p>
          </div>
        )}
      </div>
    </>
  );
}

function ChallengeRow({ challenge, index, onClaim }: { challenge: DailyChallenge; index: number; onClaim: () => void }) {
  const progress = Math.min(challenge.progress, challenge.target);
  const pct = Math.min(challenge.target > 0 ? Math.round((progress / challenge.target) * 100) : 0, 100);
  const progressColor = challenge.rewardClaimed ? "#22c55e" : challenge.completed ? "#f59e0b" : index === 0 ? "#9333ea" : index === 1 ? "#22d3ee" : "#f97316";
  const progressLabel = challenge.type === "all_habits" ? (challenge.completed ? "Complete" : "Incomplete") : challenge.type === "streak" ? `${progress}/${challenge.target} days` : challenge.type === "focus_minutes" ? `${progress}/${challenge.target} min` : challenge.type === "xp_earned" ? `${progress}/${challenge.target} XP` : challenge.type === "categories" ? `${progress}/${challenge.target} categories` : `${progress}/${challenge.target}`;
  return (
    <div className="px-4 py-3 transition-all duration-200"
      style={{ background: challenge.rewardClaimed ? "rgba(34,197,94,0.04)" : challenge.completed ? "rgba(245,158,11,0.05)" : undefined }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5"
          style={{ background: challenge.rewardClaimed ? "rgba(34,197,94,0.15)" : challenge.completed ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${challenge.rewardClaimed ? "rgba(34,197,94,0.35)" : challenge.completed ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.1)"}` }}>
          {challenge.rewardClaimed ? "✅" : challenge.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className={`text-sm font-bold leading-tight ${challenge.rewardClaimed ? "text-green-400 line-through opacity-70" : ""}`}>{challenge.title}</p>
            {challenge.rewardClaimed ? (
              <div className="flex items-center gap-1 flex-shrink-0"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /><span className="text-[10px] font-bold text-green-400">+{challenge.xpReward}</span></div>
            ) : challenge.completed ? (
              <button onClick={onClaim} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all active:scale-95 flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)", color: "#000", boxShadow: "0 0 10px rgba(245,158,11,0.4)" }}>
                <Zap className="w-2.5 h-2.5" />Claim +{challenge.xpReward}
              </button>
            ) : (
              <div className="flex items-center gap-0.5 px-2 py-1 rounded-lg flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Zap className="w-2.5 h-2.5 text-forge-gold opacity-60" /><span className="text-[10px] font-bold text-muted-foreground">+{challenge.xpReward}</span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mb-2">{challenge.description}</p>
          <div className="space-y-1">
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, background: challenge.rewardClaimed ? "#22c55e" : `linear-gradient(90deg, ${progressColor}, ${progressColor}cc)` }} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-muted-foreground">{progressLabel}</span>
              <span className="text-[9px] font-bold" style={{ color: challenge.completed ? progressColor : "rgba(255,255,255,0.3)" }}>{pct}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
