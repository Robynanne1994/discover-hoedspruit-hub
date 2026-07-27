// Delivers a single business_notifications row to the recipient's registered
// devices as a real phone push:
//   * Android tokens  -> Firebase Cloud Messaging (HTTP v1)
//   * iOS tokens      -> Apple Push Notification service (token-based / .p8)
//
// Invoked server-to-server by the dispatch_push_notification() DB trigger with
// the service-role key as a bearer token. Also accepts the Supabase Database
// Webhook payload shape ({ record: {...} }) if you wire it up that way instead.
//
// Required edge-function secrets (see MOBILE_PUSH_SETUP.md):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (provided automatically)
//   FCM_SERVICE_ACCOUNT   — the full Firebase service-account JSON (as a string)
//   APNS_KEY              — contents of the AuthKey_XXXX.p8 file
//   APNS_KEY_ID           — the .p8 Key ID
//   APNS_TEAM_ID          — your Apple Developer Team ID
//   APNS_BUNDLE_ID        — the iOS app bundle id (e.g. za.co.hellohoedspruit.app)
//   APNS_HOST             — optional; api.push.apple.com (default) or
//                           api.sandbox.push.apple.com for development builds
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const auth = req.headers.get("Authorization") || "";
    if (auth !== `Bearer ${serviceKey}`) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

    const payload = await req.json().catch(() => ({} as any));
    // Support both the trigger payload and a Supabase Database Webhook payload.
    const notifId = payload?.notification_id ?? payload?.record?.id;
    if (!notifId) return json({ error: "notification_id required" }, 400);

    const { data: notif } = await supabase
      .from("business_notifications")
      .select("id,user_id,title,body,link,kind,push")
      .eq("id", notifId)
      .maybeSingle();

    if (!notif) return json({ error: "notification not found" }, 404);
    if (notif.push !== true) return json({ skipped: "push flag is not true" });

    const { data: devices } = await supabase
      .from("push_devices")
      .select("token,platform")
      .eq("user_id", notif.user_id);

    if (!devices?.length) return json({ sent: 0, reason: "no registered devices" });

    const androidTokens = devices.filter((d) => d.platform === "android").map((d) => d.token);
    const iosTokens = devices.filter((d) => d.platform === "ios").map((d) => d.token);
    // Unknown-platform tokens are attempted via FCM (the common case on Android).
    const otherTokens = devices
      .filter((d) => d.platform !== "android" && d.platform !== "ios")
      .map((d) => d.token);

    const title = notif.title || "Hello Hoedspruit";
    const body = notif.body || "";
    const data = {
      link: notif.link ?? "",
      notification_id: String(notif.id),
      kind: notif.kind ?? "",
    };

    let sent = 0;
    const stale: string[] = [];
    const errors: string[] = [];

    const fcmTokens = [...androidTokens, ...otherTokens];
    if (fcmTokens.length) {
      const r = await sendFcm(fcmTokens, title, body, data);
      sent += r.sent;
      stale.push(...r.stale);
      errors.push(...r.errors);
    }
    if (iosTokens.length) {
      const r = await sendApns(iosTokens, title, body, data);
      sent += r.sent;
      stale.push(...r.stale);
      errors.push(...r.errors);
    }

    // Prune tokens the push services reported as dead so we stop retrying them.
    if (stale.length) {
      await supabase.from("push_devices").delete().in("token", stale);
    }

    return json({ sent, removed: stale.length, errors });
  } catch (err: any) {
    return json({ error: err?.message || String(err) }, 500);
  }
});

// ---------------------------------------------------------------------------
// Firebase Cloud Messaging (Android)
// ---------------------------------------------------------------------------
async function sendFcm(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<{ sent: number; stale: string[]; errors: string[] }> {
  const saJson = Deno.env.get("FCM_SERVICE_ACCOUNT");
  if (!saJson) return { sent: 0, stale: [], errors: ["FCM_SERVICE_ACCOUNT not set"] };

  let sa: any;
  try {
    sa = JSON.parse(saJson);
  } catch {
    return { sent: 0, stale: [], errors: ["FCM_SERVICE_ACCOUNT is not valid JSON"] };
  }

  let accessToken: string;
  try {
    accessToken = await getGoogleAccessToken(sa);
  } catch (e: any) {
    return { sent: 0, stale: [], errors: [`FCM auth failed: ${e?.message ?? e}`] };
  }

  const projectId = sa.project_id;
  const endpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  let sent = 0;
  const stale: string[] = [];
  const errors: string[] = [];

  for (const token of tokens) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data,
          android: { priority: "HIGH", notification: { sound: "default" } },
        },
      }),
    });

    if (res.ok) {
      sent++;
    } else {
      const t = await res.text();
      if (res.status === 404 || /UNREGISTERED|NOT_FOUND|INVALID_ARGUMENT/i.test(t)) {
        stale.push(token);
      } else {
        errors.push(`fcm ${res.status}: ${t.slice(0, 180)}`);
      }
    }
  }

  return { sent, stale, errors };
}

async function getGoogleAccessToken(sa: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64urlJson(header)}.${b64urlJson(claim)}`;
  const key = await importPkcs8(sa.private_key, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" });
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${b64urlBytes(new Uint8Array(sig))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:
      "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" +
      encodeURIComponent(jwt),
  });
  const j = await res.json();
  if (!j.access_token) throw new Error("token exchange failed: " + JSON.stringify(j));
  return j.access_token as string;
}

// ---------------------------------------------------------------------------
// Apple Push Notification service (iOS)
// ---------------------------------------------------------------------------
async function sendApns(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<{ sent: number; stale: string[]; errors: string[] }> {
  const p8 = Deno.env.get("APNS_KEY");
  const keyId = Deno.env.get("APNS_KEY_ID");
  const teamId = Deno.env.get("APNS_TEAM_ID");
  const bundleId = Deno.env.get("APNS_BUNDLE_ID");
  const host = Deno.env.get("APNS_HOST") || "api.push.apple.com";
  if (!p8 || !keyId || !teamId || !bundleId) {
    return { sent: 0, stale: [], errors: ["APNS_* secrets not fully set"] };
  }

  let jwt: string;
  try {
    jwt = await makeApnsJwt(p8, keyId, teamId);
  } catch (e: any) {
    return { sent: 0, stale: [], errors: [`APNs auth failed: ${e?.message ?? e}`] };
  }

  const payload = JSON.stringify({
    aps: { alert: { title, body }, sound: "default" },
    link: data.link,
    notification_id: data.notification_id,
    kind: data.kind,
  });

  let sent = 0;
  const stale: string[] = [];
  const errors: string[] = [];

  for (const token of tokens) {
    const res = await fetch(`https://${host}/3/device/${token}`, {
      method: "POST",
      headers: {
        authorization: `bearer ${jwt}`,
        "apns-topic": bundleId,
        "apns-push-type": "alert",
        "apns-priority": "10",
      },
      body: payload,
    });

    if (res.ok) {
      sent++;
    } else {
      const t = await res.text();
      if (res.status === 410 || /BadDeviceToken|Unregistered/i.test(t)) {
        stale.push(token);
      } else {
        errors.push(`apns ${res.status}: ${t.slice(0, 180)}`);
      }
    }
  }

  return { sent, stale, errors };
}

async function makeApnsJwt(p8: string, keyId: string, teamId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const claim = { iss: teamId, iat: now };
  const unsigned = `${b64urlJson(header)}.${b64urlJson(claim)}`;
  const key = await importPkcs8(p8, { name: "ECDSA", namedCurve: "P-256" });
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${b64urlBytes(new Uint8Array(sig))}`;
}

// ---------------------------------------------------------------------------
// Shared crypto / encoding helpers
// ---------------------------------------------------------------------------
async function importPkcs8(pem: string, algo: any): Promise<CryptoKey> {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der, algo, false, ["sign"]);
}

function b64urlJson(obj: unknown): string {
  return b64urlBytes(new TextEncoder().encode(JSON.stringify(obj)));
}

function b64urlBytes(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
