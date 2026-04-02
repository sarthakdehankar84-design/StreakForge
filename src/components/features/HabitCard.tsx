import { CheckCircle2, Flame, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Habit } from "@/types";
import { isHabitCompletedToday } from "@/lib/storage";

interface HabitCardProps {
  habit: Habit;
  onComplete: (habitId: string) => void;
  compact?: boolean;
}

export default function HabitCard({ habit, onComplete, compact = false }: HabitCardProps) {
  const completed = isHabitCompletedToday(habit);

  const completionRate = Math.round(
    (habit.completedDates.length / Math.max(
      Math.ceil((Date.now() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      1
    )) * 100
  );

  return (
    <div
      className={cn(
        "glass rounded-2xl transition-all duration-300 cursor-pointer group",
        completed
          ? "border-forge-green/30 bg-forge-green/5"
          : "hover:border-white/15 hover:bg-white/5",
        compact ? "p-3" : "p-4"
      )}
      style={{
        boxShadow: completed ? `0 0 20px ${habit.color}20` : undefined,
      }}
      onClick={() => !completed && onComplete(habit.id)}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={cn(
            "rounded-xl flex items-center justify-center text-xl transition-all duration-200 flex-shrink-0",
            compact ? "w-10 h-10" : "w-12 h-12"
          )}
          style={{ background: `${habit.color}25`, border: `1px solid ${habit.color}40` }}
        >
          {habit.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn("font-semibold text-foreground truncate", compact ? "text-sm" : "text-base")}>
              {habit.name}
            </h3>
            {completed && (
              <span className="text-[10px] font-bold text-forge-green bg-forge-green/15 px-2 py-0.5 rounded-full flex-shrink-0">
                DONE
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-forge-flame" />
              <span className="text-xs text-muted-foreground">{habit.streak}d</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-forge-gold" />
              <span className="text-xs text-muted-foreground">+{habit.xpPerCompletion} XP</span>
            </div>
            {!compact && (
              <div className="flex-1">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${completionRate}%`,
                      background: habit.color,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Complete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!completed) onComplete(habit.id);
          }}
          className={cn(
            "rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0",
            compact ? "w-8 h-8" : "w-10 h-10",
            completed
              ? "text-forge-green cursor-default"
              : "text-muted-foreground hover:text-foreground hover:scale-110 hover:bg-white/10"
          )}
        >
          <CheckCircle2
            className={cn("transition-all", compact ? "w-5 h-5" : "w-6 h-6")}
            fill={completed ? "currentColor" : "none"}
          />
        </button>
      </div>
    </div>
  );
}
