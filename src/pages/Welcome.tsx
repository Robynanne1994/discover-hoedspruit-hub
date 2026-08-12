import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGuestAuth } from "@/hooks/useGuestAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react";
import hhLogo from "@/assets/hh-logo.png";
import Seo from "@/components/Seo";
import PageHeader from "@/components/PageHeader";
import { lovable } from "@/integrations/lovable/index";
import { validatePassword, PASSWORD_REQUIREMENTS_TEXT } from "@/lib/passwordPolicy";
import { sanitiseUsername, validateUsername, USERNAME_MAX, USERNAME_HINT } from "@/lib/username";

import { RESET_LINK_TTL_MINUTES, sendPasswordResetEmail } from "@/lib/passwordReset";
import { explainSignInFailure, NO_ACCOUNT_HINT, type SignInFailure } from "@/lib/signIn";
import { useResendCooldown } from "@/hooks/useResendCooldown";
import VerificationCodeInput from "@/components/auth/VerificationCodeInput";
import {
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_CODE_TTL_MINUTES,
  isCompleteCode,
  resendSignupCode,
  verifySignupCode,
} from "@/lib/emailVerification";
import { friendlyOAuthError } from "@/lib/authProviders";
import { MUTED, type } from "@/lib/type";
import { MUTED as TOKEN_MUTED } from "@/lib/type";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.2 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.77 24c0-1.6.28-3.14.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const AppleIcon = () => (
  <svg width="17" height="20" viewBox="0 0 384 512" fill="#1A1A1A" aria-hidden="true">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);




const SIGNIN_LABEL_STYLE: React.CSSProperties = {
  ...type.meta,
  textTransform: "none",
  display: "block",
  marginBottom: 6,
};

const CREATE_LABEL_STYLE: React.CSSProperties = {
  ...type.eyebrow,
  textTransform: "none",
  color: "#1A1A1A",
  display: "block",
  marginBottom: 4,
};

// Capitalise the first letter of each word as the user types, so "john smith"
// becomes "John Smith" without fighting the caret.
const capitaliseName = (value: string) =>
  value.replace(/(^|[\s'-])([a-z])/g, (_m, sep, ch) => sep + ch.toUpperCase());



const Welcome = () => {
  const location = useLocation() as { state?: { mode?: "signin" | "signup"; from?: string } };
  const initialMode = location.state?.mode ?? "welcome";
  const [mode, setMode] = useState<
    "welcome" | "signin" | "signup" | "forgot" | "forgotSent" | "verify"
  >(initialMode);
  const navigate = useNavigate();
  const { enterGuest } = useGuestAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  // Debounced live availability check so the user finds out before submitting.
  useEffect(() => {
    const handle = sanitiseUsername(username);
    if (validateUsername(handle)) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc(
        "is_username_available" as any,
        { _username: handle } as any
      );
      if (cancelled) return;
      if (error) setUsernameStatus("idle");
      else setUsernameStatus(data ? "available" : "taken");
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [username]);

  const [residency, setResidency] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<SignInFailure | null>(null);
  // The one signup failure worth keeping on screen rather than in a toast: the
  // address already has an account, and the two things worth doing about it are
  // both one tap away.
  const [signupError, setSignupError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const { signIn, signUp } = useAuth();
  // Supabase rate-limits auth emails, so the resend link counts down instead of
  // failing the request.
  const resetCooldown = useResendCooldown();
  const verifyCooldown = useResendCooldown();

  // "Check your email" step. The account already exists at this point; it just
  // has no session until the emailed code comes back.
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  // Why we're asking: a brand-new signup, or a log in that Supabase refused
  // because the address was never confirmed.
  const [verifyReason, setVerifyReason] = useState<"signup" | "signin">("signup");

  /**
   * Sign in with Google or Apple.
   *
   * The provider has already proved the address, so there is no code to enter —
   * but a provider hands us an email and very little else. Anything still
   * missing (username, residency, name) is collected by /complete-profile,
   * which App.tsx routes to on the way in; without that the account would exist
   * with nothing on it but an email address.
   *
   * An address that already belongs to an email-and-password account is
   * refused by Supabase rather than quietly taken over. `friendlyOAuthError`
   * turns that into the two things worth doing about it.
   */
  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if ((result as any).error) {
        toast.error(friendlyOAuthError((result as any).error.message, provider), {
          duration: 8000,
        });
        setOauthLoading(null);
        return;
      }
      // Redirected away to the provider: this page is going away, and the app
      // picks up again when it comes back.
      if ((result as any).redirected) return;
      localStorage.setItem("hh-keep-signed-in", "1");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(friendlyOAuthError(err?.message, provider), { duration: 8000 });
    }
    setOauthLoading(null);
  };


  const RESIDENCY_OPTIONS = [
    { label: "Local", value: "I live in Hoedspruit" },
    { label: "Visitor", value: "I am a visitor in Hoedspruit" },
  ];


  useEffect(() => {
    if (location.state?.mode) setMode(location.state.mode);
  }, [location.state?.mode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("deleted") === "1") {
      toast.error(
        "Something went wrong with your account. Please continue as a guest or create another account. Feel free to reach out to us at hello@hellohoedspruit.co.",
        { duration: 10000 },
      );
      // clean the query string so the toast doesn't re-fire
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSignupError(null);
    setLoading(true);
    if (mode === "signup") {
      if (!firstName || !lastName) {
        toast.error("Please enter both your first and last name");
        setLoading(false);
        return;
      }
      const usernameError = validateUsername(username);
      if (usernameError) {
        toast.error(usernameError);
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
      const trimmedUsername = sanitiseUsername(username);
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
      const displayName = `${firstName} ${lastName}`;
      // The username and residency travel as signup metadata: the account is
      // created unconfirmed, so there is no session yet and nothing the client
      // could write to `profiles`. handle_new_user() builds the profile row
      // from them, and the username is only claimed once the address is
      // confirmed — see apply_signup_metadata().
      const { error, needsVerification } = await signUp(email, password, {
        displayName,
        firstName,
        surname: lastName,
        username: trimmedUsername,
        location: residency,
      });
      if (error) {
        const code = (error as Error & { code?: string }).code;
        if (code === "email_in_use") {
          // The mirror image of the "no account for this email" message on the
          // log-in side: this address is taken, so point them at logging in.
          setSignupError(error.message);
        } else if (/duplicate|unique/i.test(error.message)) {
          toast.error("That username is already taken. Please choose a different one.");
        } else {
          toast.error(error.message);
        }
      } else if (needsVerification) {
        // The account exists but isn't usable until the emailed code is typed
        // back in — that's what proves the address is really theirs.
        localStorage.setItem("hh-keep-signed-in", "1");
        verifyCooldown.start();
        openVerifyStep("signup");
        setLoading(false);
        return;
      }
    } else {
      localStorage.setItem("hh-keep-signed-in", keepSignedIn ? "1" : "0");
      const { error } = await signIn(email, password);

      if (error) {
        // Supabase gives the same error for a wrong password and an email with
        // no account behind it, so this asks the server which one it was before
        // deciding what to say. See src/lib/signIn.ts.
        const failure = await explainSignInFailure(error.message, email);
        // An account made before verification existed still has an unconfirmed
        // address. Send it a code rather than dead-ending on an error the
        // person can do nothing about.
        if (failure.kind === "unconfirmed") {
          const { error: sendErr } = await resendSignupCode(email);
          if (!sendErr) verifyCooldown.start();
          openVerifyStep("signin");
          if (sendErr) setCodeError(sendErr);
          setLoading(false);
          return;
        }
        setAuthError(failure);
        toast.error(
          failure.kind === "noAccount" ? `${failure.message} ${NO_ACCOUNT_HINT}` : failure.message
        );
      } else {
        navigate("/", { replace: true });
      }
    }
    setLoading(false);
  };

  /** Move to the "check your email" step with a clean slate. */
  const openVerifyStep = (reason: "signup" | "signin") => {
    setVerifyReason(reason);
    setCode("");
    setCodeError(null);
    setMode("verify");
  };

  /**
   * The address is confirmed; finish the job by signing in.
   *
   * Redeeming a code deliberately does not hand back a session — the code
   * proves the inbox, not the person — so the password typed a moment ago is
   * what actually signs them in. It is still in state either way: on the signup
   * form they just chose it, and on the log in form they just typed it.
   */
  const finishVerification = async () => {
    const { error } = await signIn(email, password);
    if (error) {
      // Verified, but the sign-in didn't take. Nothing has been lost — the
      // account is live now — so hand them to the log in form rather than
      // leaving them on a code screen with nothing left to enter.
      toast.success("Email verified. Log in to finish.");
      setPassword("");
      setMode("signin");
      return;
    }
    toast.success(
      verifyReason === "signup" ? "Account created! You're in." : "Email verified.",
    );
    navigate("/", { replace: true });
  };

  const handleVerifyCode = async (submitted?: string) => {
    const entered = submitted ?? code;
    if (verifying || !isCompleteCode(entered)) return;
    setVerifying(true);
    setCodeError(null);
    const { error } = await verifySignupCode(email, entered);
    if (error) {
      setCodeError(error);
      setVerifying(false);
      return;
    }
    await finishVerification();
    setVerifying(false);
  };

  const handleResendCode = async () => {
    if (loading || verifyCooldown.waiting) return;
    setLoading(true);
    setCodeError(null);
    const { error } = await resendSignupCode(email);
    setLoading(false);
    if (error) {
      setCodeError(error);
      return;
    }
    verifyCooldown.start();
    toast.success("New code sent.");
  };

  const handleSendReset = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading || resetCooldown.waiting) return;
    setLoading(true);
    const { error } = await sendPasswordResetEmail(email);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    resetCooldown.start();
    setMode("forgotSent");
  };

  if (mode === "verify") {
    const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
    const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";
    const ready = isCompleteCode(code) && !verifying;
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#E6E0CC", fontFamily: FF }}>
        <PageHeader
          title="Verify Email"
          onBack={() => setMode(verifyReason === "signup" ? "signup" : "signin")}
        />
        <div className="flex-1 px-6 pb-12 pt-6 flex flex-col">
          <h1
            style={{
              ...type.pageTitle,
              color: "#1A1A1A", lineHeight: 1.1, margin: "0 0 10px",
            }}
          >
            Check your email
          </h1>
          <p style={{ ...type.body, color: MUTED, margin: "0 0 24px" }}>
            {verifyReason === "signin"
              ? "This account hasn't confirmed its email address yet. We've sent a "
              : "We've sent a "}
            {VERIFICATION_CODE_LENGTH}-digit code to{" "}
            <span style={{ color: "#1A1A1A", fontWeight: 600 }}>{email.trim()}</span>. Enter
            it below to confirm the address is yours — it's how we reset your password and
            reach you if there's ever a problem with your account.
          </p>

          <VerificationCodeInput
            value={code}
            onChange={(next) => {
              setCode(next);
              if (codeError) setCodeError(null);
            }}
            onComplete={(full) => handleVerifyCode(full)}
            disabled={verifying}
            invalid={!!codeError}
            autoFocus
          />

          {codeError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-[13px] mt-4"
              style={{ background: "#fdecec", border: "1px solid #e5484d", color: "#b42318" }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{codeError}</span>
            </div>
          )}

          <Button
            onClick={() => handleVerifyCode()}
            className="w-full h-12 font-medium rounded-full mt-6"
            style={{ background: "#423324", color: "#FFFFFF", ...type.button }}
            disabled={!ready}
          >
            {verifying ? "Verifying..." : "Verify Email"}
          </Button>

          <p style={{ ...type.body, color: MUTED, marginTop: 16, textAlign: "center" }}>
            The code works for {VERIFICATION_CODE_TTL_MINUTES} minutes, so there's no rush.
            Nothing in your inbox after a minute or two? Check your spam or junk folder —
            it comes from hello@hellohoedspruit.co.
          </p>

          <p className="text-center text-sm mt-4" style={{ color: "#2b2420" }}>
            Didn't get it?{" "}
            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading || verifyCooldown.waiting}
              className="font-medium"
              style={{ color: "#715a3d", opacity: loading || verifyCooldown.waiting ? 0.6 : 1 }}
            >
              {loading
                ? "Sending..."
                : verifyCooldown.waiting
                ? `Resend in ${verifyCooldown.remaining}s`
                : "Send a new code"}
            </button>
          </p>

          <p className="text-center text-sm mt-3" style={{ color: TOKEN_MUTED }}>
            Typed the wrong address?{" "}
            <button
              type="button"
              onClick={() => setMode(verifyReason === "signup" ? "signup" : "signin")}
              className="font-medium"
              style={{ color: "#715a3d" }}
            >
              Go back
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (mode === "forgot" || mode === "forgotSent") {
    const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#E6E0CC" }}>
        <PageHeader title="Reset Password" onBack={() => setMode("signin")} />
        <div className="flex-1 px-6 pb-12 pt-6 flex flex-col">
          {mode === "forgot" ? (
            <>
              <p style={{ ...type.body, color: MUTED, margin: "0 0 20px" }}>
                Enter the email address for your account and we'll send you a secure
                link to choose a new password. The link works for {RESET_LINK_TTL_MINUTES}{" "}
                minutes.
              </p>
              <form onSubmit={handleSendReset} className="flex flex-col">
                <div>
                  <Label htmlFor="resetEmail" style={CREATE_LABEL_STYLE}>
                    Email
                  </Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="h-12 rounded-xl bg-card border-border text-[15px]"
                    style={{ background: "#ffffff", color: "#1A1A1A" }}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 font-medium rounded-full mt-6"
                  style={{ background: "#423324", color: "#FFFFFF", ...type.button }}
                  disabled={loading || resetCooldown.waiting}
                >
                  {loading
                    ? "Sending..."
                    : resetCooldown.waiting
                    ? `Try again in ${resetCooldown.remaining}s`
                    : "Email Reset Link"}
                </Button>
              </form>
              <p className="text-center text-sm mt-6" style={{ fontFamily: FF, color: "#2b2420" }}>
                Remembered it?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="font-medium"
                  style={{ fontFamily: FF, color: "#715a3d" }}
                >
                  Log in
                </button>
              </p>
            </>
          ) : (
            <>
              <p style={{ ...type.body, color: MUTED, margin: "0 0 20px" }}>
                If an account exists for{" "}
                <span style={{ color: "#1A1A1A", fontWeight: 600 }}>{email.trim()}</span>
                , we've sent it a password reset link. Open it within{" "}
                {RESET_LINK_TTL_MINUTES} minutes to choose a new password — and check your
                spam folder if it doesn't arrive in a minute or two.
              </p>
              <Button
                onClick={() => setMode("signin")}
                className="w-full h-12 font-medium rounded-full"
                style={{ background: "#423324", color: "#FFFFFF", ...type.button }}
              >
                Back to Log In
              </Button>
              <p className="text-center text-sm mt-6" style={{ fontFamily: FF, color: "#2b2420" }}>
                Didn't get it?{" "}
                <button
                  type="button"
                  onClick={() => handleSendReset()}
                  disabled={loading || resetCooldown.waiting}
                  className="font-medium"
                  style={{
                    fontFamily: FF,
                    color: "#715a3d",
                    opacity: loading || resetCooldown.waiting ? 0.6 : 1,
                  }}
                >
                  {loading
                    ? "Sending..."
                    : resetCooldown.waiting
                    ? `Resend in ${resetCooldown.remaining}s`
                    : "Resend link"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (mode === "welcome") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#E6E0CC", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
        <Seo
          title="Welcome to Hello Hoedspruit"
          description="Sign in or create a free account to save your favourite places, events and specials around Hoedspruit."
          path="/welcome"
        />
        {/* Skip: this screen is optional, never a gate. Browsing the app never
            requires an account. */}
        <div className="flex justify-end px-5" style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}>
          <button
            type="button"
            onClick={() => {
              enterGuest();
              navigate("/");
            }}
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: "#715a3d",
              padding: "8px 4px",
              background: "none",
              border: "none",
              borderRadius: 9999,
            }}
          >
            Skip
          </button>
        </div>

        {/* Logo block */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-6 pb-6">
          <img src={hhLogo} alt="Hello Hoedspruit" style={{ width: 220, height: "auto" }} />
          <h1
            style={{
              ...type.sectionTitle,
              color: "#423324",
              fontSize: 22,
              lineHeight: 1.2,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            Your Lowveld local
          </h1>
        </div>

        {/* Bottom action area */}
        <div className="px-5 pb-10">

          <Button
            onClick={() => {
              enterGuest();
              navigate("/");
            }}
            className="w-full"
            style={{
              height: 48,
              borderRadius: 9999,
              background: "#423324",
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            Browse the App
          </Button>

          <Button
            onClick={() => setMode("signup")}
            variant="outline"
            className="w-full mt-3"
            style={{
              height: 48,
              borderRadius: 9999,
              background: "transparent",
              border: "1.5px solid #715a3d",
              color: "#715a3d",
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            Create an Account
          </Button>

          <p style={{ textAlign: "center", color: "#6B6A5E", fontSize: 13, lineHeight: 1.5, marginTop: 14 }}>
            No account needed to browse. Sign up only to save places and follow people.
          </p>


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
                borderRadius: 9999,
              }}
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    );
  }

  const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";

  // Inputs now sit inside a white card, so they take the cream inset fill
  // instead of white-on-cream.
  const fieldStyle: React.CSSProperties = {
    background: "#F0EBE0",
    color: "#1A1A1A",
    borderColor: "transparent",
  };

  const CARD_LABEL: React.CSSProperties = {
    fontFamily: FF,
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: "#423324",
    display: "block",
    marginBottom: 2,
  };

  const hintStyle: React.CSSProperties = {
    fontFamily: FF,
    fontSize: 12.5,
    color: TOKEN_MUTED,
    margin: "6px 0 0",
  };

  const socialButtonStyle: React.CSSProperties = {
    height: 48, borderRadius: 9999, background: "#FFFFFF",
    border: "1px solid rgba(26,26,26,0.10)", color: "#1A1A1A",
    fontFamily: FF, fontSize: 16, fontWeight: 600,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    cursor: "pointer", opacity: oauthLoading ? 0.6 : 1,
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#E6E0CC", fontFamily: FF }}>
      <div className="flex-1 px-5 pb-12 pt-6 flex flex-col">
        {/* Circular back button */}
        <button
          type="button"
          onClick={() => {
            const from = location.state?.from;
            if (from) navigate(from, { replace: true });
            else setMode("welcome");
          }}
          aria-label="Back"
          style={{
            width: 44, height: 44, borderRadius: 9999, background: "#FFFFFF",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "none", cursor: "pointer", marginBottom: 22,
          }}
        >
          <ArrowLeft size={20} color="#1A1A1A" strokeWidth={1.75} />
        </button>

        <p
          style={{
            fontFamily: FF, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "#715A3D", margin: "0 0 6px",
          }}
        >
          Your Lowveld Local
        </p>
        <h1
          style={{
            fontFamily: HEAD, fontSize: 38, fontWeight: 550, letterSpacing: "-0.02em",
            color: "#1A1A1A", lineHeight: 1.05, margin: "0 0 8px",
          }}
        >
          {mode === "signup" ? "Create Account" : "Welcome Back"}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Fields live in one white card */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 16,
              border: "1px solid rgba(26,26,26,0.06)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >

          {mode === "signup" && (
            <>
              <div>
                <Label htmlFor="fullName" style={CARD_LABEL}>
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(capitaliseName(e.target.value))}
                  required
                  autoCapitalize="words"
                  placeholder="Your first and last name"
                  className="h-12 rounded-xl text-[15px]"
                  style={fieldStyle}
                />
              </div>

              <div>
                <Label htmlFor="username" style={CARD_LABEL}>
                  Username
                </Label>
                <div className="relative">
                  <span
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px]"
                    style={{ color: TOKEN_MUTED }}
                  >
                    @
                  </span>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(sanitiseUsername(e.target.value))}
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    maxLength={USERNAME_MAX}
                    placeholder="yourname"
                    className="h-12 rounded-xl text-[15px] pl-8"
                    style={fieldStyle}
                  />
                </div>
                <p
                  style={{
                    ...hintStyle,
                    color:
                      usernameStatus === "taken"
                        ? "#B42318"
                        : usernameStatus === "available"
                          ? "#3F6B3F"
                          : TOKEN_MUTED,
                  }}
                >
                  {usernameStatus === "checking"
                    ? "Checking availability..."
                    : usernameStatus === "taken"
                      ? "That username is already taken."
                      : usernameStatus === "available"
                        ? `@${username} is available.`
                        : USERNAME_HINT}
                </p>
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
                fontFamily: FF,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              {authError.kind === "noAccount" ? (
                /* Nothing to retype here — the address simply has no account,
                   so the message hands over the two things worth doing next. */
                <div>
                  <span>
                    {authError.message} {NO_ACCOUNT_HINT}
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthError(null);
                        setPassword("");
                        setMode("signup");
                      }}
                      style={{
                        fontFamily: FF, fontWeight: 600, fontSize: 13, color: "#b42318",
                        textDecoration: "underline", textUnderlineOffset: 3, background: "none",
                        border: "none", padding: 0, cursor: "pointer",
                      }}
                    >
                      Create an Account
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthError(null);
                        setEmail("");
                        setPassword("");
                        emailInputRef.current?.focus();
                      }}
                      style={{
                        fontFamily: FF, fontWeight: 600, fontSize: 13, color: "#b42318",
                        textDecoration: "underline", textUnderlineOffset: 3, background: "none",
                        border: "none", padding: 0, cursor: "pointer",
                      }}
                    >
                      Use a different email
                    </button>
                  </div>
                </div>
              ) : (
                <span>{authError.message}</span>
              )}
            </div>
          )}
          {signupError && mode === "signup" && (
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
              <div>
                <span>{signupError}</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSignupError(null);
                      setPassword("");
                      setMode("signin");
                    }}
                    style={{
                      fontFamily: FF, fontWeight: 600, fontSize: 13, color: "#b42318",
                      textDecoration: "underline", textUnderlineOffset: 3, background: "none",
                      border: "none", padding: 0, cursor: "pointer",
                    }}
                  >
                    Log in instead
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignupError(null);
                      setEmail("");
                      emailInputRef.current?.focus();
                    }}
                    style={{
                      fontFamily: FF, fontWeight: 600, fontSize: 13, color: "#b42318",
                      textDecoration: "underline", textUnderlineOffset: 3, background: "none",
                      border: "none", padding: 0, cursor: "pointer",
                    }}
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="email" style={CARD_LABEL}>
              Email
            </Label>
            <Input
              id="email"
              ref={emailInputRef}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (authError) setAuthError(null);
                if (signupError) setSignupError(null);
              }}
              required
              placeholder="you@example.com"
              className="h-12 rounded-xl text-[15px]"
              style={{
                ...fieldStyle,
                ...((authError && mode === "signin") || (signupError && mode === "signup")
                  ? { border: "1.5px solid #e5484d" }
                  : {}),
              }}
            />
          </div>

          {/* Residency sits between email and password on sign-up */}
          {mode === "signup" && (
            <div>
              <Label style={CARD_LABEL}>
                RESIDENCY
              </Label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {RESIDENCY_OPTIONS.map((opt) => {
                  const active = residency === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setResidency(opt.value)}
                      aria-pressed={active}
                      style={{
                        height: 40,
                        borderRadius: 9999,
                        background: active ? "#423324" : "#FFFFFF",
                        border: active ? "1.5px solid #423324" : "1.5px solid rgba(26,26,26,0.14)",
                        color: active ? "#FFFFFF" : "#1A1A1A",
                        fontFamily: FF,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="password" style={CARD_LABEL}>
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
                placeholder={mode === "signup" ? "Create a password" : "Enter your password"}
                className="h-12 rounded-xl text-[15px] pr-12"
                style={{
                  ...fieldStyle,
                  // A missing account is an email problem, not a password one —
                  // don't flag a field the person got right.
                  ...(authError && mode === "signin" && authError.kind !== "noAccount"
                    ? { border: "1.5px solid #e5484d" }
                    : {}),
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
            {mode === "signup" && (
              <p style={hintStyle}>At least 8 characters, with a number and a symbol.</p>
            )}
          </div>

          {mode === "signin" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <button
                type="button"
                onClick={() => setKeepSignedIn((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: "none", border: "none", padding: 0, cursor: "pointer",
                }}
                aria-pressed={keepSignedIn}
              >
                {/* Pill toggle */}
                <span
                  style={{
                    width: 46, height: 28, borderRadius: 9999, flexShrink: 0,
                    background: keepSignedIn ? "#423324" : "rgba(26,26,26,0.16)",
                    display: "flex", alignItems: "center",
                    padding: 3,
                    transition: "background 150ms ease",
                  }}
                >
                  <span
                    style={{
                      width: 22, height: 22, borderRadius: 9999, background: "#FFFFFF",
                      transform: keepSignedIn ? "translateX(18px)" : "translateX(0)",
                      transition: "transform 150ms ease",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                    }}
                  />
                </span>
                <span style={{ fontFamily: FF, fontSize: 13, color: "#2B2420", whiteSpace: "nowrap" }}>Keep Me Signed In</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("forgot")}
                style={{
                  fontFamily: FF, color: "#715a3d", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
                }}
              >
                Forgot Password?
              </button>
            </div>
          )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-full mt-5"
            style={{ background: "#423324", color: "#FFFFFF", fontSize: 16, fontWeight: 600 }}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : mode === "signup"
              ? "Create Account"
              : "Log In"}
          </Button>
        </form>

        {mode === "signup" && (
          <p style={{ fontFamily: FF, fontSize: 13, color: TOKEN_MUTED, margin: "12px 0 0", textAlign: "center" }}>
            By creating an account you agree to our{" "}
            <a
              href="https://hellohoedspruit.co/legal/terms-of-use"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: FF, fontSize: 13, fontWeight: 600, color: "#5A452E" }}
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="https://hellohoedspruit.co/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: FF, fontSize: 13, fontWeight: 600, color: "#5A452E" }}
            >
              Privacy Policy
            </a>
            .
          </p>
        )}

        {/* OR divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "22px 0 16px" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(26,26,26,0.12)" }} />
          <span style={{ fontFamily: FF, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: TOKEN_MUTED }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "rgba(26,26,26,0.12)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={oauthLoading !== null}
            style={socialButtonStyle}
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("apple")}
            disabled={oauthLoading !== null}
            style={socialButtonStyle}
          >
            <AppleIcon />
            Continue with Apple
          </button>
        </div>

        <p className="text-center text-sm mt-6" style={{ fontFamily: FF, color: "#2b2420" }}>
          {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
          <button
            onClick={() => {
              setAuthError(null);
              setSignupError(null);
              setMode(mode === "signup" ? "signin" : "signup");
            }}
            style={{ fontFamily: FF, color: "#715a3d", fontWeight: 600 }}
          >
            {mode === "signup" ? "Log In" : "Create an Account"}
          </button>
        </p>
      </div>
    </div>
  );
};


export default Welcome;
