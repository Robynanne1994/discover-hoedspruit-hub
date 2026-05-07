import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessOwner } from "@/hooks/useBusinessOwner";
import BusinessShell from "@/components/business/BusinessShell";
import { Button, Card, Body, Small, StatusPill, EmptyState } from "@/components/business/ui";

const BusinessSpecials = () => {
  const { listing } = useBusinessOwner();
  const [pending, setPending] = useState<any[]>([]);
  const [live, setLive] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase.from("specials_pending").select("*").order("created_at", { ascending: false });
      setPending(p ?? []);
      if (listing) {
        const { data: l } = await supabase.from("specials").select("*").eq("business_id", listing.id).order("created_at", { ascending: false });
        setLive(l ?? []);
      }
    };
    load();
  }, [listing]);

  return (
    <BusinessShell title="SPECIALS" back="/business/dashboard">
      <div style={{ marginTop: 12, marginBottom: 24 }}>
        <Link to="/business/specials/new"><Button full>POST A SPECIAL</Button></Link>
      </div>

      {pending.length === 0 && live.length === 0 ? (
        <EmptyState message="No specials yet." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pending.map((s) => (
            <Link key={s.id} to={`/business/specials/${s.id}`} style={{ textDecoration: "none" }}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <Body style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.payload?.title ?? "Untitled"}
                    </Body>
                    <Small soft style={{ marginTop: 4 }}>Submission</Small>
                  </div>
                  <StatusPill status={s.status} />
                </div>
              </Card>
            </Link>
          ))}
          {live.map((s) => (
            <Card key={s.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <Body style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</Body>
                  <Small soft style={{ marginTop: 4 }}>Live</Small>
                </div>
                <StatusPill status="approved" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </BusinessShell>
  );
};

export default BusinessSpecials;
