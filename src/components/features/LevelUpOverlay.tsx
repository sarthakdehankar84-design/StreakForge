import { useEffect, useState, useCallback } from "react";
import { getLevelTitle } from "@/constants";

interface LevelUpOverlayProps {
  level: number;
  onDismiss: () => void;
}

const PARTICLE_COLORS = ["#9333ea", "#a78bfa", "#22d3ee", "#f59e0b", "#ec4899", "#c084fc", "#67e8f9"];

function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (360 / count) * i + (Math.random() - 0.5) * (360 / count);
    const distance = 90 + Math.random() * 130;
    const rad = (angle * Math.PI) / 180;
    return {
      id: i,
      tx: Math.cos(rad) * distance,
      ty: Math.sin(rad) * distance,
      size: 4 + Math.random() * 7,
      delay: Math.random() * 0.25,
      duration: 0.75 + Math.random() * 0.5,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      shape: Math.random() > 0.6 ? "star" : "circle",
    };
  });
}

const PARTICLES = generateParticles(28);

export default function LevelUpOverlay({ level, onDismiss }: LevelUpOverlayProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");
  const title = getLevelTitle(level);

  const dismiss = useCallback(() => {
    setPhase("exit");
    setTimeout(onDismiss, 450);
  }, [onDismiss]);

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase("hold"), 500);
    const exitTimer = setTimeout(() => setPhase("exit"), 2100);
    const doneTimer = setTimeout(onDismiss, 2550);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        background: "rgba(0,0,0,0.82)",
        opacity: phase === "exit" ? 0 : 1,
        transition: "opacity 0.45s ease",
        pointerEvents: phase === "exit" ? "none" : "auto",
      }}
      onClick={dismiss}
    >
      {/* ── Particle burst ───────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute"
            style={{
              width: p.size,
              height: p.size,
              borderRadius: p.shape === "circle" ? "50%" : "2px",
              background: p.color,
              boxShadow: `0 0 ${p.size * 2.5}px ${p.color}`,
              transform: p.shape === "star" ? "rotate(45deg)" : undefined,
              animation: `levelup-particle ${p.duration}s cubic-bezier(0.22,1,0.36,1) ${p.delay}s both`,
              ["--p-tx" as string]: `${p.tx}px`,
              ["--p-ty" as string]: `${p.ty}px`,
            }}
          />
        ))}
      </div>

      {/* ── Background glow orbs ─────────────────── */}
      <div
        className="absolute w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(147,51,234,0.18) 0%, transparent 70%)",
          animation: "levelup-glow-pulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-48 h-48 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)",
          animation: "levelup-glow-pulse 1.5s ease-in-out 0.75s infinite",
        }}
      />

      {/* ── Main card ────────────────────────────── */}
      <div
        className="relative text-center rounded-3xl overflow-hidden select-none"
        style={{
          padding: "40px 48px 32px",
          background:
            "linear-gradient(160deg, rgba(20,12,40,0.95) 0%, rgba(10,16,30,0.95) 100%)",
          border: "1.5px solid rgba(147,51,234,0.55)",
          boxShadow:
            "0 0 50px rgba(147,51,234,0.35), 0 0 100px rgba(147,51,234,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
          animation:
            "levelup-card-in 0.55s cubic-bezier(0.34,1.56,0.64,1) both",
          minWidth: 280,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ring flash overlay */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            border: "2px solid rgba(167,139,250,0.8)",
            animation: "ring-flash 0.65s ease-out 0.1s both",
          }}
        />

        {/* Inner glow bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(147,51,234,0.18), transparent 65%)",
          }}
        />

        <div className="relative z-10">
          {/* "LEVEL UP" label */}
          <p
            className="text-[10px] font-black tracking-[0.35em] mb-4 text-forge-purple-light"
            style={{
              animation: "levelup-fade-up 0.4s ease-out 0.18s both",
              textShadow: "0 0 20px rgba(167,139,250,0.8)",
            }}
          >
            ⚡ LEVEL UP ⚡
          </p>

          {/* Level ring + number */}
          <div
            className="relative inline-flex items-center justify-center mb-5"
            style={{ animation: "levelup-number-in 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.12s both" }}
          >
            {/* Outer pulsing ring */}
            <div
              className="absolute rounded-full"
              style={{
                width: 148,
                height: 148,
                border: "1px solid rgba(147,51,234,0.3)",
                animation: "levelup-outer-ring 2s ease-in-out infinite",
              }}
            />
            {/* Middle ring */}
            <div
              className="absolute rounded-full"
              style={{
                width: 122,
                height: 122,
                border: "1.5px solid rgba(147,51,234,0.5)",
                boxShadow: "0 0 20px rgba(147,51,234,0.25), inset 0 0 20px rgba(147,51,234,0.1)",
                animation: "levelup-mid-ring 2s ease-in-out 0.2s infinite",
              }}
            />
            {/* Core circle */}
            <div
              className="w-24 h-24 rounded-full flex flex-col items-center justify-center relative"
              style={{
                background:
                  "linear-gradient(135deg, rgba(147,51,234,0.45) 0%, rgba(34,211,238,0.3) 100%)",
                border: "2px solid rgba(167,139,250,0.7)",
                boxShadow:
                  "0 0 30px rgba(147,51,234,0.55), 0 0 60px rgba(147,51,234,0.2), inset 0 0 20px rgba(147,51,234,0.2)",
              }}
            >
              <span
                className="text-[38px] font-display font-black text-white leading-none"
                style={{ textShadow: "0 0 24px rgba(167,139,250,0.9)" }}
              >
                {level}
              </span>
            </div>
          </div>

          {/* Level title */}
          <p
            className="text-2xl font-display font-bold shimmer-text mb-2"
            style={{ animation: "levelup-fade-up 0.4s ease-out 0.32s both" }}
          >
            {title}
          </p>

          {/* Subtitle */}
          <p
            className="text-sm text-muted-foreground mb-6"
            style={{ animation: "levelup-fade-up 0.4s ease-out 0.44s both" }}
          >
            You crossed Level {level} — keep forging 🔥
          </p>

          {/* XP overflow bar */}
          <div
            className="mb-6"
            style={{ animation: "levelup-fade-up 0.4s ease-out 0.5s both" }}
          >
            <div className="h-2 bg-white/8 rounded-full overflow-hidden relative">
              {/* Overflow flash: fills from 0 to 100% then flashes */}
              <div
                className="h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, #9333ea, #a78bfa, #22d3ee)",
                  animation: "xp-overflow-fill 0.7s cubic-bezier(0.25,0.46,0.45,0.94) 0.3s both",
                  boxShadow: "0 0 10px rgba(147,51,234,0.8)",
                }}
              />
              {/* Flash overlay */}
              <div
                className="absolute inset-0 rounded-full bg-white"
                style={{ animation: "xp-flash 0.5s ease-out 1s both" }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              XP overflow — Level {level} unlocked!
            </p>
          </div>

          {/* Badge row */}
          <div
            className="flex items-center justify-center gap-2"
            style={{ animation: "levelup-fade-up 0.4s ease-out 0.6s both" }}
          >
            {["🔥", "⚡", "🎯"].map((emoji, i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  animation: `levelup-badge-bounce 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.65 + i * 0.1}s both`,
                }}
              >
                {emoji}
              </div>
            ))}
          </div>

          {/* Dismiss hint */}
          <p
            className="text-[10px] text-muted-foreground mt-5 opacity-40"
            style={{ animation: "levelup-fade-up 0.4s ease-out 1s both" }}
          >
            Tap anywhere to dismiss
          </p>
        </div>
      </div>
    </div>
  );
}
