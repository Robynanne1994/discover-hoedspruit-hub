import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessOwner } from "@/hooks/useBusinessOwner";
import BusinessShell from "@/components/business/BusinessShell";
import { Button, Input, Label, Textarea, Card, Body, H2, Small, StatusPill, COLORS } from "@/components/business/ui";
import { toast } from "sonner";

interface ListingHit { id: string; title: string; location: string | null; phone: string | null; email: string | null; business_owner_id: string | null }

const BusinessClaim = () => {
  const navigate = useNavigate();
  const { user, listing, pendingClaim, refresh } = useBusinessOwner();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ListingHit[]>([]);
  const [picked, setPicked] = useState<ListingHit | null>(null);
  const [proof, setProof] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (listing) navigate("/business/dashboard", { replace: true });
  }, [listing, navigate]);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, title, location, phone, email, business_owner_id")
        .ilike("title", `%${q.trim()}%`)
        .is("business_owner_id", null)
        .limit(10);
      setResults((data ?? []) as ListingHit[]);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const submit = async () => {
    if (!user || !picked) return;
    setBusy(true);
    const { error } = await supabase.from("claim_requests").insert({
      user_id: user.id,
      listing_id: picked.id,
      proof_contact: proof || null,
      note: note || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Claim sent for review");
    await refresh();
    navigate("/business/dashboard");
  };

  if (pendingClaim && pendingClaim.status === "pending") {
    return (
      <BusinessShell title="Claim business" back="/business/dashboard">
        <Card style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 12 }}><StatusPill status="pending" /></div>
          <H2>Claim under review</H2>
          <Body soft style={{ marginTop: 8 }}>We will review this within 48 hours. You will be able to edit your business details once we approve.</Body>
        </Card>
      </BusinessShell>
    );
  }

  return (
    <BusinessShell title="Claim your business" back="/business/dashboard">
      <div style={{ marginTop: 12, marginBottom: 36 }}>
        <H2>Find your business</H2>
        <Body soft style={{ marginTop: 8 }}>Search by name. Pick the matching business then send your claim.</Body>
      </div>

      {!picked ? (
        <>
          <Input placeholder="Search by business name" value={q} onChange={(e) => setQ(e.target.value)} />
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {results.map((r) => (
              <Card key={r.id} onClick={() => setPicked(r)}>
                <Body style={{ fontWeight: 500 }}>{r.title}</Body>
                {r.location && <Small soft style={{ marginTop: 4 }}>{r.location}</Small>}
              </Card>
            ))}
            {q.trim().length >= 2 && results.length === 0 && (
              <Small soft style={{ textAlign: "center", padding: 24 }}>No matches. Try another name.</Small>
            )}
          </div>
        </>
      ) : (
        <>
          <Card>
            <Small soft>Claiming</Small>
            <Body style={{ fontWeight: 500, marginTop: 4 }}>{picked.title}</Body>
            {picked.location && <Small soft style={{ marginTop: 4 }}>{picked.location}</Small>}
            <button
              onClick={() => setPicked(null)}
              style={{ marginTop: 12, background: "none", border: "none", color: COLORS.body, textDecoration: "underline", cursor: "pointer", fontSize: 14, padding: 0 }}
            >
              Pick a different business
            </button>
          </Card>

          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <Label>Proof contact</Label>
              <Input
                placeholder={picked.phone || picked.email || "Phone or email already on the listing"}
                value={proof}
                onChange={(e) => setProof(e.target.value)}
              />
              <Small soft style={{ marginTop: 6 }}>Use a contact number or email already shown on this listing.</Small>
            </div>
            <div>
              <Label>Note</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tell us a little about your role at the business"
              />
            </div>
            <Button full onClick={submit} disabled={busy}>{busy ? "Sending..." : "Send for review"}</Button>
          </div>
        </>
      )}
    </BusinessShell>
  );
};

export default BusinessClaim;
