import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import Seo from "@/components/Seo";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const PAGE_BG = "#E6E0CC";
const CARD = "#FFFFFF";
const CREAM = "#F5F0E4";
const INK = "#1A1A1A";
const MUTED = "#8A8275";
const SUBTLE = "rgba(26,26,26,0.55)";
const LINE = "rgba(26,26,26,0.10)";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #8a6f4d, #c4a374)",
  "linear-gradient(135deg, #6b7a5a, #a8b58c)",
  "linear-gradient(135deg, #a86b52, #d4a087)",
  "linear-gradient(135deg, #5d6b7a, #8fa3b3)",
  "linear-gradient(135deg, #8a5d6b, #c08a96)",
  "linear-gradient(135deg, #7a6b4a, #b8a473)",
];

const initialsOf = (name?: string | null) => {
  if (!name) return "·";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
};

const titleCase = (s?: string | null) =>
  (s || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const handleOf = (p?: { username?: string | null; display_name?: string | null } | null) => {
  if (!p) return "";
  if (p.username) return `@${p.username.toLowerCase()}`;
  if (p.display_name) return `@${p.display_name.toLowerCase().replace(/\s+/g, "")}`;
  return "";
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: "Pending review", bg: "#F2E7CF", color: "#7A5A1E" },
  reviewed: { label: "Reviewed", bg: "#DBEBDB", color: "#2F6B3A" },
  dismissed: { label: "Dismissed", bg: "#E7E2D6", color: "#6B6A5E" },
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p
    style={{
      fontFamily: '"Bricolage Grotesque", ' + SANS,
      fontSize: 15,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: INK,
      margin: "0 0 10px 0",
      padding: "0 24px",
    }}
  >
    {children}
  </p>
);

const Avatar = ({ profile, index }: { profile: any; index: number }) => {
  const grad = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        flexShrink: 0,
        overflow: "hidden",
        backgroundImage: profile?.avatar_url ? `url(${profile.avatar_url})` : grad,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: SANS,
        fontStyle: "italic",
        fontSize: 18,
        color: CREAM,
      }}
    >
      {!profile?.avatar_url && initialsOf(profile?.display_name)}
    </div>
  );
};

const EmptyState = ({ text }: { text: string }) => (
  <div
    style={{
      background: CARD,
      borderRadius: 18,
      margin: "0 24px",
      padding: "28px 22px",
      textAlign: "center",
      fontFamily: SANS,
      fontSize: 14,
      color: SUBTLE,
    }}
  >
    {text}
  </div>
);

const BlockedReported = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) navigate("/welcome");
  }, [authLoading, user, navigate]);

  const uid = user?.id;

  const { data: blocked, isLoading: loadingBlocked } = useQuery({
    queryKey: ["my-blocked-users", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("user_blocks" as any)
        .select("blocked_id, created_at")
        .eq("blocker_id", uid!)
        .order("created_at", { ascending: false });
      const list = (rows as any[]) || [];
      if (!list.length) return [];
      const ids = list.map((r) => r.blocked_id);
      const { data: profiles } = await supabase.rpc("get_public_profiles", { _ids: ids });
      const map = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));
      return list.map((r) => ({ id: r.blocked_id, created_at: r.created_at, profile: map[r.blocked_id] || null }));
    },
  });

  const { data: reports, isLoading: loadingReports } = useQuery({
    queryKey: ["my-reports", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("user_reports")
        .select("id, reported_user_id, reason, detail, status, reporter_feedback, created_at, resolved_at")
        .eq("reporter_user_id", uid!)
        .order("created_at", { ascending: false });
      const list = (rows as any[]) || [];
      if (!list.length) return [];
      const ids = Array.from(new Set(list.map((r) => r.reported_user_id)));
      const { data: profiles } = await supabase.rpc("get_public_profiles", { _ids: ids });
      const map = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));
      return list.map((r) => ({ ...r, profile: map[r.reported_user_id] || null }));
    },
  });

  const unblock = useMutation({
    mutationFn: async (blockedId: string) => {
      const { error } = await supabase
        .from("user_blocks" as any)
        .delete()
        .eq("blocker_id", uid!)
        .eq("blocked_id", blockedId);
      if (error) throw error;
    },
    onMutate: async (blockedId: string) => {
      const key = ["my-blocked-users", uid];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<any[]>(key);
      if (prev) qc.setQueryData(key, prev.filter((b) => b.id !== blockedId));
      return { key, prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(ctx.key, ctx.prev);
      toast.error("Could not unblock. Please try again.");
    },
    onSuccess: () => {
      toast.success("User unblocked");
      qc.invalidateQueries({ queryKey: ["blocked-users", uid] });
      qc.invalidateQueries({ queryKey: ["search-users"] });
    },
  });

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, paddingBottom: 120, fontFamily: SANS }}>
      <Seo
        title="Blocked & Reported — Hello Hoedspruit"
        description="Manage the users you have blocked and review the reports you have submitted."
        path="/blocked-reported"
        noIndex
      />
      <PageHeader title="Blocked & Reported" onBack={() => navigate("/my-account")} />

      <div style={{ height: 24 }} />

      {/* Blocked */}
      <Eyebrow>Blocked</Eyebrow>
      {loadingBlocked ? (
        <div style={{ background: CARD, borderRadius: 18, margin: "0 24px", padding: "6px 18px" }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 0",
                borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
              }}
            >
              <Skeleton className="h-12 w-12 rounded-full" />
              <div style={{ flex: 1 }}>
                <Skeleton className="h-4 w-28 mb-2 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : !blocked?.length ? (
        <EmptyState text="You haven't blocked anyone." />
      ) : (
        <div style={{ background: CARD, borderRadius: 18, margin: "0 24px", padding: "6px 18px" }}>
          {blocked.map((b, i) => (
            <div
              key={b.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 0",
                borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
              }}
            >
              <Avatar profile={b.profile} index={i} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: "0 0 2px",
                    fontFamily: SANS,
                    fontSize: 16,
                    fontWeight: 400,
                    letterSpacing: "-0.1px",
                    color: INK,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {titleCase(b.profile?.display_name) || "User"}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontFamily: SANS,
                    fontSize: 13,
                    color: MUTED,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {handleOf(b.profile)}
                </p>
              </div>
              <button
                onClick={() => unblock.mutate(b.id)}
                disabled={unblock.isPending}
                style={{
                  flexShrink: 0,
                  height: 34,
                  padding: "0 18px",
                  borderRadius: 999,
                  background: CREAM,
                  border: `1px solid ${LINE}`,
                  color: INK,
                  fontFamily: SANS,
                  fontWeight: 500,
                  fontSize: 13,
                  letterSpacing: "0.1px",
                  cursor: unblock.isPending ? "default" : "pointer",
                  opacity: unblock.isPending ? 0.6 : 1,
                }}
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 28 }} />

      {/* Reported */}
      <Eyebrow>Reported</Eyebrow>
      {loadingReports ? (
        <div style={{ background: CARD, borderRadius: 18, margin: "0 24px", padding: "22px" }}>
          <Skeleton className="h-4 w-40 mb-3 rounded" />
          <Skeleton className="h-3 w-full mb-2 rounded" />
          <Skeleton className="h-3 w-2/3 rounded" />
        </div>
      ) : !reports?.length ? (
        <EmptyState text="You haven't reported anyone." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "0 24px" }}>
          {reports.map((r) => {
            const meta = STATUS_META[r.status] ?? STATUS_META.pending;
            return (
              <div key={r.id} style={{ background: CARD, borderRadius: 18, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 15,
                      fontWeight: 600,
                      color: INK,
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {titleCase(r.profile?.display_name) || handleOf(r.profile) || "User"}
                  </span>
                  <span
                    style={{
                      flexShrink: 0,
                      fontFamily: SANS,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: meta.bg,
                      color: meta.color,
                    }}
                  >
                    {meta.label}
                  </span>
                </div>

                <div style={{ fontFamily: SANS, fontSize: 13.5, color: INK, marginBottom: 4 }}>
                  <span style={{ color: MUTED }}>Reason: </span>
                  {r.reason}
                </div>
                {r.detail && (
                  <p style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.5, color: SUBTLE, margin: "0 0 8px", whiteSpace: "pre-wrap" }}>
                    {r.detail}
                  </p>
                )}

                <div style={{ fontFamily: SANS, fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: MUTED }}>
                  Reported {fmtDate(r.created_at)}
                </div>

                {r.reporter_feedback && (
                  <div
                    style={{
                      marginTop: 12,
                      background: CREAM,
                      borderRadius: 12,
                      padding: "12px 14px",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "#715a3d",
                        marginBottom: 4,
                      }}
                    >
                      Response from our team
                    </div>
                    <p style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.5, color: INK, margin: 0, whiteSpace: "pre-wrap" }}>
                      {r.reporter_feedback}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BlockedReported;
