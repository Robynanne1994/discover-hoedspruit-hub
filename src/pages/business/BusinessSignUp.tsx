import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BusinessShell from "@/components/business/BusinessShell";
import { Button, Input, Label, FieldError, Body, H2, Small } from "@/components/business/ui";
import { toast } from "sonner";
import { useBusinessOwner } from "@/hooks/useBusinessOwner";

const BusinessSignUp = () => {
  const navigate = useNavigate();
  const { user, authLoading, isOwner, loading } = useBusinessOwner();
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!authLoading && !loading && user && isOwner) {
    return <Navigate to="/business/dashboard" replace />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);

    // 1. Sign up
    const { data: signUpData, error: signErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/business/dashboard",
        data: { display_name: contactName || businessName },
      },
    });
    if (signErr) {
      setErr(signErr.message);
      setBusy(false);
      return;
    }

    // 2. Sign in if not auto-signed
    let session = signUpData.session;
    if (!session) {
      const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
      if (loginErr) {
        toast.success("Account created. Please confirm your email then sign in.");
        navigate("/business/sign-in");
        setBusy(false);
        return;
      }
      session = loginData.session;
    }
    const userId = session?.user?.id;
    if (!userId) {
      setBusy(false);
      return;
    }

    // 3. Assign business_owner role + create business_accounts row
    const [{ error: roleErr }, { error: accErr }] = await Promise.all([
      supabase.rpc("claim_business_owner_role" as any),
      supabase.from("business_accounts").insert({
        user_id: userId,
        business_name: businessName || null,
        contact_name: contactName || null,
        contact_phone: phone || null,
        contact_email: email,
      }),
    ]);
    if (roleErr) {
      setErr(roleErr.message);
      setBusy(false);
      return;
    }
    if (accErr && !/duplicate/i.test(accErr.message)) {
      setErr(accErr.message);
      setBusy(false);
      return;
    }

    setBusy(false);
    toast.success("Account created");
    navigate("/business/subscribe");
  };

  return (
    <BusinessShell title="Create business account" back="/business/sign-in">
      <div style={{ marginTop: 12, marginBottom: 36 }}>
        <H2>List your business</H2>
        <Body soft style={{ marginTop: 8 }}>Set up an account to claim a listing and post specials and events.</Body>
      </div>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <Label htmlFor="bn">Business name</Label>
          <Input id="bn" value={businessName} required onChange={(e) => setBusinessName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="cn">Your name</Label>
          <Input id="cn" value={contactName} required onChange={(e) => setContactName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="em">Email</Label>
          <Input id="em" type="email" value={email} required onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="ph">Phone</Label>
          <Input id="ph" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="pw">Password</Label>
          <Input id="pw" type="password" value={password} required minLength={6} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <FieldError>{err}</FieldError>
        <Button type="submit" full disabled={busy}>{busy ? "Creating..." : "Create account"}</Button>
        <Small soft style={{ textAlign: "center" }}>
          Already have an account? <Link to="/business/sign-in" style={{ color: "#020202", textDecoration: "underline" }}>Sign in</Link>
        </Small>
      </form>
    </BusinessShell>
  );
};

export default BusinessSignUp;
