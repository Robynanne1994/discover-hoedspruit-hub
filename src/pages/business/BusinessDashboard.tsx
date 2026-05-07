import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessOwner } from "@/hooks/useBusinessOwner";
import BusinessShell from "@/components/business/BusinessShell";
import { Button, Card, H2, H3, Body, Small, StatusPill, COLORS, EmptyState } from "@/components/business/ui";
import { useAuth } from "@/hooks/useAuth";
import { Tag, Calendar, Pencil } from "lucide-react";

interface RecentItem { id: string; kind: string; title: string; status: string; created_at: string }
interface NotifItem { id: string; title: string; body: string | null; link: string | null; status: string; is_read: boolean; created_at: string }

const BusinessDashboard = () => {
  const { signOut, user } = useAuth();
  const { account, listing, pendingClaim, loading } = useBusinessOwner();
  const [stats, setStats] = useState({ specials: 0, events: 0, featured: 0 });
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadNotifs = async () => {
      const { data } = await supabase
        .from("business_notifications")
        .select("id,title,body,link,status,is_read,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setNotifs((data ?? []) as NotifItem[]);
    };
    loadNotifs();
  }, [user]);

  const markRead = async (id: string) => {
    setNotifs((n) => n.map((x) => x.id === id ? { ...x, is_read: true } : x));
    await supabase.from("business_notifications").update({ is_read: true }).eq("id", id);
  };
  const markAllRead = async () => {
    if (!user) return;
    const ids = notifs.filter((n) => !n.is_read).map((n) => n.id);
    if (!ids.length) return;
    setNotifs((n) => n.map((x) => ({ ...x, is_read: true })));
    await supabase.from("business_notifications").update({ is_read: true }).in("id", ids);
  };

  useEffect(() => {
    const load = async () => {
      if (!listing) return;

      const today = new Date().toISOString().slice(0, 10);
      const [{ count: specialsCount }, { count: eventsCount }, { count: featuredCount }] = await Promise.all([
        supabase.from("specials").select("id", { count: "exact", head: true }).eq("business_id", listing.id).eq("is_active", true),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("business_id", listing.id).gte("start_date", today),
        supabase.from("specials").select("id", { count: "exact", head: true }).eq("business_id", listing.id).eq("is_active", true),
      ]);

      const [{ data: pSp }, { data: pEv }, { data: pLi }] = await Promise.all([
        supabase.from("specials_pending").select("id, status, created_at, payload").order("created_at", { ascending: false }).limit(5),
        supabase.from("events_pending").select("id, status, created_at, payload").order("created_at", { ascending: false }).limit(5),
        supabase.from("listing_edits_pending").select("id, status, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      const merged: RecentItem[] = [
        ...(pSp ?? []).map((r: any) => ({ id: r.id, kind: "Special", title: r.payload?.title ?? "Untitled", status: r.status, created_at: r.created_at })),
        ...(pEv ?? []).map((r: any) => ({ id: r.id, kind: "Event", title: r.payload?.title ?? "Untitled", status: r.status, created_at: r.created_at })),
        ...(pLi ?? []).map((r: any) => ({ id: r.id, kind: "Business edit", title: "Business details", status: r.status, created_at: r.created_at })),
      ].sort((a, b) => (a.created_at > b.created_at ? -1 : 1)).slice(0, 5);

      setStats({ specials: specialsCount ?? 0, events: eventsCount ?? 0, featured: featuredCount ?? 0 });
      setRecent(merged);
    };
    load();
  }, [listing]);

  if (loading) return <BusinessShell title="BUSINESS HUB" back="/my-account" theme="dark"><Small style={{ color: "rgba(255,255,255,0.7)" }}>Loading...</Small></BusinessShell>;
1
  return (
    <BusinessShell title="BUSINESS HUB" back="/my-account" theme="dark">
      <div style={{ marginTop: 12, marginBottom: 24 }}>
        <H2 style={{ color: "#FFFFFF" }}>WELCOME{account?.business_name ? `, ${account.business_name.toUpperCase()}` : ""}</H2>
      </div>

      {notifs.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Body style={{ fontWeight: 500, color: "#FFFFFF" }}>
              NOTIFICATIONS{notifs.some((n) => !n.is_read) ? ` (${notifs.filter((n) => !n.is_read).length})` : ""}
            </Body>
            {notifs.some((n) => !n.is_read) && (
              <button onClick={markAllRead} style={{ background: "transparent", border: "none", color: "#FFFFFF", textDecoration: "underline", fontSize: 12, cursor: "pointer", padding: 0 }}>
                Mark all read
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notifs.slice(0, 5).map((n) => {
              const inner = (
                <Card style={{ padding: 14, opacity: n.is_read ? 0.7 : 1, borderLeft: n.is_read ? "none" : `3px solid ${n.status === "approved" ? "#2e7d32" : n.status === "rejected" ? "#c62828" : "#b8916a"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Body style={{ fontWeight: 500, fontSize: 14 }}>{n.title}</Body>
                      {n.body && <Small soft style={{ marginTop: 4, display: "block" }}>{n.body}</Small>}
                      <Small soft style={{ marginTop: 4, display: "block", fontSize: 11 }}>{new Date(n.created_at).toLocaleString()}</Small>
                    </div>
                    <StatusPill status={n.status} />
                  </div>
                </Card>
              );
              return n.link ? (
                <Link key={n.id} to={n.link} onClick={() => markRead(n.id)} style={{ textDecoration: "none" }}>{inner}</Link>
              ) : (
                <div key={n.id} onClick={() => markRead(n.id)} style={{ cursor: "pointer" }}>{inner}</div>
              );
            })}
          </div>
        </div>
      )}

      {!listing && (
        <Card style={{ marginBottom: 16 }}>
          <Small soft style={{ marginBottom: 8 }}>BUSINESS</Small>
          {pendingClaim && pendingClaim.status === "pending" ? (
            <>
              <div style={{ marginBottom: 12 }}><StatusPill status="pending" /></div>
              <Body>Claim under review</Body>
              <Small soft style={{ marginTop: 4 }}>We will review this within 48 hours.</Small>
            </>
          ) : (
            <>
              <Body style={{ marginBottom: 12 }}>You have not linked a business yet.</Body>
              <Link to="/business/claim"><Button>CLAIM A BUSINESS</Button></Link>
            </>
          )}
        </Card>
      )}

      {listing && (
        <>
          <Card style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
              <div style={{ flex: 1, padding: 20, minWidth: 0 }}>
                <Small soft>BUSINESS</Small>
                <Body style={{ fontWeight: 500, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{listing.title}</Body>
                {listing.location && <Small soft style={{ marginTop: 4 }}>{listing.location}</Small>}
              </div>
              {listing.image_url && (
                <div style={{ width: 96, flexShrink: 0, background: `url(${listing.image_url}) center/cover no-repeat` }} />
              )}
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            <Card style={{ padding: 16, textAlign: "center" }}>
              <p style={{ fontSize: 26, color: COLORS.heading, margin: 0, fontWeight: 400 }}>{stats.specials}</p>
              <Small soft style={{ marginTop: 4, fontSize: 12 }}>SPECIALS</Small>
            </Card>
            <Card style={{ padding: 16, textAlign: "center" }}>
              <p style={{ fontSize: 26, color: COLORS.heading, margin: 0, fontWeight: 400 }}>{stats.events}</p>
              <Small soft style={{ marginTop: 4, fontSize: 12 }}>EVENTS</Small>
            </Card>
            <Card style={{ padding: 16, textAlign: "center" }}>
              <p style={{ fontSize: 26, color: COLORS.heading, margin: 0, fontWeight: 400 }}>{stats.featured}</p>
              <Small soft style={{ marginTop: 4, fontSize: 12 }}>FEATURED</Small>
            </Card>
          </div>

          <div style={{ background: COLORS.card, borderRadius: 16, border: "1px solid rgba(18,18,20,0.06)", overflow: "hidden", marginBottom: 16 }}>
            <Link to="/business/specials/new" style={{ textDecoration: "none", display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 20, borderBottom: "1px solid rgba(18,18,20,0.06)" }}>
                <Tag size={20} strokeWidth={1.5} color={COLORS.heading} />
                <H3 style={{ fontSize: 16, textTransform: "none" }}>Post a Special</H3>
              </div>
            </Link>
            <Link to="/business/events/new" style={{ textDecoration: "none", display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 20, borderBottom: "1px solid rgba(18,18,20,0.06)" }}>
                <Calendar size={20} strokeWidth={1.5} color={COLORS.heading} />
                <H3 style={{ fontSize: 16, textTransform: "none" }}>Post an Event</H3>
              </div>
            </Link>
            <Link to="/business/listing" style={{ textDecoration: "none", display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 20 }}>
                <Pencil size={20} strokeWidth={1.5} color={COLORS.heading} />
                <H3 style={{ fontSize: 16, textTransform: "none" }}>Edit Business Details</H3>
              </div>
            </Link>
          </div>

          {recent.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Body style={{ fontWeight: 500, marginBottom: 12 }}>RECENT SUBMISSIONS</Body>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recent.map((r) => (
                  <Card key={r.kind + r.id} style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <Small soft style={{ fontSize: 12 }}>{r.kind.toUpperCase()}</Small>
                        <Body style={{ marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</Body>
                      </div>
                      <StatusPill status={r.status} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24 }}>
        <Link to="/business/billing" style={{ textDecoration: "none" }}>
          <Button variant="secondary" full>BILLING</Button>
        </Link>
        <Button variant="secondary" full onClick={signOut}>SIGN OUT</Button>
      </div>
    </BusinessShell>
  );
};

export default BusinessDashboard;
