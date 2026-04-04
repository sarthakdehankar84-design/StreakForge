import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, RotateCcw, SkipForward, Zap, Coffee, Layers,
  Clock, TrendingUp, History, Volume2, VolumeX, Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchHabits, fetchTimerSessions, createTimerSession, updateGameState, getOrCreateGameState, type GameState } from "@/lib/db";
import type { Habit, TimerSession } from "@/types";
import { POMODORO_WORK, POMODORO_SHORT_BREAK, XP_PER_POMODORO, XP_PER_FREE_MINUTE } from "@/constants";
import CircularProgress from "@/components/features/CircularProgress";
import XPToast from "@/components/features/XPToast";
import { getSoundEnabled, setSoundEnabled, playTick, playCompletionChime, playBreakBell } from "@/lib/audio";

type TimerMode = "pomodoro" | "shortBreak" | "longBreak" | "freeflow";
type Preset = "pomodoro" | "deepwork";

const PRESET_CONFIG: Record<Preset, {
  label: string; sublabel: string; workMinutes: number; breakMinutes: number;
  color: string; glowColor: string; icon: string; description: string;
}> = {
  pomodoro: { label: "Pomodoro", sublabel: "25 / 5 min", workMinutes: 25, breakMinutes: 5, color: "#9333ea", glowColor: "rgba(147,51,234,0.4)", icon: "🍅", description: "Classic focus sprints with short recovery breaks" },
  deepwork: { label: "Deep Work", sublabel: "90 / 15 min", workMinutes: 90, breakMinutes: 15, color: "#22d3ee", glowColor: "rgba(34,211,238,0.4)", icon: "🧠", description: "Extended concentration for complex tasks" },
};

const MODE_CONFIG: Record<TimerMode, { label: string; color: string; icon: React.ReactNode }> = {
  pomodoro: { label: "Focus", color: "#9333ea", icon: <Layers className="w-4 h-4" /> },
  shortBreak: { label: "Break", color: "#22d3ee", icon: <Coffee className="w-4 h-4" /> },
  longBreak: { label: "Long Break", color: "#22c55e", icon: <Coffee className="w-4 h-4" /> },
  freeflow: { label: "Free Flow", color: "#f59e0b", icon: <Zap className="w-4 h-4" /> },
};

function formatTime(secs: number): string {
  const m = Math.floor(Math.abs(secs) / 60).toString().padStart(2, "0");
  const s = (Math.abs(secs) % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function DailySummary({ sessions }: { sessions: TimerSession[] }) {
  const todayStr = new Date().toISOString().split("T")[0];
  const todaySessions = sessions.filter((s) => s.completedAt?.startsWith(todayStr));
  const totalSecs = todaySessions.reduce((acc, s) => acc + s.actualSeconds, 0);
  const totalMinutes = Math.floor(totalSecs / 60);
  const totalXP = todaySessions.reduce((acc, s) => acc + s.xpEarned, 0);
  const count = todaySessions.length;
  const pct = Math.min((totalMinutes / 120) * 100, 100);

  return (
    <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, rgba(147,51,234,0.10), rgba(34,211,238,0.06))", border: "1px solid rgba(147,51,234,0.25)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-forge-purple-light" />
          <span className="text-sm font-display font-semibold">Today's Focus</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{count} session{count !== 1 ? "s" : ""}</span>
      </div>
      <div className="flex items-end gap-6 mb-3">
        <div>
          <p className="text-2xl font-display font-black">{totalMinutes}<span className="text-sm font-normal text-muted-foreground ml-1">min</span></p>
          <p className="text-[10px] text-muted-foreground">Focus time</p>
        </div>
        <div>
          <p className="text-xl font-display font-bold text-forge-gold-light">+{totalXP}<span className="text-sm font-normal text-muted-foreground ml-1">XP</span></p>
          <p className="text-[10px] text-muted-foreground">Earned today</p>
        </div>
        {count > 0 && (
          <div className="ml-auto text-right">
            <p className="text-sm font-bold text-forge-cyan">{Math.floor(totalSecs / count / 60)}m</p>
            <p className="text-[10px] text-muted-foreground">Avg/session</p>
          </div>
        )}
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] text-muted-foreground">Daily goal: 2h focus</span>
          <span className="text-[9px] font-bold" style={{ color: pct >= 100 ? "#22c55e" : "#a78bfa" }}>
            {pct >= 100 ? "✓ Goal reached!" : `${Math.round(pct)}%`}
          </span>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{
            width: `${pct}%`,
            background: pct >= 100 ? "linear-gradient(90deg, #22c55e, #4ade80)" : "linear-gradient(90deg, #9333ea, #22d3ee)",
          }} />
        </div>
      </div>
    </div>
  );
}

function SessionHistory({ sessions }: { sessions: TimerSession[] }) {
  if (sessions.length === 0) return null;
  const recent = [...sessions].slice(0, 5);
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-display font-semibold">Recent Sessions</span>
        <span className="ml-auto text-[10px] text-muted-foreground">{sessions.length} total</span>
      </div>
      <div className="space-y-2">
        {recent.map((session, idx) => {
          const modeLabel = session.mode === "pomodoro" ? "Pomo" : session.mode === "freeflow" ? "Flow" : "Break";
          const modeColor = session.mode === "pomodoro" ? "#9333ea" : session.mode === "freeflow" ? "#f59e0b" : "#22d3ee";
          const dMins = Math.floor(session.actualSeconds / 60);
          const dSecs = session.actualSeconds % 60;
          const timeStr = dMins > 0 ? `${dMins}m${dSecs > 0 ? ` ${dSecs}s` : ""}` : `${session.actualSeconds}s`;
          const timeAgo = session.completedAt ? new Date(session.completedAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) : "";
          return (
            <div key={session.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: idx === 0 ? "rgba(147,51,234,0.08)" : "rgba(255,255,255,0.03)", border: idx === 0 ? "1px solid rgba(147,51,234,0.2)" : "1px solid rgba(255,255,255,0.05)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${modeColor}15`, border: `1px solid ${modeColor}30` }}>
                <Clock className="w-4 h-4" style={{ color: modeColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{session.habitName || "Focus Session"}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${modeColor}20`, color: modeColor }}>{modeLabel}</span>
                  {timeAgo && <span className="text-[9px] text-muted-foreground">{timeAgo}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold">{timeStr}</p>
                <p className="text-[10px] font-semibold text-forge-gold">+{session.xpEarned} XP</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Timer() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<Preset>("pomodoro");
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(PRESET_CONFIG.pomodoro.workMinutes * 60);
  const [totalSeconds, setTotalSeconds] = useState(PRESET_CONFIG.pomodoro.workMinutes * 60);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [toast, setToast] = useState<{ xp: number; name: string } | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [soundEnabled, setSoundEnabledState] = useState(() => getSoundEnabled());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastTickSecRef = useRef<number>(-1);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchHabits(user.id), fetchTimerSessions(user.id), getOrCreateGameState(user.id)])
      .then(([hs, ss, gs]) => { setHabits(hs); setSessions(ss); setGameState(gs); setLoading(false); });
  }, [user]);

  const cfg = MODE_CONFIG[mode];
  const presetCfg = PRESET_CONFIG[preset];

  const resetTimer = useCallback((m: TimerMode = mode, p: Preset = preset) => {
    const pc = PRESET_CONFIG[p];
    const secs = m === "pomodoro" ? pc.workMinutes * 60 : m === "shortBreak" ? pc.breakMinutes * 60 : m === "longBreak" ? pc.breakMinutes * 2 * 60 : 3600;
    setSecondsLeft(secs);
    setTotalSeconds(secs);
    setRunning(false);
    setSessionStarted(false);
    setElapsed(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [mode, preset]);

  useEffect(() => { resetTimer(mode, preset); }, [mode, preset]);

  const handleComplete = useCallback(async () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    let xpEarned = 0;
    if (mode === "pomodoro") {
      xpEarned = XP_PER_POMODORO;
      setPomodorosCompleted((p) => p + 1);
    } else if (mode === "freeflow") {
      xpEarned = Math.floor((elapsed / 60) * XP_PER_FREE_MINUTE);
    }

    if (xpEarned > 0 && user && gameState) {
      playCompletionChime();
      const session: Omit<TimerSession, "id"> = {
        habitId: selectedHabit?.id,
        habitName: selectedHabit?.name,
        mode,
        plannedMinutes: presetCfg.workMinutes,
        actualSeconds: elapsed,
        completed: true,
        xpEarned,
        startedAt: new Date(Date.now() - elapsed * 1000).toISOString(),
        completedAt: new Date().toISOString(),
      };
      await createTimerSession(user.id, session);

      let { xp, level, xpToNextLevel, totalXp } = gameState;
      xp += xpEarned;
      totalXp += xpEarned;
      if (xp >= xpToNextLevel) { xp -= xpToNextLevel; level += 1; }
      const newGs = { ...gameState, xp, level, totalXp };
      setGameState(newGs);
      await updateGameState(user.id, { xp, level, totalXp });

      const newSession = { id: `s_${Date.now()}`, ...session };
      setSessions((prev) => [newSession, ...prev]);
      setToast({ xp: xpEarned, name: mode === "pomodoro" ? "Pomodoro Complete! 🍅" : "Focus Session! ⚡" });
    }
    resetTimer();
  }, [mode, elapsed, selectedHabit, user, gameState, presetCfg.workMinutes, resetTimer]);

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now() - elapsed * 1000;
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const newElapsed = Math.floor((now - startTimeRef.current) / 1000);
        setElapsed(newElapsed);
        if (mode === "freeflow") {
          setSecondsLeft(newElapsed);
        } else {
          const remaining = totalSeconds - newElapsed;
          if (remaining <= 0) { handleComplete(); return; }
          setSecondsLeft(remaining);
          if (mode === "pomodoro" && remaining <= 5 && remaining > 0) {
            const ir = Math.ceil(remaining);
            if (ir !== lastTickSecRef.current) { lastTickSecRef.current = ir; playTick(); }
          } else { lastTickSecRef.current = -1; }
        }
      }, 250);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handlePlayPause = () => {
    if (!running && !sessionStarted) { setSessionStarted(true); startTimeRef.current = Date.now(); }
    setRunning((r) => !r);
  };

  const toggleSound = () => { const n = !soundEnabled; setSoundEnabledState(n); setSoundEnabled(n); };

  const progressPct = mode === "freeflow"
    ? Math.min((elapsed / 3600) * 100, 100)
    : totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-forge-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] pb-nav">
      {toast && <XPToast xp={toast.xp} habitName={toast.name} onDone={() => setToast(null)} />}

      <div className="px-4 pt-14 pb-4">
        <h1 className="text-2xl font-display font-bold mb-1">Focus Timer</h1>
        <p className="text-muted-foreground text-sm">Earn XP for every minute of deep work</p>
      </div>

      {/* Preset Toggle */}
      <div className="px-4 mb-5">
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(PRESET_CONFIG) as [Preset, typeof presetCfg][]).map(([key, pc]) => {
            const isActive = preset === key;
            return (
              <button key={key} onClick={() => { if (!running) { setPreset(key); setMode("pomodoro"); } }} disabled={running}
                className="relative rounded-2xl p-4 text-left transition-all duration-300 overflow-hidden disabled:opacity-60"
                style={{ background: isActive ? `linear-gradient(135deg, ${pc.color}22, ${pc.color}0d)` : "rgba(255,255,255,0.03)", border: isActive ? `1.5px solid ${pc.color}60` : "1px solid rgba(255,255,255,0.08)", boxShadow: isActive ? `0 0 20px ${pc.color}25` : undefined }}>
                {isActive && <div className="absolute top-3 right-3 w-2 h-2 rounded-full" style={{ background: pc.color, boxShadow: `0 0 6px ${pc.color}` }} />}
                <div className="text-2xl mb-2">{pc.icon}</div>
                <p className="text-sm font-display font-bold mb-0.5" style={{ color: isActive ? pc.color : "rgba(255,255,255,0.8)" }}>{pc.label}</p>
                <p className="text-[10px] font-bold text-muted-foreground mb-1">{pc.sublabel}</p>
                <p className="text-[9px] text-muted-foreground leading-relaxed">{pc.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Phase Selector */}
      <div className="px-4 mb-6">
        <div className="glass rounded-2xl p-1.5 flex gap-1">
          {([{ key: "pomodoro" as TimerMode, label: "Focus" }, { key: "shortBreak" as TimerMode, label: `${presetCfg.breakMinutes}m Break` }, { key: "freeflow" as TimerMode, label: "Free Flow" }]).map(({ key, label }) => {
            const mc = MODE_CONFIG[key]; const isActive = mode === key;
            return (
              <button key={key} onClick={() => { if (!running) { if (key === "shortBreak" || key === "longBreak") playBreakBell(); setMode(key); } }} disabled={running}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-50"
                style={{ background: isActive ? mc.color + "30" : undefined, boxShadow: isActive ? `0 0 10px ${mc.color}35` : undefined, border: isActive ? `1px solid ${mc.color}55` : "1px solid transparent", color: isActive ? mc.color : "rgba(255,255,255,0.4)" }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timer Display */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <CircularProgress percentage={progressPct} size={240} strokeWidth={10} color={cfg.color}>
            <div className="text-center">
              <p className="font-display font-black text-5xl" style={{ textShadow: `0 0 30px ${cfg.color}60` }}>
                {formatTime(mode === "freeflow" ? elapsed : secondsLeft)}
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{cfg.label}</p>
              {mode === "pomodoro" && <p className="text-[10px] mt-1" style={{ color: cfg.color }}>{presetCfg.icon} #{pomodorosCompleted + 1}</p>}
            </div>
          </CircularProgress>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={() => resetTimer()} className="w-12 h-12 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:scale-105">
          <RotateCcw className="w-5 h-5" />
        </button>
        <button onClick={handlePlayPause} className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`, boxShadow: `0 0 30px ${cfg.color}60, 0 4px 20px rgba(0,0,0,0.4)` }}>
          {running ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
        </button>
        <button onClick={handleComplete} className="w-12 h-12 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:scale-105">
          <SkipForward className="w-5 h-5" />
        </button>
        <button onClick={toggleSound} className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{ background: soundEnabled ? "rgba(147,51,234,0.18)" : "rgba(255,255,255,0.05)", border: soundEnabled ? "1.5px solid rgba(147,51,234,0.55)" : "1.5px solid rgba(255,255,255,0.12)" }}>
          {soundEnabled ? <Volume2 className="w-4 h-4" style={{ color: "#a78bfa" }} /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>

      {/* Habit Link */}
      <div className="px-4 mb-4">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Link to Habit (optional)</p>
          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
            {habits.map((h) => (
              <button key={h.id} onClick={() => setSelectedHabit(selectedHabit?.id === h.id ? null : h)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${selectedHabit?.id === h.id ? "border" : "glass hover:bg-white/5"}`}
                style={{ borderColor: selectedHabit?.id === h.id ? h.color : undefined, background: selectedHabit?.id === h.id ? `${h.color}20` : undefined }}>
                <span>{h.icon}</span>
                <span className="truncate">{h.name}</span>
              </button>
            ))}
            {habits.length === 0 && <p className="text-xs text-muted-foreground col-span-2 text-center py-2">Add habits first</p>}
          </div>
        </div>
      </div>

      <div className="px-4 mb-4"><DailySummary sessions={sessions} /></div>
      <div className="px-4 mb-4"><SessionHistory sessions={sessions} /></div>
    </div>
  );
}
