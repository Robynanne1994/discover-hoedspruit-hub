import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Check, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBusinessOwner } from "@/hooks/useBusinessOwner";

const OLIVE = "#5C6446";
const CREAM = "#EEE8DA";
const SOFT_CREAM_FILL = "rgba(238, 232, 218, 0.92)";
const INK = "#2A2A24";
const MUTED = "#6B6A5E";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const BusinessSignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const intent = searchParams.get("intent");
  const postSignupPath = intent === "claim" ? "/business/claim" : "/business/subscribe";
  const { user, authLoading, isOwner, loading } = useBusinessOwner();

  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = "playfair-display-font";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;1,300;1,400&display=swap";
    document.head.appendChild(link);
  }, []);

  if (!authLoading && !loading && user && isOwner) {
    return <Navigate to="/business/dashboard" replace />;
  }

  const canSubmit =
    agreed &&
    businessName.trim() &&
    contactName.trim() &&
    email.trim() &&
    phone.trim() &&
    password.length >= 8 &&
    !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);

    const { data: signUpData, error: signErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/business/dashboard",
        data: { display_name: contactName || businessName },
      },
    });
    if (signErr) {
      toast.error(signErr.message);
      setBusy(false);
      return;
    }

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

    const fullPhone = `+27${phone.replace(/\s+/g, "")}`;
    const [{ error: roleErr }, { error: accErr }] = await Promise.all([
      supabase.rpc("claim_business_owner_role" as any),
      supabase.from("business_accounts").insert({
        user_id: userId,
        business_name: businessName || null,
        contact_name: contactName || null,
        contact_phone: fullPhone,
        contact_email: email,
      }),
    ]);
    if (roleErr) {
      toast.error(roleErr.message);
      setBusy(false);
      return;
    }
    if (accErr && !/duplicate/i.test(accErr.message)) {
      toast.error(accErr.message);
      setBusy(false);
      return;
    }

    setBusy(false);
    toast.success("Account created");
    navigate(postSignupPath);
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: SANS,
    fontSize: 10.5,
    fontWeight: 400,
    letterSpacing: "1.8px",
    textTransform: "uppercase",
    color: CREAM,
    opacity: 0.75,
    paddingLeft: 4,
    marginBottom: 8,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 52,
    borderRadius: 16,
    background: SOFT_CREAM_FILL,
    border: "none",
    outline: "none",
    padding: "0 20px",
    fontFamily: SANS,
    fontSize: 15,
    color: INK,
    boxSizing: "border-box",
  };

  const linkUnderline: React.CSSProperties = {
    color: CREAM,
    borderBottom: "1px solid rgba(238, 232, 218, 0.4)",
    paddingBottom: 1,
    textDecoration: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: OLIVE, paddingBottom: 48 }}>
      <style>{`
        .biz-su-input::placeholder { color: ${MUTED}; opacity: 1; }
      `}</style>

      {/* Top bar */}
      <div style={{ paddingTop: 32, paddingLeft: 24, paddingRight: 24 }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: CREAM,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={18} strokeWidth={1.6} color={INK} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ padding: "18px 24px 0" }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: "2.4px",
            textTransform: "uppercase",
            color: CREAM,
            opacity: 0.7,
            marginBottom: 14,
          }}
        >
          For Local Businesses
        </div>
        <h1
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 72,
            lineHeight: 0.92,
            letterSpacing: "-2.5px",
            color: CREAM,
            margin: 0,
          }}
        >
          list yours.
        </h1>
        <p
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 17,
            lineHeight: 1.4,
            color: CREAM,
            opacity: 0.75,
            maxWidth: 300,
            marginTop: 18,
            marginBottom: 32,
          }}
        >
          Claim your listing, post specials, and share what's on.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={submit} style={{ padding: "0 24px" }}>
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="bn" style={labelStyle}>Business Name</label>
          <input
            id="bn"
            className="biz-su-input"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Hat & Creek"
            style={inputStyle}
            required
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label htmlFor="cn" style={labelStyle}>Your Name</label>
          <input
            id="cn"
            className="biz-su-input"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="First and surname"
            style={inputStyle}
            required
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label htmlFor="em" style={labelStyle}>Email</label>
          <input
            id="em"
            type="email"
            className="biz-su-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourbusiness.co.za"
            style={inputStyle}
            required
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label htmlFor="ph" style={labelStyle}>Phone</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              aria-label="Country code"
              style={{
                width: 100,
                height: 52,
                borderRadius: 16,
                background: SOFT_CREAM_FILL,
                border: "none",
                padding: "0 38px 0 16px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: SANS,
                fontSize: 15,
                color: INK,
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <span style={{ fontSize: 18 }}>🇿🇦</span>
              <span>+27</span>
              <ChevronDown
                size={14}
                color={MUTED}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}
              />
            </button>
            <input
              id="ph"
              type="tel"
              className="biz-su-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="063 241 0296"
              style={{ ...inputStyle, flex: 1, width: "auto" }}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: 6 }}>
          <label htmlFor="pw" style={labelStyle}>Password</label>
          <div style={{ position: "relative" }}>
            <input
              id="pw"
              type={showPw ? "text" : "password"}
              className="biz-su-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              style={{ ...inputStyle, paddingRight: 52 }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: 18,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                opacity: 0.7,
                display: "flex",
              }}
            >
              {showPw ? (
                <EyeOff size={16} strokeWidth={1.6} color={MUTED} />
              ) : (
                <Eye size={16} strokeWidth={1.6} color={MUTED} />
              )}
            </button>
          </div>
          <p
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 12.5,
              color: CREAM,
              opacity: 0.6,
              paddingLeft: 4,
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            A mix of letters, numbers, and symbols keeps it safest.
          </p>
        </div>

        {/* Terms checkbox */}
        <label
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            marginTop: 6,
            marginBottom: 24,
            cursor: "pointer",
          }}
        >
          <span
            onClick={(e) => {
              e.preventDefault();
              setAgreed((v) => !v);
            }}
            style={{
              flexShrink: 0,
              width: 20,
              height: 20,
              borderRadius: 6,
              border: "1.5px solid rgba(238, 232, 218, 0.45)",
              background: agreed ? INK : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 1,
            }}
          >
            {agreed && <Check size={12} strokeWidth={2.5} color={CREAM} />}
          </span>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
          />
          <span
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 13,
              lineHeight: 1.5,
              color: CREAM,
              opacity: 0.75,
            }}
          >
            I agree to the{" "}
            <Link to="/legal/terms" style={{ ...linkUnderline, opacity: 1 }} onClick={(e) => e.stopPropagation()}>
              terms of use
            </Link>{" "}
            and{" "}
            <Link to="/legal/privacy" style={{ ...linkUnderline, opacity: 1 }} onClick={(e) => e.stopPropagation()}>
              privacy policy
            </Link>
            , and confirm I'm authorised to list this business.
          </span>
        </label>

        {/* Create Account button */}
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            width: "100%",
            height: 54,
            borderRadius: 999,
            background: INK,
            color: CREAM,
            border: "none",
            fontFamily: SANS,
            fontSize: 15,
            fontWeight: 400,
            letterSpacing: "0.1px",
            cursor: canSubmit ? "pointer" : "not-allowed",
            opacity: canSubmit ? 1 : 0.4,
            marginBottom: 18,
          }}
        >
          {busy ? "Creating..." : "Create Account"}
        </button>

        {/* Sign in link */}
        <div
          style={{
            textAlign: "center",
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 14.5,
            color: CREAM,
            opacity: 0.7,
          }}
        >
          Already have an account?
          <Link
            to="/business/sign-in"
            style={{
              color: CREAM,
              opacity: 1,
              marginLeft: 4,
              borderBottom: "1px solid rgba(238, 232, 218, 0.5)",
              paddingBottom: 1,
              textDecoration: "none",
            }}
          >
            Sign in.
          </Link>
        </div>
      </form>
    </div>
  );
};

export default BusinessSignUp;
