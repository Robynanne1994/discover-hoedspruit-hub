// Delivering one transactional email, the same way everywhere.
//
// Two functions send account email — the Supabase send-email hook
// (send-auth-email) and the app's own verification-code function
// (account-email) — and both need the identical set of guards around the send:
// refuse addresses that have bounced or complained, prefer our own sending
// domain, fall back to the platform sender while that domain is being set up,
// and record every attempt. Doing that in one place means the two can't drift.
import { sendLovableEmail } from "npm:@lovable.dev/email-js";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/** Where a person should write if the automated path has failed them. */
const SUPPORT_EMAIL = "hello@hellohoedspruit.co";

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Goes into email_send_log.template_name, e.g. "auth_signup". */
  label: string;
}

export type SendOutcome =
  | { ok: true; messageId: string }
  /**
   * The address is suppressed (hard bounce or spam complaint). Not retryable,
   * and the message is safe to show a person.
   */
  | { ok: false; reason: "suppressed"; message: string }
  | { ok: false; reason: "failed"; message: string };

/**
 * Who the mail is from, and where a reply to it should go.
 *
 * Both senders need both. Resend puts them on the envelope; the Lovable API
 * *rejects the send outright* without a `from` — `400 missing_parameter: from`
 * — which is how every fallback send came to fail while the app said the code
 * was on its way.
 */
function senderAddress(): string {
  // notify.hellohoedspruit.co, not hellohoedspruit.co and not .com: a sender is
  // only ever as good as the domain it is verified for, and this subdomain is
  // the one this project has actually proved it owns. Sending as anything else
  // is refused outright — `403 no_matching_sender` — which is how the fallback
  // came to fail even once it was passing a From address at all.
  return Deno.env.get("AUTH_EMAIL_FROM") || "Hello Hoedspruit <noreply@notify.hellohoedspruit.co>";
}

function replyToAddress(): string {
  return Deno.env.get("AUTH_EMAIL_REPLY_TO") || SUPPORT_EMAIL;
}

/**
 * The domain out of a `Name <local@domain>` address, for the Lovable API's
 * `sender_domain`. It infers this from `from` when it is left out, but the
 * inference is theirs and this is the one thing in the payload we already know
 * for certain.
 */
function senderDomain(from: string): string {
  const address = from.match(/<([^>]+)>/)?.[1] ?? from;
  return address.split("@")[1]?.trim() ?? "";
}

/** Send through Resend. Returns the provider message id. */
async function sendViaResend(apiKey: string, email: OutgoingEmail): Promise<string> {
  const from = senderAddress();
  const replyTo = replyToAddress();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      // Sending both parts matters: HTML-only mail is a long-standing spam
      // signal, and the text part is what a watch or a screen reader shows.
      text: email.text,
      reply_to: replyTo,
      headers: {
        // Tells receiving servers this is a one-off, user-triggered message
        // rather than bulk mail, and stops separate codes threading together.
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

/**
 * Has this address hard-bounced or reported us as spam?
 *
 * Repeatedly mailing a dead mailbox is what wrecks a sending domain's
 * reputation for everyone else. Account email is always user-triggered, so this
 * only ever catches genuine failures — an unsubscribe is not one of them, since
 * nobody unsubscribes from being able to log in.
 */
async function isSuppressed(
  admin: SupabaseClient | null,
  recipient: string,
): Promise<boolean> {
  if (!admin) return false;
  const { data } = await admin
    .from("suppressed_emails")
    .select("reason")
    .eq("email", recipient.toLowerCase())
    .maybeSingle();
  return !!data && data.reason !== "unsubscribe";
}

/**
 * Send one email and log the attempt.
 *
 * `admin` is a service-role client, used for the suppression check and the send
 * log; pass null and both are skipped (the mail still goes out).
 */
export async function deliverEmail(
  email: OutgoingEmail,
  admin: SupabaseClient | null,
): Promise<SendOutcome> {
  if (await isSuppressed(admin, email.to)) {
    console.warn("Refusing to send to a suppressed address", { label: email.label });
    return {
      ok: false,
      reason: "suppressed",
      message:
        `We can't deliver email to that address. Please use a different one, or write to ${SUPPORT_EMAIL}.`,
    };
  }

  const messageId = crypto.randomUUID();

  try {
    let providerMessageId = "";
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      providerMessageId = await sendViaResend(resendKey, email);
    } else {
      // No Resend key yet: keep the flows alive on the sender the rest of the
      // app already uses. Deliverability is not fixed until Resend is wired up
      // — see EMAIL_VERIFICATION_SETUP.md.
      console.warn("RESEND_API_KEY not set — falling back to the Lovable sender");
      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (!apiKey) throw new Error("Neither RESEND_API_KEY nor LOVABLE_API_KEY is set");
      const from = senderAddress();
      const domain = senderDomain(from);
      await sendLovableEmail(
        {
          to: email.to,
          // Required. Leaving it out is a 400 from the API, not a default.
          from,
          ...(domain ? { sender_domain: domain } : {}),
          subject: email.subject,
          html: email.html,
          text: email.text,
          reply_to: replyToAddress(),
          purpose: "transactional",
          label: email.label,
          message_id: messageId,
          idempotency_key: messageId,
        },
        { apiKey, sendUrl: Deno.env.get("LOVABLE_SEND_URL") },
      );
      providerMessageId = messageId;
    }

    await admin?.from("email_send_log").insert({
      message_id: providerMessageId || messageId,
      template_name: email.label,
      recipient_email: email.to,
      status: "sent",
    });

    return { ok: true, messageId: providerMessageId || messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to send email", { label: email.label, error: message });

    await admin?.from("email_send_log").insert({
      message_id: messageId,
      template_name: email.label,
      recipient_email: email.to,
      status: "failed",
      error_message: message.slice(0, 1000),
    });

    // Report the failure rather than swallowing it. A silent failure here is
    // precisely the bug being fixed: the app says "check your email" and the
    // person waits for something that was never sent.
    return {
      ok: false,
      reason: "failed",
      message: "We couldn't send that email just now. Please try again in a moment.",
    };
  }
}
