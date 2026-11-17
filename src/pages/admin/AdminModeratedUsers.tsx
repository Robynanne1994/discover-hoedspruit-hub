import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, ShieldAlert, Search, X, RefreshCw, Flag, CheckCircle2, Unlock } from "lucide-react";
import ModerationActionDialog, { ModerationAction } from "@/components/admin/ModerationActionDialog";

type Row = {
  id: string;
  display_name: string | null;
  username: string | null;
  email: string | null;
  moderation_status: string;
  suspended_until: string | null;
  moderation_reason: string | null;
};

const STATUSES = ["warned", "suspended", "banned"] as const;
type StatusTab = (typeof STATUSES)[number] | "all";

const fmt = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

const AdminModeratedUsers = () => {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<StatusTab>("all");
  const [dialog, setDialog] = useState<{
    open: boolean;
    action: ModerationAction;
    userId?: string;
    label?: string;
  }>({ open: false, action: "unsuspend" });

  const query = useQuery({
    queryKey: ["admin-moderated-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, email, moderation_status, suspended_until, moderation_reason")
        .in("moderation_status", ["warned", "suspended", "banned"])
        .order("moderation_status", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const rows = useMemo(
    () => (query.data ?? []).filter((r) => (tab === "all" || r.moderation_status === tab) && [r.display_name, r.username, r.email, r.moderation_reason].some((value) => value?.toLowerCase().includes(search.trim().toLowerCase()) || !search.trim())),
    [query.data, tab, search],
  );

  const lift = (r: Row) =>
    setDialog({
      open: true,
      action: r.moderation_status === "banned" ? "unban" : "unsuspend",
      userId: r.id,
      label: r.display_name || r.username || r.email || "this user",
    });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-tint border border-border text-primary"><ShieldAlert className="h-5 w-5" /></span>
          <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">Moderated Users</h1>
        </div>
        <Button asChild variant="outline" size="sm"><Link to="/admin/user-reports"><Flag /> Reported Users</Link></Button>
      </header>
      <div className="space-y-4 border-y border-border bg-primary-tint px-4 py-4 sm:px-5">
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Moderation status">
          {(["all", ...STATUSES] as StatusTab[]).map((t) => (
            <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} aria-pressed={tab === t} onClick={() => setTab(t)} className={tab === t ? "capitalize" : "capitalize bg-card"}>
              {t}<span className="text-xs opacity-80">{(query.data ?? []).filter((r) => t === "all" || r.moderation_status === t).length}</span>
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input aria-label="Search moderated users" placeholder="Search name, email or reason…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 rounded-xl bg-card border-border text-foreground pl-10 pr-10" />
            {search && <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-9 w-9 border-0" aria-label="Clear search" onClick={() => setSearch("")}><X /></Button>}
          </div>
          <Button size="icon" variant="outline" className="shrink-0 bg-card" aria-label="Refresh users" title="Refresh users" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw className={query.isFetching ? "animate-spin" : ""} /></Button>
        </div>
        <p className="text-sm font-semibold text-foreground" aria-live="polite">{query.isLoading ? "Loading users…" : `${rows.length} ${rows.length === 1 ? "user" : "users"}`}</p>
      </div>

      {query.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : query.isError ? (
        <div role="alert" className="rounded-xl border border-border bg-card p-6 space-y-3"><p className="text-foreground">Could not load moderated users. Please try again.</p><Button variant="outline" onClick={() => void query.refetch()}>Try Again</Button></div>
      ) : rows.length === 0 ? (
        <div className="bg-card border border-border rounded-xl px-6 py-12 text-center">
          <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-3" />
          <h2 className="font-heading text-lg font-bold text-foreground">{search ? "No Matching Users" : "No Moderated Users"}</h2>
          {search && <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch("")}>Clear Search</Button>}
        </div>
      ) : (
        <div className="bg-card text-card-foreground border border-border rounded-xl overflow-hidden">
          <div className="hidden lg:grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-5 bg-primary-tint px-5 py-4 border-b border-border text-sm font-semibold text-foreground">
            <span>User</span><span>Status / Until</span><span>Reason</span><span className="w-40 text-right">Action</span>
          </div>
          <div className="divide-y divide-border">
            {rows.map((r) => (
              <article key={r.id} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-4 lg:gap-5 p-4 lg:p-5 items-start">
                <div className="min-w-0">
                  <Link to={`/profile/${r.id}`} className="inline-flex items-center gap-1 text-primary hover:underline font-semibold break-all">
                    {r.display_name || r.username || r.email || r.id.slice(0, 8)}<ExternalLink className="h-3 w-3 shrink-0" />
                  </Link>
                  {r.email && (r.display_name || r.username) && <p className="text-xs text-muted-foreground mt-1 break-all">{r.email}</p>}
                </div>
                <div className="space-y-2">
                  <Badge variant={r.moderation_status === "warned" ? "outline" : "default"} className="capitalize">{r.moderation_status}</Badge>
                  {r.moderation_status === "suspended" && r.suspended_until && <p className="text-xs text-muted-foreground">Until {fmt(r.suspended_until)}</p>}
                </div>
                <div className="min-w-0">
                  <p className="lg:hidden text-sm font-semibold text-foreground mb-1">Reason</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{r.moderation_reason || "No reason recorded."}</p>
                </div>
                <div className="lg:w-40 lg:text-right">
                  {r.moderation_status !== "warned" && <Button size="sm" variant="outline" onClick={() => lift(r)}><Unlock />{r.moderation_status === "banned" ? "Lift Ban" : "Lift Suspension"}</Button>}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <ModerationActionDialog
        open={dialog.open}
        onOpenChange={(v) => setDialog((d) => ({ ...d, open: v }))}
        action={dialog.action}
        reportId={null}
        targetUserId={dialog.userId}
        reportedUserLabel={dialog.label}
      />
    </div>
  );
};

export default AdminModeratedUsers;
