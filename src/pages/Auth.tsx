import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

type AccountType = "user" | "business";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("user");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "claim-prompt">("form");
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  if (user && step === "form") {
    navigate("/my-account");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isSignUp) {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) return toast.error(error.message);
      navigate("/my-account");
      return;
    }

    // Sign up
    const { error } = await signUp(email, password, displayName || businessName || undefined);
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }

    // For business, set up account row + role
    if (accountType === "business") {
      // Get session (auto-confirm is on for this project)
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        await Promise.all([
          supabase.rpc("claim_business_owner_role" as any),
          supabase.from("business_accounts").insert({
            user_id: userId,
            business_name: businessName || null,
            contact_name: displayName || null,
            contact_phone: phone || null,
            contact_email: email,
          }),
        ]);
        setLoading(false);
        toast.success("Business account created");
        setStep("claim-prompt");
        return;
      }
    }

    setLoading(false);
    toast.success("Account created");
    navigate("/my-account");
  };

  if (step === "claim-prompt") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 flex items-center justify-center px-6">
          <div className="w-full max-w-md text-center bg-card border border-border rounded-xl p-8 space-y-6">
            <h1 className="text-2xl font-bold">Claim your listing?</h1>
            <p className="text-muted-foreground">
              Already listed on Hello Hoedspruit? Claim your business now to post specials, events and edit your details.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/business/claim")} className="w-full">
                Yes, claim my listing
              </Button>
              <Button variant="outline" onClick={() => navigate("/business/dashboard")} className="w-full">
                Not yet — go to dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-sans text-3xl font-bold text-foreground">
              Hello <span className="text-primary">Hoedspruit</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              {isSignUp ? "Create your account" : "Welcome back"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
            {isSignUp && (
              <div>
                <Label className="mb-2 block">I'm signing up as a</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["user", "business"] as AccountType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAccountType(t)}
                      className={`border rounded-lg p-3 text-sm font-medium transition-colors ${
                        accountType === t
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {t === "user" ? "User" : "Business"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isSignUp && accountType === "business" && (
              <>
                <div>
                  <Label htmlFor="businessName">Business name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    maxLength={80}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </>
            )}

            {isSignUp && (
              <div>
                <Label htmlFor="displayName">{accountType === "business" ? "Your name (contact)" : "Name"}</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={accountType === "business" ? "Contact person" : "Your first name"}
                  required
                  maxLength={50}
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:underline font-medium"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
