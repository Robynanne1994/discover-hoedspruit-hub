import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, ArrowRight } from "lucide-react";

const Welcome = () => {
  const [mode, setMode] = useState<"welcome" | "signin" | "signup">("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await signUp(email, password, displayName || undefined);
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
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="text-primary" style={{ width: 28, height: 28 }} />
          </div>
          <h1
            className="text-center font-heading font-bold text-foreground"
            style={{ fontSize: 36, lineHeight: 1.1, letterSpacing: "-0.5px" }}
          >
            Hello{" "}
            <span className="text-primary">Hoedspruit</span>
          </h1>
          <p
            className="text-center text-muted-foreground mt-3 max-w-[280px]"
            style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.5 }}
          >
            Discover local cafés, great meals and favourite places to eat.
          </p>
        </div>

        {/* Bottom action area */}
        <div className="px-6 pb-12 space-y-3">
          <Button
            onClick={() => setMode("signup")}
            className="w-full h-12 text-[15px] font-semibold rounded-xl"
          >
            Create Account
            <ArrowRight className="ml-2" style={{ width: 18, height: 18 }} />
          </Button>
          <button
            onClick={() => setMode("signin")}
            className="w-full h-12 text-[15px] font-medium rounded-xl border border-border bg-card text-foreground active:scale-[0.98] transition-transform"
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
          className="text-muted-foreground text-sm font-medium"
        >
          ← Back
        </button>
      </div>

      <div className="flex-1 px-6 pb-12">
        <h1
          className="font-heading font-bold text-foreground mb-1"
          style={{ fontSize: 28, letterSpacing: "-0.3px" }}
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
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-xs font-medium text-muted-foreground">
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
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
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
            <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Min 6 characters"
              className="h-12 rounded-xl bg-card border-border text-[15px]"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-[15px] font-semibold rounded-xl mt-2"
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
