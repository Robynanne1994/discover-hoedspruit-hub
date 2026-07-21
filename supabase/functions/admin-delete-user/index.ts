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

    const body = await req.json().catch(() => ({}));
    const targetId = body?.user_id as string | undefined;
    if (!targetId) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (targetId === userData.user.id) {
      return new Response(JSON.stringify({ error: "Cannot delete your own account here" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Best-effort cleanup of user-owned rows
    await admin.from("favourites").delete().eq("user_id", targetId);
    await admin.from("been_here").delete().eq("user_id", targetId);
    await admin.from("reviews").delete().eq("user_id", targetId);
    await admin.from("follows").delete().eq("follower_id", targetId);
    await admin.from("follows").delete().eq("following_id", targetId);
    await admin.from("notification_preferences").delete().eq("user_id", targetId);
    await admin.from("feedback").delete().eq("user_id", targetId);
    await admin.from("collection_items").delete().in(
      "collection_id",
      ((await admin.from("collections").select("id").eq("user_id", targetId)).data ?? []).map((c: any) => c.id),
    );
    await admin.from("collections").delete().eq("user_id", targetId);
    await admin.from("user_roles").delete().eq("user_id", targetId);
    await admin.from("user_blocks").delete().eq("blocker_id", targetId);
    await admin.from("user_blocks").delete().eq("blocked_id", targetId);
    await admin.from("user_reports").delete().eq("reporter_user_id", targetId);
    await admin.from("user_reports").delete().eq("reported_user_id", targetId);
    await admin.from("business_notifications").delete().eq("user_id", targetId);
    await admin.from("listing_edits_pending").delete().eq("owner_id", targetId);
    await admin.from("events_pending").delete().eq("owner_id", targetId);
    await admin.from("specials_pending").delete().eq("owner_id", targetId);
    await admin.from("admin_user_notes").delete().eq("user_id", targetId);
    await admin.from("moderation_actions").delete().eq("target_user_id", targetId);
    await admin.from("profiles").delete().eq("id", targetId);

    const { error: delErr } = await admin.auth.admin.deleteUser(targetId);
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
