// Tests for the two pieces of the auth email hook that carry real risk:
// the signature check that keeps the endpoint from emailing login codes to
// anyone who asks, and the templates that have to contain the six-digit code
// the app prompts for.
//
// Both modules live under supabase/functions/_shared/ and are deliberately free
// of Deno APIs so they can be exercised here rather than only in production.
import { describe, expect, it } from "vitest";
import {
  SIGNATURE_TOLERANCE_SECONDS,
  normaliseSecret,
  signPayload,
  verifyWebhookSignature,
} from "../../supabase/functions/_shared/verifyWebhookSignature.ts";
import {
  renderAuthEmail,
  type AuthEmailAction,
} from "../../supabase/functions/_shared/authEmailTemplates.ts";

// A base64 secret shaped the way Supabase stores one.
const SECRET = "v1,whsec_c3VwZXJzZWNyZXRrZXltYXRlcmlhbGZvcnRlc3Rz";
const ID = "msg_2abc";
const BODY = JSON.stringify({ user: { email: "a@b.com" }, email_data: { token: "402918" } });

const now = 1_770_000_000_000;
const ts = String(Math.floor(now / 1000));

const headers = (over: Partial<Record<"id" | "timestamp" | "signature", string | null>> = {}) => ({
  id: ID,
  timestamp: ts,
  signature: null,
  ...over,
});

async function validHeaders() {
  const sig = await signPayload(SECRET, ID, ts, BODY);
  return headers({ signature: `v1,${sig}` });
}

describe("verifyWebhookSignature", () => {
  it("accepts a correctly signed request", async () => {
    expect(await verifyWebhookSignature(SECRET, await validHeaders(), BODY, now)).toBeNull();
  });

  it("rejects a tampered body", async () => {
    const h = await validHeaders();
    const tampered = JSON.stringify({
      user: { email: "attacker@example.com" },
      email_data: { token: "402918" },
    });
    expect(await verifyWebhookSignature(SECRET, h, tampered, now)).toBe(
      "Webhook signature mismatch",
    );
  });

  it("rejects a signature made with a different secret", async () => {
    const sig = await signPayload("v1,whsec_" + btoa("a different key entirely"), ID, ts, BODY);
    const result = await verifyWebhookSignature(SECRET, headers({ signature: `v1,${sig}` }), BODY, now);
    expect(result).toBe("Webhook signature mismatch");
  });

  it("rejects a request with no signature headers", async () => {
    expect(await verifyWebhookSignature(SECRET, headers(), BODY, now)).toBe(
      "Missing webhook signature headers",
    );
  });

  it("rejects an empty signature list", async () => {
    expect(await verifyWebhookSignature(SECRET, headers({ signature: "" }), BODY, now)).toBe(
      "Missing webhook signature headers",
    );
  });

  it("rejects a replayed request from outside the tolerance window", async () => {
    const h = await validHeaders();
    const wayLater = now + (SIGNATURE_TOLERANCE_SECONDS + 60) * 1000;
    expect(await verifyWebhookSignature(SECRET, h, BODY, wayLater)).toBe(
      "Webhook timestamp outside tolerance",
    );
  });

  it("accepts a request still inside the tolerance window", async () => {
    const h = await validHeaders();
    const slightlyLater = now + (SIGNATURE_TOLERANCE_SECONDS - 30) * 1000;
    expect(await verifyWebhookSignature(SECRET, h, BODY, slightlyLater)).toBeNull();
  });

  it("rejects a non-numeric timestamp", async () => {
    const h = await validHeaders();
    expect(await verifyWebhookSignature(SECRET, { ...h, timestamp: "not-a-time" }, BODY, now)).toBe(
      "Malformed webhook timestamp",
    );
  });

  it("accepts when the matching signature is one of several offered", async () => {
    const sig = await signPayload(SECRET, ID, ts, BODY);
    const h = headers({ signature: `v1,AAAAstalesignatureAAAA= v1,${sig}` });
    expect(await verifyWebhookSignature(SECRET, h, BODY, now)).toBeNull();
  });

  it("strips the v1/whsec decoration from the stored secret", () => {
    expect(normaliseSecret("v1,whsec_abc123")).toBe("abc123");
    expect(normaliseSecret("whsec_abc123")).toBe("abc123");
    expect(normaliseSecret("  abc123  ")).toBe("abc123");
  });
});

describe("renderAuthEmail", () => {
  const base = { token: "402918", confirmationUrl: "https://example.com/verify?token=x", ttlMinutes: 15 };
  const actions: AuthEmailAction[] = [
    "signup",
    "recovery",
    "email_change",
    "magiclink",
    "invite",
    "reauthentication",
  ];

  // The bug that started all of this: the app asks for six digits, and the
  // stock provider template is link-only, so the digits were never in the mail.
  it.each(actions)("puts the code in the subject, the HTML and the text for %s", (action) => {
    const { subject, html, text } = renderAuthEmail({ ...base, action });
    expect(subject).toContain("402918");
    expect(html).toContain("402918");
    expect(text).toContain("402918");
  });

  // A plain-text alternative is one of the strongest signals against being
  // filed as spam, and it is what a mail client shows when it refuses the HTML.
  it.each(actions)("always produces a non-trivial plain-text part for %s", (action) => {
    const { text } = renderAuthEmail({ ...base, action });
    expect(text.length).toBeGreaterThan(80);
    expect(text).not.toContain("<");
  });

  it("states the expiry it was given", () => {
    expect(renderAuthEmail({ ...base, action: "signup" }).html).toContain("15 minutes");
    expect(renderAuthEmail({ ...base, action: "signup", ttlMinutes: 60 }).text).toContain(
      "60 minutes",
    );
  });

  it("renders no link at all when there isn't one, rather than a dead href", () => {
    const { html, text } = renderAuthEmail({ ...base, action: "signup", confirmationUrl: null });
    expect(html).not.toContain("<a href");
    expect(text).not.toContain("http");
  });

  // Reauthentication is confirm-in-place; a link would be meaningless.
  it("renders no link for reauthentication even when one is supplied", () => {
    const { html } = renderAuthEmail({ ...base, action: "reauthentication" });
    expect(html).not.toContain("<a href");
  });

  it("keeps the email to a single link, so it doesn't read as a redirect chain", () => {
    for (const action of actions) {
      const { html } = renderAuthEmail({ ...base, action });
      expect((html.match(/<a href/g) ?? []).length).toBeLessThanOrEqual(1);
    }
  });

  it("embeds no remote content for a filter to distrust", () => {
    const { html } = renderAuthEmail({ ...base, action: "signup" });
    expect(html).not.toMatch(/<img|background-image|@import|<script/i);
  });

  it("escapes anything interpolated into the HTML", () => {
    const { html } = renderAuthEmail({
      ...base,
      action: "signup",
      confirmationUrl: 'https://x.test/?a="><script>alert(1)</script>',
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("distinguishes a password reset from a signup in its wording", () => {
    expect(renderAuthEmail({ ...base, action: "recovery" }).subject).toMatch(/password reset/i);
    expect(renderAuthEmail({ ...base, action: "signup" }).subject).toMatch(/verification/i);
  });
});
