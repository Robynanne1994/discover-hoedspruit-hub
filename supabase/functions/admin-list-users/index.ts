import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pull users (paginated up to 1000)
    const allUsers: any[] = [];
    let page = 1;
    const perPage = 200;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      allUsers.push(...data.users);
      if (data.users.length < perPage) break;
      page++;
      if (page > 25) break;
    }

    const ids = allUsers.map((u) => u.id);

    const [
      { data: profiles },
      { data: roles },
      { data: favCounts },
      { data: feedbackRows },
      { data: reportsFiled },
      { data: reportsReceived },
      { data: blocks },
      { data: listingEdits },
      { data: eventsPending },
      { data: specialsPending },
      { data: followers },
      { data: following },
      { data: notes },
    ] = await Promise.all([
      admin.from("profiles").select("*").in("id", ids),
      admin.from("user_roles").select("user_id, role").in("user_id", ids),
      admin.from("favourites").select("user_id").in("user_id", ids),
      admin.from("feedback").select("user_id").in("user_id", ids),
      admin.from("user_reports").select("reporter_user_id").in("reporter_user_id", ids),
      admin.from("user_reports").select("reported_user_id").in("reported_user_id", ids),
      admin.from("user_blocks").select("blocker_id").in("blocker_id", ids),
      admin.from("listing_edits_pending").select("owner_id").in("owner_id", ids),
      admin.from("events_pending").select("owner_id").in("owner_id", ids),
      admin.from("specials_pending").select("owner_id").in("owner_id", ids),
      admin.from("follows").select("following_id").in("following_id", ids).eq("status", "accepted"),
      admin.from("follows").select("follower_id").in("follower_id", ids).eq("status", "accepted"),
      admin.from("admin_user_notes").select("user_id, note").in("user_id", ids),
    ]);

    const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
    const rolesMap: Record<string, string[]> = {};
    (roles ?? []).forEach((r: any) => {
      rolesMap[r.user_id] = [...(rolesMap[r.user_id] ?? []), r.role];
    });
    const count = (rows: any[] | null, key: string) => {
      const m: Record<string, number> = {};
      (rows ?? []).forEach((r: any) => {
        const id = r[key];
        if (id) m[id] = (m[id] ?? 0) + 1;
      });
      return m;
    };
    const favMap = count(favCounts, "user_id");
    const feedbackMap = count(feedbackRows, "user_id");
    const reportsFiledMap = count(reportsFiled, "reporter_user_id");
    const reportsReceivedMap = count(reportsReceived, "reported_user_id");
    const blocksMap = count(blocks, "blocker_id");
    const listingEditsMap = count(listingEdits, "owner_id");
    const eventsPendingMap = count(eventsPending, "owner_id");
    const specialsPendingMap = count(specialsPending, "owner_id");
    const followersMap = count(followers, "following_id");
    const followingMap = count(following, "follower_id");
    const notesMap = Object.fromEntries((notes ?? []).map((n: any) => [n.user_id, n.note]));

    const users = allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
      provider: u.app_metadata?.provider ?? null,
      providers: u.app_metadata?.providers ?? [],
      profile: profileMap[u.id] ?? null,
      roles: rolesMap[u.id] ?? [],
      favourites_count: favMap[u.id] ?? 0,
      feedback_count: feedbackMap[u.id] ?? 0,
      reports_filed_count: reportsFiledMap[u.id] ?? 0,
      reports_received_count: reportsReceivedMap[u.id] ?? 0,
      blocks_count: blocksMap[u.id] ?? 0,
      listing_edits_count: listingEditsMap[u.id] ?? 0,
      events_pending_count: eventsPendingMap[u.id] ?? 0,
      specials_pending_count: specialsPendingMap[u.id] ?? 0,
      followers_count: followersMap[u.id] ?? 0,
      following_count: followingMap[u.id] ?? 0,
      admin_note: notesMap[u.id] ?? "",
    }));

    users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return new Response(JSON.stringify({ users }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
