import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, ChevronLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { sendOtp, verifyOtpAndSetPassword, signInWithPassword, signInWithGoogle } from "@/lib/auth";

type FlowStep = "entry" | "otp" | "setPassword";
type FlowMode = "login" | "signup";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState<FlowMode>("login");
  const [step, setStep] = useState<FlowStep>("entry");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const user = await signInWithPassword(email, password);
      login(user);
      navigate("/");
    } catch (err: any) {
      toast.error(err.message ?? "Login failed. Please try again.");
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await sendOtp(email);
      setOtpSent(true);
      setStep("otp");
      toast.success(`OTP sent to ${email}`, { description: "Check your inbox (and spam folder)." });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      toast.error("Please enter the 4-digit code from your email.");
      return;
    }
    setStep("setPassword");
  };

  const handleSetPassword = async () => {
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (!username.trim()) {
      toast.error("Please enter a display name.");
      return;
    }
    setLoading(true);
    try {
      const user = await verifyOtpAndSetPassword(email, otp, password, username.trim());
      login(user);
      navigate("/");
    } catch (err: any) {
      toast.error(err.message ?? "Verification failed. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Google redirects automatically — no state update needed on success
    } catch (err: any) {
      toast.error(err.message ?? "Google sign-in failed.");
      setGoogleLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "otp") { setStep("entry"); setOtp(""); }
    else if (step === "setPassword") { setStep("otp"); }
  };

  // ── UI ─────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] flex flex-col items-center justify-center px-5 py-12">

      {/* Logo / Brand */}
      <div className="text-center mb-10">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: "linear-gradient(135deg, rgba(147,51,234,0.35), rgba(34,211,238,0.2))",
            border: "1.5px solid rgba(147,51,234,0.55)",
            boxShadow: "0 0 30px rgba(147,51,234,0.25)",
          }}
        >
          <span className="text-3xl">⚡</span>
        </div>
        <h1 className="text-3xl font-display font-black text-foreground">StreakForge</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === "entry"
            ? mode === "login" ? "Welcome back. Keep your streak alive." : "Start your habit journey."
            : step === "otp" ? "Check your email for the verification code."
            : "One last step — set your password."}
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-3xl p-6 relative overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(147,51,234,0.08)",
        }}
      >
        {/* Glow top */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(147,51,234,0.5), rgba(34,211,238,0.5), transparent)" }}
        />

        {/* Back button */}
        {step !== "entry" && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
        )}

        {/* ── ENTRY STEP ──────────────────────────────── */}
        {step === "entry" && (
          <div className="space-y-4">
            {/* Mode toggle */}
            <div
              className="flex p-1 rounded-2xl mb-1"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              {(["login", "signup"] as FlowMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background: mode === m
                      ? "linear-gradient(135deg, rgba(147,51,234,0.4), rgba(34,211,238,0.2))"
                      : undefined,
                    color: mode === m ? "#ffffff" : "rgba(255,255,255,0.4)",
                    border: mode === m ? "1px solid rgba(147,51,234,0.45)" : "1px solid transparent",
                    boxShadow: mode === m ? "0 0 12px rgba(147,51,234,0.2)" : undefined,
                  }}
                >
                  {m === "login" ? "Log In" : "Sign Up"}
                </button>
              ))}
            </div>

            {/* Email */}
            <InputField
              icon={<Mail className="w-4 h-4" />}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={setEmail}
            />

            {/* Password — only for login */}
            {mode === "login" && (
              <InputField
                icon={<Lock className="w-4 h-4" />}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={setPassword}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                onEnter={mode === "login" ? handleLogin : undefined}
              />
            )}

            {/* Primary CTA */}
            <PrimaryButton
              loading={loading}
              onClick={mode === "login" ? handleLogin : handleSendOtp}
              label={mode === "login" ? "Log In" : "Send Verification Code"}
            />

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              <span className="text-[11px] text-muted-foreground">or</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>
          </div>
        )}

        {/* ── OTP STEP ────────────────────────────────── */}
        {step === "otp" && (
          <div className="space-y-4">
            <div
              className="flex items-center gap-3 p-3 rounded-2xl mb-1"
              style={{ background: "rgba(147,51,234,0.1)", border: "1px solid rgba(147,51,234,0.25)" }}
            >
              <KeyRound className="w-4 h-4 text-forge-purple-light flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Code sent to</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">4-digit verification code</label>
              <input
                type="number"
                inputMode="numeric"
                maxLength={4}
                placeholder="· · · ·"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 4))}
                className="w-full text-center text-4xl font-display font-black tracking-[0.5em] py-5 rounded-2xl bg-transparent outline-none transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1.5px solid rgba(147,51,234,0.35)",
                  color: "#ffffff",
                  letterSpacing: "0.5em",
                }}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
              />
            </div>

            <PrimaryButton loading={false} onClick={handleVerifyOtp} label="Verify Code" />

            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full text-center text-xs text-muted-foreground hover:text-forge-purple-light transition-colors py-1 disabled:opacity-50"
            >
              {loading ? "Resending…" : "Didn't receive it? Resend code"}
            </button>
          </div>
        )}

        {/* ── SET PASSWORD STEP ────────────────────────── */}
        {step === "setPassword" && (
          <div className="space-y-4">
            <InputField
              icon={<User className="w-4 h-4" />}
              type="text"
              placeholder="Display name"
              value={username}
              onChange={setUsername}
            />
            <InputField
              icon={<Lock className="w-4 h-4" />}
              type={showPassword ? "text" : "password"}
              placeholder="Create password (min 6 chars)"
              value={password}
              onChange={setPassword}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              onEnter={handleSetPassword}
            />
            <p className="text-[10px] text-muted-foreground -mt-2 pl-1">
              You'll use this password to log in next time.
            </p>
            <PrimaryButton loading={loading} onClick={handleSetPassword} label="Create Account" />
          </div>
        )}
      </div>

      {/* Footer */}
      {step === "entry" && (
        <p className="text-[10px] text-muted-foreground mt-6 text-center max-w-xs">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function InputField({
  icon, type, placeholder, value, onChange, rightIcon, onEnter,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rightIcon?: React.ReactNode;
  onEnter?: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 rounded-2xl transition-all duration-200 focus-within:border-forge-purple/50"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.09)",
        minHeight: 52,
      }}
    >
      <span className="text-muted-foreground flex-shrink-0">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none py-3.5"
      />
      {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </div>
  );
}

function PrimaryButton({
  loading, onClick, label,
}: {
  loading: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60"
      style={{
        background: "linear-gradient(135deg, #9333ea, #7c3aed)",
        boxShadow: "0 0 25px rgba(147,51,234,0.4), 0 4px 15px rgba(0,0,0,0.3)",
      }}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {label}
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
