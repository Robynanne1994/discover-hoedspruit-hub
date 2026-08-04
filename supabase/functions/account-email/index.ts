// Proving an email address, end to end, without depending on anything in the
// Supabase dashboard.
//
// WHAT THIS REPLACES
// ------------------
// Both "prove this address" flows used to be Supabase Auth's own one-time
// codes: signUp() for a new account, updateUser({ email }) for a change. Both
// email whatever template the project has configured, and when that template is
// the stock one the result is an email with a button and NO code — while the
// app sits waiting for six digits that were never sent. The stock button is a
// generic /auth/v1/verify redirect, so tapping it comes back into the app
// looking exactly like a password-reset link and lands on the reset screen.
// None of that is fixable from the repo, because none of it lives in the repo.
//
// So the app now owns the whole thing. This function:
//   * mints a six-digit code, stores only a peppered hash of it, and emails it
//     with the template in _shared/authEmailTemplates.ts (code, no link);
//   * checks the code back, and only then moves the address — using the admin
//     API, so the address is confirmed at the moment the code is redeemed;
//   * refuses an address that already belongs to another account, with a
//     message worth showing a person.
//
// Nothing here trusts the client with anything: codes are never returned, the
// table is service-role only, and every state change is behind a redeemed code.
//
// Every response is HTTP 200 with { ok } or { error: { code, message } }.
// supabase.functions.invoke() buries the body of a non-2xx response inside a
// FunctionsHttpError, which is exactly when the app most needs to read the
// message — so the status stays 200 and the payload carries the outcome.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { renderAuthEmail } from "../_shared/authEmailTemplates.ts";
import { deliverEmail } from "../_shared/emailSender.ts";

/**
 * How long a code stays usable. Mirrors VERIFICATION_CODE_TTL_MINUTES in
 * src/lib/emailVerification.ts — the app quotes this number to the user and
 * clears a pending change when it runs out, so the two must agree.
 *
 * Half an hour rather than the fifteen minutes Supabase defaults to: people
 * check email on another device, get interrupted, and come back. A window too
 * short to survive that is a window that fails honest users far more often than
 * it stops anyone.
 */
const TTL_MINUTES = 30;

/** Digits in a code. Mirrors VERIFICATION_CODE_LENGTH. */
const CODE_LENGTH = 6;

/** Wrong guesses a single code tolerates before it is burnt. */
const MAX_ATTEMPTS = 6;

/** Enforced gap between two codes for the same request. Mirrors the app's countdown. */
const RESEND_COOLDOWN_SECONDS = 60;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ErrorCode =
  /** The address already belongs to another account. */
  | "email_in_use"
  /** Not an email address at all. */
  | "invalid_email"
  /** Password doesn't meet the policy. */
  | "weak_password"
  /** Asked for another code too soon. */
  | "rate_limited"
  /** No live code for this request — none issued, or it has expired. */
  | "no_pending_code"
  /** The code was wrong. */
  | "invalid_code"
  /** The code has expired or been used up. */
  | "code_expired"
  /** Not signed in (for the actions that need to be). */
  | "unauthorized"
  /** Nothing to do: the address is already the account's, and confirmed. */
  | "already_current"
  | "send_failed"
  | "bad_request"
  | "server_error";

function ok(body: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({ ok: true, ...body }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function fail(code: ErrorCode, message: string): Response {
  return new Response(JSON.stringify({ ok: false, error: { code, message } }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normaliseEmail(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

/**
 * The same policy the app enforces client-side (src/lib/passwordPolicy.ts),
 * repeated here because the client is not where a rule is enforced.
 */
function passwordError(password: unknown): string | null {
  if (typeof password !== "string" || password.length < 8) {
    return "Your password needs at least 8 characters.";
  }
  if (!/[A-Za-z]/.test(password)) return "Your password needs at least one letter.";
  if (!/\d/.test(password)) return "Your password needs at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Your password needs at least one symbol.";
  return null;
}

/**
 * A six-digit code from the platform's cryptographic RNG.
 *
 * Rejection sampling rather than `% 1_000_000`: the remainder of a byte-derived
 * integer is very slightly biased towards low codes, and a code space this
 * small has no bias to spare.
 */
function generateCode(): string {
  const max = 10 ** CODE_LENGTH;
  const limit = Math.floor(0xffffffff / max) * max;
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return String(value % max).padStart(CODE_LENGTH, "0");
}

/**
 * Hash a code for storage.
 *
 * Peppered with a server-side secret: six digits is little enough entropy that
 * a bare SHA-256 of a leaked table could be reversed with a rainbow table in
 * seconds. VERIFICATION_CODE_PEPPER if it is set, otherwise the service role
 * key — which never leaves the server either, and is always present.
 */
async function hashCode(code: string, email: string, purpose: string): Promise<string> {
  const pepper =
    Deno.env.get("VERIFICATION_CODE_PEPPER") ||
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    "";
  const data = new TextEncoder().encode(`${purpose}:${email}:${code}:${pepper}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time comparison, so a wrong code can't be narrowed by timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

interface PendingCode {
  id: string;
  email: string;
  code_hash: string;
  attempts: number;
  expires_at: string;
  last_sent_at: string;
}

/** The live (unconsumed, unexpired) code for this account and purpose, if any. */
async function findPendingCode(
  admin: SupabaseClient,
  userId: string,
  purpose: "signup" | "email_change",
): Promise<PendingCode | null> {
  const { data } = await admin
    .from("email_verification_codes")
    .select("id, email, code_hash, attempts, expires_at, last_sent_at")
    .eq("user_id", userId)
    .eq("purpose", purpose)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as PendingCode | null) ?? null;
}

/**
 * Issue a code and email it.
 *
 * Any earlier code for the same account and purpose is consumed first: two live
 * codes for one address means whichever one the person reads might be the stale
 * one, and "that code isn't right" for a code they are looking at is the worst
 * message this flow can produce.
 */
async function issueAndSend(
  admin: SupabaseClient,
  args: {
    userId: string;
    email: string;
    purpose: "signup" | "email_change";
  },
): Promise<Response> {
  const { userId, email, purpose } = args;

  // One a minute, matching the countdown the app shows on its resend button.
  const pending = await findPendingCode(admin, userId, purpose);
  if (pending) {
    const since = Date.now() - new Date(pending.last_sent_at).getTime();
    const waitMs = RESEND_COOLDOWN_SECONDS * 1000 - since;
    if (waitMs > 0) {
      return fail(
        "rate_limited",
        `For security we only send one code a minute. Try again in ${Math.ceil(waitMs / 1000)} seconds.`,
      );
    }
  }

  const code = generateCode();
  const codeHash = await hashCode(code, email, purpose);
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000).toISOString();

  await admin
    .from("email_verification_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("purpose", purpose)
    .is("consumed_at", null);

  const { data: inserted, error: insertError } = await admin
    .from("email_verification_codes")
    .insert({
      user_id: userId,
      email,
      purpose,
      code_hash: codeHash,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("Could not store verification code", insertError);
    return fail("server_error", "We couldn't start that just now. Please try again.");
  }

  const { subject, html, text } = renderAuthEmail({
    action: purpose === "signup" ? "signup" : "email_change",
    token: code,
    // No link, deliberately. The code is the only thing the app ever asks for,
    // and a one-tap link is what took people to the password reset screen.
    confirmationUrl: null,
    ttlMinutes: TTL_MINUTES,
  });

  const outcome = await deliverEmail(
    { to: email, subject, html, text, label: `verify_${purpose}` },
    admin,
  );

  if (!outcome.ok) {
    // The code is useless if the email never left, and leaving it behind would
    // hold the one-a-minute limit against a person who received nothing.
    await admin.from("email_verification_codes").delete().eq("id", inserted.id);
    return fail(outcome.reason === "suppressed" ? "email_in_use" : "send_failed", outcome.message);
  }

  // Cheap housekeeping, on the path that already writes.
  await admin.rpc("purge_expired_verification_codes");

  return ok({ email, expiresInMinutes: TTL_MINUTES });
}

type CheckResult =
  | { ok: true; pending: PendingCode }
  | { ok: false; response: Response };

/** Check a submitted code against the live one, counting the wrong guesses. */
async function checkCode(
  admin: SupabaseClient,
  userId: string,
  purpose: "signup" | "email_change",
  submitted: string,
): Promise<CheckResult> {
  const digits = String(submitted ?? "").replace(/\D/g, "");
  if (digits.length !== CODE_LENGTH) {
    return {
      ok: false,
      response: fail("invalid_code", `Enter the ${CODE_LENGTH}-digit code from your email.`),
    };
  }

  const pending = await findPendingCode(admin, userId, purpose);
  if (!pending) {
    return {
      ok: false,
      response: fail(
        "no_pending_code",
        "We don't have a code waiting for you. Ask for a new one below.",
      ),
    };
  }

  if (new Date(pending.expires_at).getTime() <= Date.now()) {
    await admin
      .from("email_verification_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", pending.id);
    return {
      ok: false,
      response: fail("code_expired", "That code has expired. Ask for a new one below."),
    };
  }

  if (pending.attempts >= MAX_ATTEMPTS) {
    await admin
      .from("email_verification_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", pending.id);
    return {
      ok: false,
      response: fail(
        "code_expired",
        "Too many incorrect tries. We've cancelled that code — ask for a new one below.",
      ),
    };
  }

  const submittedHash = await hashCode(digits, pending.email, purpose);
  if (!timingSafeEqual(submittedHash, pending.code_hash)) {
    await admin
      .from("email_verification_codes")
      .update({ attempts: pending.attempts + 1 })
      .eq("id", pending.id);
    const left = MAX_ATTEMPTS - (pending.attempts + 1);
    return {
      ok: false,
      response: fail(
        "invalid_code",
        left > 0
          ? "That code isn't right. Check the email and try again."
          : "That code isn't right, and that was the last try. Ask for a new one below.",
      ),
    };
  }

  return { ok: true, pending };
}

/** Who is this address, as far as auth.users is concerned? */
async function lookupAccount(
  admin: SupabaseClient,
  email: string,
): Promise<{ userId: string; isConfirmed: boolean } | null> {
  const { data, error } = await admin.rpc("auth_user_for_email", { _email: email });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return { userId: row.user_id as string, isConfirmed: !!row.is_confirmed };
}

const IN_USE_MESSAGE =
  "That email already has a Hello Hoedspruit account. Log in with it instead, or use a different email address.";

/** Pull the signed-in user off the request, or null. */
async function requireUser(admin: SupabaseClient, req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const { data, error } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (error || !data.user) return null;
  return data.user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return fail("bad_request", "Method not allowed");

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
    return fail("server_error", "Email verification isn't configured. Please try again later.");
  }
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail("bad_request", "Malformed request.");
  }

  const action = String(body.action ?? "");

  try {
    switch (action) {
      // ---------------------------------------------------------------------
      // Creating an account with an email address
      // ---------------------------------------------------------------------
      // The account is created here rather than by the client's signUp(), for
      // one reason: signUp() makes Supabase send its own confirmation email,
      // and that email is the problem. Created through the admin API, no mail
      // goes out except the one below — the one with the code in it.
      //
      // The account is created UNCONFIRMED, so it cannot be signed in to until
      // the code comes back (Supabase refuses a password sign-in for an
      // unconfirmed address while confirmations are on). The username and
      // residency ride along as metadata and are claimed by
      // apply_signup_metadata() the moment the address is confirmed.
      case "signup-start": {
        const email = normaliseEmail(body.email);
        if (!EMAIL_PATTERN.test(email)) {
          return fail("invalid_email", "Please enter a valid email address.");
        }
        const password = body.password;
        const pwError = passwordError(password);
        if (pwError) return fail("weak_password", pwError);

        const metadata = (body.metadata ?? {}) as Record<string, unknown>;
        const existing = await lookupAccount(admin, email);

        let userId: string;
        if (existing?.isConfirmed) {
          // A real, usable account already owns this address.
          return fail("email_in_use", IN_USE_MESSAGE);
        } else if (existing) {
          // An abandoned attempt on the same address — someone who closed the
          // app before entering the code, or is trying again with a different
          // password. Take the new details over the old ones rather than
          // telling them their own half-finished signup is in the way.
          const { error } = await admin.auth.admin.updateUserById(existing.userId, {
            password: password as string,
            user_metadata: metadata,
          });
          if (error) throw error;
          userId = existing.userId;
        } else {
          const { data, error } = await admin.auth.admin.createUser({
            email,
            password: password as string,
            email_confirm: false,
            user_metadata: metadata,
          });
          if (error) {
            if (/already/i.test(error.message)) return fail("email_in_use", IN_USE_MESSAGE);
            throw error;
          }
          userId = data.user!.id;
        }

        return await issueAndSend(admin, { userId, email, purpose: "signup" });
      }

      // Another copy of the signup code. Also the path an account created
      // before confirmations existed takes: it is unconfirmed, Supabase refuses
      // its password, and the log in screen sends it a code instead of
      // dead-ending.
      case "signup-resend": {
        const email = normaliseEmail(body.email);
        if (!EMAIL_PATTERN.test(email)) {
          return fail("invalid_email", "Please enter a valid email address.");
        }
        const existing = await lookupAccount(admin, email);
        if (!existing) {
          return fail(
            "no_pending_code",
            "There's no account waiting to be verified for that email. Create an account to get started.",
          );
        }
        if (existing.isConfirmed) {
          return fail("already_current", "That email is already verified. You can log in.");
        }
        return await issueAndSend(admin, { userId: existing.userId, email, purpose: "signup" });
      }

      // The code comes back. Confirming the address is what turns the attempt
      // into a usable account; the client signs in with the password it already
      // has, so no session is minted here.
      case "signup-verify": {
        const email = normaliseEmail(body.email);
        const existing = await lookupAccount(admin, email);
        if (!existing) {
          return fail("no_pending_code", "We couldn't find that signup. Please start again.");
        }
        if (existing.isConfirmed) {
          // Already done — a double submit, or a second device. Report success:
          // the state the caller wanted is the state that exists.
          return ok({ email, alreadyVerified: true });
        }

        const result = await checkCode(admin, existing.userId, "signup", body.code as string);
        if (!result.ok) return result.response;

        const { error } = await admin.auth.admin.updateUserById(existing.userId, {
          email_confirm: true,
        });
        if (error) throw error;

        await admin
          .from("email_verification_codes")
          .update({ consumed_at: new Date().toISOString() })
          .eq("id", result.pending.id);

        return ok({ email });
      }

      // ---------------------------------------------------------------------
      // Changing the address on an existing account
      // ---------------------------------------------------------------------
      // The account keeps its current address for the whole of this, and only
      // moves when the code from the NEW address comes back. A typo therefore
      // can never strand an account on an inbox nobody can open.
      case "change-start": {
        const user = await requireUser(admin, req);
        if (!user) return fail("unauthorized", "Please log in and try again.");

        const email = normaliseEmail(body.email);
        if (!EMAIL_PATTERN.test(email)) {
          return fail("invalid_email", "Please enter a valid email address.");
        }
        if (email === normaliseEmail(user.email)) {
          return fail("already_current", "That's already the email on your account.");
        }

        // is_email_available consults both profiles and auth.users, excluding
        // this account, so re-using your own address is never flagged.
        const { data: available, error: availError } = await admin.rpc("is_email_available", {
          _email: email,
          _exclude_id: user.id,
        });
        if (availError) throw availError;
        if (!available) return fail("email_in_use", IN_USE_MESSAGE);

        return await issueAndSend(admin, { userId: user.id, email, purpose: "email_change" });
      }

      case "change-resend": {
        const user = await requireUser(admin, req);
        if (!user) return fail("unauthorized", "Please log in and try again.");

        // The live code if there is one — but also a spent one from the last
        // couple of hours, so someone who used up their guesses can ask for a
        // fresh code instead of being made to retype the address.
        const pending = await findPendingCode(admin, user.id, "email_change");
        let target = pending?.email;
        if (!target) {
          const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
          const { data: recent } = await admin
            .from("email_verification_codes")
            .select("email")
            .eq("user_id", user.id)
            .eq("purpose", "email_change")
            .gte("created_at", since)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          target = (recent as { email?: string } | null)?.email;
        }
        if (!target) {
          return fail(
            "no_pending_code",
            "That request has expired. Enter your new email address again.",
          );
        }

        // Re-check availability: the address could have been taken while this
        // request sat open.
        const { data: available } = await admin.rpc("is_email_available", {
          _email: target,
          _exclude_id: user.id,
        });
        if (available === false) return fail("email_in_use", IN_USE_MESSAGE);
        return await issueAndSend(admin, {
          userId: user.id,
          email: target,
          purpose: "email_change",
        });
      }

      case "change-verify": {
        const user = await requireUser(admin, req);
        if (!user) return fail("unauthorized", "Please log in and try again.");

        const result = await checkCode(admin, user.id, "email_change", body.code as string);
        if (!result.ok) return result.response;

        const newEmail = result.pending.email;

        // Last look before the move: nothing stops someone else claiming the
        // address in the half hour a code is valid for.
        const { data: available } = await admin.rpc("is_email_available", {
          _email: newEmail,
          _exclude_id: user.id,
        });
        if (available === false) return fail("email_in_use", IN_USE_MESSAGE);

        // email_confirm alongside the address: the code IS the confirmation,
        // and without it the account would land on the new address unverified
        // and unable to reset its own password.
        const { error } = await admin.auth.admin.updateUserById(user.id, {
          email: newEmail,
          email_confirm: true,
        });
        if (error) {
          if (/already/i.test(error.message)) return fail("email_in_use", IN_USE_MESSAGE);
          throw error;
        }

        await admin
          .from("email_verification_codes")
          .update({ consumed_at: new Date().toISOString() })
          .eq("id", result.pending.id);

        // on_auth_user_email_changed mirrors this onto profiles.email; doing it
        // here too means the screen never reads a stale address back.
        await admin.from("profiles").update({ email: newEmail }).eq("id", user.id);

        return ok({ email: newEmail });
      }

      // Abandon a pending change. Nothing on the account has moved, so this is
      // only tidying — but it releases the one-a-minute limit and stops the
      // Email row claiming to be waiting for something.
      case "change-cancel": {
        const user = await requireUser(admin, req);
        if (!user) return fail("unauthorized", "Please log in and try again.");
        await admin
          .from("email_verification_codes")
          .update({ consumed_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("purpose", "email_change")
          .is("consumed_at", null);
        return ok();
      }

      // What the app is waiting for, if anything — so re-opening Account Info
      // picks a change back up instead of losing it.
      case "change-status": {
        const user = await requireUser(admin, req);
        if (!user) return fail("unauthorized", "Please log in and try again.");
        const pending = await findPendingCode(admin, user.id, "email_change");
        if (!pending || new Date(pending.expires_at).getTime() <= Date.now()) {
          return ok({ pending: null });
        }
        return ok({ pending: { email: pending.email, expiresAt: pending.expires_at } });
      }

      default:
        return fail("bad_request", "Unknown action.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("account-email failed", { action, error: message });
    return fail("server_error", "Something went wrong on our side. Please try again.");
  }
});
