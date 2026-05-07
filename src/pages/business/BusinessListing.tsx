import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessOwner } from "@/hooks/useBusinessOwner";
import BusinessShell from "@/components/business/BusinessShell";
import { Button, Input, Label, Textarea, Card, Body, Small, StatusPill, COLORS } from "@/components/business/ui";
import { toast } from "sonner";
import { Upload, X, Plus } from "lucide-react";

const DAYS: { label: string; key: string }[] = [
  { label: "Mon", key: "monday" },
  { label: "Tue", key: "tuesday" },
  { label: "Wed", key: "wednesday" },
  { label: "Thu", key: "thursday" },
  { label: "Fri", key: "friday" },
  { label: "Sat", key: "saturday" },
  { label: "Sun", key: "sunday" },
];

interface Hours { [day: string]: { closed: boolean; open: string; close: string } }

const blankHours = (): Hours =>
  Object.fromEntries(DAYS.map((d) => [d.key, { closed: false, open: "09:00", close: "17:00" }]));

const parseDayString = (s: string): { closed: boolean; open: string; close: string } => {
  if (!s || /closed/i.test(s)) return { closed: true, open: "09:00", close: "17:00" };
  const m = s.match(/(\d{1,2})[:.]?(\d{0,2})\s*[-–]\s*(\d{1,2})[:.]?(\d{0,2})/);
  if (!m) return { closed: false, open: "09:00", close: "17:00" };
  const pad = (h: string, mm: string) => `${h.padStart(2, "0")}:${(mm || "00").padStart(2, "0")}`;
  return { closed: false, open: pad(m[1], m[2]), close: pad(m[3], m[4]) };
};

const serializeHours = (h: Hours): Record<string, string> =>
  Object.fromEntries(DAYS.map(({ key }) => [key, h[key].closed ? "Closed" : `${h[key].open}-${h[key].close}`]));

const BusinessListing = () => {
  const navigate = useNavigate();
  const { listing } = useBusinessOwner();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [hours, setHours] = useState<Hours>(blankHours());
  const [latestPending, setLatestPending] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!listing) return;
      const { data: full } = await supabase.from("listings").select("*").eq("id", listing.id).maybeSingle();
      if (full) {
        setTitle(full.title ?? "");
        setDescription(full.description ?? "");
        setLongDescription((full as any).long_description ?? "");
        setPhone(full.phone ?? "");
        setWhatsapp(full.whatsapp ?? "");
        setEmail(full.email ?? "");
        setWebsite(full.website ?? "");
        setLocation(full.location ?? "");
        setImageUrl(full.image_url ?? "");
        setGallery((full.gallery_images ?? []) as string[]);
        const oh = (full.opening_hours ?? {}) as Record<string, string>;
        const merged = blankHours();
        DAYS.forEach(({ key }) => { if (oh[key] !== undefined) merged[key] = parseDayString(oh[key] as string); });
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
      <BusinessShell title="BUSINESS" back="/business/dashboard">
        <Card style={{ marginTop: 24 }}>
          <Body>You have not linked a business yet.</Body>
          <div style={{ marginTop: 12 }}>
            <Button onClick={() => navigate("/business/claim")}>CLAIM A BUSINESS</Button>
          </div>
        </Card>
      </BusinessShell>
    );
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${listing.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("listing-images").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); return null; }
    const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const url = await uploadFile(file);
    setUploadingCover(false);
    if (url) setImageUrl(url);
    e.target.value = "";
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadingGallery(true);
    const urls: string[] = [];
    for (const f of files) {
      const url = await uploadFile(f);
      if (url) urls.push(url);
    }
    setUploadingGallery(false);
    setGallery((g) => [...g, ...urls]);
    e.target.value = "";
  };

  const removeGalleryImage = (i: number) => setGallery((g) => g.filter((_, idx) => idx !== i));

  const submit = async () => {
    setBusy(true);
    const payload = {
      title, description, long_description: longDescription, phone, whatsapp, email, website, location,
      image_url: imageUrl, gallery_images: gallery, opening_hours: serializeHours(hours),
    };
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
    <BusinessShell title="EDIT BUSINESS" back="/business/dashboard">
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
        <div>
          <Label>Cover image</Label>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            style={{ display: "none" }}
          />
          {imageUrl ? (
            <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", height: 360, width: "100%" }}>
              <img src={imageUrl} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                style={{
                  position: "absolute", bottom: 8, right: 8,
                  background: "rgba(0,0,0,0.7)", color: "#fff",
                  border: "none", borderRadius: 20, padding: "8px 14px",
                  fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                <Upload size={14} />
                {uploadingCover ? "Uploading..." : "Replace"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              style={{
                width: "100%", aspectRatio: "3/4",
                background: "rgba(18,18,20,0.04)",
                border: `1px dashed ${COLORS.inputBorder}`,
                borderRadius: 14, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 8, color: COLORS.bodySoft, fontSize: 14,
              }}
            >
              <Upload size={24} />
              {uploadingCover ? "Uploading..." : "Upload cover"}
            </button>
          )}
        </div>

        <div><Label>Business name</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div>
          <Label>Short description</Label>
          <Textarea
            value={description}
            maxLength={200}
            rows={3}
            onChange={(e) => setDescription(e.target.value.slice(0, 200))}
            placeholder="A 1–2 sentence intro shown in listing cards"
          />
          <Small soft style={{ marginTop: 4, display: "block", textAlign: "right" }}>{description.length}/200</Small>
        </div>
        <div>
          <Label>Long description</Label>
          <Textarea
            value={longDescription}
            maxLength={1500}
            rows={8}
            onChange={(e) => setLongDescription(e.target.value.slice(0, 1500))}
            placeholder="1–2 paragraphs about your business, shown on the detail page"
          />
          <Small soft style={{ marginTop: 4, display: "block", textAlign: "right" }}>{longDescription.length}/1500</Small>
        </div>
        <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
        <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div><Label>WhatsApp</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="e.g. +27 82 123 4567" /></div>
        <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><Label>Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} /></div>

        <div>
          <Label>Image gallery</Label>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryUpload}
            style={{ display: "none" }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {gallery.map((url, i) => (
              <div key={i} style={{ position: "relative", aspectRatio: "1/1", borderRadius: 12, overflow: "hidden" }}>
                <img src={url} alt={`Gallery ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(i)}
                  style={{
                    position: "absolute", top: 4, right: 4,
                    background: "rgba(0,0,0,0.7)", color: "#fff",
                    border: "none", borderRadius: "50%", width: 24, height: 24,
                    display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploadingGallery}
              style={{
                aspectRatio: "1/1",
                background: "rgba(18,18,20,0.04)",
                border: `1px dashed ${COLORS.inputBorder}`,
                borderRadius: 12, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 4, color: COLORS.bodySoft, fontSize: 12,
              }}
            >
              <Plus size={20} />
              {uploadingGallery ? "Uploading..." : "Add"}
            </button>
          </div>
        </div>

        <div>
          <Label>Opening hours</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DAYS.map(({ label, key }) => (
              <Card key={key} style={{ padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: hours[key].closed ? 0 : 12 }}>
                  <div style={{ fontWeight: 500, fontSize: 16 }}>{label}</div>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: COLORS.body }}>
                    <input
                      type="checkbox"
                      checked={hours[key].closed}
                      onChange={(e) => updateDay(key, { closed: e.target.checked })}
                    />
                    Closed
                  </label>
                </div>
                {!hours[key].closed && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: COLORS.bodySoft, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Open</div>
                      <Input
                        type="time"
                        value={hours[key].open}
                        onChange={(e) => updateDay(key, { open: e.target.value })}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: COLORS.bodySoft, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Close</div>
                      <Input
                        type="time"
                        value={hours[key].close}
                        onChange={(e) => updateDay(key, { close: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        <Button full onClick={submit} disabled={busy}>{busy ? "SENDING..." : "SEND FOR REVIEW"}</Button>
        <Small soft style={{ textAlign: "center" }}>This will go live once we approve it.</Small>
      </div>
    </BusinessShell>
  );
};

export default BusinessListing;
