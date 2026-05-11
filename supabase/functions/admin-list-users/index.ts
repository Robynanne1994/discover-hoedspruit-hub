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

    const [{ data: profiles }, { data: roles }, { data: favCounts }] = await Promise.all([
      admin.from("profiles").select("*").in("id", ids),
      admin.from("user_roles").select("user_id, role").in("user_id", ids),
      admin.from("favourites").select("user_id").in("user_id", ids),
    ]);

    const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
    const rolesMap: Record<string, string[]> = {};
    (roles ?? []).forEach((r: any) => {
      rolesMap[r.user_id] = [...(rolesMap[r.user_id] ?? []), r.role];
    });
    const favMap: Record<string, number> = {};
    (favCounts ?? []).forEach((f: any) => {
      favMap[f.user_id] = (favMap[f.user_id] ?? 0) + 1;
    });

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
