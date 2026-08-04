// Standard Webhooks signature verification, as Supabase Auth signs its hooks.
//
// This is the only thing standing between the send-auth-email function and an
// open endpoint that will email an attacker-chosen six-digit login code to an
// attacker-chosen address on request. It is kept here, separate from the
// function, for two reasons: nothing in it touches a Deno API, so it can be
// unit-tested in the app's own vitest run (see src/test/authEmailHook.test.ts),
// and the function is left with no security logic of its own to get wrong.
//
// Uses Web Crypto only — available in Deno, in Node 18+, and in the browser.
//
// The scheme: HMAC-SHA256 over "<id>.<timestamp>.<body>", base64-encoded, with
// the key being the base64-decoded secret. See https://www.standardwebhooks.com
/** Reject a webhook whose timestamp is further than this from now. */
export const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;
/** Pull the Standard Webhooks headers off a request. */
export function readSignatureHeaders(headers) {
    return {
        id: headers.get("webhook-id"),
        timestamp: headers.get("webhook-timestamp"),
        signature: headers.get("webhook-signature"),
    };
}
function timingSafeEqual(a, b) {
    // Compare every character even once a mismatch is known, so the time taken
    // doesn't reveal how much of a guessed signature was correct.
    if (a.length !== b.length)
        return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++)
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}
function base64ToBytes(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++)
        bytes[i] = binary.charCodeAt(i);
    return bytes;
}
function bytesToBase64(buffer) {
    const view = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < view.length; i++)
        binary += String.fromCharCode(view[i]);
    return btoa(binary);
}
/**
 * Strip the "v1,whsec_" decoration Supabase stores the secret with, leaving the
 * base64 key material.
 */
export function normaliseSecret(secret) {
    return secret.trim().replace(/^v1,\s*/, "").replace(/^whsec_/, "").trim();
}
/** Compute the expected signature for a payload. Exported for tests. */
export async function signPayload(secret, id, timestamp, body) {
    const key = await crypto.subtle.importKey("raw", base64ToBytes(normaliseSecret(secret)).buffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${body}`));
    return bytesToBase64(mac);
}
/**
 * Verify a signed webhook.
 *
 * Resolves to null when the request is authentic, or a short reason when it is
 * not. Callers must treat any non-null result as fatal — never as a warning.
 */
export async function verifyWebhookSignature(secret, headers, body, now = Date.now()) {
    const { id, timestamp, signature } = headers;
    if (!id || !timestamp || !signature)
        return "Missing webhook signature headers";
    const sentAt = Number(timestamp);
    if (!Number.isFinite(sentAt))
        return "Malformed webhook timestamp";
    // Bounds the replay window: without it a captured request could re-send a
    // code indefinitely.
    if (Math.abs(now / 1000 - sentAt) > SIGNATURE_TOLERANCE_SECONDS) {
        return "Webhook timestamp outside tolerance";
    }
    let expected;
    try {
        expected = await signPayload(secret, id, timestamp, body);
    }
    catch {
        return "Hook secret is not valid base64";
    }
    // The header carries a space-separated list of "<version>,<signature>" pairs
    // so a secret can be rotated without downtime. Any one match is enough.
    const provided = signature
        .split(" ")
        .map((part) => part.split(",")[1] ?? "")
        .filter(Boolean);
    if (!provided.some((candidate) => timingSafeEqual(candidate, expected))) {
        return "Webhook signature mismatch";
    }
    return null;
}
