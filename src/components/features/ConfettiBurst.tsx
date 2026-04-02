import { useEffect, useRef } from "react";

interface ConfettiBurstProps {
  onDone: () => void;
}

const COLORS = [
  "#9333ea", "#a78bfa", "#22d3ee", "#f59e0b",
  "#22c55e", "#f97316", "#ec4899", "#60a5fa",
  "#fbbf24", "#34d399", "#f472b6", "#818cf8",
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotSpeed: number;
  shape: "rect" | "circle";
  opacity: number;
  gravity: number;
}

export default function ConfettiBurst({ onDone }: ConfettiBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Spawn particles in 3 bursts from top-center area
    const count = 120;
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.35;

    particlesRef.current = Array.from({ length: count }, (_, i) => {
      const angle = (Math.random() * Math.PI * 2);
      const speed = 4 + Math.random() * 9;
      const delayFactor = i < 40 ? 0 : i < 80 ? 0.3 : 0.6;
      return {
        x: cx + (Math.random() - 0.5) * 60,
        y: cy,
        vx: Math.cos(angle) * speed * (0.6 + Math.random() * 0.8),
        vy: Math.sin(angle) * speed * (0.6 + Math.random() * 0.8) - 8 - Math.random() * 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 5 + Math.random() * 8,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        shape: Math.random() > 0.4 ? "rect" : "circle",
        opacity: 1,
        gravity: 0.25 + Math.random() * 0.15,
        // store delay as a custom property via early vy boost
        // we'll stagger launch by adjusting vy for later particles
      };
    });

    startRef.current = performance.now();

    const draw = (now: number) => {
      const elapsed = (now - startRef.current) / 1000; // seconds
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let allGone = true;

      particlesRef.current.forEach((p) => {
        p.vy += p.gravity;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        // Fade out after 2 seconds
        if (elapsed > 1.8) {
          p.opacity = Math.max(0, p.opacity - 0.025);
        }

        if (p.opacity > 0 && p.y < canvas.height + 60) {
          allGone = false;
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;

          if (p.shape === "circle") {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          }
          ctx.restore();
        }
      });

      if (allGone || elapsed > 4) {
        onDone();
        return;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[90]"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
