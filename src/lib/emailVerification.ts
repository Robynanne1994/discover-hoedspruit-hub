// Email verification: the six-digit code that proves an address is a real
// inbox the person actually reads.
//
// It runs in three places, all of them through this module:
//   * Signup — the account is created unconfirmed and cannot be signed in to
//     until the code is typed back in.
//   * Changing your email in Account Info — the new address gets the code, and
//     the account only moves across once it is confirmed.
//   * Signing in to an account created before confirmation was switched on —
//     Supabase refuses the password with "Email not confirmed" (classified as
//     `unconfirmed` by src/lib/signIn.ts), and the log in screen sends a code
//     instead of dead-ending.
//
// The address is the only channel we have for a password reset or for reaching
// someone about their account, so an unverified one is worth very little.
//
// WHY THE CODES ARE OURS
// ----------------------
// All of this used to go through Supabase Auth's own one-time codes, which are
// delivered by whatever email template the project has configured — a dashboard
// setting nothing in this repo can reach. When that template is the stock one,
// the email arrives with a button and no code, and the app sits waiting for six
// digits nobody was ever sent. Tapping the button lands on the password reset
// screen, because a stock confirmation link is a generic /auth/v1/verify
// redirect.
//
// So the codes are now minted, emailed and checked by the app's own
// `account-email` edge function, and the email it sends contains the code and
// nothing else. See supabase/functions/account-email/index.ts.
import { supabase } from "@/integrations/supabase/client";

/** How many digits are in a verification code. Mirrors CODE_LENGTH in the function. */
export const VERIFICATION_CODE_LENGTH = 6;

/**
 * How long a code stays usable. Mirrors TTL_MINUTES in the account-email
 * function and `otp_expiry` in supabase/config.toml.
 *
 * Half an hour, not the fifteen minutes Supabase defaults to: people check
 * their email on another device, get interrupted, and come back. A window too
 * short to survive that fails honest users far more often than it stops anyone.
 */
export const VERIFICATION_CODE_TTL_MINUTES = 30;

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

/**
 * Turn an auth error into something worth showing a person.
 *
 * The account-email function already writes readable messages, so this is
 * mostly for the errors that come back from Supabase itself (a failed sign-in
 * after verifying, say) and for anything unexpected.
 */
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
  if (/network|fetch|offline|timeout|failed to (send|fetch)/i.test(text)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  return text || "Could not verify that code. Please try again.";
}

/** Turn an error from *sending* a code into readable copy. */
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
  if (/network|fetch|offline|timeout|failed to (send|fetch)/i.test(text)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  return text || "Could not send the code. Please try again.";
}

/**
 * The reasons the function can refuse, for the cases the caller has to handle
 * differently rather than just print. `email_in_use` is the one that matters:
 * it is the difference between "try again" and "you already have an account".
 */
export type VerificationErrorCode =
  | "email_in_use"
  | "invalid_email"
  | "weak_password"
  | "rate_limited"
  | "no_pending_code"
  | "invalid_code"
  | "code_expired"
  | "unauthorized"
  | "already_current"
  | "send_failed"
  | "bad_request"
  | "server_error"
  | "network";

export type VerificationResult<T = Record<string, unknown>> = {
  error: string | null;
  code?: VerificationErrorCode;
} & Partial<T>;

/**
 * Call the account-email function.
 *
 * It answers 200 with `{ ok }` or `{ error: { code, message } }` whatever
 * happens — `functions.invoke` buries the body of a non-2xx response inside a
 * FunctionsHttpError, which is exactly when the message matters most. A real
 * transport failure (offline, function down) still arrives as `error` here.
 */
async function callAccountEmail(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<VerificationResult<Record<string, unknown>>> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const { data, error } = await supabase.functions.invoke("account-email", {
      body: { action, ...payload },
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    });
    if (error) {
      return {
        error: friendlySendError(error.message),
        code: "network",
      };
    }
    const result = (data ?? {}) as {
      ok?: boolean;
      error?: { code?: VerificationErrorCode; message?: string };
    };
    if (!result.ok) {
      return {
        error: result.error?.message || "Something went wrong. Please try again.",
        code: result.error?.code ?? "server_error",
      };
    }
    return { error: null, ...(data as Record<string, unknown>) };
  } catch (err) {
    return {
      error: friendlySendError((err as Error)?.message),
      code: "network",
    };
  }
}

/** Everything the signup form knows about the account being created. */
export interface SignupDetails {
  displayName?: string;
  firstName?: string;
  surname?: string;
  username?: string;
  location?: string;
}

function metadataFrom(details?: SignupDetails): Record<string, string> {
  const metadata: Record<string, string> = {};
  if (details?.displayName) metadata.display_name = details.displayName;
  if (details?.firstName) metadata.first_name = details.firstName;
  if (details?.surname) metadata.surname = details.surname;
  if (details?.username) metadata.username = details.username;
  if (details?.location) metadata.location = details.location;
  return metadata;
}

/**
 * Create the account and email it a code.
 *
 * The account exists after this but cannot be signed in to: it is unconfirmed,
 * and Supabase refuses a password sign-in for an unconfirmed address. The
 * username and residency travel as user metadata and are claimed by
 * `apply_signup_metadata()` the moment the address is confirmed — deliberately
 * not before, so a signup abandoned over a mistyped address doesn't sit on the
 * handle the person is coming back to use.
 */
export async function startSignup(
  email: string,
  password: string,
  details?: SignupDetails,
): Promise<VerificationResult> {
  const trimmed = email.trim();
  if (!isValidEmail(trimmed)) {
    return { error: "Please enter a valid email address.", code: "invalid_email" };
  }
  return callAccountEmail("signup-start", {
    email: trimmed,
    password,
    metadata: metadataFrom(details),
  });
}

/** Email a fresh signup code to an address that hasn't confirmed yet. */
export async function resendSignupCode(email: string): Promise<VerificationResult> {
  const trimmed = email.trim();
  if (!isValidEmail(trimmed)) {
    return { error: "Please enter a valid email address.", code: "invalid_email" };
  }
  return callAccountEmail("signup-resend", { email: trimmed });
}

/**
 * Redeem a signup code, which confirms the address and makes the account
 * usable. No session comes back — the caller signs in with the password it
 * already has, which is also what stops a redeemed code being a way in for
 * anyone who doesn't know it.
 */
export async function verifySignupCode(
  email: string,
  code: string,
): Promise<VerificationResult> {
  const token = normaliseCode(code);
  if (token.length !== VERIFICATION_CODE_LENGTH) {
    return {
      error: `Enter the ${VERIFICATION_CODE_LENGTH}-digit code from your email.`,
      code: "invalid_code",
    };
  }
  return callAccountEmail("signup-verify", { email: email.trim(), code: token });
}

/**
 * Start an email change: a code goes to the NEW address. The account keeps its
 * old address until that code is redeemed, so an address nobody can open is
 * never left on the account.
 *
 * Refuses with `email_in_use` when the address already belongs to another
 * account — checked against both `profiles` and `auth.users`, so an address
 * that is only ever used to log in still counts.
 */
export async function startEmailChange(newEmail: string): Promise<VerificationResult> {
  const trimmed = newEmail.trim();
  if (!isValidEmail(trimmed)) {
    return { error: "Please enter a valid email address.", code: "invalid_email" };
  }
  return callAccountEmail("change-start", { email: trimmed });
}

/** Another copy of the code for the change already in flight. */
export async function resendEmailChangeCode(): Promise<VerificationResult> {
  return callAccountEmail("change-resend");
}

/**
 * Redeem the code sent to the new address, completing the change.
 *
 * On success the address has moved and is confirmed. The caller has to refresh
 * its session afterwards: the access token it is holding still carries the old
 * address in its claims until it does.
 */
export async function verifyEmailChangeCode(
  code: string,
): Promise<VerificationResult<{ email: string }>> {
  const token = normaliseCode(code);
  if (token.length !== VERIFICATION_CODE_LENGTH) {
    return {
      error: `Enter the ${VERIFICATION_CODE_LENGTH}-digit code from your email.`,
      code: "invalid_code",
    };
  }
  return callAccountEmail("change-verify", { code: token }) as Promise<
    VerificationResult<{ email: string }>
  >;
}

/** Abandon a pending change. Nothing on the account has moved, so this is tidying. */
export async function cancelEmailChange(): Promise<VerificationResult> {
  return callAccountEmail("change-cancel");
}

/**
 * The change this account is waiting on, if any — so re-opening Account Info
 * picks it back up rather than losing it.
 */
export async function readPendingEmailChange(): Promise<{
  email: string;
  expiresAt: string;
} | null> {
  const result = (await callAccountEmail("change-status")) as VerificationResult<{
    pending: { email: string; expiresAt: string } | null;
  }>;
  if (result.error) return null;
  return result.pending ?? null;
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
