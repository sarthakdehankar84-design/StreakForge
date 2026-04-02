import { useState, useEffect } from "react";
import { ShieldCheck, ShieldOff, X, Flame } from "lucide-react";
import { toast } from "sonner";
import { getUser, saveUser, todayStr } from "@/lib/storage";

interface ShieldModalProps {
  missedStreak: number;
  onUsed: () => void;
  onDecline: () => void;
}

export default function ShieldModal({ missedStreak, onUsed, onDecline }: ShieldModalProps) {
  const [phase, setPhase] = useState<"idle" | "activating" | "done">("idle");
  const user = getUser();

  // Entry animation
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleUseShield = () => {
    if (phase !== "idle") return;
    setPhase("activating");

    setTimeout(() => {
      const u = getUser();
      if (u.shields <= 0) return;
      u.shields -= 1;
      u.streak = missedStreak; // restore streak
      u.longestStreak = Math.max(u.longestStreak, u.streak);
      // Mark today as streak-continued
      const today = new Date();
      const todayKey = `sf_shield_used_${todayStr()}`;
      localStorage.setItem(todayKey, "1");
      saveUser(u);
      setPhase("done");

      setTimeout(() => {
        toast.success(`🛡️ Streak Shield activated! ${missedStreak}-day streak preserved.`, {
          description: `You have ${u.shields} shield${u.shields !== 1 ? "s" : ""} remaining.`,
          duration: 4000,
        });
        onUsed();
      }, 700);
    }, 900);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        background: "rgba(0,0,0,0.75)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden text-center"
        style={{
          background: "linear-gradient(160deg, rgba(18,10,38,0.97) 0%, rgba(10,14,28,0.97) 100%)",
          border: "1.5px solid rgba(147,51,234,0.45)",
          boxShadow: "0 0 60px rgba(147,51,234,0.25), 0 0 120px rgba(147,51,234,0.08)",
          transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.96)",
          transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
        }}
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(147,51,234,0.16) 0%, transparent 65%)",
          }}
        />

        {/* Dismiss button */}
        <button
          onClick={onDecline}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 px-6 pt-8 pb-7">
          {/* Shield icon — animated on activation */}
          <div className="flex justify-center mb-5">
            <div
              className="relative"
              style={{
                animation: phase === "activating" ? "shield-pulse 0.9s ease-in-out both" : undefined,
              }}
            >
              {/* Outer glow ring */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  boxShadow:
                    phase === "activating"
                      ? "0 0 50px rgba(147,51,234,0.8), 0 0 100px rgba(167,139,250,0.4)"
                      : "0 0 20px rgba(147,51,234,0.3)",
                  transition: "box-shadow 0.4s ease",
                  borderRadius: "50%",
                }}
              />
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background:
                    phase === "done"
                      ? "linear-gradient(135deg, rgba(34,197,94,0.35), rgba(34,197,94,0.15))"
                      : "linear-gradient(135deg, rgba(147,51,234,0.35), rgba(167,139,250,0.2))",
                  border:
                    phase === "done"
                      ? "2px solid rgba(34,197,94,0.7)"
                      : "2px solid rgba(147,51,234,0.65)",
                  boxShadow:
                    phase === "done"
                      ? "0 0 30px rgba(34,197,94,0.4)"
                      : "0 0 30px rgba(147,51,234,0.4)",
                  transition: "all 0.4s ease",
                }}
              >
                {phase === "done" ? (
                  <ShieldCheck
                    className="w-12 h-12"
                    style={{ color: "#4ade80", filter: "drop-shadow(0 0 10px rgba(34,197,94,0.8))" }}
                  />
                ) : (
                  <ShieldCheck
                    className="w-12 h-12"
                    style={{
                      color: "#a78bfa",
                      filter: "drop-shadow(0 0 10px rgba(167,139,250,0.8))",
                      animation: phase === "idle" ? "shield-float 3s ease-in-out infinite" : "shield-activate 0.9s ease-in-out both",
                    }}
                  />
                )}
              </div>

              {/* Ripple particles on activation */}
              {phase === "activating" && (
                <>
                  {[0, 60, 120, 180, 240, 300].map((angle) => {
                    const rad = (angle * Math.PI) / 180;
                    return (
                      <div
                        key={angle}
                        className="absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full"
                        style={{
                          background: "#a78bfa",
                          boxShadow: "0 0 8px #a78bfa",
                          animation: `shield-particle 0.9s cubic-bezier(0.22,1,0.36,1) both`,
                          "--s-tx": `${Math.cos(rad) * 70}px`,
                          "--s-ty": `${Math.sin(rad) * 70}px`,
                          animationDelay: `${angle * 0.001}s`,
                        } as React.CSSProperties}
                      />
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Text */}
          <div className="mb-1">
            <p className="text-[10px] font-black tracking-[0.3em] text-forge-purple-light mb-2">
              ⚠️ STREAK MISSED
            </p>
            <h2 className="text-xl font-display font-bold text-foreground mb-1">
              Use a Streak Shield?
            </h2>
          </div>

          {/* Streak display */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl mb-4"
            style={{
              background: "rgba(249,115,22,0.12)",
              border: "1px solid rgba(249,115,22,0.3)",
            }}
          >
            <Flame
              className="w-4 h-4"
              style={{ color: "#f97316", filter: "drop-shadow(0 0 4px rgba(249,115,22,0.7))" }}
            />
            <span className="text-sm font-bold text-foreground">
              {missedStreak}-day streak at risk
            </span>
          </div>

          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            You missed yesterday. Activate a Streak Shield to protect your
            {" "}<span className="text-forge-flame font-semibold">{missedStreak}-day streak</span>{" "}
            and keep your momentum going.
          </p>

          {/* Shield count */}
          <div
            className="flex items-center justify-center gap-2 mb-6 py-2.5 px-4 rounded-2xl"
            style={{
              background: "rgba(147,51,234,0.10)",
              border: "1px solid rgba(147,51,234,0.25)",
            }}
          >
            <ShieldCheck className="w-4 h-4 text-forge-purple-light" />
            <span className="text-sm font-semibold text-foreground">
              {user.shields} Shield{user.shields !== 1 ? "s" : ""} available
            </span>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleUseShield}
              disabled={phase !== "idle" || user.shields <= 0}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{
                background:
                  phase === "done"
                    ? "linear-gradient(135deg, #22c55e, #4ade80)"
                    : "linear-gradient(135deg, #9333ea, #a78bfa)",
                boxShadow:
                  phase === "done"
                    ? "0 0 20px rgba(34,197,94,0.4)"
                    : "0 0 20px rgba(147,51,234,0.4)",
                transition: "background 0.4s ease, box-shadow 0.4s ease",
              }}
            >
              {phase === "activating"
                ? "Activating Shield…"
                : phase === "done"
                ? "✓ Streak Protected!"
                : `🛡️ Use Shield (${user.shields} left)`}
            </button>

            <button
              onClick={onDecline}
              disabled={phase === "activating"}
              className="w-full py-3 rounded-2xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              <ShieldOff className="w-3.5 h-3.5 inline mr-1.5" />
              Let streak reset
            </button>
          </div>

          {user.shields === 0 && (
            <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
              No shields available. Reach a 7-day streak milestone to earn one.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
