import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Loader2, Check, Trash2, ExternalLink, ShieldAlert, Search, X, RefreshCw, Flag, CheckCircle2, Ban, Clock, MessageSquare } from "lucide-react";
import ModerationActionDialog, { ModerationAction } from "@/components/admin/ModerationActionDialog";

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
  severity: string | null;
  action_taken: string | null;
  created_at: string;
  resolved_at: string | null;
};

type ProfileLite = {
  id: string;
  display_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  moderation_status: string | null;
  suspended_until: string | null;
};

const FILTERS = ["unread", "pending", "repeat", "all", "resolved"] as const;
type Filter = (typeof FILTERS)[number];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const statusBadgeVariant = (status?: string | null): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "banned":
      return "destructive";
    case "suspended":
      return "destructive";
    case "warned":
      return "default";
    default:
      return "outline";
  }
};

const ProfileLine = ({
  profile,
  fallback,
}: {
  profile?: ProfileLite;
  fallback?: { name?: string | null; email?: string | null };
}) => {
  if (profile) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Link to={`/profile/${profile.id}`} className="inline-flex items-center gap-1 text-primary hover:underline">
          {profile.display_name || profile.username || profile.email || profile.id.slice(0, 8)}
          <ExternalLink className="h-3 w-3" />
        </Link>
        {profile.moderation_status && profile.moderation_status !== "active" && (
          <Badge variant={statusBadgeVariant(profile.moderation_status)} className="capitalize">
            {profile.moderation_status}
            {profile.moderation_status === "suspended" && profile.suspended_until
              ? ` · until ${new Date(profile.suspended_until).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
              : ""}
          </Badge>
        )}
      </div>
    );
  }
  return (
    <span>
      {fallback?.name || "Guest"}
      {fallback?.email ? ` · ${fallback.email}` : ""}
    </span>
  );
};

const AdminUserReports = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("unread");
  const [dialog, setDialog] = useState<{
    open: boolean;
    action: ModerationAction;
    reportId?: string | null;
    label?: string;
    reporterIsUser?: boolean;
  }>({ open: false, action: "warn" });

  const reportsQuery = useQuery({
    queryKey: ["admin-user-reports", filter],
    queryFn: async () => {
      let q = supabase.from("user_reports").select("*").order("created_at", { ascending: false });
      if (filter === "unread") q = q.eq("is_read", false);
      else if (filter === "pending" || filter === "repeat") q = q.eq("status", "pending");
      else if (filter === "resolved") q = q.neq("status", "pending");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as UserReport[];
    },
  });

  const allReports = reportsQuery.data ?? [];

  // Count pending reports per reported user for the repeat-offender filter and chip
  const pendingByUser = useMemo(() => {
    const m = new Map<string, number>();
    allReports.forEach((r) => {
      if (r.status === "pending") m.set(r.reported_user_id, (m.get(r.reported_user_id) ?? 0) + 1);
    });
    return m;
  }, [allReports]);

  const reports = useMemo(() => {
    if (filter !== "repeat") return allReports;
    return allReports.filter((r) => (pendingByUser.get(r.reported_user_id) ?? 0) >= 2);
  }, [filter, allReports, pendingByUser]);

  const userIds = Array.from(
    new Set(reports.flatMap((r) => [r.reported_user_id, r.reporter_user_id].filter(Boolean) as string[])),
  );

  const profilesQuery = useQuery({
    queryKey: ["admin-user-reports-profiles", userIds.sort().join(",")],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, email, avatar_url, moderation_status, suspended_until")
        .in("id", userIds);
      if (error) throw error;
      const map = new Map<string, ProfileLite>();
      (data ?? []).forEach((p: any) => map.set(p.id, p as ProfileLite));
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

  const openDialog = (
    action: ModerationAction,
    report: UserReport,
    profile?: ProfileLite,
  ) =>
    setDialog({
      open: true,
      action,
      reportId: report.id,
      label: profile?.display_name || profile?.username || profile?.email || "this user",
      reporterIsUser: !!report.reporter_user_id,
    });

  const visibleReports = reports.filter((report) => {
    const profile = profilesQuery.data?.get(report.reported_user_id);
    return [report.reason, report.detail, report.reporter_name, report.reporter_email, profile?.display_name, profile?.username, profile?.email].some((value) => value?.toLowerCase().includes(search.trim().toLowerCase()));
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border bg-primary-tint text-primary"><Flag className="h-5 w-5" /></span>
          <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">Reported Users</h1>
        </div>
        <Button asChild variant="outline" size="sm"><Link to="/admin/moderated-users"><ShieldAlert /> Moderated Users</Link></Button>
      </header>

      <div className="space-y-4 border-y border-border bg-primary-tint px-4 py-4 sm:px-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Report status">
          {FILTERS.map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} aria-pressed={filter === f} onClick={() => setFilter(f)} className={filter === f ? "" : "bg-card"}>
              {f === "repeat" ? "Repeat Reports" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input aria-label="Search reports" placeholder="Search users or reports…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 rounded-xl bg-card border-border text-foreground pl-10 pr-10" />
            {search && <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-9 w-9 border-0" aria-label="Clear search" onClick={() => setSearch("")}><X /></Button>}
          </div>
          <Button size="icon" variant="outline" className="shrink-0 bg-card" aria-label="Refresh reports" title="Refresh reports" disabled={reportsQuery.isFetching} onClick={() => { void reportsQuery.refetch(); void profilesQuery.refetch(); }}><RefreshCw className={reportsQuery.isFetching ? "animate-spin" : ""} /></Button>
        </div>
        <p className="text-sm font-semibold text-foreground" aria-live="polite">{reportsQuery.isLoading ? "Loading reports…" : `${visibleReports.length} ${visibleReports.length === 1 ? "report" : "reports"}`}</p>
      </div>

      {reportsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : reportsQuery.isError || profilesQuery.isError ? (
        <div role="alert" className="border border-border bg-card rounded-xl p-6 space-y-3"><p className="text-foreground">Could not load reports. Please try again.</p><Button variant="outline" onClick={() => { void reportsQuery.refetch(); void profilesQuery.refetch(); }}>Try Again</Button></div>
      ) : visibleReports.length === 0 ? (
        <div className="bg-card border border-border rounded-xl px-6 py-12 text-center">
          <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-3" />
          <h2 className="font-heading text-lg font-bold text-foreground">{search ? "No Matching Reports" : "No Reports to Show"}</h2>
          {search && <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch("")}>Clear Search</Button>}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleReports.map((r) => {
            const reportedProfile = profilesQuery.data?.get(r.reported_user_id);
            const reporterProfile = r.reporter_user_id ? profilesQuery.data?.get(r.reporter_user_id) : undefined;
            const otherPending = (pendingByUser.get(r.reported_user_id) ?? 0) - 1;
            return (
              <article key={r.id} className="bg-card text-card-foreground border border-border rounded-xl overflow-hidden">
                <div className="bg-primary-tint border-b border-border px-4 py-3 lg:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={r.status === "pending" ? "default" : "secondary"} className="capitalize">{r.status}</Badge>
                  {!r.is_read && <Badge variant="outline" className="bg-card text-primary font-semibold">Unread</Badge>}
                  {r.severity && r.severity !== "none" && (
                    <Badge variant="outline" className="capitalize">severity: {r.severity}</Badge>
                  )}
                  {r.action_taken && r.action_taken !== "none" && (
                    <Badge variant="outline" className="capitalize">action: {r.action_taken.replace("_", " ")}</Badge>
                  )}
                  {otherPending > 0 && (
                    <Badge variant="outline">+{otherPending} other open report{otherPending === 1 ? "" : "s"}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">{fmtDate(r.created_at)}</span>
                </div>

                </div>
                <div className="p-4 lg:p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Reported user</p>
                    <ProfileLine profile={reportedProfile} fallback={{ name: r.reported_user_id.slice(0, 8) }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Reported by</p>
                    <ProfileLine
                      profile={reporterProfile}
                      fallback={{ name: r.reporter_name, email: r.reporter_email }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Reason</p>
                  <p className="text-base font-semibold text-foreground">{r.reason}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Detail</p>
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{r.detail}</p>
                </div>

                {r.admin_note && (
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Admin note</p>
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{r.admin_note}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  {!r.is_read && (
                    <Button size="sm" variant="outline" disabled={markRead.isPending} onClick={() => markRead.mutate(r.id)}>
                      <Check className="h-4 w-4 mr-1" />
                      Mark Read
                    </Button>
                  )}
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => openDialog("warn", r, reportedProfile)}><ShieldAlert /> Warn</Button>
                      <Button size="sm" variant="outline" onClick={() => openDialog("suspend", r, reportedProfile)}><Clock /> Suspend</Button>
                      <Button size="sm" variant="outline" onClick={() => openDialog("ban", r, reportedProfile)}><Ban /> Ban</Button>
                      <Button size="sm" variant="outline" onClick={() => openDialog("content_removed", r, reportedProfile)}><MessageSquare /> Content Removed</Button>
                      <Button size="sm" variant="ghost" onClick={() => openDialog("dismissed", r, reportedProfile)}>Dismiss</Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-primary ml-auto"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (confirm("Delete this report?")) remove.mutate(r.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ModerationActionDialog
        open={dialog.open}
        onOpenChange={(v) => setDialog((d) => ({ ...d, open: v }))}
        action={dialog.action}
        reportId={dialog.reportId}
        reportedUserLabel={dialog.label}
        reporterIsUser={dialog.reporterIsUser}
      />
    </div>
  );
};

export default AdminUserReports;
