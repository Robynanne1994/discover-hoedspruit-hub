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

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const LABEL_STYLE: React.CSSProperties = {
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

// "checking"  – waiting for Supabase to turn the emailed link into a session
// "ready"     – recovery session in place, show the new-password form
// "invalid"   – the link was expired/used/bad, offer to send a fresh one
// "resent"    – a fresh link has been emailed from this page
type LinkStatus = "checking" | "ready" | "invalid" | "resent";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<LinkStatus>("checking");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Supabase reports an expired or already-used link as error params in the
    // URL hash instead of a token, e.g. #error=access_denied&error_code=otp_expired.
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (hashParams.get("error")) {
      setStatus("invalid");
      return;
    }

    // A valid link signs the user in with a recovery session. The client
    // processes the URL token itself, so wait for the session to appear —
    // either it is already there, or an auth event delivers it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setStatus((s) => (s === "resent" ? s : "ready"));
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStatus((s) => (s === "resent" ? s : "ready"));
    });
    const timeout = window.setTimeout(() => {
      setStatus((s) => (s === "checking" ? "invalid" : s));
    }, 4000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

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
      setError(
        /different from the old password/i.test(updateError.message)
          ? "Your new password must be different from your old password."
          : updateError.message || "Could not update your password. Please try again."
      );
      return;
    }
    toast.success("Password updated. You're signed in.");
    navigate("/", { replace: true });
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = resendEmail.trim();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    setSending(true);
    const { error: sendError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSending(false);
    if (sendError) {
      toast.error(
        /rate|seconds|too many/i.test(sendError.message)
          ? "Please wait a moment before requesting another link."
          : sendError.message || "Could not send the reset link. Please try again."
      );
      return;
    }
    setStatus("resent");
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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f5f0e8", fontFamily: FF }}>
      <Seo
        title="Reset Password — Hello Hoedspruit"
        description="Choose a new password for your Hello Hoedspruit account."
        path="/reset-password"
        noIndex
      />
      <PageHeader title="Reset Password" onBack={() => navigate("/")} />

      <div className="flex-1 px-6 pb-12 pt-6 flex flex-col">
        {status === "checking" && (
          <p style={{ fontFamily: FF, fontSize: 14, lineHeight: 1.55, color: "#6B6255", textAlign: "center", marginTop: 24 }}>
            Checking your reset link…
          </p>
        )}

        {status === "ready" && (
          <>
            <p style={{ fontFamily: FF, fontSize: 14, lineHeight: 1.55, color: "#6B6255", margin: "0 0 20px" }}>
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
                      style={{ background: "#ffffff", color: "#1A1A1A" }}
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
                      style={{ background: "#ffffff", color: "#1A1A1A" }}
                    />
                    {eyeButton(showConfirm, () => setShowConfirm((v) => !v))}
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 font-medium rounded-full mt-6"
                style={{ background: "#423324", color: "#FFFFFF", fontSize: 16 }}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save New Password"}
              </Button>
            </form>
          </>
        )}

        {status === "invalid" && (
          <>
            <p style={{ fontFamily: FF, fontSize: 14, lineHeight: 1.55, color: "#6B6255", margin: "0 0 20px" }}>
              This password reset link is invalid or has expired. Enter your email below
              and we'll send you a fresh one.
            </p>
            <form onSubmit={handleResend} className="flex flex-col">
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
                  placeholder="you@example.com"
                  className="h-12 rounded-xl bg-card border-border text-[15px]"
                  style={{ background: "#ffffff", color: "#1A1A1A" }}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 font-medium rounded-full mt-6"
                style={{ background: "#423324", color: "#FFFFFF", fontSize: 16 }}
                disabled={sending}
              >
                {sending ? "Sending..." : "Email Me a New Link"}
              </Button>
            </form>
          </>
        )}

        {status === "resent" && (
          <>
            <p style={{ fontFamily: FF, fontSize: 14, lineHeight: 1.55, color: "#6B6255", margin: "0 0 20px" }}>
              If an account exists for{" "}
              <span style={{ color: "#1A1A1A", fontWeight: 600 }}>{resendEmail.trim()}</span>
              , we've sent it a new password reset link. Open the link to choose a new
              password — and check your spam folder if it doesn't arrive within a few minutes.
            </p>
            <Button
              onClick={() => navigate("/welcome", { state: { mode: "signin" } })}
              className="w-full h-12 font-medium rounded-full"
              style={{ background: "#423324", color: "#FFFFFF", fontSize: 16 }}
            >
              Back to Log In
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
