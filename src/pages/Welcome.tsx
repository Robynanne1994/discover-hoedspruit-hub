import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import hhLogo from "@/assets/hh-logo.png";

const Welcome = () => {
  const [mode, setMode] = useState<"welcome" | "signin" | "signup">("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [displayName, setDisplayName] = useState("");
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
      const { error } = await signUp(email, password, displayName || firstName, firstName);
      if (error) toast.error(error.message);
      else toast.success("Account created! You're in.");
    } else {
      const { error } = await signIn(email, password);
      if (error) toast.error(error.message);
    }
    setLoading(false);
  };

  if (mode === "welcome") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "hsl(38, 30%, 96%)" }}>
        {/* Top section with branding */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
          <img src={hhLogo} alt="Hello Hoedspruit" style={{ width: 260, height: "auto" }} />
        </div>

        {/* Bottom action area */}
        <div className="px-6 pb-12 space-y-3">
          <Button
            onClick={() => setMode("signup")}
            className="w-full h-12 rounded-xl"
            style={{ background: "#655444", color: "#ffffff", fontSize: 16, fontWeight: 600 }}
          >
            Create Account
            <ArrowRight className="ml-2" style={{ width: 18, height: 18 }} />
          </Button>
          <button
            onClick={() => setMode("signin")}
            className="w-full h-12 rounded-xl border border-border bg-card text-foreground active:scale-[0.98] transition-transform"
            style={{ fontSize: 16, fontWeight: 600 }}
          >
            I already have an account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(38, 30%, 96%)" }}>
      <div className="px-6 pt-14 pb-4">
        <button
          onClick={() => setMode("welcome")}
          aria-label="Back"
          className="text-foreground active:scale-95 transition-transform"
        >
          <ArrowLeft style={{ width: 24, height: 24, color: "#0A0A0A" }} />
        </button>
      </div>

      <div className="flex-1 px-6 pb-12">
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
                <Label htmlFor="displayName" className="text-xs font-medium" style={{ color: "#0A0A0A" }}>
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should we call you?"
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
