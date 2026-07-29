import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGuestAuth } from "@/hooks/useGuestAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import hhLogo from "@/assets/hh-logo.png";
import Seo from "@/components/Seo";
import PageHeader from "@/components/PageHeader";
import { lovable } from "@/integrations/lovable/index";
import { validatePassword, PASSWORD_REQUIREMENTS_TEXT } from "@/lib/passwordPolicy";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.2 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.77 24c0-1.6.28-3.14.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const AppleIcon = () => (
  <svg width="17" height="20" viewBox="0 0 384 512" fill="#1A1A1A" aria-hidden="true">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);




const SIGNIN_LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'Helvetica Neue', 'Helvetica World', Helvetica, Arial, sans-serif",
  fontWeight: 400,
  fontSize: 12,
  lineHeight: "14.4px",
  letterSpacing: "0.24px",
  textTransform: "none",
  color: "#8A8480",
  display: "block",
  marginBottom: 6,
};

const CREATE_LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'Helvetica Neue', 'Helvetica World', Helvetica, Arial, sans-serif",
  fontWeight: 700,
  fontSize: 14,
  lineHeight: "16.8px",
  letterSpacing: 0,
  textTransform: "none",
  color: "#1A1A1A",
  display: "block",
  marginBottom: 4,
};

const Welcome = () => {
  const location = useLocation() as { state?: { mode?: "signin" | "signup" } };
  const initialMode = location.state?.mode ?? "welcome";
  const [mode, setMode] = useState<"welcome" | "signin" | "signup" | "forgot" | "forgotSent">(initialMode);
  const navigate = useNavigate();
  const { enterGuest } = useGuestAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");
  const [username, setUsername] = useState("");
  const [residency, setResidency] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const { signIn, signUp } = useAuth();

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if ((result as any).error) {
        toast.error((result as any).error.message || "Could not sign in. Please try again.");
        setOauthLoading(null);
        return;
      }
      if ((result as any).redirected) return;
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Could not sign in. Please try again.");
    }
    setOauthLoading(null);
  };


  const RESIDENCY_OPTIONS = [
    { label: "Local", value: "I live in Hoedspruit" },
    { label: "Visitor", value: "I am a visitor in Hoedspruit" },
  ];


  useEffect(() => {
    if (location.state?.mode) setMode(location.state.mode);
  }, [location.state?.mode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("deleted") === "1") {
      toast.error(
        "Something went wrong with your account. Please continue as a guest or create another account. Feel free to reach out to us at hello@hellohoedspruit.com.",
        { duration: 10000 },
      );
      // clean the query string so the toast doesn't re-fire
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    if (mode === "signup") {
      if (!firstName || !lastName) {
        toast.error("Please enter both your first and last name");
        setLoading(false);
        return;
      }
      if (!username.trim()) {
        toast.error("Please choose a username");
        setLoading(false);
        return;
      }
      if (!residency) {
        toast.error("Please let us know if you live in or are visiting Hoedspruit");
        setLoading(false);
        return;
      }
      const pwError = validatePassword(password);
      if (pwError) {
        toast.error(`${pwError} ${PASSWORD_REQUIREMENTS_TEXT}`);
        setLoading(false);
        return;
      }
      // Check username availability (case-insensitive). A SECURITY DEFINER RPC
      // is used because RLS blocks reading other users' profile rows directly.
      const trimmedUsername = username.trim();
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: available, error: checkError } = await supabase.rpc(
        "is_username_available" as any,
        { _username: trimmedUsername } as any
      );
      if (checkError) {
        toast.error(checkError.message);
        setLoading(false);
        return;
      }
      if (!available) {
        toast.error("That username is already taken. Please choose a different one.");
        setLoading(false);
        return;
      }
      const displayName = `${firstName} ${lastName}`;
      const { error } = await signUp(email, password, {
        displayName: fullName,
        firstName: firstName.trim(),
        surname: lastName.trim(),
      });
      if (error) {
        if (/duplicate|unique/i.test(error.message)) {
          toast.error("That username is already taken. Please choose a different one.");
        } else {
          toast.error(error.message);
        }
      } else {
        // Persist username on profile. The DB unique index is the final guard
        // against a race between the availability check and this write.
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: upErr } = await supabase
            .from("profiles")
            .update({ username: trimmedUsername, location: residency })
            .eq("id", user.id);
          if (upErr) {
            if ((upErr as any).code === "23505" || /duplicate|unique/i.test(upErr.message)) {
              toast.error("That username is already taken. Please choose a different one.");
              setLoading(false);
              return;
            }
            // Non-fatal: the account exists; the username can be set later in settings.
          }
        }
        toast.success("Account created! You're in.");
      }
    } else {
      localStorage.setItem("hh-keep-signed-in", keepSignedIn ? "1" : "0");
      const { error } = await signIn(email, password);

      if (error) {
        const msg = /invalid login credentials|invalid.*password|invalid.*email/i.test(error.message)
          ? "Incorrect email or password. Please try again."
          : error.message;
        setAuthError(msg);
        toast.error(msg);
      } else {
        navigate("/", { replace: true });
      }
    }
    setLoading(false);
  };

  const handleSendReset = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Please enter your email address.");
      return;
    }
    setLoading(true);
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(
        /rate|seconds|too many/i.test(error.message)
          ? "Please wait a moment before requesting another link."
          : error.message || "Could not send the reset link. Please try again."
      );
      return;
    }
    setMode("forgotSent");
  };

  if (mode === "forgot" || mode === "forgotSent") {
    const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#E6E0CC" }}>
        <PageHeader title="Reset Password" onBack={() => setMode("signin")} />
        <div className="flex-1 px-6 pb-12 pt-6 flex flex-col">
          {mode === "forgot" ? (
            <>
              <p style={{ fontFamily: FF, fontSize: 14, lineHeight: 1.55, color: "#6B6255", margin: "0 0 20px" }}>
                Enter the email address for your account and we'll send you a secure
                link to choose a new password.
              </p>
              <form onSubmit={handleSendReset} className="flex flex-col">
                <div>
                  <Label htmlFor="resetEmail" style={CREATE_LABEL_STYLE}>
                    Email
                  </Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="h-12 rounded-xl bg-card border-border text-[15px]"
                    style={{ background: "#ffffff", color: "#1A1A1A" }}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 font-medium rounded-full mt-6"
                  style={{ background: "#423324", color: "#FFFFFF", fontSize: 16 }}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Email Reset Link"}
                </Button>
              </form>
              <p className="text-center text-sm mt-6" style={{ fontFamily: FF, color: "#2b2420" }}>
                Remembered it?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="font-medium"
                  style={{ fontFamily: FF, color: "#715a3d" }}
                >
                  Log in
                </button>
              </p>
            </>
          ) : (
            <>
              <p style={{ fontFamily: FF, fontSize: 14, lineHeight: 1.55, color: "#6B6255", margin: "0 0 20px" }}>
                If an account exists for{" "}
                <span style={{ color: "#1A1A1A", fontWeight: 600 }}>{email.trim()}</span>
                , we've sent it a password reset link. Open the link to choose a new
                password — and check your spam folder if it doesn't arrive within a few
                minutes.
              </p>
              <Button
                onClick={() => setMode("signin")}
                className="w-full h-12 font-medium rounded-full"
                style={{ background: "#423324", color: "#FFFFFF", fontSize: 16 }}
              >
                Back to Log In
              </Button>
              <p className="text-center text-sm mt-6" style={{ fontFamily: FF, color: "#2b2420" }}>
                Didn't get it?{" "}
                <button
                  type="button"
                  onClick={() => handleSendReset()}
                  disabled={loading}
                  className="font-medium"
                  style={{ fontFamily: FF, color: "#715a3d", opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? "Sending..." : "Resend link"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (mode === "welcome") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#E6E0CC", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
        <Seo
          title="Welcome to Hello Hoedspruit"
          description="Sign in or create a free account to save your favourite places, events and specials around Hoedspruit."
          path="/welcome"
        />
        {/* Logo block */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-6">
          <img src={hhLogo} alt="Hello Hoedspruit" style={{ width: 220, height: "auto" }} />
          <h1
            style={{
              fontFamily: "'Bricolage Grotesque', 'Helvetica Neue', 'Helvetica World', Helvetica, Arial, sans-serif",
              color: "#423324",
              fontSize: 22,
              lineHeight: 1.2,
              fontWeight: 500,
              letterSpacing: "0.01em",
              marginTop: 16,
              textAlign: "center",
            }}
          >
            Your Lowveld local
          </h1>
        </div>

        {/* Bottom action area */}
        <div className="px-5 pb-10">

          <Button
            onClick={() => setMode("signup")}
            className="w-full"
            style={{
              height: 48,
              borderRadius: 9999,
              background: "#423324",
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            Create an Account
          </Button>

          <Button
            onClick={() => {
              enterGuest();
              navigate("/");
            }}
            variant="outline"
            className="w-full mt-3"
            style={{
              height: 48,
              borderRadius: 9999,
              background: "transparent",
              border: "1.5px solid #715a3d",
              color: "#715a3d",
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            Continue as Guest
          </Button>

          <p style={{ textAlign: "center", color: "#2b2420", fontSize: 14, marginTop: 18 }}>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("signin")}
              style={{
                color: "#715a3d",
                fontWeight: 500,
                textDecoration: "underline",
                textUnderlineOffset: 3,
                borderRadius: 9999,
              }}
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    );
  }

  const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  const HEAD = "'Bricolage Grotesque', 'Helvetica Neue', Helvetica, Arial, sans-serif";

  const fieldStyle: React.CSSProperties = {
    background: "#ffffff",
    color: "#1A1A1A",
    borderColor: "rgba(26,26,26,0.10)",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#E6E0CC", fontFamily: FF }}>
      <style>{`
        .residency-select [data-radix-select-trigger-icon] > svg {
          opacity: 1 !important;
          color: #8A8480 !important;
        }
      `}</style>

      <div className="flex-1 px-6 pb-12 pt-6 flex flex-col">
        {/* Circular back button */}
        <button
          type="button"
          onClick={() => setMode("welcome")}
          aria-label="Back"
          style={{
            width: 44, height: 44, borderRadius: 9999, background: "#FFFFFF",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "none", cursor: "pointer", marginBottom: 22,
          }}
        >
          <ArrowLeft size={20} color="#1A1A1A" strokeWidth={1.75} />
        </button>

        <p
          style={{
            fontFamily: FF, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "#715A3D", margin: "0 0 6px",
          }}
        >
          Your Lowveld Local
        </p>
        <h1
          style={{
            fontFamily: HEAD, fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em",
            color: "#1A1A1A", lineHeight: 1.05, margin: "0 0 10px",
          }}
        >
          {mode === "signup" ? "Create account" : "Welcome back"}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="space-y-4">

          {mode === "signup" && (
            <>
              <div>
                <Label htmlFor="fullName" style={CREATE_LABEL_STYLE}>
                  First &amp; Last Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(capitaliseName(e.target.value))}
                  required
                  autoCapitalize="words"
                  placeholder="Your first and last name"
                  className="h-12 rounded-xl bg-card border-border text-[15px]"
                  style={fieldStyle}
                />
              </div>

              <div>
                <Label htmlFor="username" style={CREATE_LABEL_STYLE}>
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Choose a unique username"
                  className="h-12 rounded-xl bg-card border-border text-[15px]"
                  style={fieldStyle}
                />
              </div>
              <div>
                <Label style={CREATE_LABEL_STYLE}>
                  Are you a local or a visitor?
                </Label>
                <Select value={residency} onValueChange={setResidency}>
                  <SelectTrigger className="residency-select h-12 w-full rounded-xl border border-border bg-white px-4 text-[15px]">
                    <SelectValue
                      placeholder="Select one"
                      style={{ color: residency ? "#1A1A1A" : "#8A8480" }}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {RESIDENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-[15px]">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </>
          )}
          {authError && mode === "signin" && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-[13px]"
              style={{
                background: "#fdecec",
                border: "1px solid #e5484d",
                color: "#b42318",
                fontFamily: FF,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{authError}</span>
            </div>
          )}
          <div>
            <Label htmlFor="email" style={CREATE_LABEL_STYLE}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (authError) setAuthError(null); }}
              required
              placeholder="you@example.com"
              className="h-12 rounded-xl bg-card border-border text-[15px]"
              style={{
                ...fieldStyle,
                ...(authError && mode === "signin" ? { border: "1.5px solid #e5484d" } : {}),
              }}
            />
          </div>
          <div>
            <Label htmlFor="password" style={CREATE_LABEL_STYLE}>
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (authError) setAuthError(null); }}
                required
                minLength={8}
                placeholder={mode === "signup" ? "Min 8 chars, with a number & symbol" : "Enter your password"}
                className="h-12 rounded-xl bg-card border-border text-[15px] pr-12"
                style={{
                  ...fieldStyle,
                  ...(authError && mode === "signin" ? { border: "1.5px solid #e5484d" } : {}),
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground active:scale-95 transition-transform"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          </div>

          {mode === "signin" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setKeepSignedIn((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "none", border: "none", padding: 0, cursor: "pointer",
                }}
                aria-pressed={keepSignedIn}
              >
                <span
                  style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: keepSignedIn ? "#423324" : "transparent",
                    border: keepSignedIn ? "none" : "1.5px solid rgba(26,26,26,0.30)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {keepSignedIn && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </span>
                <span style={{ fontFamily: FF, fontSize: 14, color: "#2B2420" }}>Keep me signed in</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("forgot")}
                style={{
                  fontFamily: FF, color: "#715a3d", fontSize: 14, fontWeight: 500,
                  textDecoration: "underline", textUnderlineOffset: 3,
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 font-medium rounded-full mt-6"
            style={{ background: "#423324", color: "#FFFFFF", fontSize: 16 }}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : mode === "signup"
              ? "Create Account"
              : "Log in"}
          </Button>
        </form>

        {/* OR divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "22px 0 16px" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(26,26,26,0.12)" }} />
          <span style={{ fontFamily: FF, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#6B6A5E" }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "rgba(26,26,26,0.12)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={oauthLoading !== null}
            style={{
              height: 48, borderRadius: 9999, background: "transparent",
              border: "1.5px solid rgba(26,26,26,0.18)", color: "#1A1A1A",
              fontFamily: FF, fontSize: 16, fontWeight: 500,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              cursor: "pointer", opacity: oauthLoading ? 0.6 : 1,
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("apple")}
            disabled={oauthLoading !== null}
            style={{
              height: 48, borderRadius: 9999, background: "transparent",
              border: "1.5px solid rgba(26,26,26,0.18)", color: "#1A1A1A",
              fontFamily: FF, fontSize: 16, fontWeight: 500,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              cursor: "pointer", opacity: oauthLoading ? 0.6 : 1,
            }}
          >
            <AppleIcon />
            Continue with Apple
          </button>
        </div>

        <p className="text-center text-sm mt-6" style={{ fontFamily: FF, color: "#2b2420" }}>
          {mode === "signup" ? "Already have an account?" : "Don't have an account yet?"}{" "}
          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="font-medium"
            style={{ fontFamily: FF, color: "#715a3d" }}
          >
            {mode === "signup" ? "Log in" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
};


export default Welcome;
