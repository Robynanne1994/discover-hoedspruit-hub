import { CSSProperties, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Calendar, Check, CheckCircle2, X } from "lucide-react";
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
  reviewed: { label: "Reviewed - Action Taken", bg: "#DCFCE7", ink: "#14532D" },
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

const fmtDate = (iso: string) => {
  const formatted = new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return formatted.replace(",", ";");
};

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

const SHEET_BG = "#f5f0e8";
const HEADING = "#020202";
const BODY = "#2b2420";
const LABEL = "#8a7a63";
const DIVIDER = "#e2dccb";
const NOTE_BG = "#ede6d5";
const NOTE_BORDER = "#d9d0bb";

const ReportDetailSheet = ({
  open,
  onClose,
  report,
}: {
  open: boolean;
  onClose: () => void;
  report: any | null;
}) => {
  const navigate = useNavigate();
  if (!open || !report) return null;
  const label =
    report.profile?.display_name || report.profile?.username || "User";
  const handle = report.profile?.username ? `@${report.profile.username}` : null;
  const goToProfile = () => {
    if (!report.reported_user_id) return;
    onClose();
    navigate(`/profile/${report.reported_user_id}`);
  };

  const labelStyle: CSSProperties = {
    fontFamily: FF,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: LABEL,
    marginBottom: 8,
    display: "block",
  };
  const valueStyle: CSSProperties = {
    fontFamily: FF,
    fontSize: 17,
    fontWeight: 700,
    color: HEADING,
    lineHeight: 1.4,
    margin: 0,
  };
  const divider = (
    <div style={{ height: 1, background: DIVIDER, margin: "20px 0" }} />
  );

  const responseText = report.admin_message
    ? report.admin_message
    : report.admin_note && report.status !== "pending"
    ? report.admin_note
    : report.status === "pending"
    ? "Our team hasn't responded yet. You'll see their message here once they review your report."
    : "Our team reviewed your report but didn't leave a written message.";

  const reasonText =
    report.reason === "Harassment or bullying" ? "Harassment or Bullying" : report.reason;

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
          background: SHEET_BG,
          borderRadius: "20px 20px 0 0",
          padding: "10px 24px 32px",
          animation: "rd-slide-up 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          maxHeight: "92vh",
          overflowY: "auto",
          position: "relative",
        }}
      >
        <style>{`@keyframes rd-slide-up { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>

        {/* Grab handle */}
        <div
          style={{
            width: 44,
            height: 5,
            background: "#cdc4ad",
            borderRadius: 999,
            margin: "6px auto 14px",
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 18,
            right: 20,
            border: "none",
            background: "#e4ddc8",
            cursor: "pointer",
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          <X size={16} color={HEADING} strokeWidth={2} />
        </button>

        {/* Header: avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0 4px" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#EAE4D5",
              flexShrink: 0,
              backgroundImage: report.profile?.avatar_url
                ? `url(${report.profile.avatar_url})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FF, fontSize: 22, fontWeight: 700, color: HEADING, lineHeight: 1.15 }}>
              {label}
            </div>
            {handle && (
              <div style={{ fontFamily: FF, fontSize: 14, color: LABEL, marginTop: 2 }}>
                {handle}
              </div>
            )}
          </div>
        </div>

        {divider}

        {/* REPORT STATUS */}
        <div>
          <span style={labelStyle}>REPORT STATUS</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: BROWN,
              color: "#f5f0e8",
              padding: "8px 14px",
              borderRadius: 999,
              fontFamily: FF,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            <CheckCircle2 size={16} strokeWidth={2} />
            {STATUS_META[report.status]?.label ?? "Pending review"}
          </span>
        </div>

        {divider}

        {/* REASON */}
        <div>
          <span style={labelStyle}>REASON</span>
          <p style={valueStyle}>{reasonText}</p>
        </div>

        {/* REASON NOTE */}
        <div style={{ marginTop: 18 }}>
          <span style={labelStyle}>REASON NOTE</span>
          <div
            style={{
              background: NOTE_BG,
              border: `1px solid ${NOTE_BORDER}`,
              borderRadius: 14,
              padding: "14px 16px",
              fontFamily: FF,
              fontSize: 15,
              color: BODY,
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
            }}
          >
            {report.detail?.trim()
              ? report.detail
              : "You didn't add any extra details with this report."}
          </div>
        </div>

        {divider}

        {/* REPORT OUTCOME */}
        {report.action_taken && report.action_taken !== "none" && (
          <div style={{ marginBottom: 18 }}>
            <span style={labelStyle}>REPORT OUTCOME</span>
            <p style={{ fontFamily: FF, fontSize: 15, fontWeight: 400, color: BODY, lineHeight: 1.55, margin: 0 }}>{ACTION_LABEL[report.action_taken] ?? report.action_taken}</p>
          </div>
        )}

        {/* RESPONSE */}
        <div>
          <span style={labelStyle}>HELLO HOEDSPRUIT'S RESPONSE</span>
          <div
            style={{
              background: BROWN,
              borderRadius: 14,
              padding: "14px 16px",
              fontFamily: FF,
              fontSize: 15,
              color: "#f5f0e8",
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
            }}
          >
            {responseText}
          </div>
        </div>

        {divider}

        {/* Submitted / Resolved rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <Calendar size={16} color={LABEL} strokeWidth={2} />
              <span style={{ ...labelStyle, marginBottom: 0 }}>SUBMITTED</span>
            </span>
            <span style={{ fontFamily: FF, fontSize: 14.5, fontWeight: 700, color: HEADING }}>
              {fmtDate(report.created_at)}
            </span>
          </div>

          {report.resolved_at && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                <Check size={16} color={LABEL} strokeWidth={2.25} />
                <span style={{ ...labelStyle, marginBottom: 0 }}>RESOLVED</span>
              </span>
              <span style={{ fontFamily: FF, fontSize: 14.5, fontWeight: 700, color: HEADING }}>
                {fmtDate(report.resolved_at)}
              </span>
            </div>
          )}

          {report.status === "pending" && (
            <p style={{ fontFamily: FF, fontSize: 13, color: LABEL, margin: "4px 0 0", lineHeight: 1.55 }}>
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
      const reportIds = (data ?? []).map((r: any) => r.id);
      const [profsRes, notesRes] = await Promise.all([
        ids.length
          ? supabase.rpc("get_public_profiles", { _ids: ids })
          : Promise.resolve({ data: [] as any[] } as any),
        reportIds.length
          ? supabase
              .from("business_notifications")
              .select("ref_id, body, title, created_at")
              .eq("user_id", user!.id)
              .eq("kind", "report_update")
              .eq("ref_table", "user_reports")
              .in("ref_id", reportIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as any[] } as any),
      ]);
      const map = new Map((((profsRes as any).data as any[]) ?? []).map((p: any) => [p.id, p]));
      const msgMap = new Map<string, string>();
      (((notesRes as any).data as any[]) ?? []).forEach((n: any) => {
        if (!msgMap.has(n.ref_id)) msgMap.set(n.ref_id, n.body);
      });
      return (data ?? []).map((r: any) => ({
        ...r,
        profile: map.get(r.reported_user_id),
        admin_message: msgMap.get(r.id) ?? null,
      }));
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
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "business_notifications",
          filter: `user_id=eq.${user.id}`,
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
                  <ArrowUpRight size={18} color={INK} style={{ flexShrink: 0 }} />
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
