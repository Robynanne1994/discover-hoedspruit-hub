import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BusinessShell from "@/components/business/BusinessShell";
import { Button, Input, Label, FieldError, Body, H2, Small } from "@/components/business/ui";
import { toast } from "sonner";

const BusinessSignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    toast.success("Signed in");
    navigate("/business/dashboard");
  };

  return (
    <BusinessShell title="Business sign in" back="/my-account">
      <div style={{ marginTop: 12, marginBottom: 36 }}>
        <H2>Welcome back</H2>
        <Body soft style={{ marginTop: 8 }}>Sign in to manage your listing.</Body>
      </div>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} required onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} required minLength={6} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <FieldError>{err}</FieldError>
        <Button type="submit" full disabled={busy}>{busy ? "Signing in..." : "Sign in"}</Button>
        <Small soft style={{ textAlign: "center" }}>
          New here? <Link to="/business/sign-up" style={{ color: "#020202", textDecoration: "underline" }}>Create an account</Link>
        </Small>
      </form>
    </BusinessShell>
  );
};

export default BusinessSignIn;
