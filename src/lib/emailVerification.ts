// Email verification: the six-digit code that proves an address is a real
// inbox the person actually reads.
//
// It runs in three places, all of them through this module:
//   * Signup — the account exists but has no session until the code is typed
//     back in (Supabase `enable_confirmations`).
//   * Changing your email in Account Info — the new address gets the code, and
//     the account only moves across once it is confirmed.
//   * Signing in to an account created before confirmation was switched on —
//     Supabase refuses the password with "Email not confirmed" (classified as
//     `unconfirmed` by src/lib/signIn.ts), and the log in screen sends a code
//     instead of dead-ending.
//
// The address is the only channel we have for a password reset or for reaching
// someone about their account, so an unverified one is worth very little.
import { supabase } from "@/integrations/supabase/client";

/** How many digits are in a verification code. Mirrors `otp_length`. */
export const VERIFICATION_CODE_LENGTH = 6;

/** How long a code stays usable. Mirrors `otp_expiry` in supabase/config.toml. */
export const VERIFICATION_CODE_TTL_MINUTES = 15;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Does this look like an email address at all? */
export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/**
 * Keep only what can belong in a code, capped at its length.
 *
 * Pasting "Your code is 402 918" leaves "402918", so a code copied out of the
 * email body with whatever whitespace or punctuation came with it still works.
 */
export function normaliseCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, VERIFICATION_CODE_LENGTH);
}

/** Is this a complete code, ready to submit? */
export function isCompleteCode(raw: string): boolean {
  return normaliseCode(raw).length === VERIFICATION_CODE_LENGTH;
}

/** Turn a Supabase auth error into something worth showing a person. */
export function friendlyVerificationError(message?: string | null): string {
  const text = message ?? "";
  if (/expired/i.test(text) && /token|otp|code/i.test(text)) {
    return "That code has expired. Ask for a new one below.";
  }
  if (/invalid|incorrect|not found/i.test(text)) {
    return "That code isn't right. Check the email and try again.";
  }
  if (/rate|frequency|too many|seconds|429/i.test(text)) {
    return "For security we only send one code a minute. Please wait a moment and try again.";
  }
  if (/already (been )?registered|already exists|already in use/i.test(text)) {
    return "That email is already in use by another account.";
  }
  if (/invalid.*email|email.*invalid/i.test(text)) {
    return "Please enter a valid email address.";
  }
  if (/network|fetch|offline|timeout/i.test(text)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  return text || "Could not verify that code. Please try again.";
}

/** Turn a Supabase error from *sending* a code into readable copy. */
export function friendlySendError(message?: string | null): string {
  const text = message ?? "";
  if (/rate|frequency|too many|seconds|429/i.test(text)) {
    return "For security we only send one code a minute. Please wait a moment and try again.";
  }
  if (/already (been )?registered|already exists|already in use/i.test(text)) {
    return "That email is already in use by another account.";
  }
  if (/invalid.*email|email.*invalid/i.test(text)) {
    return "Please enter a valid email address.";
  }
  if (/network|fetch|offline|timeout/i.test(text)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  return text || "Could not send the code. Please try again.";
}

type Result = { error: string | null };

/** Email a fresh signup code to an address that hasn't confirmed yet. */
export async function resendSignupCode(email: string): Promise<Result> {
  const trimmed = email.trim();
  if (!isValidEmail(trimmed)) return { error: "Please enter a valid email address." };
  const { error } = await supabase.auth.resend({ type: "signup", email: trimmed });
  return { error: error ? friendlySendError(error.message) : null };
}

/**
 * Redeem a signup code. On success the user is signed in — Supabase returns a
 * session from `verifyOtp`, and the client stores it.
 */
export async function verifySignupCode(email: string, code: string): Promise<Result> {
  const token = normaliseCode(code);
  if (token.length !== VERIFICATION_CODE_LENGTH) {
    return { error: `Enter the ${VERIFICATION_CODE_LENGTH}-digit code from your email.` };
  }
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token,
    type: "signup",
  });
  return { error: error ? friendlyVerificationError(error.message) : null };
}

/**
 * Start an email change: Supabase emails a code to the NEW address. The
 * account keeps its old address until that code is redeemed, so an address
 * nobody can open is never left on the account.
 *
 * `applied` reports that the address moved immediately and no code is coming.
 * That happens when "Confirm email" is switched off on the Supabase project:
 * updateUser() writes the new address there and then, sends nothing, and
 * returns no error. Without this flag the caller would sit on a code-entry
 * screen waiting for an email that is never sent.
 */
export async function sendEmailChangeCode(
  newEmail: string,
): Promise<Result & { applied: boolean }> {
  const trimmed = newEmail.trim();
  if (!isValidEmail(trimmed)) {
    return { error: "Please enter a valid email address.", applied: false };
  }
  const { data, error } = await supabase.auth.updateUser({ email: trimmed });
  if (error) return { error: friendlySendError(error.message), applied: false };
  return {
    error: null,
    applied: (data?.user?.email || "").toLowerCase() === trimmed.toLowerCase(),
  };
}

/** Redeem the code sent to the new address, completing the change. */
export async function verifyEmailChangeCode(newEmail: string, code: string): Promise<Result> {
  const token = normaliseCode(code);
  if (token.length !== VERIFICATION_CODE_LENGTH) {
    return { error: `Enter the ${VERIFICATION_CODE_LENGTH}-digit code from your email.` };
  }
  const { error } = await supabase.auth.verifyOtp({
    email: newEmail.trim(),
    token,
    type: "email_change",
  });
  return { error: error ? friendlyVerificationError(error.message) : null };
}

/**
 * Has this account confirmed its email address?
 *
 * Accounts created before confirmation was switched on have no
 * `email_confirmed_at`, which is precisely the state Account Info offers to fix.
 */
export function isEmailVerified(user: { email_confirmed_at?: string | null } | null): boolean {
  return !!user?.email_confirmed_at;
}
