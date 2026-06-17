import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const PAGE_BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED = "#9C9387";
const LINE = "#EAE4D5";

const AccountBlocked = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const { data: blocks } = useQuery({
    queryKey: ["user-blocks", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_blocks")
        .select("id, blocked_id, created_at")
        .eq("blocker_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (data ?? []).map((b: any) => b.blocked_id);
      if (ids.length === 0) return [];
      const { data: profs } = await supabase.rpc("get_public_profiles", { _ids: ids });
      const map = new Map(((profs as any[]) ?? []).map((p: any) => [p.id, p]));
      return (data ?? []).map((b: any) => ({ ...b, profile: map.get(b.blocked_id) }));
    },
  });

  const unblock = async (id: string) => {
    const { error } = await supabase.from("user_blocks").delete().eq("id", id);
    if (error) {
      toast.error("Could not unblock. Please try again.");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["user-blocks"] });
    toast.success("Unblocked.");
  };

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, paddingBottom: 100, fontFamily: FF }}>
      <PageHeader title="Blocked" />
      <div style={{ padding: "16px 20px 0" }}>
        {(!blocks || blocks.length === 0) ? (
          <div style={{ background: CARD, borderRadius: 16, padding: "20px", fontFamily: FF, fontSize: 14, color: MUTED, textAlign: "center" }}>
            You haven't blocked anyone.
          </div>
        ) : (
          <div style={{ background: CARD, borderRadius: 16, padding: "4px 20px" }}>
            {blocks.map((b: any, i: number) => (
              <div
                key={b.id}
                style={{
                  borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
                  padding: "14px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "#EAE4D5", flexShrink: 0,
                    backgroundImage: b.profile?.avatar_url ? `url(${b.profile.avatar_url})` : undefined,
                    backgroundSize: "cover", backgroundPosition: "center",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FF, fontSize: 15, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {b.profile?.display_name || b.profile?.username || "User"}
                  </div>
                  {b.profile?.username && (
                    <div style={{ fontFamily: FF, fontSize: 12.5, color: MUTED }}>@{b.profile.username}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => unblock(b.id)}
                  style={{
                    fontFamily: FF, fontSize: 13, color: "#715a3d",
                    background: "transparent", border: `1px solid #715a3d`,
                    borderRadius: 999, padding: "6px 14px", cursor: "pointer",
                  }}
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountBlocked;
