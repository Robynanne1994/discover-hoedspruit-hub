import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const PAGE_BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED = "#9C9387";
const LINE = "#EAE4D5";

const statusLabel = (s: string) => {
  if (s === "pending") return "Pending review";
  if (s === "resolved") return "Resolved";
  if (s === "dismissed") return "Dismissed";
  return s;
};

const AccountReported = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const { data: reports } = useQuery({
    queryKey: ["user-reported", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_reports")
        .select("id, reported_user_id, reason, status, created_at")
        .eq("reporter_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (data ?? []).map((r: any) => r.reported_user_id);
      if (ids.length === 0) return [];
      const { data: profs } = await supabase.rpc("get_public_profiles", { _ids: ids });
      const map = new Map(((profs as any[]) ?? []).map((p: any) => [p.id, p]));
      return (data ?? []).map((r: any) => ({ ...r, profile: map.get(r.reported_user_id) }));
    },
  });

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, paddingBottom: 100, fontFamily: FF }}>
      <PageHeader title="Reported" />
      <div style={{ padding: "16px 20px 0" }}>
        {(!reports || reports.length === 0) ? (
          <div style={{ background: CARD, borderRadius: 16, padding: "20px", fontFamily: FF, fontSize: 14, color: MUTED, textAlign: "center" }}>
            You haven't reported anyone.
          </div>
        ) : (
          <div style={{ background: CARD, borderRadius: 16, padding: "4px 20px" }}>
            {reports.map((r: any, i: number) => (
              <div
                key={r.id}
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
                    backgroundImage: r.profile?.avatar_url ? `url(${r.profile.avatar_url})` : undefined,
                    backgroundSize: "cover", backgroundPosition: "center",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FF, fontSize: 15, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.profile?.display_name || r.profile?.username || "User"}
                  </div>
                  <div style={{ fontFamily: FF, fontSize: 12.5, color: MUTED, marginTop: 2 }}>
                    {r.reason} · {statusLabel(r.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountReported;
