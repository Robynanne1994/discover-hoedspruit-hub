import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessOwner } from "@/hooks/useBusinessOwner";
import BusinessShell from "@/components/business/BusinessShell";
import { Button, Card, H2, H3, Body, Small, StatusPill, COLORS, EmptyState } from "@/components/business/ui";
import { useAuth } from "@/hooks/useAuth";

interface RecentItem { id: string; kind: string; title: string; status: string; created_at: string }

const BusinessDashboard = () => {
  const { signOut } = useAuth();
  const { account, listing, pendingClaim, loading } = useBusinessOwner();
  const [stats, setStats] = useState({ specials: 0, events: 0, featured: 0 });
  const [recent, setRecent] = useState<RecentItem[]>([]);

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
      <div style={{ marginTop: 12, marginBottom: 36 }}>
        <H2 style={{ color: "#FFFFFF" }}>WELCOME{account?.business_name ? `, ${account.business_name.toUpperCase()}` : ""}</H2>
      </div>

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
          <Card style={{ marginBottom: 16 }}>
            <Small soft>BUSINESS</Small>
            <Body style={{ fontWeight: 500, marginTop: 4 }}>{listing.title}</Body>
            {listing.location && <Small soft style={{ marginTop: 4 }}>{listing.location}</Small>}
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
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

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 36 }}>
            <Link to="/business/specials/new" style={{ textDecoration: "none" }}>
              <Card><H3 style={{ fontSize: 18 }}>POST A SPECIAL</H3></Card>
            </Link>
            <Link to="/business/events/new" style={{ textDecoration: "none" }}>
              <Card><H3 style={{ fontSize: 18 }}>POST AN EVENT</H3></Card>
            </Link>
            <Link to="/business/listing" style={{ textDecoration: "none" }}>
              <Card><H3 style={{ fontSize: 18 }}>EDIT BUSINESS</H3></Card>
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
                        <Small soft style={{ fontSize: 12 }}>{r.kind}</Small>
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
