import { NavLink } from "react-router-dom";
import { Home, Flame, Timer, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/habits", icon: Flame, label: "Habits" },
  { to: "/timer", icon: Timer, label: "Focus" },
  { to: "/leaderboard", icon: Trophy, label: "Rank" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-lg mx-auto">
        <div className="glass-strong border-t border-white/10 flex items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom,8px)]">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-[48px] min-h-[48px] justify-center",
                  isActive
                    ? "text-forge-purple-light"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      "p-1.5 rounded-lg transition-all duration-200",
                      isActive && "bg-forge-purple/20 glow-purple"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-all duration-200",
                        isActive && "text-forge-purple-light"
                      )}
                    />
                  </div>
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
