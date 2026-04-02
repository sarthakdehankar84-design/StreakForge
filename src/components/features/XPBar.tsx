import { cn } from "@/lib/utils";
import { getLevelTitle } from "@/constants";
import type { User } from "@/types";

interface XPBarProps {
  user: User;
  compact?: boolean;
}

export default function XPBar({ user, compact = false }: XPBarProps) {
  const pct = Math.min((user.xp / user.xpToNextLevel) * 100, 100);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-forge-purple-light font-bold">Lv {user.level}</span>
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-forge-purple to-forge-cyan transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">{user.xp}/{user.xpToNextLevel}</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-forge-purple-light">Level {user.level}</span>
          <span className="text-xs text-muted-foreground">— {getLevelTitle(user.level)}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {user.xp} / {user.xpToNextLevel} XP
        </span>
      </div>
      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full bg-gradient-to-r from-forge-purple via-forge-purple-light to-forge-cyan transition-all duration-700 ease-out relative"
          style={{ width: `${pct}%` }}
        >
          <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse-ring" />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">
        {user.xpToNextLevel - user.xp} XP to Level {user.level + 1}
      </p>
    </div>
  );
}
