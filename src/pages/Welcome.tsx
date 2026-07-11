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
import { ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react";
import hhLogo from "@/assets/hh-logo.png";
import Seo from "@/components/Seo";
import PageHeader from "@/components/PageHeader";
import { validatePassword, PASSWORD_REQUIREMENTS_TEXT } from "@/lib/passwordPolicy";



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
  color: "#0A0A0A",
  display: "block",
  marginBottom: 4,
};

const Welcome = () => {
  const location = useLocation() as { state?: { mode?: "signin" | "signup" } };
  const initialMode = location.state?.mode ?? "welcome";
  const [mode, setMode] = useState<"welcome" | "signin" | "signup">(initialMode);
  const navigate = useNavigate();
  const { enterGuest } = useGuestAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [residency, setResidency] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();

  const RESIDENCY_OPTIONS = [
    { label: "Local", value: "I live in Hoedspruit" },
    { label: "Visitor", value: "I am a visitor in Hoedspruit" },
  ];


  useEffect(() => {
    if (location.state?.mode) setMode(location.state.mode);
  }, [location.state?.mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    if (mode === "signup") {
      if (!firstName.trim()) {
        toast.error("Please enter your first name");
        setLoading(false);
        return;
      }
      if (!lastName.trim()) {
        toast.error("Please enter your surname");
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
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
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

  if (mode === "welcome") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#f5f0e8", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
        <Seo
          title="Welcome to Hello Hoedspruit"
          description="Sign in or create a free account to save your favourite places, events and specials around Hoedspruit."
          path="/welcome"
        />
        {/* Logo block */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-6">
          <img src={hhLogo} alt="Hello Hoedspruit" style={{ width: 220, height: "auto" }} />
        </div>

        {/* Bottom action area */}
        <div className="px-5 pb-10">
          <h1
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              color: "#020202",
              fontSize: 26,
              lineHeight: 1.15,
              fontWeight: 550,
              textTransform: "uppercase",
              letterSpacing: "0.01em",
              marginBottom: 22,
            }}
          >
            Your lowveld local
          </h1>

          <Button
            onClick={() => setMode("signup")}
            className="w-full"
            style={{
              height: 52,
              borderRadius: 9999,
              background: "#423324",
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            Create Account
          </Button>

          <Button
            onClick={() => {
              enterGuest();
              navigate("/");
            }}
            variant="outline"
            className="w-full mt-3"
            style={{
              height: 52,
              borderRadius: 16,
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
              }}
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f5f0e8" }}>
      <PageHeader
        title={mode === "signup" ? "Create Account" : "Welcome Back"}
        onBack={() => setMode("welcome")}
      />

      <div className={`flex-1 px-6 pb-12 flex flex-col ${mode === "signup" ? "pt-4" : "pt-6"}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <Label htmlFor="firstName" style={CREATE_LABEL_STYLE}>
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Your first name"
                  className="h-12 rounded-xl bg-card border-border text-[15px]"
                  style={{ background: "#ffffff", color: "#020202" }}
                />
              </div>
              <div>
                <Label htmlFor="lastName" style={CREATE_LABEL_STYLE}>
                  Surname
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Your surname"
                  className="h-12 rounded-xl bg-card border-border text-[15px]"
                  style={{ background: "#ffffff", color: "#020202" }}
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
                  style={{ background: "#ffffff", color: "#020202" }}
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
                      style={{ color: residency ? "#020202" : "#8A8480" }}
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
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{authError}</span>
            </div>
          )}
          <div className={mode === "signup" ? "" : "space-y-1.5"}>
            <Label htmlFor="email" style={mode === "signup" ? CREATE_LABEL_STYLE : SIGNIN_LABEL_STYLE}>
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
                background: "#ffffff",
                color: "#020202",
                ...(authError && mode === "signin" ? { border: "1.5px solid #e5484d" } : {}),
              }}
            />
          </div>
          <div className={mode === "signup" ? "" : "space-y-1.5"}>
            <Label htmlFor="password" style={mode === "signup" ? CREATE_LABEL_STYLE : SIGNIN_LABEL_STYLE}>
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
                placeholder="Min 8 chars, with a number & symbol"
                className="h-12 rounded-xl bg-card border-border text-[15px] pr-12"
                style={{
                  background: "#ffffff",
                  color: "#020202",
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

          <Button
            type="submit"
            className="w-full h-12 font-semibold rounded-full mt-2"
            style={{ background: "#423324", color: "#FFFFFF", fontSize: 16 }}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : mode === "signup"
              ? "Create Account"
              : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm mt-6" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: "#2b2420" }}>
          {mode === "signup" ? "Already have an account?" : "Don't have an account yet?"}{" "}
          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="font-medium"
            style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: "#715a3d" }}
          >
            {mode === "signup" ? "Sign in" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Welcome;
