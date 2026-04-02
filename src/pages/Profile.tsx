import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Flame,
  Zap,
  Clock,
  Trophy,
  Star,
  Share2,
  Copy,
  Check,
  Timer,
  Target,
  TrendingUp,
  Crown,
  ChevronRight,
  Swords,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { getUser, getHabits, getTimerSessions } from "@/lib/storage";
import { mockDailyStats } from "@/lib/mockData";
import { getLevelTitle, RARITY_COLORS } from "@/constants";
import type { Badge } from "@/types";
import XPBar from "@/components/features/XPBar";
import CircularProgress from "@/components/features/CircularProgress";

const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 };

const RARITY_LABELS: Record<Badge["rarity"], string> = {
  legendary: "Legendary",
  epic: "Epic",
  rare: "Rare",
  common: "Common",
};

const RARITY_BG: Record<Badge["rarity"], string> = {
  legendary: "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.08))",
  epic: "linear-gradient(135deg, rgba(167,139,250,0.25), rgba(167,139,250,0.08))",
  rare: "linear-gradient(135deg, rgba(34,211,238,0.25), rgba(34,211,238,0.08))",
  common: "linear-gradient(135deg, rgba(148,163,184,0.15), rgba(148,163,184,0.05))",
};

const RARITY_BORDER: Record<Badge["rarity"], string> = {
  legendary: "rgba(245,158,11,0.55)",
  epic: "rgba(167,139,250,0.55)",
  rare: "rgba(34,211,238,0.55)",
  common: "rgba(148,163,184,0.25)",
};

// ─── Heatmap helpers ──────────────────────────────────────────────────────────

const HEATMAP_DAYS = 91;

function buildHeatmapData() {
  const today = new Date();
  const cells: { date: string; ratio: number; completed: number; total: number; xp: number }[] = [];

  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const stat = mockDailyStats.find((s) => s.date === dateStr);
    cells.push({
      date: dateStr,
      ratio: stat ? stat.habitsCompleted / Math.max(stat.totalHabits, 1) : 0,
      completed: stat?.habitsCompleted ?? 0,
      total: stat?.totalHabits ?? 0,
      xp: stat?.xpEarned ?? 0,
    });
  }
  return cells;
}

function buildWeeklyXP(cells: ReturnType<typeof buildHeatmapData>) {
  const weeks: { weekXP: number; weekLabel: string }[] = [];
  for (let w = 0; w < 13; w++) {
    const slice = cells.slice(w * 7, w * 7 + 7);
    const weekXP = slice.reduce((s, c) => s + c.xp, 0);
    const firstDate = slice[0]?.date ?? "";
    const d = new Date(firstDate);
    const label = d.toLocaleDateString("en", { month: "short", day: "numeric" });
    weeks.push({ weekXP, weekLabel: label });
  }
  return weeks;
}

function buildMonthlyStats(cells: ReturnType<typeof buildHeatmapData>) {
  const months: Record<string, { xp: number; done: number; active: number; label: string }> = {};
  cells.forEach((c) => {
    const d = new Date(c.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!months[key]) {
      months[key] = {
        xp: 0,
        done: 0,
        active: 0,
        label: d.toLocaleDateString("en", { month: "long", year: "numeric" }),
      };
    }
    months[key].xp += c.xp;
    months[key].done += c.completed;
    if (c.completed > 0) months[key].active += 1;
  });
  return Object.values(months);
}

function heatColor(ratio: number): string {
  if (ratio <= 0) return "rgba(255,255,255,0.055)";
  if (ratio < 0.25) return "rgba(147,51,234,0.20)";
  if (ratio < 0.5) return "rgba(147,51,234,0.42)";
  if (ratio < 0.75) return "rgba(147,51,234,0.65)";
  return "#9333ea";
}

function heatGlow(ratio: number): string | undefined {
  if (ratio >= 1) return "0 0 6px rgba(147,51,234,0.8)";
  if (ratio >= 0.75) return "0 0 4px rgba(147,51,234,0.4)";
  return undefined;
}

const DOW_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

// ─── Heatmap Component ────────────────────────────────────────────────────────
function HabitHeatmap() {
  const [tooltip, setTooltip] = useState<{
    date: string;
    completed: number;
    total: number;
    xp: number;
    x: number;
    y: number;
  } | null>(null);

  const cells = buildHeatmapData();
  const weeks = buildWeeklyXP(cells);
  const monthlyStats = buildMonthlyStats(cells);

  const maxWeekXP = Math.max(...weeks.map((w) => w.weekXP), 1);

  const firstDate = new Date(cells[0].date);
  const startDow = firstDate.getDay();

  const padded: (typeof cells[0] | null)[] = [
    ...Array(startDow).fill(null),
    ...cells,
  ];
  while (padded.length < 13 * 7) padded.push(null);

  const monthLabels: { col: number; label: string }[] = [];
  for (let col = 0; col < 13; col++) {
    const cell = padded[col * 7];
    if (!cell) continue;
    const d = new Date(cell.date);
    const prevCell = col > 0 ? padded[(col - 1) * 7] : null;
    if (!prevCell || new Date(prevCell.date).getMonth() !== d.getMonth()) {
      monthLabels.push({
        col,
        label: d.toLocaleDateString("en", { month: "short" }),
      });
    }
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display font-semibold">Habit Heatmap</h3>
          <p className="text-xs text-muted-foreground">Last 3 months</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-muted-foreground">Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-[3px]"
              style={{ background: heatColor(r) }}
            />
          ))}
          <span className="text-[9px] text-muted-foreground">More</span>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {monthlyStats.slice(-3).map((m) => (
          <div
            key={m.label}
            className="flex-1 rounded-xl px-2.5 py-2 text-center"
            style={{ background: "rgba(147,51,234,0.08)", border: "1px solid rgba(147,51,234,0.2)" }}
          >
            <p className="text-[9px] font-bold text-forge-purple-light mb-1 truncate">{m.label}</p>
            <p className="text-sm font-black text-foreground">{m.xp.toLocaleString()}</p>
            <p className="text-[8px] text-muted-foreground">XP</p>
            <div className="flex justify-between mt-1">
              <span className="text-[8px] text-muted-foreground">✅ {m.done}</span>
              <span className="text-[8px] text-muted-foreground">📅 {m.active}d</span>
            </div>
          </div>
        ))}
      </div>

      <div className="relative" style={{ touchAction: "none" }}>
        <div className="flex mb-1" style={{ paddingLeft: 18 }}>
          {Array.from({ length: 13 }, (_, col) => {
            const ml = monthLabels.find((m) => m.col === col);
            return (
              <div key={col} className="flex-1 text-[8px] text-muted-foreground text-center">
                {ml ? ml.label : ""}
              </div>
            );
          })}
        </div>

        <div className="flex gap-0">
          <div className="flex flex-col justify-between" style={{ width: 18, paddingTop: 1, paddingBottom: 1 }}>
            {DOW_LABELS.map((d, i) => (
              <div key={i} className="flex items-center" style={{ height: "calc(100% / 7)" }}>
                <span className="text-[8px] text-muted-foreground">{i % 2 === 1 ? d : ""}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-1 gap-[3px]">
            {Array.from({ length: 13 }, (_, col) => (
              <div key={col} className="flex flex-col flex-1 gap-[3px]">
                {Array.from({ length: 7 }, (_, row) => {
                  const cell = padded[col * 7 + row];
                  return (
                    <div
                      key={row}
                      className="rounded-[3px] cursor-pointer transition-transform duration-100 hover:scale-125"
                      style={{
                        aspectRatio: "1",
                        background: cell ? heatColor(cell.ratio) : "transparent",
                        boxShadow: cell ? heatGlow(cell.ratio) : undefined,
                        opacity: cell ? 1 : 0,
                      }}
                      onMouseEnter={(e) => {
                        if (!cell) return;
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        const parentRect = (e.target as HTMLElement).closest(".glass")!.getBoundingClientRect();
                        setTooltip({
                          date: cell.date,
                          completed: cell.completed,
                          total: cell.total,
                          xp: cell.xp,
                          x: rect.left - parentRect.left + rect.width / 2,
                          y: rect.top - parentRect.top,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {tooltip && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{ left: tooltip.x, top: tooltip.y - 64, transform: "translateX(-50%)" }}
          >
            <div
              className="rounded-xl px-3 py-2 text-xs whitespace-nowrap"
              style={{
                background: "rgba(15,10,30,0.95)",
                border: "1px solid rgba(147,51,234,0.4)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}
            >
              <p className="text-muted-foreground font-medium">
                {new Date(tooltip.date).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
              </p>
              <p className="text-forge-purple-light font-bold">
                {tooltip.completed}/{tooltip.total} habits · +{tooltip.xp} XP
              </p>
            </div>
            <div
              className="mx-auto mt-0.5"
              style={{
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "5px solid rgba(147,51,234,0.4)",
              }}
            />
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-[10px] text-muted-foreground mb-2">Weekly XP</p>
        <div className="flex items-end gap-[3px]" style={{ height: 40 }}>
          {weeks.map((w, i) => {
            const pct = w.weekXP / maxWeekXP;
            const isMax = w.weekXP === maxWeekXP;
            return (
              <div
                key={i}
                className="flex-1 rounded-t-[3px] transition-all duration-700"
                style={{
                  height: `${Math.max(pct * 100, 6)}%`,
                  transitionDelay: `${i * 40}ms`,
                  background: isMax
                    ? "linear-gradient(180deg, #a78bfa, #9333ea)"
                    : pct > 0.5
                    ? "rgba(147,51,234,0.5)"
                    : pct > 0
                    ? "rgba(147,51,234,0.25)"
                    : "rgba(255,255,255,0.06)",
                  boxShadow: isMax ? "0 0 8px rgba(147,51,234,0.6)" : undefined,
                }}
                title={`${w.weekLabel}: ${w.weekXP} XP`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function buildXPHistory() {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - 29 + i);
    const dateStr = d.toISOString().split("T")[0];
    const stat = mockDailyStats.find((s) => s.date === dateStr);
    const label = d.toLocaleDateString("en", { month: "short", day: "numeric" });
    return {
      date: label,
      xp: stat?.xpEarned ?? 0,
      full: dateStr,
    };
  });
}

function CustomTooltip({ active, payload, label }: any) {
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
  const user = getUser();
  const habits = getHabits();
  const sessions = getTimerSessions();

  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [copied, setCopied] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const xpHistory = buildXPHistory();
  const totalXPLast30 = xpHistory.reduce((s, d) => s + d.xp, 0);
  const bestDayXP = Math.max(...xpHistory.map((d) => d.xp));
  const activeDays = xpHistory.filter((d) => d.xp > 0).length;

  const totalSessions = sessions.length + 67;
  const focusMinutes =
    sessions.reduce((s, sess) => s + Math.floor(sess.actualSeconds / 60), 0) + 1840;
  const focusHours = Math.floor(focusMinutes / 60);
  const totalCompletions = habits.reduce((s, h) => s + h.totalCompletions, 0);
  const bestStreak = user.longestStreak;
  const avgDailyXP = Math.round(totalXPLast30 / 30);

  const sortedBadges = [...user.badges].sort(
    (a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]
  );

  const levelPct = Math.round((user.xp / user.xpToNextLevel) * 100);

  const handleCopyShare = () => {
    const text = `🔥 StreakForge Stats — ${user.name}
━━━━━━━━━━━━━━━━
⚡ Level ${user.level} ${getLevelTitle(user.level)}
🏆 Rank #${user.rank} · ${user.totalXp.toLocaleString()} Total XP
🔥 Best Streak: ${bestStreak} days
⏱️ Focus Hours: ${focusHours}h
✅ Habits Done: ${totalCompletions}
━━━━━━━━━━━━━━━━
Build habits. Level up. Dominate. StreakForge 🚀`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] pb-nav">
      {/* Header */}
      <div className="px-4 pt-12 pb-2 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-display font-bold">Profile</h1>
      </div>

      {/* Hero card */}
      <div className="px-4 mt-3 mb-4">
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(147,51,234,0.18), rgba(34,211,238,0.10))",
            border: "1px solid rgba(147,51,234,0.35)",
            boxShadow: "0 0 40px rgba(147,51,234,0.15), 0 0 80px rgba(34,211,238,0.06)",
          }}
        >
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(circle, #9333ea, transparent)" }}
          />
          <div
            className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-15 pointer-events-none"
            style={{ background: "radial-gradient(circle, #22d3ee, transparent)" }}
          />

          <div className="relative flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <CircularProgress
                percentage={levelPct}
                size={86}
                strokeWidth={5}
                color="#9333ea"
                bgColor="rgba(147,51,234,0.15)"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-full"
                  style={{ boxShadow: "0 0 16px rgba(147,51,234,0.5)" }}
                />
              </CircularProgress>
              <div
                className="absolute -bottom-1 -right-1 min-w-[28px] h-7 rounded-full flex items-center justify-center text-xs font-black text-black px-1.5"
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #f97316)",
                  boxShadow: "0 0 10px rgba(245,158,11,0.6)",
                }}
              >
                {user.level}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-lg font-display font-bold text-foreground truncate">
                  {user.name}
                </h2>
                <Crown
                  className="w-4 h-4 text-forge-gold flex-shrink-0"
                  style={{ filter: "drop-shadow(0 0 4px rgba(245,158,11,0.8))" }}
                />
              </div>
              <p className="text-sm text-forge-purple-light font-semibold mb-2">
                {getLevelTitle(user.level)} · Level {user.level}
              </p>
              <XPBar user={user} compact />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { icon: <Flame className="w-3.5 h-3.5 text-forge-flame" />, value: `${user.streak}d`, label: "Streak" },
              { icon: <Trophy className="w-3.5 h-3.5 text-forge-cyan" />, value: `#${user.rank}`, label: "Rank" },
              { icon: <Zap className="w-3.5 h-3.5 text-forge-gold" />, value: user.totalXp.toLocaleString(), label: "Total XP" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl px-2 py-2.5 flex flex-col items-center gap-1">
                {s.icon}
                <p className="text-sm font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="px-4 mb-4">
        <HabitHeatmap />
      </div>

      {/* XP History Chart */}
      <div className="px-4 mb-4">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-display font-semibold">XP History</h3>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-forge-gold-light">
                {totalXPLast30.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">total XP earned</p>
            </div>
          </div>

          <div className="flex gap-4 mb-4 mt-3">
            {[
              { label: "Avg/day", value: `${avgDailyXP} XP`, color: "#a78bfa" },
              { label: "Best day", value: `${bestDayXP} XP`, color: "#f59e0b" },
              { label: "Active days", value: `${activeDays}/30`, color: "#22d3ee" },
            ].map((m) => (
              <div key={m.label} className="flex-1 text-center">
                <p className="text-sm font-bold" style={{ color: m.color }}>
                  {m.value}
                </p>
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
                <XAxis
                  dataKey="date"
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }}
                  interval={6}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(147,51,234,0.3)", strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="xp"
                  stroke="#9333ea"
                  strokeWidth={2}
                  fill="url(#xpGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#a78bfa", stroke: "#9333ea", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Skill Tree shortcut */}
      <div className="px-4 mb-4">
        <Link
          to="/skills"
          className="flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, rgba(147,51,234,0.18), rgba(34,211,238,0.10))",
            border: "1px solid rgba(147,51,234,0.35)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(147,51,234,0.2)",
              border: "1px solid rgba(147,51,234,0.4)",
              boxShadow: "0 0 12px rgba(147,51,234,0.3)",
            }}
          >
            <Swords className="w-5 h-5 text-forge-purple-light" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-foreground">Skill Tree</p>
            <p className="text-xs text-muted-foreground">View attribute upgrades & milestones</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Total Stats */}
      <div className="px-4 mb-4">
        <h3 className="font-display font-semibold mb-3">All-Time Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: <Timer className="w-5 h-5 text-forge-purple-light" />,
              label: "Focus Hours",
              value: `${focusHours}h`,
              sub: `${focusMinutes.toLocaleString()} minutes total`,
              color: "#9333ea",
            },
            {
              icon: <Target className="w-5 h-5 text-forge-cyan" />,
              label: "Habits Done",
              value: totalCompletions.toString(),
              sub: `${habits.length} active habits`,
              color: "#22d3ee",
            },
            {
              icon: <Flame className="w-5 h-5 text-forge-flame" />,
              label: "Best Streak",
              value: `${bestStreak}d`,
              sub: `Current: ${user.streak} days`,
              color: "#f97316",
            },
            {
              icon: <TrendingUp className="w-5 h-5 text-forge-green" />,
              label: "Sessions",
              value: totalSessions.toString(),
              sub: "Pomodoro + Free Flow",
              color: "#22c55e",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-2xl p-4"
              style={{ boxShadow: `0 0 20px ${stat.color}10` }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${stat.color}20`, border: `1px solid ${stat.color}30` }}
              >
                {stat.icon}
              </div>
              <p className="text-xl font-display font-black text-foreground mb-0.5">
                {stat.value}
              </p>
              <p className="text-xs font-semibold text-foreground mb-0.5">{stat.label}</p>
              <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display font-semibold">Badges</h3>
            <p className="text-xs text-muted-foreground">{user.badges.length} earned</p>
          </div>
          <Star className="w-4 h-4 text-forge-gold" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {sortedBadges.map((badge) => (
            <button
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className="glass rounded-2xl p-4 flex items-center gap-3 text-left transition-all duration-200 hover:scale-[1.02] group"
              style={{
                border: `1px solid ${RARITY_BORDER[badge.rarity]}`,
                background: RARITY_BG[badge.rarity],
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{
                  background: `${RARITY_COLORS[badge.rarity]}15`,
                  border: `1px solid ${RARITY_COLORS[badge.rarity]}40`,
                  boxShadow: `0 0 12px ${RARITY_COLORS[badge.rarity]}30`,
                }}
              >
                {badge.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{badge.name}</p>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    color: RARITY_COLORS[badge.rarity],
                    background: `${RARITY_COLORS[badge.rarity]}20`,
                  }}
                >
                  {RARITY_LABELS[badge.rarity]}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Shareable Stats Card */}
      <div className="px-4 mb-4">
        <h3 className="font-display font-semibold mb-3">Share Your Stats</h3>
        <div
          ref={shareCardRef}
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0f0f18 0%, #13131f 50%, #0d0d1a 100%)",
            border: "1px solid rgba(147,51,234,0.4)",
            boxShadow: "0 0 30px rgba(147,51,234,0.15)",
          }}
        >
          <div
            className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle, #9333ea, transparent)", transform: "translate(30%,-30%)" }}
          />
          <div
            className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle, #22d3ee, transparent)", transform: "translate(-30%,30%)" }}
          />

          <div className="neon-line mb-4" />

          <div className="flex items-center gap-3 mb-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-full border-2 border-forge-purple/60"
              style={{ boxShadow: "0 0 12px rgba(147,51,234,0.5)" }}
            />
            <div>
              <p className="font-display font-bold text-foreground">{user.name}</p>
              <p className="text-xs text-forge-purple-light">
                Level {user.level} {getLevelTitle(user.level)}
              </p>
            </div>
            <div className="ml-auto">
              <p
                className="text-2xl font-display font-black shimmer-text"
                style={{ letterSpacing: "-0.02em" }}
              >
                StreakForge
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { emoji: "🔥", label: "Best Streak", value: `${bestStreak} days` },
              { emoji: "⚡", label: "Total XP", value: user.totalXp.toLocaleString() },
              { emoji: "⏱️", label: "Focus Hours", value: `${focusHours}h` },
              { emoji: "✅", label: "Habits Done", value: totalCompletions.toString() },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl px-3 py-2.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <p className="text-xs text-muted-foreground mb-0.5">
                  {s.emoji} {s.label}
                </p>
                <p className="text-base font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <p className="text-xs text-muted-foreground flex-shrink-0">Badges earned:</p>
            <div className="flex gap-1.5 flex-wrap">
              {sortedBadges.map((b) => (
                <span
                  key={b.id}
                  className="text-base"
                  title={b.name}
                  style={{ filter: `drop-shadow(0 0 4px ${RARITY_COLORS[b.rarity]}80)` }}
                >
                  {b.icon}
                </span>
              ))}
            </div>
          </div>

          <div className="neon-line mb-3" />
          <p className="text-[10px] text-muted-foreground text-center">
            Build habits. Level up. Dominate. · streakforge.onspace.app
          </p>
        </div>

        <div className="flex gap-3 mt-3">
          <button
            onClick={handleCopyShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl glass border border-white/10 text-sm font-semibold text-foreground hover:border-forge-purple/40 hover:bg-forge-purple/10 transition-all duration-200"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-forge-green" />
                <span className="text-forge-green">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Stats
              </>
            )}
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: "StreakForge Stats",
                  text: `Check out my StreakForge stats! Level ${user.level}, ${bestStreak}-day best streak, ${user.totalXp.toLocaleString()} XP 🔥`,
                  url: window.location.origin,
                });
              } else {
                handleCopyShare();
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-white text-sm transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #9333ea, #22d3ee)",
              boxShadow: "0 0 20px rgba(147,51,234,0.4)",
            }}
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="rounded-3xl p-6 w-full max-w-xs text-center relative overflow-hidden"
            style={{
              background: RARITY_BG[selectedBadge.rarity],
              border: `1.5px solid ${RARITY_BORDER[selectedBadge.rarity]}`,
              boxShadow: `0 0 40px ${RARITY_COLORS[selectedBadge.rarity]}30`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="absolute inset-0 pointer-events-none rounded-3xl"
              style={{
                background: `radial-gradient(circle at 50% 30%, ${RARITY_COLORS[selectedBadge.rarity]}15, transparent 70%)`,
              }}
            />

            <div className="relative">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-4 transition-transform"
                style={{
                  background: `${RARITY_COLORS[selectedBadge.rarity]}15`,
                  border: `2px solid ${RARITY_COLORS[selectedBadge.rarity]}50`,
                  boxShadow: `0 0 30px ${RARITY_COLORS[selectedBadge.rarity]}40`,
                  animation: "float 3s ease-in-out infinite",
                }}
              >
                {selectedBadge.icon}
              </div>

              <span
                className="inline-block text-xs font-black px-3 py-1 rounded-full mb-3"
                style={{
                  color: RARITY_COLORS[selectedBadge.rarity],
                  background: `${RARITY_COLORS[selectedBadge.rarity]}20`,
                  border: `1px solid ${RARITY_COLORS[selectedBadge.rarity]}40`,
                }}
              >
                ✦ {RARITY_LABELS[selectedBadge.rarity].toUpperCase()}
              </span>

              <h3 className="text-xl font-display font-bold text-foreground mb-2">
                {selectedBadge.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{selectedBadge.description}</p>

              {selectedBadge.unlockedAt && (
                <p className="text-xs text-muted-foreground mb-5">
                  Unlocked{" "}
                  {new Date(selectedBadge.unlockedAt).toLocaleDateString("en", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}

              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full py-3 rounded-2xl font-semibold text-white text-sm transition-all hover:opacity-90"
                style={{
                  background: `linear-gradient(135deg, ${RARITY_COLORS[selectedBadge.rarity]}, ${RARITY_COLORS[selectedBadge.rarity]}99)`,
                  boxShadow: `0 0 16px ${RARITY_COLORS[selectedBadge.rarity]}40`,
                }}
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
