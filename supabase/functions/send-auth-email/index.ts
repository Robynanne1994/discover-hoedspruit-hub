// Supabase Auth "Send Email Hook".
//
// With this hook registered, Supabase stops sending auth email itself and hands
// every one to this function instead: signup confirmations, password resets,
// email changes, magic links. That is the point. Three separate problems all
// come from letting the platform's built-in sender do it:
//
//   1. Nothing arrives. The built-in sender is a shared, heavily rate-limited
//      convenience for development — a few messages an hour on a free project.
//      From the inside that is indistinguishable from "the email is broken".
//   2. What does arrive is flagged. It comes from a shared provider domain that
//      hellohoedspruit.com has never vouched for, so it fails the checks
//      (SPF/DKIM/DMARC) a receiving server uses to decide who a message is
//      really from. That is what puts it in spam under a red banner — and a
//      banner-flagged message has all of its links disabled, which is why the
//      button in the email did nothing.
//   3. The template is whatever is pasted in the dashboard. The stock one is
//      link-only, so it never contained the six-digit code the app asks for.
//
// This function fixes all three: it renders the templates that ship in this
// repo (code first, link optional) and sends them through a provider on a
// domain we control.
//
// Sending goes to Resend when RESEND_API_KEY is set — the arrangement that
// actually fixes deliverability, because the DNS records that authenticate the
// mail live on our own domain. Without that key it falls back to the Lovable
// sender the rest of the app already uses, so the flows keep working from the
// first deploy rather than breaking until DNS is done.
//
// See EMAIL_VERIFICATION_SETUP.md for the (unavoidably manual) dashboard and
// DNS steps.
import { sendLovableEmail } from "npm:@lovable.dev/email-js";
import { createClient } from "npm:@supabase/supabase-js@2";
import { renderAuthEmail, type AuthEmailAction } from "../_shared/authEmailTemplates.ts";
import {
  readSignatureHeaders,
  verifyWebhookSignature,
} from "../_shared/verifyWebhookSignature.ts";

/** How long a code stays valid. Mirrors `otp_expiry` in supabase/config.toml. */
const TTL_MINUTES = 15;

/** What Supabase posts to a send-email hook. */
interface HookPayload {
  user: {
    id?: string;
    email?: string;
    /** Set while an email change is pending — the address being confirmed. */
    new_email?: string | null;
  };
  email_data: {
    token?: string;
    token_hash?: string;
    /** The new address's code during an email change. */
    token_new?: string;
    token_hash_new?: string;
    redirect_to?: string;
    email_action_type?: string;
    site_url?: string;
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * An error shaped the way Supabase Auth expects, so the message surfaces to the
 * caller instead of becoming a generic 500. The app turns it into readable copy
 * via friendlySendError().
 */
function hookError(message: string, status = 500): Response {
  return new Response(JSON.stringify({ error: { http_code: status, message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const KNOWN_ACTIONS: AuthEmailAction[] = [
  "signup",
  "recovery",
  "email_change",
  "magiclink",
  "invite",
  "reauthentication",
];

function normaliseAction(raw?: string): AuthEmailAction {
  const value = (raw || "signup").toLowerCase();
  // Supabase emits "email_change_new" / "email_change_current" on a double
  // confirmation; both are the same email as far as the copy is concerned.
  if (value.startsWith("email_change")) return "email_change";
  return (KNOWN_ACTIONS as string[]).includes(value)
    ? (value as AuthEmailAction)
    : "signup";
}

/**
 * Rebuild the one-tap link.
 *
 * Supabase only gives the hook the pieces, not the finished URL. The verify
 * endpoint redirects to `redirect_to` once the token checks out — and it only
 * honours a `redirect_to` that is on the project's allow list, which is why the
 * app is careful never to send it a "capacitor://localhost" one.
 */
function buildConfirmationUrl(
  payload: HookPayload,
  action: AuthEmailAction,
  tokenHash: string,
): string | null {
  const base = Deno.env.get("SUPABASE_URL") || payload.email_data.site_url;
  if (!base || !tokenHash) return null;
  const url = new URL(`${base.replace(/\/+$/, "")}/auth/v1/verify`);
  url.searchParams.set("token", tokenHash);
  // The normalised action, not the raw one: Supabase reports the halves of a
  // double confirmation as "email_change_new"/"email_change_current", but the
  // verify endpoint only knows "email_change".
  url.searchParams.set("type", action);
  const redirectTo = payload.email_data.redirect_to;
  if (redirectTo) url.searchParams.set("redirect_to", redirectTo);
  return url.toString();
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Send through Resend. Returns the provider message id. */
async function sendViaResend(apiKey: string, args: SendArgs): Promise<string> {
  const from = Deno.env.get("AUTH_EMAIL_FROM") || "Hello Hoedspruit <noreply@hellohoedspruit.com>";
  const replyTo = Deno.env.get("AUTH_EMAIL_REPLY_TO") || "hello@hellohoedspruit.com";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      // Sending both parts matters: HTML-only mail is a long-standing spam
      // signal, and the text part is what a watch or a screen reader shows.
      text: args.text,
      reply_to: replyTo,
      headers: {
        // Tells receiving servers this is a one-off, user-triggered message
        // rather than bulk mail, and stops threading separate codes together.
        "X-Entity-Ref-ID": crypto.randomUUID(),
        "Auto-Submitted": "auto-generated",
      },
    }),
  });

  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(`Resend ${response.status}: ${bodyText.slice(0, 500)}`);
  }
  try {
    return (JSON.parse(bodyText) as { id?: string }).id ?? "";
  } catch {
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return hookError("Method not allowed", 405);

  const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
  const body = await req.text();

  // Fail closed. An unsigned request to this endpoint is a request to email a
  // valid login code wherever the caller likes.
  if (!hookSecret) {
    console.error("SEND_EMAIL_HOOK_SECRET is not set — refusing to send");
    return hookError("Email hook is not configured", 500);
  }
  const signatureError = await verifyWebhookSignature(
    hookSecret,
    readSignatureHeaders(req.headers),
    body,
  );
  if (signatureError) {
    console.error("Rejected auth email hook call", { reason: signatureError });
    return hookError("Unauthorized", 401);
  }

  let payload: HookPayload;
  try {
    payload = JSON.parse(body) as HookPayload;
  } catch {
    return hookError("Malformed hook payload", 400);
  }

  const action = normaliseAction(payload.email_data?.email_action_type);
  const isEmailChange = action === "email_change";

  // An email change confirms at the NEW address — that is the whole point of
  // the exercise, and the old one may well be a typo nobody can open.
  const recipient = isEmailChange
    ? payload.user?.new_email || payload.user?.email
    : payload.user?.email;

  // Same split for the code: Supabase issues a separate token per address.
  const token = isEmailChange
    ? payload.email_data?.token_new || payload.email_data?.token
    : payload.email_data?.token;
  const tokenHash = isEmailChange
    ? payload.email_data?.token_hash_new || payload.email_data?.token_hash
    : payload.email_data?.token_hash;

  if (!recipient || !token) {
    console.error("Hook payload missing recipient or token", { action });
    return hookError("Hook payload missing recipient or token", 400);
  }

  const { subject, html, text } = renderAuthEmail({
    action,
    token,
    confirmationUrl: buildConfirmationUrl(payload, action, tokenHash || ""),
    ttlMinutes: TTL_MINUTES,
  });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const log = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

  // Never mail an address that has bounced or complained: repeatedly sending to
  // a dead mailbox is what wrecks a sending domain's reputation for everyone
  // else. Auth mail is user-triggered, so this only ever catches hard failures.
  if (log) {
    const { data: suppressed } = await log
      .from("suppressed_emails")
      .select("reason")
      .eq("email", recipient.toLowerCase())
      .maybeSingle();
    if (suppressed && suppressed.reason !== "unsubscribe") {
      console.warn("Refusing to send auth email to suppressed address", {
        reason: suppressed.reason,
      });
      return hookError(
        "We can't deliver email to that address. Please use a different one or contact support.",
        422,
      );
    }
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const messageId = crypto.randomUUID();
  const label = `auth_${action}`;

  try {
    let providerMessageId = "";
    if (resendKey) {
      providerMessageId = await sendViaResend(resendKey, {
        to: recipient,
        subject,
        html,
        text,
      });
    } else {
      // No Resend key yet: keep the flows alive on the sender the rest of the
      // app already uses. Deliverability is not fixed until Resend is wired up.
      console.warn("RESEND_API_KEY not set — falling back to the Lovable sender");
      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (!apiKey) throw new Error("Neither RESEND_API_KEY nor LOVABLE_API_KEY is set");
      await sendLovableEmail(
        {
          to: recipient,
          subject,
          html,
          text,
          purpose: "transactional",
          label,
          message_id: messageId,
          idempotency_key: messageId,
        },
        { apiKey, sendUrl: Deno.env.get("LOVABLE_SEND_URL") },
      );
      providerMessageId = messageId;
    }

    if (log) {
      await log.from("email_send_log").insert({
        message_id: providerMessageId || messageId,
        template_name: label,
        recipient_email: recipient,
        status: "sent",
      });
    }

    // The body is ignored on success; a 200 tells Supabase the mail is away.
    return json({});
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to send auth email", { action, error: message });

    if (log) {
      await log.from("email_send_log").insert({
        message_id: messageId,
        template_name: label,
        recipient_email: recipient,
        status: "failed",
        error_message: message.slice(0, 1000),
      });
    }

    // Report the failure rather than swallowing it. A silent failure here is
    // precisely the bug being fixed: the app says "check your email" and the
    // person waits for something that was never sent.
    return hookError("We couldn't send that email just now. Please try again.", 500);
  }
});
