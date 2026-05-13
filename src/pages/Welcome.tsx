import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import hhLogo from "@/assets/hh-logo.png";

type Role = "user" | "business";

const Welcome = () => {
  const [mode, setMode] = useState<"welcome" | "signin" | "signup">("welcome");
  const [role, setRole] = useState<Role>("user");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      if (!firstName.trim()) {
        toast.error("Please enter your first name");
        setLoading(false);
        return;
      }
      if (!username.trim()) {
        toast.error("Please choose a username");
        setLoading(false);
        return;
      }
      // Check username availability (case-insensitive)
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: existing, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", username.trim())
        .maybeSingle();
      if (checkError) {
        toast.error(checkError.message);
        setLoading(false);
        return;
      }
      if (existing) {
        toast.error("That username is already taken. Please try a different one.");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, username.trim(), firstName);
      if (error) {
        if (/duplicate|unique/i.test(error.message)) {
          toast.error("That username is already taken. Please try a different one.");
        } else {
          toast.error(error.message);
        }
      } else {
        // Persist username on profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").update({ username: username.trim() }).eq("id", user.id);
        }
        toast.success("Account created! You're in.");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) toast.error(error.message);
    }
    setLoading(false);
  };

  if (mode === "welcome") {
    const handlePrimary = () => {
      if (role === "business") {
        navigate("/business/sign-up");
      } else {
        setMode("signup");
      }
    };
    const handleLogin = () => {
      if (role === "business") {
        navigate("/business/sign-in");
      } else {
        setMode("signin");
      }
    };

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#5C6446", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
        {/* Logo block */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-6">
          <img src={hhLogo} alt="Hello Hoedspruit" style={{ width: 240, height: "auto" }} />
        </div>

        {/* Bottom action area */}
        <div className="px-5 pb-10">
          <h1
            style={{
              color: "#ffffff",
              fontSize: 26,
              lineHeight: 1.15,
              fontWeight: 400,
              textTransform: "uppercase",
              letterSpacing: "0.01em",
              marginBottom: 22,
            }}
          >
            Your local guide
            <br />
            to Hoedspruit
          </h1>

          {/* Role pill toggle */}
          <div
            style={{
              display: "flex",
              padding: 4,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.45)",
              background: "rgba(0,0,0,0.18)",
              marginBottom: 14,
            }}
          >
            {(["user", "business"] as Role[]).map((r) => {
              const active = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 999,
                    background: active ? "#f5f0e8" : "transparent",
                    color: active ? "#020202" : "#ffffff",
                    fontSize: 14,
                    fontWeight: active ? 500 : 400,
                    letterSpacing: "0.01em",
                    transition: "all 150ms ease",
                  }}
                >
                  {r === "user" ? "I'm a user" : "I'm a business"}
                </button>
              );
            })}
          </div>

          <Button
            onClick={handlePrimary}
            className="w-full"
            style={{
              height: 52,
              borderRadius: 16,
              background: "#715a3d",
              color: "#ffffff",
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            Create account
          </Button>

          <p style={{ textAlign: "center", color: "#ffffff", fontSize: 14, marginTop: 18 }}>
            Already have an account?{" "}
            <button
              type="button"
              onClick={handleLogin}
              style={{
                color: "#ffffff",
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
    <div className="min-h-screen flex flex-col" style={{ background: "#5C6446" }}>
      <div className="px-6 pt-14 pb-4 relative z-10">
        <button
          type="button"
          onClick={() => setMode("welcome")}
          aria-label="Back"
          className="text-foreground active:scale-95 transition-transform p-2 -ml-2"
        >
          <ArrowLeft style={{ width: 24, height: 24, color: "#0A0A0A" }} />
        </button>
      </div>

      <div className="flex-1 px-6 pb-12 flex flex-col justify-center">
        <h1
          className="font-heading font-bold text-foreground mb-1"
          style={{ fontSize: 28, letterSpacing: "0.01em" }}
        >
          {mode === "signup" ? "Create Account" : "Welcome Back"}
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          {mode === "signup"
            ? "Join the Hello Hoedspruit community"
            : "Sign in to your account"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-medium" style={{ color: "#0A0A0A" }}>
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
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-medium" style={{ color: "#0A0A0A" }}>
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
                />
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium" style={{ color: "#0A0A0A" }}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="h-12 rounded-xl bg-card border-border text-[15px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium" style={{ color: "#0A0A0A" }}>
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min 6 characters"
                className="h-12 rounded-xl bg-card border-border text-[15px] pr-12"
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
            className="w-full h-12 font-semibold rounded-xl mt-2"
            style={{ background: "#655444", color: "#ffffff", fontSize: 16 }}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : mode === "signup"
              ? "Create Account"
              : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-primary font-medium"
          >
            {mode === "signup" ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Welcome;
