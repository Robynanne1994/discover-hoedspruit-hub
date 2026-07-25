// Daily job: send reminder notifications 7/3/1 days before saved specials end.
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

  const offsets: Array<{ days: number; kind: string; title: (t: string) => string }> = [
    { days: 7, kind: "special_reminder_7d", title: (t) => `${t} ends in one week. Don't miss out!` },
    { days: 3, kind: "special_reminder_3d", title: (t) => `Only 3 days left to enjoy ${t}.` },
    { days: 1, kind: "special_reminder_1d", title: (t) => `Last chance! ${t} ends tomorrow.` },
  ];

  let inserted = 0;
  const errors: string[] = [];

  for (const off of offsets) {
    const target = new Date(today);
    target.setUTCDate(target.getUTCDate() + off.days);
    const dateStr = target.toISOString().slice(0, 10);

    const { data: specials, error: sErr } = await supabase
      .from("specials")
      .select("id, title, is_active")
      .eq("valid_until", dateStr);
    if (sErr) { errors.push(`specials ${off.days}d: ${sErr.message}`); continue; }
    const active = (specials ?? []).filter((s) => s.is_active !== false);
    if (!active.length) continue;

    for (const sp of active) {
      const { data: favs, error: fErr } = await supabase
        .from("favourites")
        .select("user_id, created_at")
        .eq("item_type", "special")
        .eq("item_id", sp.id);
      if (fErr) { errors.push(`favs ${sp.id}: ${fErr.message}`); continue; }
      if (!favs?.length) continue;

      const userIds = favs.map((f) => f.user_id);
      const savedAt = new Map(favs.map((f) => [f.user_id, new Date(f.created_at)]));

      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("user_id, push_enabled, specials_ending")
        .in("user_id", userIds);
      const okUsers = new Set(
        (prefs ?? [])
          .filter((p) => p.push_enabled !== false && p.specials_ending !== false)
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

      // Dedupe: skip users who already got this kind for this special.
      const { data: existing } = await supabase
        .from("business_notifications")
        .select("user_id")
        .eq("kind", off.kind)
        .eq("ref_table", "specials")
        .eq("ref_id", sp.id)
        .in("user_id", eligible);
      const already = new Set((existing ?? []).map((r) => r.user_id));

      const rows = eligible
        .filter((uid) => !already.has(uid))
        .map((uid) => ({
          user_id: uid,
          kind: off.kind,
          status: "unread",
          title: off.title(sp.title),
          body: "",
          link: `/specials/${sp.id}`,
          ref_table: "specials",
          ref_id: sp.id,
        }));

      if (rows.length) {
        const { error: iErr } = await supabase.from("business_notifications").insert(rows);
        if (iErr) errors.push(`insert ${sp.id} ${off.days}d: ${iErr.message}`);
        else inserted += rows.length;
      }
    }
  }

  return new Response(JSON.stringify({ inserted, errors }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
