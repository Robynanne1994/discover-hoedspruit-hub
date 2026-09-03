// Admin broadcast: send an app update / announcement to every app user.
//
// Every user gets a business_notifications row (so the announcement always
// shows in their Notifications tab with the unread red dot). Whether it is
// also flagged for a device push is decided per-user from their preferences:
//   push = master push_enabled AND "App Updates & News" (hh_app_updates).
// Users without a notification_preferences row fall back to the column
// defaults (push_enabled = true, hh_app_updates = true), i.e. pushed.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) {
      return json({ error: "Invalid token" }, 401);
    }

    // Verify caller is admin.
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return json({ error: "Forbidden" }, 403);
    }

    const payload = await req.json().catch(() => ({}));
    const title = String(payload?.title ?? "").trim();
    const body = String(payload?.body ?? "").trim();
    const linkRaw = String(payload?.link ?? "").trim();
    const link = linkRaw.length ? linkRaw : null;

    if (!title) {
      return json({ error: "A title is required." }, 400);
    }

    // Pull all users (paginated up to 5000).
    const allUsers: { id: string }[] = [];
    let page = 1;
    const perPage = 200;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      allUsers.push(...data.users.map((u) => ({ id: u.id })));
      if (data.users.length < perPage) break;
      page++;
      if (page > 25) break;
    }

    if (allUsers.length === 0) {
      return json({ recipient_count: 0, pushed_count: 0 });
    }

    const ids = allUsers.map((u) => u.id);

    // Fetch preferences for all users in chunks (IN list limits).
    const prefMap = new Map<string, { push_enabled: boolean; hh_app_updates: boolean }>();
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);
      const { data: prefs, error: prefErr } = await admin
        .from("notification_preferences")
        .select("user_id, push_enabled, hh_app_updates")
        .in("user_id", chunk);
      if (prefErr) throw prefErr;
      (prefs ?? []).forEach((p: any) =>
        prefMap.set(p.user_id, {
          push_enabled: p.push_enabled,
          hh_app_updates: p.hh_app_updates,
        }),
      );
    }

    const rows = allUsers.map((u) => {
      const pref = prefMap.get(u.id);
      // No prefs row => column defaults (both true) => pushed.
      const pushEnabled = pref ? pref.push_enabled !== false : true;
      const appUpdates = pref ? pref.hh_app_updates !== false : true;
      return {
        user_id: u.id,
        kind: "app_update",
        status: "unread",
        title,
        body: body || null,
        link,
        push: pushEnabled && appUpdates,
        ref_table: "app_update_broadcasts",
        ref_id: null as string | null,
      };
    });

    const pushed_count = rows.filter((r) => r.push).length;

    // Log the broadcast first so we can stamp ref_id on every notification row.
    const { data: broadcast, error: bErr } = await admin
      .from("app_update_broadcasts")
      .insert({
        title,
        body: body || null,
        link,
        sent_by: userData.user.id,
        recipient_count: rows.length,
        pushed_count,
      })
      .select("id")
      .single();
    if (bErr) throw bErr;

    const broadcastId = broadcast.id as string;
    rows.forEach((r) => (r.ref_id = broadcastId));

    // Insert notification rows in chunks, getting the new ids back so the
    // pushable ones can be dispatched below.
    let inserted = 0;
    const pushableIds: string[] = [];
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { data: insertedRows, error: iErr } = await admin
        .from("business_notifications")
        .insert(chunk)
        .select("id, push");
      if (iErr) throw iErr;
      inserted += chunk.length;
      (insertedRows ?? []).forEach((r: any) => {
        if (r.push) pushableIds.push(r.id);
      });
    }

    // Dispatch the actual device push directly, rather than relying on the
    // DB trigger (dispatch_push_notification), which reads its target URL
    // and auth key from Supabase Vault — a one-time setup step that may not
    // be done yet. This function already has both values as env vars
    // (auto-injected into every edge function), so it can call send-push
    // itself with no extra configuration.
    const pushResults = await Promise.allSettled(
      pushableIds.map((id) =>
        fetch(`${supabaseUrl}/functions/v1/send-push`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ notification_id: id }),
        }),
      ),
    );
    const pushFailures = pushResults.filter((r) => r.status === "rejected").length;

    return json({
      broadcast_id: broadcastId,
      recipient_count: inserted,
      pushed_count,
      push_dispatch_failures: pushFailures,
    });
  } catch (err: any) {
    return json({ error: err?.message || "Unknown error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
