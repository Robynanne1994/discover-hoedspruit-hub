import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import Seo from "@/components/Seo";
import { validatePassword, PASSWORD_REQUIREMENTS_TEXT } from "@/lib/passwordPolicy";
import { useResendCooldown } from "@/hooks/useResendCooldown";
import { MUTED as TOKEN_MUTED } from "@/lib/type";
import {
  RESET_LINK_TTL_MINUTES,
  clearRecoveryParams,
  endRecoverySession,
  forgetRecoveryLink,
  formatCountdown,
  isResetLinkExpired,
  readRecoveryLink,
  redeemRecoveryLink,
  resetLinkRemainingMs,
  sendPasswordResetEmail,
} from "@/lib/passwordReset";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const CREAM = "#E6E0CC";
const INK = "#1A1A1A";
const MUTED = TOKEN_MUTED;
const BROWN = "#423324";
const LINK = "#715a3d";

/**
 * How long to wait for the Supabase client to turn the tokens in the URL into a
 * session before giving up on the link. Generous on purpose: a slow connection
 * must never be mistaken for a bad link. Success arrives via an auth event, so
 * this only ever elapses on genuine failure.
 */
const REDEEM_GRACE_MS = 20000;

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontWeight: 700,
  fontSize: 14,
  lineHeight: "16.8px",
  letterSpacing: 0,
  textTransform: "none",
  color: INK,
  display: "block",
  marginBottom: 4,
};

const COPY_STYLE: React.CSSProperties = {
  fontFamily: FF,
  fontSize: 14,
  lineHeight: 1.55,
  color: MUTED,
  margin: "0 0 20px",
};

const PRIMARY_BTN_STYLE: React.CSSProperties = {
  background: BROWN,
  color: "#FFFFFF",
  fontSize: 16,
};

// "checking" – redeeming the emailed link
// "ready"    – link accepted, show the new-password form
// "expired"  – the link was expired, already used or bad: offer a fresh one
// "request"  – opened without a link: ask which account to email
// "sent"     – a fresh link has been emailed from this screen
type Status = "checking" | "ready" | "expired" | "request" | "sent";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("checking");
  const [issuedAt, setIssuedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [sending, setSending] = useState(false);
  const cooldown = useResendCooldown();

  // Redeem whatever the emailed link arrived with.
  useEffect(() => {
    const { link, issuedAt: issued } = readRecoveryLink();
    setIssuedAt(issued);
    // Take the tokens out of the address bar so they aren't shared or re-used
    // when the page is refreshed. `readRecoveryLink()` remembers them for us.
    clearRecoveryParams();

    if (link.kind === "none") {
      setStatus("request");
      return;
    }
    if (link.kind === "expired") {
      setStatus("expired");
      return;
    }
    // Our own 15-minute window. Supabase may still accept the token, so end any
    // session it granted rather than leaving the visitor signed in on a link
    // that is, as far as this app is concerned, too old to trust.
    if (isResetLinkExpired(issued)) {
      void endRecoverySession();
      setStatus("expired");
      return;
    }

    let cancelled = false;
    let timeout: number | undefined;
    const markReady = () =>
      !cancelled && setStatus((s) => (s === "checking" ? "ready" : s));

    // A valid link signs the user in with a recovery session. Listen first, so
    // the session can't land between the redeem call and the check below.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) markReady();
    });

    void (async () => {
      const redeemError = await redeemRecoveryLink(link);
      if (cancelled) return;
      if (redeemError) {
        setStatus("expired");
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        markReady();
        return;
      }
      // Implicit flow: the client is still exchanging the tokens from the hash.
      // Wait it out; the auth listener above resolves the happy path.
      timeout = window.setTimeout(async () => {
        const {
          data: { session: late },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        if (late) markReady();
        else setStatus((s) => (s === "checking" ? "expired" : s));
      }, REDEEM_GRACE_MS);
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, []);

  // Tick the countdown shown on the form.
  useEffect(() => {
    if (status !== "ready" || issuedAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [status, issuedAt]);

  const remainingMs = status === "ready" ? resetLinkRemainingMs(issuedAt, now) : null;

  // The window closed while the form was open.
  useEffect(() => {
    if (status !== "ready" || remainingMs !== 0) return;
    void endRecoverySession();
    setStatus("expired");
    toast.error("That reset link has expired. We can send you a new one.");
  }, [status, remainingMs]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const policyError = validatePassword(next);
    if (policyError) {
      setError(`${policyError} ${PASSWORD_REQUIREMENTS_TEXT}`);
      return;
    }
    if (next !== confirm) {
      setError("The passwords don't match. Please re-enter them.");
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (updateError) {
      if (/expired|invalid|session|jwt/i.test(updateError.message)) {
        void endRecoverySession();
        setStatus("expired");
        return;
      }
      setError(
        /different from the old password/i.test(updateError.message)
          ? "Your new password must be different from your old password."
          : updateError.message || "Could not update your password. Please try again."
      );
      return;
    }
    // The link is spent: don't let this page re-open the form for it.
    forgetRecoveryLink();
    toast.success("Password updated. You're signed in.");
    navigate("/", { replace: true });
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (sending || cooldown.waiting) return;
    setSending(true);
    const { error: sendError } = await sendPasswordResetEmail(resendEmail);
    setSending(false);
    if (sendError) {
      toast.error(sendError);
      return;
    }
    cooldown.start();
    setStatus("sent");
  };

  const eyeButton = (shown: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      aria-label={shown ? "Hide password" : "Show password"}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground active:scale-95 transition-transform"
    >
      {shown ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  const emailRequestForm = (
    <form onSubmit={handleSend} className="flex flex-col">
      <div>
        <Label htmlFor="resendEmail" style={LABEL_STYLE}>
          Email
        </Label>
        <Input
          id="resendEmail"
          type="email"
          value={resendEmail}
          onChange={(e) => setResendEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="h-12 rounded-xl bg-card border-border text-[15px]"
          style={{ background: "#ffffff", color: INK }}
        />
      </div>
      <Button
        type="submit"
        className="w-full h-12 font-medium rounded-full mt-6"
        style={PRIMARY_BTN_STYLE}
        disabled={sending || cooldown.waiting}
      >
        {sending
          ? "Sending..."
          : cooldown.waiting
          ? `Try again in ${cooldown.remaining}s`
          : "Email Me a Reset Link"}
      </Button>
    </form>
  );

  const backToLogin = (
    <p className="text-center text-sm mt-6" style={{ fontFamily: FF, color: "#2b2420" }}>
      Remembered it?{" "}
      <button
        type="button"
        onClick={() => navigate("/welcome", { state: { mode: "signin" } })}
        className="font-medium"
        style={{ fontFamily: FF, color: LINK }}
      >
        Log in
      </button>
    </p>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: CREAM, fontFamily: FF }}>
      <Seo
        title="Reset Password — Hello Hoedspruit"
        description="Choose a new password for your Hello Hoedspruit account."
        path="/reset-password"
        noIndex
      />
      <PageHeader title="Reset Password" onBack={() => navigate("/")} />

      <div className="flex-1 px-6 pb-12 pt-6 flex flex-col">
        {status === "checking" && (
          <p style={{ ...COPY_STYLE, textAlign: "center", marginTop: 24 }}>
            Checking your reset link…
          </p>
        )}

        {status === "ready" && (
          <>
            <p style={COPY_STYLE}>
              Choose a new password for your account. {PASSWORD_REQUIREMENTS_TEXT}
            </p>
            <form onSubmit={handleUpdatePassword} className="flex flex-col">
              <div className="space-y-4">
                {error && (
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
                    <span>{error}</span>
                  </div>
                )}
                <div>
                  <Label htmlFor="newPassword" style={LABEL_STYLE}>
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNext ? "text" : "password"}
                      value={next}
                      onChange={(e) => { setNext(e.target.value); if (error) setError(null); }}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Min 8 chars, with a number & symbol"
                      className="h-12 rounded-xl bg-card border-border text-[15px] pr-12"
                      style={{ background: "#ffffff", color: INK }}
                    />
                    {eyeButton(showNext, () => setShowNext((v) => !v))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword" style={LABEL_STYLE}>
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); if (error) setError(null); }}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Re-enter your new password"
                      className="h-12 rounded-xl bg-card border-border text-[15px] pr-12"
                      style={{ background: "#ffffff", color: INK }}
                    />
                    {eyeButton(showConfirm, () => setShowConfirm((v) => !v))}
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 font-medium rounded-full mt-6"
                style={PRIMARY_BTN_STYLE}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save New Password"}
              </Button>
            </form>
            {remainingMs !== null && (
              <p
                style={{
                  fontFamily: FF,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: MUTED,
                  textAlign: "center",
                  marginTop: 14,
                }}
              >
                This link expires in{" "}
                <span style={{ color: INK, fontWeight: 600 }}>{formatCountdown(remainingMs)}</span>
              </p>
            )}
          </>
        )}

        {status === "expired" && (
          <>
            <p style={COPY_STYLE}>
              This password reset link has expired or has already been used. Reset links
              last {RESET_LINK_TTL_MINUTES} minutes — enter your email below and we'll
              send you a fresh one.
            </p>
            {emailRequestForm}
            {backToLogin}
          </>
        )}

        {status === "request" && (
          <>
            <p style={COPY_STYLE}>
              Enter the email address for your account and we'll send you a secure link
              to choose a new password. The link works for {RESET_LINK_TTL_MINUTES} minutes.
            </p>
            {emailRequestForm}
            {backToLogin}
          </>
        )}

        {status === "sent" && (
          <>
            <p style={COPY_STYLE}>
              If an account exists for{" "}
              <span style={{ color: INK, fontWeight: 600 }}>{resendEmail.trim()}</span>, we've
              sent it a password reset link. Open it within{" "}
              {RESET_LINK_TTL_MINUTES} minutes to choose a new password — and check your
              spam folder if it doesn't arrive in a minute or two.
            </p>
            <Button
              onClick={() => navigate("/welcome", { state: { mode: "signin" } })}
              className="w-full h-12 font-medium rounded-full"
              style={PRIMARY_BTN_STYLE}
            >
              Back to Log In
            </Button>
            <p className="text-center text-sm mt-6" style={{ fontFamily: FF, color: "#2b2420" }}>
              Didn't get it?{" "}
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={sending || cooldown.waiting}
                className="font-medium"
                style={{
                  fontFamily: FF,
                  color: LINK,
                  opacity: sending || cooldown.waiting ? 0.6 : 1,
                }}
              >
                {sending
                  ? "Sending..."
                  : cooldown.waiting
                  ? `Resend in ${cooldown.remaining}s`
                  : "Resend link"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
