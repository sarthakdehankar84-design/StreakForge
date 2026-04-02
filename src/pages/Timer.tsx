import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, SkipForward, Zap, Coffee, Layers, Clock, TrendingUp, History, Volume2, VolumeX } from "lucide-react";
import { getHabits, saveTimerSession, getTimerSessions, getUser, saveUser } from "@/lib/storage";
import type { Habit, TimerSession } from "@/types";
import { POMODORO_WORK, POMODORO_SHORT_BREAK, POMODORO_LONG_BREAK, XP_PER_POMODORO, XP_PER_FREE_MINUTE } from "@/constants";
import CircularProgress from "@/components/features/CircularProgress";
import XPToast from "@/components/features/XPToast";
import { getSoundEnabled, setSoundEnabled, playTick, playCompletionChime, playBreakBell } from "@/lib/audio";

type TimerMode = "pomodoro" | "shortBreak" | "longBreak" | "freeflow";
type Preset = "pomodoro" | "deepwork";

const PRESET_CONFIG: Record<Preset, {
  label: string;
  sublabel: string;
  workMinutes: number;
  breakMinutes: number;
  color: string;
  glowColor: string;
  icon: string;
  description: string;
}> = {
  pomodoro: {
    label: "Pomodoro",
    sublabel: "25 / 5 min",
    workMinutes: 25,
    breakMinutes: 5,
    color: "#9333ea",
    glowColor: "rgba(147,51,234,0.4)",
    icon: "🍅",
    description: "Classic focus sprints with short recovery breaks",
  },
  deepwork: {
    label: "Deep Work",
    sublabel: "90 / 15 min",
    workMinutes: 90,
    breakMinutes: 15,
    color: "#22d3ee",
    glowColor: "rgba(34,211,238,0.4)",
    icon: "🧠",
    description: "Extended concentration for complex tasks",
  },
};

const MODE_CONFIG: Record<TimerMode, { label: string; color: string; icon: React.ReactNode }> = {
  pomodoro: { label: "Focus", color: "#9333ea", icon: <Layers className="w-4 h-4" /> },
  shortBreak: { label: "Break", color: "#22d3ee", icon: <Coffee className="w-4 h-4" /> },
  longBreak: { label: "Long Break", color: "#22c55e", icon: <Coffee className="w-4 h-4" /> },
  freeflow: { label: "Free Flow", color: "#f59e0b", icon: <Zap className="w-4 h-4" /> },
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

function formatTime(secs: number): string {
  const m = Math.floor(Math.abs(secs) / 60).toString().padStart(2, "0");
  const s = (Math.abs(secs) % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Daily Summary ────────────────────────────────────────────────────────────
function DailySummary({ sessions }: { sessions: TimerSession[] }) {
  const todayStr = new Date().toISOString().split("T")[0];
  const todaySessions = sessions.filter((s) => s.completedAt?.startsWith(todayStr));
  const totalSeconds = todaySessions.reduce((acc, s) => acc + s.actualSeconds, 0);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalXP = todaySessions.reduce((acc, s) => acc + s.xpEarned, 0);
  const sessionCount = todaySessions.length;

  const maxMinutes = 120;
  const pct = Math.min((totalMinutes / maxMinutes) * 100, 100);

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "linear-gradient(135deg, rgba(147,51,234,0.10), rgba(34,211,238,0.06))",
        border: "1px solid rgba(147,51,234,0.25)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-forge-purple-light" />
          <span className="text-sm font-display font-semibold">Today's Focus</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{sessionCount} session{sessionCount !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex items-end gap-6 mb-3">
        <div>
          <p className="text-2xl font-display font-black text-foreground">{totalMinutes}<span className="text-sm font-normal text-muted-foreground ml-1">min</span></p>
          <p className="text-[10px] text-muted-foreground">Focus time</p>
        </div>
        <div>
          <p className="text-xl font-display font-bold text-forge-gold-light">+{totalXP}<span className="text-sm font-normal text-muted-foreground ml-1">XP</span></p>
          <p className="text-[10px] text-muted-foreground">Earned today</p>
        </div>
        {sessionCount > 0 && (
          <div className="ml-auto text-right">
            <p className="text-sm font-bold text-forge-cyan">{Math.floor(totalSeconds / sessionCount / 60)}m</p>
            <p className="text-[10px] text-muted-foreground">Avg/session</p>
          </div>
        )}
      </div>

      {/* Progress bar toward 120 min goal */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] text-muted-foreground">Daily goal: 2h focus</span>
          <span className="text-[9px] font-bold" style={{ color: pct >= 100 ? "#22c55e" : "#a78bfa" }}>
            {pct >= 100 ? "✓ Goal reached!" : `${Math.round(pct)}%`}
          </span>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: pct >= 100
                ? "linear-gradient(90deg, #22c55e, #4ade80)"
                : "linear-gradient(90deg, #9333ea, #22d3ee)",
              boxShadow: pct >= 100 ? "0 0 8px rgba(34,197,94,0.5)" : "0 0 6px rgba(147,51,234,0.4)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Session History ──────────────────────────────────────────────────────────
function SessionHistory({ sessions }: { sessions: TimerSession[] }) {
  if (sessions.length === 0) return null;

  const recent = [...sessions].reverse().slice(0, 5);

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
          const durationMins = Math.floor(session.actualSeconds / 60);
          const durationSecs = session.actualSeconds % 60;
          const timeStr = durationMins > 0
            ? `${durationMins}m${durationSecs > 0 ? ` ${durationSecs}s` : ""}`
            : `${session.actualSeconds}s`;

          const completedDate = session.completedAt ? new Date(session.completedAt) : null;
          const timeAgoStr = completedDate
            ? completedDate.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })
            : "";

          // Detect if deep work (>= 80 min)
          const isDeepWork = session.actualSeconds >= 80 * 60;

          return (
            <div
              key={session.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200"
              style={{
                background: idx === 0
                  ? "rgba(147,51,234,0.08)"
                  : "rgba(255,255,255,0.03)",
                border: idx === 0
                  ? "1px solid rgba(147,51,234,0.2)"
                  : "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {/* Habit icon or generic */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{
                  background: `${modeColor}15`,
                  border: `1px solid ${modeColor}30`,
                }}
              >
                {session.habitName ? (
                  <span className="text-base">
                    {session.mode === "pomodoro" ? "🍅" : session.mode === "freeflow" ? "⚡" : "☕"}
                  </span>
                ) : (
                  <Clock className="w-4 h-4" style={{ color: modeColor }} />
                )}
              </div>

              {/* Name + mode tag */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {session.habitName || "Focus Session"}
                  </p>
                  {isDeepWork && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: "rgba(34,211,238,0.15)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.3)" }}>
                      🧠 DEEP
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${modeColor}20`, color: modeColor }}
                  >
                    {modeLabel}
                  </span>
                  {timeAgoStr && (
                    <span className="text-[9px] text-muted-foreground">{timeAgoStr}</span>
                  )}
                </div>
              </div>

              {/* Duration + XP */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-foreground">{timeStr}</p>
                <p className="text-[10px] font-semibold text-forge-gold">+{session.xpEarned} XP</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Timer Page ──────────────────────────────────────────────────────────
export default function Timer() {
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
  const [sessions, setSessions] = useState<TimerSession[]>(() => getTimerSessions());
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => getSoundEnabled());

  const habits = getHabits();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastTickSecRef = useRef<number>(-1);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setSoundEnabled(next);
  };

  const cfg = MODE_CONFIG[mode];
  const presetCfg = PRESET_CONFIG[preset];

  const resetTimer = useCallback((m: TimerMode = mode, p: Preset = preset) => {
    const pc = PRESET_CONFIG[p];
    const secs = m === "pomodoro" ? pc.workMinutes * 60
      : m === "shortBreak" ? pc.breakMinutes * 60
      : m === "longBreak" ? pc.breakMinutes * 2 * 60
      : 60 * 60;
    setSecondsLeft(secs);
    setTotalSeconds(secs);
    setRunning(false);
    setSessionStarted(false);
    setElapsed(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [mode, preset]);

  useEffect(() => {
    resetTimer(mode, preset);
  }, [mode, preset]);

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
          if (remaining <= 0) {
            handleComplete();
            return;
          }
          setSecondsLeft(remaining);
          // Tick for last 5 seconds of a focus mode
          if (mode === "pomodoro" && remaining <= 5 && remaining > 0) {
            const intRemaining = Math.ceil(remaining);
            if (intRemaining !== lastTickSecRef.current) {
              lastTickSecRef.current = intRemaining;
              playTick();
            }
          } else {
            lastTickSecRef.current = -1;
          }
        }
      }, 250);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleComplete = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    let xpEarned = 0;
    if (mode === "pomodoro") {
      xpEarned = XP_PER_POMODORO;
      setPomodorosCompleted((p) => p + 1);
    } else if (mode === "freeflow") {
      xpEarned = Math.floor((elapsed / 60) * XP_PER_FREE_MINUTE);
    }

    if (xpEarned > 0) {
      playCompletionChime();
      const user = getUser();
      user.xp += xpEarned;
      user.totalXp += xpEarned;
      if (user.xp >= user.xpToNextLevel) {
        user.xp -= user.xpToNextLevel;
        user.level += 1;
      }
      saveUser(user);

      const session: TimerSession = {
        id: `s_${Date.now()}`,
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
      saveTimerSession(session);
      setSessions(getTimerSessions());
      setToast({ xp: xpEarned, name: mode === "pomodoro" ? "Pomodoro Complete! 🍅" : "Focus Session! ⚡" });
    }
    resetTimer();
  };

  const handlePlayPause = () => {
    if (!running && !sessionStarted) {
      setSessionStarted(true);
      startTimeRef.current = Date.now();
    }
    setRunning((r) => !r);
  };

  const switchPreset = (p: Preset) => {
    if (running) return;
    setPreset(p);
    setMode("pomodoro");
  };

  const handleModeSwitch = (m: TimerMode) => {
    if (running) return;
    if (m === "shortBreak" || m === "longBreak") {
      playBreakBell();
    }
    setMode(m);
  };

  const progressPct = mode === "freeflow"
    ? Math.min((elapsed / (60 * 60)) * 100, 100)
    : totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] pb-nav">
      {toast && <XPToast xp={toast.xp} habitName={toast.name} onDone={() => setToast(null)} />}

      <div className="px-4 pt-14 pb-4">
        <h1 className="text-2xl font-display font-bold mb-1">Focus Timer</h1>
        <p className="text-muted-foreground text-sm">Earn XP for every minute of deep work</p>
      </div>

      {/* ── Preset Toggle ─────────────────────────────── */}
      <div className="px-4 mb-5">
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(PRESET_CONFIG) as [Preset, typeof presetCfg][]).map(([key, pc]) => {
            const isActive = preset === key;
            return (
              <button
                key={key}
                onClick={() => switchPreset(key)}
                disabled={running}
                className="relative rounded-2xl p-4 text-left transition-all duration-300 overflow-hidden disabled:opacity-60"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${pc.color}22, ${pc.color}0d)`
                    : "rgba(255,255,255,0.03)",
                  border: isActive
                    ? `1.5px solid ${pc.color}60`
                    : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: isActive ? `0 0 20px ${pc.color}25` : undefined,
                }}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <div
                    className="absolute top-3 right-3 w-2 h-2 rounded-full"
                    style={{ background: pc.color, boxShadow: `0 0 6px ${pc.color}` }}
                  />
                )}
                <div className="text-2xl mb-2">{pc.icon}</div>
                <p
                  className="text-sm font-display font-bold mb-0.5"
                  style={{ color: isActive ? pc.color : "rgba(255,255,255,0.8)" }}
                >
                  {pc.label}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground mb-1">{pc.sublabel}</p>
                <p className="text-[9px] text-muted-foreground leading-relaxed">{pc.description}</p>
              </button>
            );
          })}
        </div>

        {/* XP hint for current preset */}
        <div
          className="flex items-center justify-center gap-2 mt-2.5 py-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <Zap className="w-3 h-3 text-forge-gold" />
          <span className="text-[11px] text-muted-foreground">
            {preset === "pomodoro"
              ? `+${XP_PER_POMODORO} XP per Pomodoro · +${Math.round(XP_PER_FREE_MINUTE)}/min Free Flow`
              : `+${Math.round(presetCfg.workMinutes * XP_PER_FREE_MINUTE)} XP per Deep Work session`}
          </span>
        </div>
      </div>

      {/* ── Phase Selector (Focus / Break) ─────────────── */}
      <div className="px-4 mb-6">
        <div className="glass rounded-2xl p-1.5 flex gap-1">
          {([
            { key: "pomodoro" as TimerMode, label: "Focus" },
            { key: "shortBreak" as TimerMode, label: `${presetCfg.breakMinutes}m Break` },
            { key: "freeflow" as TimerMode, label: "Free Flow" },
          ]).map(({ key, label }) => {
            const modeCfg = MODE_CONFIG[key];
            const isActive = mode === key;
            return (
              <button
                key={key}
                onClick={() => handleModeSwitch(key as TimerMode)}
                disabled={running}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-50"
                style={{
                  background: isActive ? modeCfg.color + "30" : undefined,
                  boxShadow: isActive ? `0 0 10px ${modeCfg.color}35` : undefined,
                  border: isActive ? `1px solid ${modeCfg.color}55` : "1px solid transparent",
                  color: isActive ? modeCfg.color : "rgba(255,255,255,0.4)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Timer Display ──────────────────────────────── */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <CircularProgress
            percentage={progressPct}
            size={240}
            strokeWidth={10}
            color={cfg.color}
          >
            <div className="text-center">
              <p
                className="font-display font-black text-5xl text-foreground"
                style={{
                  textShadow: `0 0 30px ${cfg.color}60`,
                  animation: running && secondsLeft < 11 && mode !== "freeflow" ? "countdown-tick 1s ease-in-out infinite" : undefined,
                }}
              >
                {formatTime(mode === "freeflow" ? elapsed : secondsLeft)}
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{cfg.label}</p>
              {mode === "pomodoro" && (
                <p className="text-[10px] mt-1" style={{ color: cfg.color }}>
                  {presetCfg.icon} #{pomodorosCompleted + 1}
                </p>
              )}
            </div>
          </CircularProgress>
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow: running ? `0 0 60px ${cfg.color}25, inset 0 0 60px ${cfg.color}10` : undefined,
              transition: "box-shadow 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* ── Controls ───────────────────────────────────── */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => resetTimer()}
          className="w-12 h-12 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:scale-105"
          title="Reset timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={handlePlayPause}
          className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`,
            boxShadow: `0 0 30px ${cfg.color}60, 0 4px 20px rgba(0,0,0,0.4)`,
          }}
        >
          {running ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
        </button>
        <button
          onClick={handleComplete}
          className="w-12 h-12 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:scale-105"
          title="Skip / complete session"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
          title={soundEnabled ? "Mute sounds" : "Enable sounds"}
          style={{
            background: soundEnabled
              ? "rgba(147,51,234,0.18)"
              : "rgba(255,255,255,0.05)",
            border: soundEnabled
              ? "1.5px solid rgba(147,51,234,0.55)"
              : "1.5px solid rgba(255,255,255,0.12)",
            boxShadow: soundEnabled
              ? "0 0 12px rgba(147,51,234,0.3)"
              : undefined,
          }}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4" style={{ color: "#a78bfa" }} />
          ) : (
            <VolumeX className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* ── Habit Link ─────────────────────────────────── */}
      <div className="px-4 mb-4">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Link to Habit (optional)</p>
          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
            {habits.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelectedHabit(selectedHabit?.id === h.id ? null : h)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  selectedHabit?.id === h.id ? "border" : "glass hover:bg-white/5"
                }`}
                style={{
                  borderColor: selectedHabit?.id === h.id ? h.color : undefined,
                  background: selectedHabit?.id === h.id ? `${h.color}20` : undefined,
                }}
              >
                <span>{h.icon}</span>
                <span className="truncate text-foreground">{h.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Daily Summary ──────────────────────────────── */}
      <div className="px-4 mb-4">
        <DailySummary sessions={sessions} />
      </div>

      {/* ── Session History ────────────────────────────── */}
      <div className="px-4 mb-4">
        <SessionHistory sessions={sessions} />
      </div>
    </div>
  );
}
