import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessOwner } from "@/hooks/useBusinessOwner";
import BusinessShell from "@/components/business/BusinessShell";
import { Button, Input, Label, Textarea, Card, Body, Small, StatusPill } from "@/components/business/ui";
import { toast } from "sonner";

interface Props { mode: "new" | "edit" }

const BusinessEventForm = ({ mode }: Props) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { listing, user } = useBusinessOwner();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [bookingLink, setBookingLink] = useState("");
  const [category1, setCategory1] = useState("");
  const [category2, setCategory2] = useState("");
  const [category3, setCategory3] = useState("");
  const [feature, setFeature] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [locSuggestions, setLocSuggestions] = useState<{ id: string; title: string; location: string | null }[]>([]);
  const [showLocSugg, setShowLocSugg] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = location.trim();
    if (!q || q.length < 2 || !showLocSugg) { setLocSuggestions([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("listings")
        .select("id,title,location")
        .or(`title.ilike.%${q}%,location.ilike.%${q}%`)
        .limit(6);
      if (!cancelled) setLocSuggestions(data ?? []);
    }, 180);
    return () => { cancelled = true; clearTimeout(t); };
  }, [location, showLocSugg]);

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    (async () => {
      const { data } = await supabase.from("events_pending").select("*").eq("id", id).maybeSingle();
      if (data) {
        const p: any = data.payload || {};
        setTitle(p.title ?? "");
        setDescription(p.description ?? "");
        setImageUrl(p.image_url ?? "");
        setDate(p.date ?? "");
        setStartDate(p.start_date ?? "");
        setEndDate(p.end_date ?? "");
        setStartTime(p.start_time ?? "");
        setEndTime(p.end_time ?? "");
        setLocation(p.location ?? "");
        setPrice(p.price ?? "");
        setBookingLink(p.booking_link ?? "");
        setCategory1(p.sub_tag_1 ?? p.category_1 ?? "");
        setCategory2(p.sub_tag_2 ?? p.category_2 ?? "");
        setCategory3(p.category_3 ?? "");
        setGalleryImages(Array.isArray(p.gallery_images) ? p.gallery_images : []);
        setFeature(!!data.feature_requested);
        setStatus(data.status);
        setAdminNote(data.admin_note);
      }
    })();
  }, [mode, id]);

  const upload = async (file: File) => {
    setUploading(true);
    const path = `${user?.id}/events/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("listing-images").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
  };

  const uploadGallery = async (files: FileList) => {
    setUploadingGallery(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${user?.id}/events/gallery/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("listing-images").upload(path, file, { upsert: true });
      if (error) { toast.error(error.message); continue; }
      const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    setGalleryImages((prev) => [...prev, ...urls]);
    setUploadingGallery(false);
  };

  const submit = async () => {
    if (!user || !listing) return;
    setBusy(true);
    const payload = {
      title,
      description,
      image_url: imageUrl,
      gallery_images: galleryImages,
      date: date || startDate,
      start_date: startDate || null,
      end_date: endDate || null,
      start_time: startTime || null,
      end_time: endTime || null,
      location,
      price: price || null,
      booking_link: bookingLink || null,
      booking_link_label: bookingLinkLabel || null,
      business_id: listing.id,
    };
    if (mode === "new") {
      const { data, error } = await supabase.from("events_pending").insert({
        owner_id: user.id, listing_id: listing.id, payload, feature_requested: feature,
      }).select("id").single();
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Sent for review");
      if (feature && data) navigate(`/business/feature/event/${data.id}`);
      else navigate("/business/events");
    } else {
      const { error } = await supabase.from("events_pending").update({ payload, feature_requested: feature }).eq("id", id!);
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Updated");
      navigate("/business/events");
    }
  };

  if (!listing) {
    return (
      <BusinessShell title="Event" back="/business/events">
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
    <BusinessShell theme="dark" title={mode === "new" ? "Post an event" : "Edit event"} back="/business/events">
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
        <div style={{ position: "relative" }}>
          <Label>Location</Label>
          <Input
            value={location}
            onChange={(e) => { setLocation(e.target.value); setShowLocSugg(true); }}
            onFocus={() => setShowLocSugg(true)}
            onBlur={() => setTimeout(() => setShowLocSugg(false), 150)}
            placeholder="Start typing a venue or address"
          />
          {showLocSugg && locSuggestions.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#FFFFFF", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.18)", zIndex: 20, overflow: "hidden" }}>
              {locSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setLocation(s.title); setShowLocSugg(false); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer", color: "#0A0A0A", fontSize: 14, borderBottom: "1px solid #EFEAE2" }}
                >
                  <div style={{ fontWeight: 500 }}>{s.title}</div>
                  {s.location && <div style={{ fontSize: 12, color: "#6B6560", marginTop: 2 }}>{s.location}</div>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label>Image</Label>
          {imageUrl && <img src={imageUrl} alt="" style={{ width: "100%", borderRadius: 14, marginBottom: 12, aspectRatio: "4/3", objectFit: "cover" }} />}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading..." : imageUrl ? "Replace image" : "Upload image"}
          </Button>
        </div>
        <div><Label>Date label</Label><Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="e.g. Sat 14 June" /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><Label>Start date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
          <div><Label>End date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><Label>Start time</Label><Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
          <div><Label>End time</Label><Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>
        </div>
        <div><Label>Price</Label><Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. R150 / Free" /></div>
        <div><Label>Booking link</Label><Input value={bookingLink} onChange={(e) => setBookingLink(e.target.value)} placeholder="https://..." type="url" /></div>
        <div><Label>Booking link label</Label><Input value={bookingLinkLabel} onChange={(e) => setBookingLinkLabel(e.target.value)} placeholder="e.g. Book now" /></div>
        <div>
          <Label>Gallery images</Label>
          {galleryImages.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
              {galleryImages.map((url, i) => (
                <div key={i} style={{ position: "relative", aspectRatio: "1/1", borderRadius: 10, overflow: "hidden" }}>
                  <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => setGalleryImages((g) => g.filter((_, idx) => idx !== i))}
                    style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 999, background: "rgba(0,0,0,0.65)", color: "#FFFFFF", border: "none", cursor: "pointer", fontSize: 14, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                    aria-label="Remove"
                  >×</button>
                </div>
              ))}
            </div>
          )}
          <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && uploadGallery(e.target.files)} />
          <Button variant="secondary" onClick={() => galleryRef.current?.click()} disabled={uploadingGallery}>
            {uploadingGallery ? "Uploading..." : "Add gallery images"}
          </Button>
        </div>

        <Card style={{ padding: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={feature} onChange={(e) => setFeature(e.target.checked)} />
            <div style={{ flex: 1 }}>
              <Body style={{ fontWeight: 500 }}>Feature this</Body>
              <Small soft style={{ marginTop: 4 }}>Pay a one-off fee to feature this event on the home page.</Small>
            </div>
          </label>
        </Card>

        <Button full onClick={submit} disabled={busy || !title}>
          {busy ? "Sending..." : feature ? "Pay and submit for review" : "Send for review"}
        </Button>
        <Small soft style={{ textAlign: "center" }}>This will go live once we approve it.</Small>
      </div>
    </BusinessShell>
  );
};

export default BusinessEventForm;
