import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessOwner } from "@/hooks/useBusinessOwner";
import BusinessLayout from "@/components/business/BusinessLayout";
import { Button, Card, Body, Small, StatusPill, EmptyState } from "@/components/business/ui";

const BusinessEvents = () => {
  const { listing, account } = useBusinessOwner();
  const [pending, setPending] = useState<any[]>([]);
  const [live, setLive] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase.from("events_pending").select("*").order("created_at", { ascending: false });
      setPending(p ?? []);
      if (listing) {
        const { data: l } = await supabase.from("events").select("*").eq("business_id", listing.id).order("created_at", { ascending: false });
        setLive(l ?? []);
      }
    };
    load();
  }, [listing]);

  return (
    <BusinessLayout businessName={account?.business_name || listing?.title || null}>
      <div style={{ marginTop: 12, marginBottom: 24 }}>
        <Link to="/business/events/new"><Button full>POST AN EVENT</Button></Link>
      </div>

      {pending.length === 0 && live.length === 0 ? (
        <EmptyState message="No events yet." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pending.map((e) => (
            <Link key={e.id} to={`/business/events/${e.id}`} style={{ textDecoration: "none" }}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <Body style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.payload?.title ?? "Untitled"}
                    </Body>
                    <Small soft style={{ marginTop: 4 }}>Submission</Small>
                  </div>
                  <StatusPill status={e.status} />
                </div>
              </Card>
            </Link>
          ))}
          {live.map((e) => (
            <Card key={e.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <Body style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</Body>
                  <Small soft style={{ marginTop: 4 }}>Live</Small>
                </div>
                <StatusPill status="approved" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </BusinessLayout>
  );
};

export default BusinessEvents;
