import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessOwner } from "@/hooks/useBusinessOwner";
import BusinessShell from "@/components/business/BusinessShell";
import { Button, Card, Body, Small, H3, COLORS, Input, Label } from "@/components/business/ui";
import { toast } from "sonner";

const FEATURE_FEE = "R399";
const FEATURE_DAYS = 7;

const BusinessFeature = () => {
  const { type, id } = useParams<{ type: "special" | "event"; id: string }>();
  const navigate = useNavigate();
  const { user } = useBusinessOwner();
  const [item, setItem] = useState<any>(null);
  const [start, setStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id || !type) return;
    (async () => {
      const table = type === "special" ? "specials_pending" : "events_pending";
      const { data } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
      setItem(data);
    })();
  }, [id, type]);

  const end = (() => {
    const d = new Date(start);
    d.setDate(d.getDate() + FEATURE_DAYS - 1);
    return d.toISOString().slice(0, 10);
  })();

  const submit = async () => {
    if (!user || !id || !type) return;
    setBusy(true);
    const { error } = await supabase.from("feature_requests").insert({
      owner_id: user.id,
      item_type: type,
      pending_id: id,
      feature_start: start,
      feature_end: end,
      payment_status: "pending_setup",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Feature request sent for review");
    navigate(type === "special" ? "/business/specials" : "/business/events");
  };

  return (
    <BusinessShell title="Feature this" back={type === "special" ? "/business/specials" : "/business/events"}>
      <Card style={{ marginTop: 24 }}>
        <H3>Feature fee</H3>
        <p style={{ fontSize: 53, fontWeight: 400, color: COLORS.heading, margin: "16px 0 4px", lineHeight: 1 }}>
          {FEATURE_FEE}
        </p>
        <Small soft>Runs for {FEATURE_DAYS} days</Small>
        <div style={{ height: 1, background: COLORS.divider, margin: "20px 0" }} />
        {item && <Body style={{ marginBottom: 20 }}>{item.payload?.title ?? "Untitled"}</Body>}
        <div style={{ marginBottom: 20 }}>
          <Label>Start date</Label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <Small soft style={{ marginTop: 6 }}>Ends {end}</Small>
        </div>
        <Button full onClick={submit} disabled={busy}>{busy ? "Sending..." : "Pay and submit for review"}</Button>
        <Small soft style={{ marginTop: 12, textAlign: "center" }}>
          Payment is being set up. We will only feature your item once we approve it.
        </Small>
      </Card>
    </BusinessShell>
  );
};

export default BusinessFeature;
