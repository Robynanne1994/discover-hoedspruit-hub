import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Search, User as UserIcon, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  profile: {
    display_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    location?: string | null;
    phone?: string | null;
    email?: string | null;
    is_private?: boolean | null;
  } | null;
  favourites_count: number;
  feedback_count: number;
  reports_filed_count: number;
  reports_received_count: number;
  blocks_count: number;
  listing_edits_count: number;
  events_pending_count: number;
  specials_pending_count: number;
  followers_count: number;
  following_count: number;
  admin_note: string;
}

const fmt = (d?: string | null) => {
  if (!d) return "—";
  try {
    return format(new Date(d), "d MMM yyyy, HH:mm");
  } catch {
    return d;
  }
};

const shortId = (id: string) => `${id.slice(0, 8)}…${id.slice(-4)}`;

const LABEL_STYLE: React.CSSProperties = {
  color: "#1A1A1A",
  fontWeight: 600,
};

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [idExpanded, setIdExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-list-users");
      if (error) throw error;
      return (data?.users ?? []) as AdminUser[];
    },
  });

  const openUser = (u: AdminUser) => {
    setSelected(u);
    setNote(u.admin_note ?? "");
    setIdExpanded(false);
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((u) => {
      return (
        u.email?.toLowerCase().includes(q) ||
        u.profile?.display_name?.toLowerCase().includes(q) ||
        u.profile?.username?.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    });
  }, [data, search]);

  const saveNote = async () => {
    if (!selected) return;
    setSavingNote(true);
    const { data: sess } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("admin_user_notes")
      .upsert({ user_id: selected.id, note, updated_by: sess.user?.id ?? null });
    setSavingNote(false);
    if (error) {
      toast.error("Failed to save note");
    } else {
      toast.success("Note saved");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    }
  };

  const deleteUser = async () => {
    if (!selected) return;
    setDeleting(true);
    const { data: resp, error } = await supabase.functions.invoke("admin-delete-user", {
      body: { user_id: selected.id },
    });
    setDeleting(false);
    if (error || (resp as any)?.error) {
      toast.error((error as any)?.message || (resp as any)?.error || "Failed to delete user");
      return;
    }
    toast.success("User deleted");
    setConfirmDelete(false);
    setSelected(null);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Users</h1>
          <p className="text-sm text-muted-foreground mb-6 text-slate-950">
            All registered users {data ? `(${data.length})` : ""}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, ID"
            className="pl-9"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load users. {(error as any)?.message}
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Last sign in</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No users found.</td></tr>
              )}
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => openUser(u)}
                  className="border-t border-border cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {u.profile?.avatar_url ? (
                        <img src={u.profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium truncate text-slate-950">
                          {u.profile?.display_name || u.profile?.username || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground md:hidden truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell truncate max-w-[260px]">
                    {u.email || "—"}
                    {!u.email_confirmed_at && (
                      <Badge variant="outline" className="ml-2 text-xs">Unconfirmed</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{fmt(u.created_at)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{fmt(u.last_sign_in_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                {selected.profile?.avatar_url ? (
                  <img src={selected.profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <div className="text-base font-semibold text-slate-950">
                    {selected.profile?.display_name || selected.profile?.username || "Unnamed"}
                  </div>
                  {selected.profile?.username && (
                    <div className="text-xs text-muted-foreground">@{selected.profile.username}</div>
                  )}
                </div>
              </div>

              <Row label="User ID">
                <button
                  type="button"
                  onClick={() => setIdExpanded((v) => !v)}
                  className="font-mono text-xs text-right hover:underline"
                  title={idExpanded ? "Hide" : "Show full ID"}
                >
                  {idExpanded ? selected.id : shortId(selected.id)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selected.id);
                    toast.success("ID copied");
                  }}
                  className="p-1 rounded hover:bg-muted"
                  title="Copy ID"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </Row>
              <Row label="Email"><span className="break-all">{selected.email || "—"}</span></Row>
              <Row label="Phone">{selected.phone || selected.profile?.phone || "—"}</Row>
              <Row label="Location">{selected.profile?.location || "—"}</Row>
              <Row label="Joined">{fmt(selected.created_at)}</Row>
              <Row label="Last sign in">{fmt(selected.last_sign_in_at)}</Row>

              <div className="pt-3 mt-3 border-t border-border">
                <div className="text-xs uppercase tracking-wide font-semibold text-slate-950 mb-2">
                  Activity
                </div>
                <Row label="Followers">{selected.followers_count}</Row>
                <Row label="Following">{selected.following_count}</Row>
                <Row label="Favourites">{selected.favourites_count}</Row>
                <Row label="Feedback submitted">{selected.feedback_count}</Row>
                <Row label="Reports filed">{selected.reports_filed_count}</Row>
                <Row label="Reports received">{selected.reports_received_count}</Row>
                <Row label="Users blocked">{selected.blocks_count}</Row>
                <Row label="Listing edit suggestions">{selected.listing_edits_count}</Row>
                <Row label="Profile visibility">{selected.profile?.is_private ? "Private" : "Public"}</Row>
              </div>

              <div className="pt-3 mt-3 border-t border-border">
                <div className="text-xs uppercase tracking-wide font-semibold text-slate-950 mb-2">
                  Admin note
                </div>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Private note, only visible to admins"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <Button size="sm" onClick={saveNote} disabled={savingNote}>
                    {savingNote ? "Saving…" : "Save note"}
                  </Button>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-border">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the account and all of their data (follows, favourites, reviews,
              submissions, notifications, etc). They'll be signed out on next app open. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); deleteUser(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Yes, delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex justify-between items-center gap-4 border-b border-border/50 py-2">
    <span style={LABEL_STYLE}>{label}</span>
    <span className="text-right flex items-center gap-2 min-w-0">{children}</span>
  </div>
);

export default AdminUsers;
