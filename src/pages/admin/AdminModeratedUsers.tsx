import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
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
    () => (query.data ?? []).filter((r) => (tab === "all" ? true : r.moderation_status === tab)),
    [query.data, tab],
  );

  const lift = (r: Row) =>
    setDialog({
      open: true,
      action: r.moderation_status === "banned" ? "unban" : "unsuspend",
      userId: r.id,
      label: r.display_name || r.username || r.email || "this user",
    });

  return (
    <div>
      <h1 className="font-heading text-2xl lg:text-3xl font-bold text-slate-950 mb-2">Moderated Users</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Accounts currently warned, suspended, or banned. Suspensions auto-expire.
      </p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", ...STATUSES] as StatusTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 h-8 rounded-full text-xs font-medium border capitalize transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          No moderated users.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <Link
                  to={`/profile/${r.id}`}
                  className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                >
                  {r.display_name || r.username || r.email || r.id.slice(0, 8)}
                  <ExternalLink className="h-3 w-3" />
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant={r.moderation_status === "banned" ? "destructive" : "default"} className="capitalize">
                    {r.moderation_status}
                  </Badge>
                  {r.moderation_status === "suspended" && r.suspended_until && (
                    <span className="text-xs text-muted-foreground">until {fmt(r.suspended_until)}</span>
                  )}
                </div>
                {r.moderation_reason && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.moderation_reason}</p>
                )}
              </div>
              {r.moderation_status !== "warned" && (
                <Button size="sm" variant="outline" onClick={() => lift(r)}>
                  {r.moderation_status === "banned" ? "Lift ban" : "Lift suspension"}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <ModerationActionDialog
        open={dialog.open}
        onOpenChange={(v) => setDialog((d) => ({ ...d, open: v }))}
        action={dialog.action}
        reportId={null}
        reportedUserLabel={dialog.label}
      />
    </div>
  );
};

export default AdminModeratedUsers;
