// Working out *why* a log-in failed, so the screen can say something useful.
//
// Supabase answers a bad password and an unknown email with the exact same
// "Invalid login credentials" error. Left as-is, someone whose account was
// never created (or has since been deleted) just gets told their password is
// wrong, over and over. So when — and only when — sign-in comes back with that
// ambiguous error, we ask the server whether the address has an account at all
// (public.account_exists_for_email, see the migration of the same name) and
// split the message accordingly.
//
// Order matters: the password attempt happens first and the lookup second, so
// Supabase's auth rate limiting still guards the flow and the successful path
// costs no extra round trip.
import { supabase } from "@/integrations/supabase/client";

/** What actually went wrong, once we know enough to say. */
export type SignInFailureKind =
  /** No account is associated with this email — offer to create one. */
  | "noAccount"
  /** The email has an account; the password (or the email) was mistyped. */
  | "badCredentials"
  /** The account exists but the address hasn't been confirmed yet. */
  | "unconfirmed"
  /** Too many attempts — Supabase is throttling. */
  | "rateLimited"
  /** Couldn't reach the server. */
  | "offline"
  /** Anything else; the message is passed through. */
  | "other";

export type SignInFailure = {
  kind: SignInFailureKind;
  /** The line to show the person trying to log in. */
  message: string;
};

/**
 * The one error Supabase uses for both "wrong password" and "no such user".
 * Exported so callers can see whether a lookup is worth doing.
 */
export function isAmbiguousCredentialsError(message?: string | null): boolean {
  return /invalid login credentials|invalid.*password|invalid.*email/i.test(message ?? "");
}

/**
 * Turn a sign-in error into a message, given what we know about the address.
 *
 * `accountExists` is `true`/`false` when the lookup ran and answered, and
 * `null` when it wasn't needed or couldn't be trusted (RPC error, offline). A
 * `null` deliberately falls back to the old combined wording rather than
 * guessing: telling someone their account doesn't exist when it does would be
 * far worse than being vague.
 *
 * Pure, so the wording is testable without a network.
 */
export function interpretSignInError(
  rawMessage: string | null | undefined,
  accountExists: boolean | null,
  email = ""
): SignInFailure {
  const text = rawMessage ?? "";
  const address = email.trim();

  if (/email not confirmed|confirm.*email/i.test(text)) {
    return {
      kind: "unconfirmed",
      message:
        "This account still needs to be confirmed. Please open the confirmation link we emailed you, then log in again.",
    };
  }

  if (/rate|too many|429/i.test(text)) {
    return {
      kind: "rateLimited",
      message: "Too many attempts. Please wait a moment and try again.",
    };
  }

  if (/network|fetch|offline|timeout/i.test(text)) {
    return {
      kind: "offline",
      message: "We couldn't reach the server. Check your connection and try again.",
    };
  }

  if (isAmbiguousCredentialsError(text)) {
    if (accountExists === false) {
      return {
        kind: "noAccount",
        message: address
          ? `There's no Hello Hoedspruit account for ${address} yet.`
          : "There's no Hello Hoedspruit account for that email yet.",
      };
    }
    return {
      kind: "badCredentials",
      message: "Incorrect email or password. Please try again.",
    };
  }

  return { kind: "other", message: text || "Could not log in. Please try again." };
}

/** The follow-up line under a "no account" message, telling them what to do next. */
export const NO_ACCOUNT_HINT =
  "Check the address for typos, or create an account to get started.";

/**
 * Ask the server whether an email currently belongs to an account.
 *
 * Returns `null` rather than a guess if the question can't be answered — the
 * caller then shows the safe, ambiguous message. Deleted accounts (by the user
 * or by an admin) report `false`, because the RPC reads auth.users, which is
 * what deletion removes.
 */
export async function accountExistsForEmail(email: string): Promise<boolean | null> {
  const trimmed = email.trim();
  if (!trimmed) return null;
  try {
    // src/integrations/supabase/types.ts is generated and doesn't yet know
    // about this function, so the call is made through a narrow signature
    // rather than fighting the (stale) generated union.
    const rpc = supabase.rpc as unknown as (
      fn: string,
      args: Record<string, string>
    ) => Promise<{ data: unknown; error: unknown }>;
    const { data, error } = await rpc("account_exists_for_email", { _email: trimmed });
    if (error) return null;
    return typeof data === "boolean" ? data : null;
  } catch {
    return null;
  }
}

/**
 * The whole story for a failed sign-in: classify the error, and look the
 * address up only when that's what it takes to tell the person something true.
 */
export async function explainSignInFailure(
  rawMessage: string | null | undefined,
  email: string
): Promise<SignInFailure> {
  const accountExists = isAmbiguousCredentialsError(rawMessage)
    ? await accountExistsForEmail(email)
    : null;
  return interpretSignInError(rawMessage, accountExists, email);
}
