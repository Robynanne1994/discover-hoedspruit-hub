// Daily job: send reminder notifications 7/3/1 days before saved events.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const offsets: Array<{ days: number; kind: string; title: (t: string) => string; body: (t: string) => string }> = [
    { days: 7, kind: "event_reminder_7d", title: (t) => `Your saved event, ${t}, is one week away!`, body: () => "" },
    { days: 3, kind: "event_reminder_3d", title: (t) => `Only 3 days until ${t}. Don't forget!`, body: () => "" },
    { days: 1, kind: "event_reminder_1d", title: (t) => `${t} is tomorrow. See you there!`, body: () => "" },
  ];

  let inserted = 0;
  const errors: string[] = [];

  for (const off of offsets) {
    const target = new Date(today);
    target.setUTCDate(target.getUTCDate() + off.days);
    const dateStr = target.toISOString().slice(0, 10);

    const { data: events, error: evErr } = await supabase
      .from("events")
      .select("id, title")
      .eq("start_date", dateStr);
    if (evErr) { errors.push(`events ${off.days}d: ${evErr.message}`); continue; }
    if (!events?.length) continue;

    for (const ev of events) {
      const { data: favs, error: fErr } = await supabase
        .from("favourites")
        .select("user_id, created_at")
        .eq("item_type", "event")
        .eq("item_id", ev.id);
      if (fErr) { errors.push(`favs ${ev.id}: ${fErr.message}`); continue; }
      if (!favs?.length) continue;

      const userIds = favs.map((f) => f.user_id);
      const savedAt = new Map(favs.map((f) => [f.user_id, new Date(f.created_at)]));

      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("user_id, push_enabled, events_reminders")
        .in("user_id", userIds);
      const okUsers = new Set(
        (prefs ?? [])
          .filter((p) => p.push_enabled !== false && p.events_reminders !== false)
          .map((p) => p.user_id),
      );
      // Users without a prefs row default to enabled (defaults are true).
      for (const uid of userIds) if (!prefs?.some((p) => p.user_id === uid)) okUsers.add(uid);

      // Skip if saved after the reminder window (e.g. saved 2 days before -> skip 7d & 3d).
      const eligible = [...okUsers].filter((uid) => {
        const sAt = savedAt.get(uid);
        if (!sAt) return false;
        const daysUntil = Math.ceil((target.getTime() - sAt.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil >= off.days;
      });
      if (!eligible.length) continue;

      // Dedupe: skip users who already got this kind for this event.
      const { data: existing } = await supabase
        .from("business_notifications")
        .select("user_id")
        .eq("kind", off.kind)
        .eq("ref_table", "events")
        .eq("ref_id", ev.id)
        .in("user_id", eligible);
      const already = new Set((existing ?? []).map((r) => r.user_id));

      const rows = eligible
        .filter((uid) => !already.has(uid))
        .map((uid) => ({
          user_id: uid,
          kind: off.kind,
          status: "unread",
          title: off.title(ev.title),
          body: off.body(ev.title),
          link: `/events/${ev.id}`,
          ref_table: "events",
          ref_id: ev.id,
        }));

      if (rows.length) {
        const { error: iErr } = await supabase.from("business_notifications").insert(rows);
        if (iErr) errors.push(`insert ${ev.id} ${off.days}d: ${iErr.message}`);
        else inserted += rows.length;
      }
    }
  }

  return new Response(JSON.stringify({ inserted, errors }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
