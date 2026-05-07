import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessOwner } from "@/hooks/useBusinessOwner";
import BusinessShell from "@/components/business/BusinessShell";
import { Button, Input, Label, Textarea, Card, Body, Small, StatusPill, COLORS } from "@/components/business/ui";
import { toast } from "sonner";

interface Props { mode: "new" | "edit" }

const BusinessSpecialForm = ({ mode }: Props) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { listing, account, user } = useBusinessOwner();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [feature, setFeature] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alreadyFeatured, setAlreadyFeatured] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    (async () => {
      const { data } = await supabase.from("specials_pending").select("*").eq("id", id).maybeSingle();
      if (data) {
        const p: any = data.payload || {};
        setTitle(p.title ?? "");
        setDescription(p.description ?? "");
        setImageUrl(p.image_url ?? "");
        setValidFrom(p.valid_from ?? "");
        setValidUntil(p.valid_until ?? "");
        setFeature(!!data.feature_requested);
        setStatus(data.status);
        setAdminNote(data.admin_note);
        setAlreadyFeatured(false);
      }
    })();
  }, [mode, id]);

  const upload = async (file: File) => {
    setUploading(true);
    const path = `${user?.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("listing-images").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
  };

  const submit = async () => {
    if (!user || !listing) return;
    setBusy(true);
    const payload = {
      title,
      description,
      image_url: imageUrl,
      valid_from: validFrom || null,
      valid_until: validUntil || null,
      business_name: account?.business_name ?? listing.title,
      business_id: listing.id,
      deal_label: title,
    };
    if (mode === "new") {
      const { data, error } = await supabase.from("specials_pending").insert({
        owner_id: user.id, listing_id: listing.id, payload, feature_requested: feature,
      }).select("id").single();
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Sent for review");
      if (feature && data) navigate(`/business/feature/special/${data.id}`);
      else navigate("/business/specials");
    } else {
      const { error } = await supabase.from("specials_pending").update({ payload, feature_requested: feature }).eq("id", id!);
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Updated");
      navigate("/business/specials");
    }
  };

  if (!listing) {
    return (
      <BusinessShell title="Special" back="/business/specials">
        <Card style={{ marginTop: 24 }}>
          <Body>Claim your listing first.</Body>
          <div style={{ marginTop: 12 }}>
            <Button onClick={() => navigate("/business/claim")}>Claim a listing</Button>
          </div>
        </Card>
      </BusinessShell>
    );
  }

  return (
    <BusinessShell title={mode === "new" ? "Post a special" : "Edit special"} back="/business/specials">
      {status && (
        <div style={{ marginTop: 12, marginBottom: 16 }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Small soft>Status</Small>
              <StatusPill status={status} />
            </div>
            {adminNote && <Body style={{ marginTop: 8 }}>{adminNote}</Body>}
          </Card>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 16 }}>
        <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
        <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div>
          <Label>Image</Label>
          {imageUrl && <img src={imageUrl} alt="" style={{ width: "100%", borderRadius: 14, marginBottom: 12, aspectRatio: "4/3", objectFit: "cover" }} />}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading..." : imageUrl ? "Replace image" : "Upload image"}
          </Button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><Label>Valid from</Label><Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} /></div>
          <div><Label>Valid until</Label><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
        </div>

        {!alreadyFeatured && (
          <Card style={{ padding: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={feature} onChange={(e) => setFeature(e.target.checked)} />
              <div style={{ flex: 1 }}>
                <Body style={{ fontWeight: 500 }}>Feature this</Body>
                <Small soft style={{ marginTop: 4 }}>Pay a one-off fee to feature this special on the home page.</Small>
              </div>
            </label>
          </Card>
        )}

        <Button full onClick={submit} disabled={busy || !title}>
          {busy ? "Sending..." : feature ? "Pay and submit for review" : "Send for review"}
        </Button>
        <Small soft style={{ textAlign: "center" }}>This will go live once we approve it.</Small>
      </div>
    </BusinessShell>
  );
};

export default BusinessSpecialForm;
