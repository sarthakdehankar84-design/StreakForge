import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Flame, Mail, Lock, Eye, EyeOff, User, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Mode = "login" | "signup" | "otp";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: { access_type: "offline", prompt: "consent" },
        skipBrowserRedirect: false,
      },
    });
    if (error) toast.error(error.message);
  };

  // ── Email Login ───────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      navigate("/");
    }
  };

  // ── Send OTP for Signup ───────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!email.trim() || !password || !username.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success("Check your email for a 4-digit code!");
      setMode("otp");
      setLoading(false);
    }
  };

  // ── Verify OTP + Set Password ─────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!otp.trim()) return;
    setLoading(true);
    const { error: otpErr } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: "email",
    });
    if (otpErr) {
      toast.error(otpErr.message);
      setLoading(false);
      return;
    }
    const { error: updateErr } = await supabase.auth.updateUser({
      password,
      data: { username: username.trim(), full_name: username.trim() },
    });
    if (updateErr) {
      toast.error(updateErr.message);
      setLoading(false);
      return;
    }
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] flex items-center justify-center px-4">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #9333ea, transparent)" }} />
        <div className="absolute bottom-20 left-1/4 w-64 h-64 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #22d3ee, transparent)" }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-forge-purple to-forge-cyan flex items-center justify-center glow-purple">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-display font-black text-white shimmer-text">StreakForge</span>
          </div>
          <p className="text-muted-foreground text-sm">Build habits. Level up. Dominate.</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-6 border border-white/10">
          {/* Tab switcher */}
          {mode !== "otp" && (
            <div className="glass rounded-2xl p-1 flex mb-6">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    mode === m
                      ? "bg-forge-purple/30 text-forge-purple-light border border-forge-purple/50"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          {/* OTP verification screen */}
          {mode === "otp" ? (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <div className="text-4xl mb-2">📧</div>
                <h2 className="font-display font-bold text-lg text-white">Check your email</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  We sent a 4-digit code to<br />
                  <span className="text-forge-purple-light font-medium">{email}</span>
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="0000"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-forge-purple/60 tracking-widest"
                />
              </div>
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 4}
                className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-forge-purple to-forge-cyan disabled:opacity-40 transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ boxShadow: "0 0 20px rgba(147,51,234,0.4)" }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify & Create Account <ArrowRight className="w-4 h-4" /></>}
              </button>
              <button
                onClick={() => setMode("signup")}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                ← Back
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Username (signup only) */}
              {mode === "signup" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="YourName"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-forge-purple/60"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSendOtp())}
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-forge-purple/60"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSendOtp())}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-forge-purple/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary action */}
              <button
                onClick={mode === "login" ? handleLogin : handleSendOtp}
                disabled={loading || !email.trim() || !password}
                className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-forge-purple to-forge-cyan disabled:opacity-40 transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ boxShadow: "0 0 20px rgba(147,51,234,0.4)" }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : mode === "login" ? (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Send Verification Code <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Google */}
              <button
                onClick={handleGoogle}
                className="w-full py-3.5 rounded-2xl font-semibold text-white glass border border-white/15 hover:border-white/25 transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
