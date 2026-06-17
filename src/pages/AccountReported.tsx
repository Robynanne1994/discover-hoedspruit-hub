import { CSSProperties, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const PAGE_BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED = "#9C9387";
const LINE = "#EAE4D5";
const BROWN = "#715a3d";

type Status = "pending" | "reviewed" | "resolved" | "dismissed";

const STATUS_META: Record<string, { label: string; bg: string; ink: string }> = {
  pending: { label: "Pending review", bg: "#FEF3C7", ink: "#7C4A03" },
  reviewed: { label: "Reviewed — action taken", bg: "#DCFCE7", ink: "#14532D" },
  resolved: { label: "Resolved", bg: "#DCFCE7", ink: "#14532D" },
  dismissed: { label: "No action needed", bg: "#E5E7EB", ink: "#374151" },
};

const ACTION_LABEL: Record<string, string> = {
  none: "No action",
  warned: "User warned",
  suspended: "User suspended",
  banned: "User banned",
  content_removed: "Content removed",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const StatusPill = ({ status }: { status: string }) => {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: FF,
        fontSize: 11.5,
        fontWeight: 500,
        letterSpacing: "0.02em",
        background: meta.bg,
        color: meta.ink,
        padding: "3px 9px",
        borderRadius: 999,
      }}
    >
      {meta.label}
    </span>
  );
};

const ReportDetailSheet = ({
  open,
  onClose,
  report,
}: {
  open: boolean;
  onClose: () => void;
  report: any | null;
}) => {
  if (!open || !report) return null;
  const label =
    report.profile?.display_name || report.profile?.username || "User";
  const handle = report.profile?.username ? `@${report.profile.username}` : null;

  const labelStyle: CSSProperties = {
    fontFamily: FF,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: BROWN,
    marginBottom: 6,
    display: "block",
  };
  const valueStyle: CSSProperties = {
    fontFamily: FF,
    fontSize: 14.5,
    color: INK,
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    margin: 0,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(10,10,10,0.4)",
        display: "flex",
        alignItems: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          fontFamily: FF,
          width: "100%",
          background: "#ffffff",
          borderRadius: "20px 20px 0 0",
          padding: "20px 20px 32px",
          animation: "rd-slide-up 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <style>{`@keyframes rd-slide-up { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              color: MUTED,
              textTransform: "uppercase",
            }}
          >
            Your report
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}
          >
            <X size={20} color={INK} strokeWidth={1.75} />
          </button>
        </div>

        <h2
          style={{
            fontFamily: FF,
            fontWeight: 400,
            fontSize: 22,
            color: INK,
            margin: "0 0 4px",
          }}
        >
          Report on {label}
        </h2>
        {handle && (
          <p style={{ fontFamily: FF, fontSize: 13, color: MUTED, margin: "0 0 16px" }}>
            {handle}
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <span style={labelStyle}>Status</span>
            <StatusPill status={report.status} />
          </div>

          <div>
            <span style={labelStyle}>Reason</span>
            <p style={valueStyle}>{report.reason}</p>
          </div>

          <div>
            <span style={labelStyle}>What you wrote</span>
            <p style={valueStyle}>{report.detail || "—"}</p>
          </div>

          {report.action_taken && report.action_taken !== "none" && (
            <div>
              <span style={labelStyle}>Outcome</span>
              <p style={valueStyle}>{ACTION_LABEL[report.action_taken] ?? report.action_taken}</p>
            </div>
          )}

          {report.admin_note && report.status !== "pending" && (
            <div>
              <span style={labelStyle}>Note from our team</span>
              <p style={valueStyle}>{report.admin_note}</p>
            </div>
          )}

          <div>
            <span style={labelStyle}>Submitted</span>
            <p style={valueStyle}>{fmtDate(report.created_at)}</p>
          </div>

          {report.resolved_at && (
            <div>
              <span style={labelStyle}>Resolved</span>
              <p style={valueStyle}>{fmtDate(report.resolved_at)}</p>
            </div>
          )}

          {report.status === "pending" && (
            <p style={{ fontFamily: FF, fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.55 }}>
              {report.is_read
                ? "Our team has seen this report and is reviewing it."
                : "Our team will review this report shortly."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const AccountReported = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const { data: reports, refetch } = useQuery({
    queryKey: ["user-reported", user?.id],
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_reports")
        .select(
          "id, reported_user_id, reason, detail, status, is_read, action_taken, severity, admin_note, created_at, resolved_at",
        )
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

  // Live-update when an admin acts on one of these reports.
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`user-reported-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_reports",
          filter: `reporter_user_id=eq.${user.id}`,
        },
        () => refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, paddingBottom: 100, fontFamily: FF }}>
      <PageHeader title="Reported" />
      <div style={{ padding: "16px 20px 0" }}>
        {(!reports || reports.length === 0) ? (
          <div
            style={{
              background: CARD,
              borderRadius: 16,
              padding: "20px",
              fontFamily: FF,
              fontSize: 14,
              color: MUTED,
              textAlign: "center",
            }}
          >
            You haven't reported anyone.
          </div>
        ) : (
          <div style={{ background: CARD, borderRadius: 16, padding: "4px 20px" }}>
            {reports.map((r: any, i: number) => {
              const name = r.profile?.display_name || r.profile?.username || "User";
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setSelected(r)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
                    padding: "14px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "#EAE4D5",
                      flexShrink: 0,
                      backgroundImage: r.profile?.avatar_url
                        ? `url(${r.profile.avatar_url})`
                        : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: FF,
                        fontSize: 15,
                        color: INK,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {name}
                    </div>
                    <div
                      style={{
                        fontFamily: FF,
                        fontSize: 12.5,
                        color: MUTED,
                        marginTop: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.reason}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <StatusPill status={r.status} />
                    </div>
                  </div>
                  <ChevronRight size={18} color={MUTED} strokeWidth={1.75} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ReportDetailSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        report={selected}
      />
    </div>
  );
};

export default AccountReported;
