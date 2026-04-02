import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

interface XPToastProps {
  xp: number;
  habitName: string;
  onDone: () => void;
}

export default function XPToast({ xp, habitName, onDone }: XPToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={`fixed top-20 right-4 z-[100] glass-strong rounded-2xl px-4 py-3 flex items-center gap-3 transition-all duration-300 border border-forge-gold/30`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-20px)",
        boxShadow: "0 0 20px rgba(245, 158, 11, 0.3)",
      }}
    >
      <div className="w-9 h-9 rounded-full bg-forge-gold/20 flex items-center justify-center">
        <Zap className="w-5 h-5 text-forge-gold" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{habitName}</p>
        <p className="text-sm font-bold text-forge-gold-light">+{xp} XP earned!</p>
      </div>
    </div>
  );
}
