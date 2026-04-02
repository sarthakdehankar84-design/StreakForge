import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ChevronLeft, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { sendOtp, verifyOtpAndSetPassword, signInWithPassword, signInWithGoogle } from "@/lib/auth";
import { toast } from "sonner";

type Step = "email" | "otp" | "password" | "login";
type Mode = "signup" | "login";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Send OTP ──────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!email.trim()) return toast.error("Please enter your email.");
    setLoading(true);
    try {
      await sendOtp(email.trim().toLowerCase());
      toast.success("OTP sent! Check your inbox.");
      setStep("otp");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP → set password (signup) ───────────────────
  const handleVerifyAndRegister = async () => {
    if (otp.length < 4) return toast.error("Enter the 4-digit code.");
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    if (password !== confirmPassword) return toast.error("Passwords do not match.");
    setLoading(true);
    try {
      const authUser = await verifyOtpAndSetPassword(email, otp, password, username);
      login(authUser);
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Verification failed.");
      setLoading(false);
    }
  };

  // ── Login with email + password ───────────────────────────
  const handleLogin = async () => {
    if (!email.trim()) return toast.error("Please enter your email.");
    if (!password) return toast.error("Please enter your password.");
    setLoading(true);
    try {
      const authUser = await signInWithPassword(email.trim().toLowerCase(), password);
      login(authUser);
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Login failed.");
      setLoading(false);
    }
  };

  // ── Google OAuth ──────────────────────────────────────────
  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      toast.error(err.message ?? "Google sign-in failed.");
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setStep(m === "signup" ? "email" : "login");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setUsername("");
  };

  const isSignup = mode === "signup";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] flex flex-col items-center justify-center px-5 py-10">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{
            background: "linear-gradient(135deg, rgba(147,51,234,0.35), rgba(34,211,238,0.2))",
            border: "1.5px solid rgba(147,51,234,0.55)",
            boxShadow: "0 0 30px rgba(147,51,234,0.3)",
          }}
        >
          ⚡
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold shimmer-text">StreakForge</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isSignup ? "Create your account" : "Welcome back"}
          </p>
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-3xl p-6"
        style={{
          background: "rgba(13,13,26,0.95)",
          border: "1px solid rgba(147,51,234,0.25)",
          boxShadow: "0 0 40px rgba(147,51,234,0.12)",
        }}
      >
        {/* Mode toggle */}
        <div className="glass rounded-2xl p-1 flex mb-6">
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={
                mode === m
                  ? {
                      background: "rgba(147,51,234,0.28)",
                      color: "#a78bfa",
                      border: "1px solid rgba(147,51,234,0.5)",
                    }
                  : { color: "rgba(255,255,255,0.4)" }
              }
            >
              {m === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* ── SIGNUP FLOW ─────────────────────────────── */}
        {isSignup && (
          <div className="space-y-4">
            {/* Back button for later steps */}
            {step !== "email" && (
              <button
                onClick={() => setStep("email")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}

            {/* Step: Email */}
            {step === "email" && (
              <>
                <InputField
                  icon={<Mail className="w-4 h-4" />}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={setEmail}
                  label="Email address"
                />
                <PrimaryButton loading={loading} onClick={handleSendOtp}>
                  Send OTP <ArrowRight className="w-4 h-4" />
                </PrimaryButton>
              </>
            )}

            {/* Step: OTP + password */}
            {step === "otp" && (
              <>
                <p className="text-xs text-muted-foreground text-center -mt-1 mb-1">
                  Code sent to <span className="text-forge-purple-light font-semibold">{email}</span>
                </p>
                <InputField
                  icon={<KeyRound className="w-4 h-4" />}
                  type="text"
                  placeholder="4-digit code"
                  value={otp}
                  onChange={setOtp}
                  maxLength={4}
                  label="OTP Code"
                />
                <InputField
                  label="Username"
                  icon={<span className="text-muted-foreground text-sm">@</span>}
                  type="text"
                  placeholder="your_username"
                  value={username}
                  onChange={setUsername}
                />
                <PasswordField
                  label="Password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
                <PasswordField
                  label="Confirm Password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                />
                <PrimaryButton loading={loading} onClick={handleVerifyAndRegister}>
                  Create Account <ArrowRight className="w-4 h-4" />
                </PrimaryButton>
              </>
            )}
          </div>
        )}

        {/* ── LOGIN FLOW ──────────────────────────────── */}
        {!isSignup && (
          <div className="space-y-4">
            <InputField
              icon={<Mail className="w-4 h-4" />}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              label="Email address"
            />
            <PasswordField
              label="Password"
              placeholder="Your password"
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
            <PrimaryButton loading={loading} onClick={handleLogin}>
              Log In <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </div>

      {/* Footer note */}
      <p className="text-[11px] text-muted-foreground text-center mt-6 max-w-xs leading-relaxed">
        By continuing, you agree to StreakForge's terms. Your data is stored securely.
      </p>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InputField({
  label,
  icon,
  type,
  placeholder,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
      >
        <span className="text-muted-foreground flex-shrink-0">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
        />
      </div>
    </div>
  );
}

function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
      >
        <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  loading,
  onClick,
}: {
  children: React.ReactNode;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60"
      style={{
        background: "linear-gradient(135deg, #9333ea, #7c3aed)",
        boxShadow: "0 0 20px rgba(147,51,234,0.35)",
      }}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}
