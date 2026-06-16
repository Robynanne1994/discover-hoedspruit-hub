import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { Loader2, Check, Trash2, ExternalLink } from "lucide-react";

type UserReport = {
  id: string;
  reported_user_id: string;
  reporter_user_id: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  reason: string;
  detail: string;
  status: string;
  is_read: boolean;
  admin_note: string | null;
  reporter_feedback: string | null;
  created_at: string;
  resolved_at: string | null;
};

type ProfileLite = {
  id: string;
  display_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
};

type ReportStatus = "pending" | "reviewed" | "dismissed";

const FILTERS = ["unread", "pending", "all", "resolved"] as const;
type Filter = (typeof FILTERS)[number];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const ProfileLine = ({ profile, fallback }: { profile?: ProfileLite; fallback?: { name?: string | null; email?: string | null } }) => {
  if (profile) {
    return (
      <Link to={`/profile/${profile.id}`} className="inline-flex items-center gap-1 text-primary hover:underline">
        {profile.display_name || profile.username || profile.email || profile.id.slice(0, 8)}
        <ExternalLink className="h-3 w-3" />
      </Link>
    );
  }
  return (
    <span>
      {fallback?.name || "Guest"}
      {fallback?.email ? ` · ${fallback.email}` : ""}
    </span>
  );
};

const ReportCard = ({
  r,
  reportedProfile,
  reporterProfile,
  onMarkRead,
  onSetStatus,
  onSaveFeedback,
  onDelete,
  busy,
}: {
  r: UserReport;
  reportedProfile?: ProfileLite;
  reporterProfile?: ProfileLite;
  onMarkRead: (id: string) => void;
  onSetStatus: (id: string, status: ReportStatus) => void;
  onSaveFeedback: (id: string, feedback: string) => void;
  onDelete: (id: string) => void;
  busy: boolean;
}) => {
  const [feedback, setFeedback] = useState(r.reporter_feedback ?? "");
  const canFeedback = !!r.reporter_user_id; // guests have no account to see it
  const dirty = (feedback.trim() || "") !== (r.reporter_feedback ?? "");

  return (
    <div className="bg-card border border-border rounded-xl p-4 lg:p-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={r.status === "pending" ? "default" : "secondary"}>{r.status}</Badge>
        {!r.is_read && <Badge variant="destructive">new</Badge>}
        <span className="text-xs text-muted-foreground ml-auto">{fmtDate(r.created_at)}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Reported user</p>
          <ProfileLine profile={reportedProfile} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Reported by</p>
          <ProfileLine profile={reporterProfile} fallback={{ name: r.reporter_name, email: r.reporter_email }} />
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Reason</p>
        <p className="text-sm font-medium">{r.reason}</p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Detail</p>
        <p className="text-sm whitespace-pre-wrap">{r.detail}</p>
      </div>

      {/* Feedback to the reporter — shown to them on their Blocked & Reported page */}
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
          Feedback to reporter {canFeedback ? "(visible to them)" : "(reporter was a guest — not visible)"}
        </p>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Write a short update the reporter will see, e.g. what action you took."
          rows={3}
          disabled={!canFeedback}
        />
        <div className="flex justify-end mt-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!canFeedback || !dirty || busy}
            onClick={() => onSaveFeedback(r.id, feedback.trim())}
          >
            Save feedback
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
        {!r.is_read && (
          <Button size="sm" variant="outline" onClick={() => onMarkRead(r.id)} disabled={busy}>
            <Check className="h-4 w-4 mr-1" />
            Mark read
          </Button>
        )}
        {r.status !== "reviewed" && (
          <Button size="sm" onClick={() => onSetStatus(r.id, "reviewed")} disabled={busy}>
            Mark reviewed
          </Button>
        )}
        {r.status !== "dismissed" && (
          <Button size="sm" variant="outline" onClick={() => onSetStatus(r.id, "dismissed")} disabled={busy}>
            Dismiss
          </Button>
        )}
        {r.status !== "pending" && (
          <Button size="sm" variant="outline" onClick={() => onSetStatus(r.id, "pending")} disabled={busy}>
            Reopen
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive ml-auto"
          onClick={() => {
            if (confirm("Delete this report?")) onDelete(r.id);
          }}
          disabled={busy}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
};

const AdminUserReports = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("unread");

  const reportsQuery = useQuery({
    queryKey: ["admin-user-reports", filter],
    queryFn: async () => {
      let q = supabase.from("user_reports").select("*").order("created_at", { ascending: false });
      if (filter === "unread") q = q.eq("is_read", false);
      else if (filter === "pending") q = q.eq("status", "pending");
      else if (filter === "resolved") q = q.neq("status", "pending");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as UserReport[];
    },
  });

  const reports = reportsQuery.data ?? [];

  const userIds = Array.from(
    new Set(
      reports.flatMap((r) => [r.reported_user_id, r.reporter_user_id].filter(Boolean) as string[]),
    ),
  );

  const profilesQuery = useQuery({
    queryKey: ["admin-user-reports-profiles", userIds.sort().join(",")],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, email, avatar_url")
        .in("id", userIds);
      if (error) throw error;
      const map = new Map<string, ProfileLite>();
      (data ?? []).forEach((p) => map.set(p.id, p as ProfileLite));
      return map;
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_reports").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-user-reports"] }),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReportStatus }) => {
      const { error } = await supabase
        .from("user_reports")
        .update({
          status,
          is_read: true,
          resolved_at: status === "pending" ? null : new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin-user-reports"] });
    },
    onError: () => toast.error("Could not update status"),
  });

  const saveFeedback = useMutation({
    mutationFn: async ({ id, feedback }: { id: string; feedback: string }) => {
      const { error } = await supabase
        .from("user_reports")
        .update({ reporter_feedback: feedback || null, is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feedback saved");
      qc.invalidateQueries({ queryKey: ["admin-user-reports"] });
    },
    onError: () => toast.error("Could not save feedback"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report deleted");
      qc.invalidateQueries({ queryKey: ["admin-user-reports"] });
    },
  });

  const busy = setStatus.isPending || saveFeedback.isPending || markRead.isPending || remove.isPending;

  return (
    <div>
      <h1 className="font-heading text-2xl lg:text-3xl font-bold text-slate-950 mb-2">Reported Users</h1>
      <p className="text-sm text-muted-foreground mb-6 text-slate-950">
        Reports submitted by users (or guests) about other users. Status changes and feedback are shown to the
        reporter on their account.
      </p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 h-8 rounded-full text-xs font-medium border transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {reportsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          No reports to show.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <ReportCard
              key={r.id}
              r={r}
              reportedProfile={profilesQuery.data?.get(r.reported_user_id)}
              reporterProfile={r.reporter_user_id ? profilesQuery.data?.get(r.reporter_user_id) : undefined}
              onMarkRead={(id) => markRead.mutate(id)}
              onSetStatus={(id, status) => setStatus.mutate({ id, status })}
              onSaveFeedback={(id, feedback) => saveFeedback.mutate({ id, feedback })}
              onDelete={(id) => remove.mutate(id)}
              busy={busy}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUserReports;
