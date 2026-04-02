import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] px-4 text-center">
      <div className="text-8xl mb-4 animate-float">🌌</div>
      <h1 className="text-4xl font-display font-black mb-2 shimmer-text">404</h1>
      <p className="text-muted-foreground mb-6">This page doesn't exist in your quest log.</p>
      <Link
        to="/"
        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-forge-purple/30 border border-forge-purple/50 text-forge-purple-light font-semibold hover:bg-forge-purple/40 transition-all"
      >
        <Home className="w-4 h-4" />
        Back to Home
      </Link>
    </div>
  );
}
