import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, CheckCircle2, Zap, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { getHabits, getUser } from "@/lib/storage";
import { mockDailyStats } from "@/lib/mockData";
import type { HabitCategory } from "@/types";

// ─── Skill definitions ────────────────────────────────────────────────────────
interface SkillAttribute {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  glowColor: string;
  bgGradient: string;
  borderColor: string;
  categories: HabitCategory[];
  milestones: Milestone[];
}

interface Milestone {
  level: number;
  label: string;
  description: string;
  icon: string;
  xpRequired: number;
}

const SKILLS: SkillAttribute[] = [
  {
    id: "focus",
    name: "Focus",
    emoji: "🎯",
    description: "The ability to sustain deep attention and resist distraction during high-value work.",
    color: "#9333ea",
    glowColor: "rgba(147,51,234,0.5)",
    bgGradient: "linear-gradient(135deg, rgba(147,51,234,0.2), rgba(147,51,234,0.05))",
    borderColor: "rgba(147,51,234,0.45)",
    categories: ["study", "coding"],
    milestones: [
      { level: 1, label: "Focused Learner", description: "Started focusing on deep work", icon: "🎯", xpRequired: 0 },
      { level: 5, label: "Flow State", description: "Achieved consistent flow sessions", icon: "🌊", xpRequired: 500 },
      { level: 10, label: "Deep Worker", description: "Mastered distraction-free work", icon: "⚡", xpRequired: 1200 },
      { level: 15, label: "Mind Forge", description: "Elite concentration unlocked", icon: "🔮", xpRequired: 2000 },
      { level: 20, label: "Zen Master", description: "Transcendent focus achieved", icon: "🧿", xpRequired: 3000 },
    ],
  },
  {
    id: "knowledge",
    name: "Knowledge",
    emoji: "📚",
    description: "Accumulated learning power from reading, studying, and exploring new ideas daily.",
    color: "#f59e0b",
    glowColor: "rgba(245,158,11,0.5)",
    bgGradient: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))",
    borderColor: "rgba(245,158,11,0.45)",
    categories: ["study", "reading"],
    milestones: [
      { level: 1, label: "Curious Mind", description: "Began the path of learning", icon: "🌱", xpRequired: 0 },
      { level: 5, label: "Bookworm", description: "100+ pages absorbed this month", icon: "📖", xpRequired: 500 },
      { level: 10, label: "Scholar", description: "Deep knowledge in multiple areas", icon: "🎓", xpRequired: 1200 },
      { level: 15, label: "Polymath", description: "Cross-domain expertise forming", icon: "🌐", xpRequired: 2000 },
      { level: 20, label: "Sage", description: "Rare wisdom attained", icon: "🦉", xpRequired: 3000 },
    ],
  },
  {
    id: "discipline",
    name: "Discipline",
    emoji: "⚔️",
    description: "Consistency engine — doing the work even when motivation fades. Built through streaks and daily habits.",
    color: "#22d3ee",
    glowColor: "rgba(34,211,238,0.5)",
    bgGradient: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(34,211,238,0.05))",
    borderColor: "rgba(34,211,238,0.45)",
    categories: ["study", "coding", "reading", "mindfulness", "fitness", "health"],
    milestones: [
      { level: 1, label: "Beginner", description: "First habit streak started", icon: "🔥", xpRequired: 0 },
      { level: 5, label: "Consistent", description: "7-day streaks maintained", icon: "⚔️", xpRequired: 500 },
      { level: 10, label: "Iron Will", description: "30-day streaks conquered", icon: "🛡️", xpRequired: 1200 },
      { level: 15, label: "Forged", description: "Habits become automatic", icon: "⚙️", xpRequired: 2000 },
      { level: 20, label: "Unbreakable", description: "Nothing stops the machine", icon: "💎", xpRequired: 3000 },
    ],
  },
  {
    id: "health",
    name: "Health",
    emoji: "💪",
    description: "Physical and mental vitality. Built through movement, mindfulness, and recovery habits.",
    color: "#22c55e",
    glowColor: "rgba(34,197,94,0.5)",
    bgGradient: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))",
    borderColor: "rgba(34,197,94,0.45)",
    categories: ["fitness", "health", "mindfulness"],
    milestones: [
      { level: 1, label: "Moving", description: "First health habit logged", icon: "🚶", xpRequired: 0 },
      { level: 5, label: "Active", description: "Regular exercise established", icon: "🏃", xpRequired: 500 },
      { level: 10, label: "Athlete", description: "Peak physical habit routine", icon: "🏋️", xpRequired: 1200 },
      { level: 15, label: "Vitality", description: "Mind-body connection mastered", icon: "💪", xpRequired: 2000 },
      { level: 20, label: "Peak Form", description: "Elite health achieved", icon: "🦾", xpRequired: 3000 },
    ],
  },
  {
    id: "creativity",
    name: "Creativity",
    emoji: "✨",
    description: "Divergent thinking capacity. Nurtured through reading, coding experiments, and mindful reflection.",
    color: "#ec4899",
    glowColor: "rgba(236,72,153,0.5)",
    bgGradient: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(236,72,153,0.05))",
    borderColor: "rgba(236,72,153,0.45)",
    categories: ["reading", "coding", "mindfulness"],
    milestones: [
      { level: 1, label: "Spark", description: "Creative curiosity ignited", icon: "✨", xpRequired: 0 },
      { level: 5, label: "Maker", description: "Building new ideas daily", icon: "🎨", xpRequired: 500 },
      { level: 10, label: "Innovator", description: "Original thinking patterns", icon: "💡", xpRequired: 1200 },
      { level: 15, label: "Visionary", description: "Seeing what others miss", icon: "🔭", xpRequired: 2000 },
      { level: 20, label: "Creator", description: "Reality-bending imagination", icon: "🌌", xpRequired: 3000 },
    ],
  },
];

// ─── XP Calculation ───────────────────────────────────────────────────────────
const XP_PER_SKILL_LEVEL = 150;

function calcSkillXP(skillId: string): number {
  const skill = SKILLS.find((s) => s.id === skillId)!;
  const habits = getHabits();
  const relevantHabits = habits.filter((h) => skill.categories.includes(h.category));

  // Base XP from habit completions
  let xp = relevantHabits.reduce((sum, h) => {
    const weight = skillId === "discipline" ? 0.3 : 1.0;
    return sum + h.totalCompletions * 15 * weight;
  }, 0);

  // Discipline also gets bonus from daily stats (streak consistency)
  if (skillId === "discipline") {
    const user = getUser();
    xp += user.longestStreak * 25;
    const activeDays = mockDailyStats.filter(
      (d) => d.habitsCompleted >= Math.ceil(d.totalHabits * 0.5)
    ).length;
    xp += activeDays * 8;
  }

  return Math.round(xp);
}

function getSkillLevel(xp: number): number {
  return Math.floor(xp / XP_PER_SKILL_LEVEL) + 1;
}

function getLevelProgress(xp: number): number {
  const remainder = xp % XP_PER_SKILL_LEVEL;
  return Math.round((remainder / XP_PER_SKILL_LEVEL) * 100);
}

// ─── Animated XP Bar ─────────────────────────────────────────────────────────
function AnimatedBar({
  percentage,
  color,
  glowColor,
  delay = 0,
}: {
  percentage: number;
  color: string;
  glowColor: string;
  delay?: number;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(percentage), 150 + delay);
    return () => clearTimeout(t);
  }, [percentage, delay]);

  return (
    <div className="h-2.5 bg-white/8 rounded-full overflow-hidden relative">
      <div
        className="h-full rounded-full relative overflow-hidden transition-all duration-1000 ease-out"
        style={{
          width: `${width}%`,
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          boxShadow: `0 0 8px ${glowColor}`,
        }}
      >
        {/* Shimmer sweep */}
        <div
          className="absolute inset-0 -translate-x-full"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
            animation: "shimmer-sweep 2s ease-in-out 1.2s 1",
          }}
        />
      </div>
    </div>
  );
}

// ─── Milestone Node ───────────────────────────────────────────────────────────
function MilestoneNode({
  milestone,
  unlocked,
  current,
  color,
  glowColor,
}: {
  milestone: Milestone;
  unlocked: boolean;
  current: boolean;
  color: string;
  glowColor: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      {/* Connector line is rendered by parent */}
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg relative transition-all duration-300"
        style={
          unlocked
            ? {
                background: current
                  ? `linear-gradient(135deg, ${color}40, ${color}20)`
                  : `${color}20`,
                border: `1.5px solid ${current ? color : color + "60"}`,
                boxShadow: current ? `0 0 14px ${glowColor}, 0 0 4px ${glowColor}` : `0 0 6px ${glowColor}50`,
              }
            : {
                background: "rgba(255,255,255,0.04)",
                border: "1.5px solid rgba(255,255,255,0.10)",
              }
        }
      >
        {unlocked ? (
          <span style={current ? { filter: `drop-shadow(0 0 6px ${glowColor})` } : {}}>
            {milestone.icon}
          </span>
        ) : (
          <Lock className="w-4 h-4 text-white/20" />
        )}
        {current && (
          <div
            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
            style={{ background: color, boxShadow: `0 0 6px ${glowColor}` }}
          >
            <Sparkles className="w-2 h-2 text-white" />
          </div>
        )}
      </div>
      <div className="text-center">
        <p
          className="text-[9px] font-bold leading-tight"
          style={{ color: unlocked ? color : "rgba(255,255,255,0.2)" }}
        >
          Lv {milestone.level}
        </p>
        <p
          className="text-[8px] leading-tight max-w-[52px] mx-auto"
          style={{ color: unlocked ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.15)" }}
        >
          {milestone.label}
        </p>
      </div>
    </div>
  );
}

// ─── Radar / Pentagon SVG ─────────────────────────────────────────────────────
function RadarChart({
  values,
  colors,
}: {
  values: number[];  // 0-100
  colors: string[];
}) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 62;
  const levels = 4;
  const axes = values.length;

  const angle = (i: number) => (Math.PI * 2 * i) / axes - Math.PI / 2;

  const pointOnAxis = (i: number, pct: number) => ({
    x: cx + r * pct * Math.cos(angle(i)),
    y: cy + r * pct * Math.sin(angle(i)),
  });

  const gridPolygons = Array.from({ length: levels }, (_, lvl) => {
    const pts = Array.from({ length: axes }, (_, i) => {
      const p = pointOnAxis(i, (lvl + 1) / levels);
      return `${p.x},${p.y}`;
    }).join(" ");
    return pts;
  });

  const dataPoly = values
    .map((v, i) => {
      const p = pointOnAxis(i, Math.max(v / 100, 0.05));
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* Grid polygons */}
      {gridPolygons.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={1}
        />
      ))}
      {/* Axes */}
      {values.map((_, i) => {
        const tip = pointOnAxis(i, 1);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={tip.x}
            y2={tip.y}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={1}
          />
        );
      })}
      {/* Data fill */}
      <polygon
        points={dataPoly}
        fill="rgba(147,51,234,0.15)"
        stroke="rgba(147,51,234,0.6)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 6px rgba(147,51,234,0.4))" }}
      />
      {/* Data dots */}
      {values.map((v, i) => {
        const p = pointOnAxis(i, Math.max(v / 100, 0.05));
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill={colors[i]}
            style={{ filter: `drop-shadow(0 0 4px ${colors[i]})` }}
          />
        );
      })}
      {/* Labels */}
      {SKILLS.map((s, i) => {
        const labelR = r + 18;
        const p = {
          x: cx + labelR * Math.cos(angle(i)),
          y: cy + labelR * Math.sin(angle(i)),
        };
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fill="rgba(255,255,255,0.5)"
            fontWeight={600}
          >
            {s.emoji}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Skill Card ───────────────────────────────────────────────────────────────
function SkillCard({
  skill,
  xp,
  index,
}: {
  skill: SkillAttribute;
  xp: number;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const level = getSkillLevel(xp);
  const pct = getLevelProgress(xp);
  const xpInLevel = xp % XP_PER_SKILL_LEVEL;
  const totalXPForLevel = XP_PER_SKILL_LEVEL;
  const maxLevel = skill.milestones[skill.milestones.length - 1].level;
  const cappedLevel = Math.min(level, maxLevel);

  const currentMilestoneIdx = skill.milestones.reduce((best, m, i) => {
    return level >= m.level ? i : best;
  }, 0);

  return (
    <div
      className="rounded-3xl overflow-hidden transition-all duration-300"
      style={{
        background: skill.bgGradient,
        border: `1px solid ${skill.borderColor}`,
        boxShadow: expanded ? `0 0 30px ${skill.glowColor}30` : "none",
      }}
    >
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full p-4 flex items-center gap-4 text-left"
      >
        {/* Skill icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            background: `${skill.color}20`,
            border: `1.5px solid ${skill.color}50`,
            boxShadow: `0 0 16px ${skill.glowColor}50`,
          }}
        >
          {skill.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-bold text-base text-foreground">{skill.name}</h3>
            {/* Level badge */}
            <div
              className="text-[11px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: `${skill.color}25`,
                color: skill.color,
                border: `1px solid ${skill.color}50`,
                boxShadow: `0 0 8px ${skill.glowColor}40`,
              }}
            >
              Lv {cappedLevel}
            </div>
          </div>

          <p
            className="text-[10px] font-semibold mb-2"
            style={{ color: `${skill.color}cc` }}
          >
            {skill.milestones[currentMilestoneIdx].label}
          </p>

          {/* XP Bar */}
          <AnimatedBar
            percentage={pct}
            color={skill.color}
            glowColor={skill.glowColor}
            delay={index * 120}
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            {xpInLevel} / {totalXPForLevel} XP to Lv {cappedLevel + 1}
          </p>
        </div>

        <div className="text-muted-foreground flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded: milestone nodes + description */}
      {expanded && (
        <div className="px-4 pb-5">
          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 px-1">
            {skill.description}
          </p>

          {/* Milestone nodes with connecting track */}
          <div className="relative">
            {/* Connecting track */}
            <div
              className="absolute top-5 left-0 right-0 h-px mx-8"
              style={{ background: "rgba(255,255,255,0.08)" }}
            />
            {/* Filled track progress */}
            <div
              className="absolute top-5 left-8 h-px transition-all duration-1000 ease-out"
              style={{
                width: `calc(${Math.min(currentMilestoneIdx / (skill.milestones.length - 1), 1) * 100}% - 0px)`,
                background: `linear-gradient(90deg, ${skill.color}, ${skill.color}80)`,
                boxShadow: `0 0 6px ${skill.glowColor}`,
              }}
            />

            {/* Nodes */}
            <div className="flex justify-between relative z-10">
              {skill.milestones.map((m, i) => (
                <MilestoneNode
                  key={m.level}
                  milestone={m}
                  unlocked={level >= m.level}
                  current={i === currentMilestoneIdx}
                  color={skill.color}
                  glowColor={skill.glowColor}
                />
              ))}
            </div>
          </div>

          {/* Next milestone preview */}
          {currentMilestoneIdx < skill.milestones.length - 1 && (
            <div
              className="mt-5 rounded-2xl p-3 flex items-center gap-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Next: {skill.milestones[currentMilestoneIdx + 1].label}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {skill.milestones[currentMilestoneIdx + 1].description} · Lv{" "}
                  {skill.milestones[currentMilestoneIdx + 1].level} required
                </p>
              </div>
            </div>
          )}

          {currentMilestoneIdx === skill.milestones.length - 1 && (
            <div
              className="mt-5 rounded-2xl p-3 flex items-center gap-3"
              style={{
                background: `${skill.color}15`,
                border: `1px solid ${skill.color}40`,
              }}
            >
              <CheckCircle2
                className="w-4 h-4 flex-shrink-0"
                style={{ color: skill.color }}
              />
              <p className="text-xs font-semibold" style={{ color: skill.color }}>
                Maximum level reached — You are elite.
              </p>
            </div>
          )}

          {/* XP source tags */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            <p className="text-[10px] text-muted-foreground w-full mb-0.5">Powered by:</p>
            {skill.categories.map((cat) => (
              <span
                key={cat}
                className="text-[10px] px-2.5 py-1 rounded-full capitalize font-medium"
                style={{
                  background: `${skill.color}12`,
                  color: `${skill.color}cc`,
                  border: `1px solid ${skill.color}25`,
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SkillTree() {
  const navigate = useNavigate();
  const user = getUser();

  // Compute XP for each skill
  const skillXPs = SKILLS.map((s) => calcSkillXP(s.id));
  const skillLevels = skillXPs.map(getSkillLevel);
  const totalSkillLevels = skillLevels.reduce((s, l) => s + l, 0);

  // Radar values: normalize to 0-100 by mapping max 20 levels
  const radarValues = skillLevels.map((l) => Math.min((l / 20) * 100, 100));

  // Total points earned indicator
  const totalAttributePoints = skillXPs.reduce((s, xp) => s + xp, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] pb-nav">
      {/* Header */}
      <div className="px-4 pt-12 pb-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold">Skill Tree</h1>
          <p className="text-xs text-muted-foreground">Attribute mastery from your habits</p>
        </div>
      </div>

      {/* Overview panel */}
      <div className="px-4 mb-5">
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(147,51,234,0.15), rgba(34,211,238,0.08))",
            border: "1px solid rgba(147,51,234,0.3)",
            boxShadow: "0 0 40px rgba(147,51,234,0.12)",
          }}
        >
          {/* BG blobs */}
          <div
            className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-15 pointer-events-none"
            style={{ background: "radial-gradient(circle, #9333ea, transparent)" }}
          />
          <div
            className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle, #22d3ee, transparent)" }}
          />

          <div className="relative flex items-center gap-4">
            {/* Radar chart */}
            <div className="flex-shrink-0">
              <RadarChart values={radarValues} colors={SKILLS.map((s) => s.color)} />
            </div>

            {/* Right summary */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Character Build</p>
              <h2 className="text-base font-display font-bold text-foreground mb-3 leading-tight">
                {user.name.split(" ")[0]}'s Skill Profile
              </h2>

              <div className="space-y-1.5">
                {SKILLS.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="text-xs w-3">{s.emoji}</span>
                    <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${radarValues[i]}%`,
                          background: s.color,
                          boxShadow: `0 0 4px ${s.glowColor}`,
                          transitionDelay: `${i * 100}ms`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-8 text-right">
                      Lv {skillLevels[i]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Summary stats */}
              <div className="flex gap-3 mt-3">
                <div>
                  <p className="text-base font-display font-black text-forge-gold-light">
                    {totalSkillLevels}
                  </p>
                  <p className="text-[9px] text-muted-foreground">Total levels</p>
                </div>
                <div>
                  <p className="text-base font-display font-black text-forge-purple-light">
                    {totalAttributePoints.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-muted-foreground">Attr. points</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works note */}
      <div className="px-4 mb-4">
        <div
          className="rounded-2xl px-4 py-3 flex items-start gap-2.5"
          style={{
            background: "rgba(34,211,238,0.06)",
            border: "1px solid rgba(34,211,238,0.18)",
          }}
        >
          <Zap className="w-4 h-4 text-forge-cyan mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Completing habits earns attribute XP for their matching skills. The more you do, the higher your level milestones unlock.
          </p>
        </div>
      </div>

      {/* Skill cards */}
      <div className="px-4 space-y-3">
        {SKILLS.map((skill, i) => (
          <SkillCard key={skill.id} skill={skill} xp={skillXPs[i]} index={i} />
        ))}
      </div>
    </div>
  );
}
