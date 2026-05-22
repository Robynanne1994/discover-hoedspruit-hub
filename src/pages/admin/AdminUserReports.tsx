import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      const { error } = await supabase
        .from("user_reports")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-user-reports"] }),
  });

  const resolve = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "reviewed" | "dismissed" }) => {
      const { error } = await supabase
        .from("user_reports")
        .update({ status, is_read: true, resolved_at: new Date().toISOString() })
        .eq("id", id);
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

  return (
    <div>
      <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-2">Reported Users</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Reports submitted by users (or guests) about other users.
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
          {reports.map((r) => {
            const reportedProfile = profilesQuery.data?.get(r.reported_user_id);
            const reporterProfile = r.reporter_user_id
              ? profilesQuery.data?.get(r.reporter_user_id)
              : undefined;
            return (
              <div
                key={r.id}
                className="bg-card border border-border rounded-xl p-4 lg:p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={r.status === "pending" ? "default" : "secondary"}>
                    {r.status}
                  </Badge>
                  {!r.is_read && <Badge variant="destructive">new</Badge>}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {fmtDate(r.created_at)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      Reported user
                    </p>
                    <ProfileLine profile={reportedProfile} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      Reported by
                    </p>
                    <ProfileLine
                      profile={reporterProfile}
                      fallback={{ name: r.reporter_name, email: r.reporter_email }}
                    />
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

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  {!r.is_read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markRead.mutate(r.id)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Mark read
                    </Button>
                  )}
                  {r.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => resolve.mutate({ id: r.id, status: "reviewed" })}
                      >
                        Mark reviewed
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolve.mutate({ id: r.id, status: "dismissed" })}
                      >
                        Dismiss
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive ml-auto"
                    onClick={() => {
                      if (confirm("Delete this report?")) remove.mutate(r.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminUserReports;
