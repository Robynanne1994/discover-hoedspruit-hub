import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessOwner } from "@/hooks/useBusinessOwner";
import BusinessShell from "@/components/business/BusinessShell";
import { Button, Input, Label, Textarea, Card, Body, Small, StatusPill, COLORS } from "@/components/business/ui";
import { toast } from "sonner";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Hours { [day: string]: { closed: boolean; open: string; close: string } }

const blankHours = (): Hours =>
  Object.fromEntries(DAYS.map((d) => [d, { closed: false, open: "09:00", close: "17:00" }]));

const BusinessListing = () => {
  const navigate = useNavigate();
  const { listing } = useBusinessOwner();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [hours, setHours] = useState<Hours>(blankHours());
  const [latestPending, setLatestPending] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!listing) return;
      const { data: full } = await supabase.from("listings").select("*").eq("id", listing.id).maybeSingle();
      if (full) {
        setTitle(full.title ?? "");
        setDescription(full.description ?? "");
        setPhone(full.phone ?? "");
        setEmail(full.email ?? "");
        setWebsite(full.website ?? "");
        setLocation(full.location ?? "");
        const oh = (full.opening_hours ?? {}) as Hours;
        const merged = blankHours();
        DAYS.forEach((d) => { if (oh[d]) merged[d] = { ...merged[d], ...oh[d] }; });
        setHours(merged);
      }
      const { data: pend } = await supabase
        .from("listing_edits_pending")
        .select("*")
        .eq("listing_id", listing.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setLatestPending(pend);
    };
    load();
  }, [listing]);

  if (!listing) {
    return (
      <BusinessShell title="Listing" back="/business/dashboard">
        <Card style={{ marginTop: 24 }}>
          <Body>You have not linked a listing yet.</Body>
          <div style={{ marginTop: 12 }}>
            <Button onClick={() => navigate("/business/claim")}>Claim a listing</Button>
          </div>
        </Card>
      </BusinessShell>
    );
  }

  const submit = async () => {
    setBusy(true);
    const payload = { title, description, phone, email, website, location, opening_hours: hours };
    const { error } = await supabase.from("listing_edits_pending").insert({
      listing_id: listing.id,
      owner_id: (await supabase.auth.getUser()).data.user!.id,
      payload,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Sent for review");
    navigate("/business/dashboard");
  };

  const updateDay = (d: string, patch: Partial<Hours[string]>) =>
    setHours((h) => ({ ...h, [d]: { ...h[d], ...patch } }));

  return (
    <BusinessShell title="Edit listing" back="/business/dashboard">
      {latestPending && latestPending.status === "pending" && (
        <div style={{ marginTop: 12, marginBottom: 16 }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Small soft>Last submission</Small>
              <StatusPill status="pending" />
            </div>
            <Small soft style={{ marginTop: 8 }}>We will review this within 48 hours.</Small>
          </Card>
        </div>
      )}
      {latestPending && latestPending.status === "changes_requested" && latestPending.admin_note && (
        <div style={{ marginTop: 12, marginBottom: 16 }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Small soft>Last submission</Small>
              <StatusPill status="changes_requested" />
            </div>
            <Body style={{ marginTop: 8 }}>{latestPending.admin_note}</Body>
          </Card>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 16 }}>
        <div><Label>Business name</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
        <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><Label>Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} /></div>

        <div>
          <Label>Opening hours</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DAYS.map((d) => (
              <Card key={d} style={{ padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, fontWeight: 500 }}>{d}</div>
                  {hours[d].closed ? (
                    <div style={{ flex: 1, color: COLORS.bodySoft, fontSize: 14 }}>Closed</div>
                  ) : (
                    <>
                      <Input
                        type="time"
                        value={hours[d].open}
                        onChange={(e) => updateDay(d, { open: e.target.value })}
                        style={{ flex: 1, minWidth: 0 }}
                      />
                      <span style={{ color: COLORS.bodySoft }}>–</span>
                      <Input
                        type="time"
                        value={hours[d].close}
                        onChange={(e) => updateDay(d, { close: e.target.value })}
                        style={{ flex: 1, minWidth: 0 }}
                      />
                    </>
                  )}
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: COLORS.body }}>
                    <input
                      type="checkbox"
                      checked={hours[d].closed}
                      onChange={(e) => updateDay(d, { closed: e.target.checked })}
                    />
                    Closed
                  </label>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Button full onClick={submit} disabled={busy}>{busy ? "Sending..." : "Send for review"}</Button>
        <Small soft style={{ textAlign: "center" }}>This will go live once we approve it.</Small>
      </div>
    </BusinessShell>
  );
};

export default BusinessListing;
