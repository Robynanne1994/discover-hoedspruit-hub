import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { MUTED as TOKEN_MUTED } from "@/lib/type";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Bricolage Grotesque', 'Helvetica Neue', sans-serif";

const PAGE_BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED = TOKEN_MUTED;
const LINE = "#EAE4D5";

const ACTION_TITLES: Record<string, string> = {
  warn: "Account Warning",
  suspend: "Account Suspended",
  ban: "Account Banned",
  content_removed: "Content Removed",
  unsuspend: "Account Restored",
  unban: "Account Restored",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const AccountNotices = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/my-profile-guest", { replace: true });
  }, [user, loading, navigate]);

  const { data: actions, isLoading } = useQuery({
    queryKey: ["moderation-actions", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moderation_actions")
        .select("id, action, reason, duration_days, created_at")
        .eq("target_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-moderation", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("moderation_status, suspended_until")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  // Mark related moderation notifications as read once viewed
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("business_notifications")
      .update({ is_read: true, status: "read" } as any)
      .eq("user_id", user.id)
      .eq("kind", "moderation")
      .eq("is_read", false)
      .then(() => {});
  }, [user?.id]);

  const currentStatus = (profile as any)?.moderation_status as string | undefined;

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, paddingBottom: 100, fontFamily: FF }}>
      <PageHeader title="Account Notices" />

      <div style={{ padding: "16px 20px 0" }}>
        {currentStatus && currentStatus !== "active" && (
          <div
            style={{
              background: "#FDECEC",
              border: "1px solid #F5CBCB",
              borderRadius: 12,
              padding: "12px 14px",
              marginBottom: 16,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <ShieldAlert size={18} color="#B42318" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontFamily: FF, fontSize: 13, color: "#B42318", lineHeight: 1.4 }}>
              {currentStatus === "suspended" && (profile as any)?.suspended_until
                ? `Your account is currently suspended until ${formatDate((profile as any).suspended_until)}.`
                : currentStatus === "banned"
                ? "Your account is currently banned."
                : "Your account has an active notice."}
            </div>
          </div>
        )}

        {isLoading ? (
          <div style={{ fontFamily: FF, fontSize: 13, color: MUTED, padding: "24px 4px" }}>
            Loading…
          </div>
        ) : !actions || actions.length === 0 ? (
          <div
            style={{
              background: CARD,
              borderRadius: 20,
              padding: "40px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                background: "#F2EFE5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
              }}
            >
              <ShieldCheck size={26} color="#715A3D" strokeWidth={1.75} />
            </div>
            <p
              style={{
                fontFamily: HEAD,
                fontSize: 18,
                fontWeight: 700,
                color: INK,
                letterSpacing: "-0.2px",
                margin: "0 0 6px",
              }}
            >
              No account notices
            </p>
            <p style={{ fontFamily: FF, fontSize: 14, color: MUTED, margin: 0 }}>
              Your account is in good standing.
            </p>
          </div>
        ) : (

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {actions
              .filter((a: any) => a.action !== "dismissed")
              .map((a: any) => {
                const title = ACTION_TITLES[a.action] || "Account Notice";
                const suspendedUntil =
                  a.action === "suspend" && a.duration_days
                    ? new Date(new Date(a.created_at).getTime() + a.duration_days * 86400000)
                    : null;
                return (
                  <div
                    key={a.id}
                    style={{
                      background: CARD,
                      borderRadius: 16,
                      padding: "16px 18px",
                      border: `1px solid ${LINE}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 12,
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: FF,
                          fontSize: 15,
                          fontWeight: 700,
                          color: INK,
                        }}
                      >
                        {title}
                      </div>
                      <div style={{ fontFamily: FF, fontSize: 12, color: MUTED, flexShrink: 0 }}>
                        {formatDate(a.created_at)}
                      </div>
                    </div>
                    {a.reason && (
                      <div
                        style={{
                          fontFamily: FF,
                          fontSize: 14,
                          color: INK,
                          lineHeight: 1.5,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {a.reason}
                      </div>
                    )}
                    {suspendedUntil && (
                      <div
                        style={{
                          fontFamily: FF,
                          fontSize: 12.5,
                          color: MUTED,
                          marginTop: 8,
                        }}
                      >
                        Until {formatDate(suspendedUntil.toISOString())}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        <p
          style={{
            fontFamily: FF,
            fontSize: 12.5,
            color: MUTED,
            lineHeight: 1.5,
            margin: "20px 4px 0",
          }}
        >
          Notices from the Hello Hoedspruit moderation team appear here. If you believe a notice was
          issued in error, please contact support from the{" "}
          <a
            href="/help-centre"
            onClick={(e) => {
              e.preventDefault();
              navigate("/help-centre");
            }}
            style={{ color: "#715A3D", fontWeight: 700, textDecoration: "none" }}
          >
            Help Centre
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default AccountNotices;
