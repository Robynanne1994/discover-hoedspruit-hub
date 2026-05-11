import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Search, User as UserIcon } from "lucide-react";

interface AdminUser {
  id: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  provider: string | null;
  providers: string[];
  profile: {
    display_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    location?: string | null;
    bio?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  roles: string[];
  favourites_count: number;
}

const fmt = (d?: string | null) => {
  if (!d) return "—";
  try {
    return format(new Date(d), "d MMM yyyy, HH:mm");
  } catch {
    return d;
  }
};

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-list-users");
      if (error) throw error;
      return (data?.users ?? []) as AdminUser[];
    },
  });

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">
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
                <th className="px-4 py-3 font-medium text-muted-foreground">Roles</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users found.</td></tr>
              )}
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => setSelected(u)}
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
                        <div className="font-medium truncate">
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
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length === 0 ? (
                        <span className="text-xs text-muted-foreground">user</span>
                      ) : (
                        u.roles.map((r) => (
                          <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                        ))
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
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
                  <div className="text-base font-semibold">
                    {selected.profile?.display_name || selected.profile?.username || "Unnamed"}
                  </div>
                  {selected.profile?.username && (
                    <div className="text-xs text-muted-foreground">@{selected.profile.username}</div>
                  )}
                </div>
              </div>

              <Row label="User ID" value={selected.id} mono />
              <Row label="Email" value={selected.email || "—"} />
              <Row label="Email confirmed" value={fmt(selected.email_confirmed_at)} />
              <Row label="Phone" value={selected.phone || selected.profile?.phone || "—"} />
              <Row label="Location" value={selected.profile?.location || "—"} />
              <Row label="Bio" value={selected.profile?.bio || "—"} />
              <Row label="Provider" value={(selected.providers?.length ? selected.providers : [selected.provider]).filter(Boolean).join(", ") || "email"} />
              <Row label="Roles" value={selected.roles.length ? selected.roles.join(", ") : "user"} />
              <Row label="Favourites" value={String(selected.favourites_count)} />
              <Row label="Joined" value={fmt(selected.created_at)} />
              <Row label="Last sign in" value={fmt(selected.last_sign_in_at)} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Row = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
    <span className="text-muted-foreground">{label}</span>
    <span className={`text-right break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
  </div>
);

export default AdminUsers;
