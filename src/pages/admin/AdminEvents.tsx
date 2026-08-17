import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileSpreadsheet, Upload, X, Image as ImageIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ImageSlotField from "@/components/admin/ImageSlotField";
import { ADMIN_EDITOR_DIALOG, ADMIN_IMAGE_GRID } from "@/lib/adminEditorLayout";
import MultiContactField from "@/components/admin/MultiContactField";
import ListingContactPicker from "@/components/admin/ListingContactPicker";
import IncludedChipsInput from "@/components/admin/IncludedChipsInput";
import { sanitizeContactArray } from "@/lib/contacts";
import HostLinkField from "@/components/admin/HostLinkField";
import { eventImageSlot } from "@/lib/eventImageSlots";

type Event = Tables<"events">;
const RECURRENCE_OPTIONS = ["", "Daily", "Weekly", "Biweekly", "Monthly", "Bimonthly", "Quarterly", "Annually"];

// All three host photos land in the same 48px circle, so they share one slot.
const hostSlot = eventImageSlot("host");
const emptyForm = { title: "", title_override: "", description: "", date: "", start_date: "", end_date: "", location: "", tag: "", sub_tag_1: "", sub_tag_2: "", image_url: "", detail_image_url: "", start_time: "", end_time: "", recurrence: "", google_maps_link: "", social_media_link: "", social_media_label: "", contact_email: "", contact_phone: "", contact_whatsapp: "", additional_emails: [] as string[], additional_phones: [] as string[], additional_whatsapps: [] as string[], gallery_images: "", booking_link: "", price: "", included: [] as string[], price_notes: [] as string[], notes: [] as string[], business_id: "", business_ids: [] as string[], is_featured: false, hosted_by_name: "", hosted_by_subtitle: "", hosted_by_image_url: "", hosted_by_link: "", hosted_by_listing_id: "", hosted_by_name_2: "", hosted_by_subtitle_2: "", hosted_by_image_url_2: "", hosted_by_link_2: "", hosted_by_listing_id_2: "", hosted_by_name_3: "", hosted_by_subtitle_3: "", hosted_by_image_url_3: "", hosted_by_link_3: "", hosted_by_listing_id_3: "" };

const EventGalleryUpload = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const urls = value ? value.split("\n").filter(Boolean) : [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `events/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("listing-images").upload(path, file);
      if (error) { toast.error(`Failed: ${file.name}`); continue; }
      const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
      newUrls.push(data.publicUrl);
    }
    if (newUrls.length > 0) {
      onChange([...urls, ...newUrls].join("\n"));
      toast.success(`${newUrls.length} image(s) uploaded`);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeUrl = (index: number) => onChange(urls.filter((_, i) => i !== index).join("\n"));

  return (
    <div className="space-y-2">
      <Label>Gallery Images</Label>
      {urls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {urls.map((url, i) => (
            <div key={i} className="relative aspect-[4/3] rounded overflow-hidden border border-border">
              <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
              <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeUrl(i)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} placeholder="Paste image URLs (one per line) or upload below" className="text-xs" />
      <div className="flex gap-2">
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()} className="gap-1.5">
          {uploading ? <><ImageIcon className="h-3.5 w-3.5 animate-pulse" /> Uploading...</> : <><Upload className="h-3.5 w-3.5" /> Upload Images</>}
        </Button>
      </div>
    </div>
  );
};

const EventCoverUpload = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `events/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("listing-images").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
    onChange(data.publicUrl);
    toast.success("Cover image uploaded");
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <Label>Cover Image</Label>
      {value && (
        <div className="relative w-full aspect-[4/3] rounded overflow-hidden border border-border">
          <img src={value} alt="Cover" className="w-full h-full object-cover" />
          <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => onChange("")}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Paste image URL or upload below" />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()} className="gap-1.5">
        {uploading ? <><ImageIcon className="h-3.5 w-3.5 animate-pulse" /> Uploading...</> : <><Upload className="h-3.5 w-3.5" /> Upload Image</>}
      </Button>
    </div>
  );
};

const AdminEvents = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState<"active" | "passed">("active");

  const isEventActive = (ev: any) => {
    if (ev?.recurrence && String(ev.recurrence).trim() !== "") return true;
    const end = ev?.end_date || ev?.start_date;
    if (!end) return true;
    const todayStr = new Date().toISOString().slice(0, 10);
    return String(end) >= todayStr;
  };

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: listings } = useQuery({
    queryKey: ["all-listings-for-events-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("listings").select("id, title").order("title");
      return data ?? [];
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: typeof form) => {
      const galleryArr = values.gallery_images ? values.gallery_images.split("\n").filter(Boolean) : [];
      const payload: any = {
        title: values.title,
        title_override: (values as any).title_override?.trim() || null,
        description: values.description || null,
        date: values.date || (values.start_date && values.end_date && values.start_date !== values.end_date ? `${values.start_date} to ${values.end_date}` : (values.start_date || "")),
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        location: values.location || null,
        tag: values.tag || null,
        sub_tag_1: values.sub_tag_1 || null,
        sub_tag_2: values.sub_tag_2 || null,
        image_url: values.image_url || null,
        detail_image_url: (values as any).detail_image_url || null,
        start_time: values.start_time || null,
        end_time: values.end_time || null,
        recurrence: values.recurrence || null,
        google_maps_link: values.google_maps_link || null,
        social_media_link: values.social_media_link || null,
        social_media_label: values.social_media_label || null,
        contact_email: values.contact_email || null,
        contact_phone: values.contact_phone || null,
        contact_whatsapp: values.contact_whatsapp || null,
        additional_emails: sanitizeContactArray(values.additional_emails),
        additional_phones: sanitizeContactArray(values.additional_phones),
        additional_whatsapps: sanitizeContactArray(values.additional_whatsapps),
        gallery_images: galleryArr,
        booking_link: values.booking_link || null,
        price: values.price || null,
        included: Array.isArray((values as any).included) ? (values as any).included.map((s: string) => s.trim()).filter(Boolean) : [],
        notes: Array.isArray((values as any).notes) ? (values as any).notes.map((s: string) => s.trim()).filter(Boolean) : (typeof (values as any).notes === "string" && (values as any).notes.trim() ? [(values as any).notes.trim()] : []),
        price_notes: Array.isArray((values as any).price_notes) ? (values as any).price_notes.map((s: string) => s.trim()).filter(Boolean) : [],
        business_id: ((values as any).business_ids?.[0]) || values.business_id || null,
        business_ids: Array.isArray((values as any).business_ids) ? (values as any).business_ids.filter(Boolean) : [],
        is_featured: !!values.is_featured,
        hosted_by_name: values.hosted_by_name || null,
        hosted_by_subtitle: values.hosted_by_subtitle || null,
        hosted_by_image_url: values.hosted_by_image_url || null,
        hosted_by_link: values.hosted_by_link || null,
        hosted_by_listing_id: values.hosted_by_listing_id || null,
        hosted_by_name_2: values.hosted_by_name_2 || null,
        hosted_by_subtitle_2: values.hosted_by_subtitle_2 || null,
        hosted_by_image_url_2: values.hosted_by_image_url_2 || null,
        hosted_by_link_2: values.hosted_by_link_2 || null,
        hosted_by_listing_id_2: values.hosted_by_listing_id_2 || null,
        hosted_by_name_3: values.hosted_by_name_3 || null,
        hosted_by_subtitle_3: values.hosted_by_subtitle_3 || null,
        hosted_by_image_url_3: values.hosted_by_image_url_3 || null,
        hosted_by_link_3: values.hosted_by_link_3 || null,
        hosted_by_listing_id_3: values.hosted_by_listing_id_3 || null,
      };
      if (editing) {
        const { error } = await supabase.from("events").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success("Event deleted");
    },
  });

  const resetForm = () => { setForm(emptyForm); setEditing(null); setOpen(false); };

  const openEdit = (ev: Event) => {
    setEditing(ev);
    setForm({
      title: ev.title,
      title_override: (ev as any).title_override ?? "",
      description: ev.description ?? "",
      date: ev.date,
      start_date: (ev as any).start_date ?? "",
      end_date: (ev as any).end_date ?? "",
      location: ev.location ?? "",
      tag: ev.tag ?? "",
      sub_tag_1: (ev as any).sub_tag_1 ?? "",
      sub_tag_2: (ev as any).sub_tag_2 ?? "",
      image_url: ev.image_url ?? "",
      detail_image_url: (ev as any).detail_image_url ?? "",
      start_time: ev.start_time ?? "",
      end_time: ev.end_time ?? "",
      recurrence: ev.recurrence ?? "",
      google_maps_link: ev.google_maps_link ?? "",
      social_media_link: (ev as any).social_media_link ?? "",
      social_media_label: (ev as any).social_media_label ?? "",
      contact_email: (ev as any).contact_email ?? "",
      contact_phone: (ev as any).contact_phone ?? "",
      contact_whatsapp: (ev as any).contact_whatsapp ?? "",
      additional_emails: ((ev as any).additional_emails ?? []) as string[],
      additional_phones: ((ev as any).additional_phones ?? []) as string[],
      additional_whatsapps: ((ev as any).additional_whatsapps ?? []) as string[],
      gallery_images: ((ev as any).gallery_images ?? []).join("\n"),
      booking_link: (ev as any).booking_link ?? "",
      price: (ev as any).price ?? "",
      included: Array.isArray((ev as any).included) ? (ev as any).included : [],
      notes: Array.isArray((ev as any).notes) ? (ev as any).notes : ((ev as any).notes ? [(ev as any).notes] : []),
      price_notes: Array.isArray((ev as any).price_notes) ? (ev as any).price_notes : [],
      business_id: (ev as any).business_id ?? "",
      business_ids: Array.isArray((ev as any).business_ids) && (ev as any).business_ids.length > 0
        ? (ev as any).business_ids
        : ((ev as any).business_id ? [(ev as any).business_id] : []),
      is_featured: !!(ev as any).is_featured,
      hosted_by_name: (ev as any).hosted_by_name ?? "",
      hosted_by_subtitle: (ev as any).hosted_by_subtitle ?? "",
      hosted_by_image_url: (ev as any).hosted_by_image_url ?? "",
      hosted_by_link: ev.hosted_by_link ?? "",
      hosted_by_listing_id: (ev as any).hosted_by_listing_id ?? "",
      hosted_by_name_2: (ev as any).hosted_by_name_2 ?? "",
      hosted_by_subtitle_2: (ev as any).hosted_by_subtitle_2 ?? "",
      hosted_by_image_url_2: (ev as any).hosted_by_image_url_2 ?? "",
      hosted_by_link_2: ev.hosted_by_link_2 ?? "",
      hosted_by_listing_id_2: (ev as any).hosted_by_listing_id_2 ?? "",
      hosted_by_name_3: (ev as any).hosted_by_name_3 ?? "",
      hosted_by_subtitle_3: (ev as any).hosted_by_subtitle_3 ?? "",
      hosted_by_image_url_3: (ev as any).hosted_by_image_url_3 ?? "",
      hosted_by_link_3: ev.hosted_by_link_3 ?? "",
      hosted_by_listing_id_3: (ev as any).hosted_by_listing_id_3 ?? "",
    });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 lg:mb-8">
        <h1 className="font-heading text-2xl lg:text-3xl font-[550] text-slate-950">Events</h1>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/events/import">
            <Button variant="outline" className="gap-2"><FileSpreadsheet className="h-4 w-4" /> <span className="hidden sm:inline">Import/Export CSV</span><span className="sm:hidden">CSV</span></Button>
          </Link>
          <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Event</Button>
          </DialogTrigger>
          <DialogContent className={ADMIN_EDITOR_DIALOG}>
            <DialogHeader><DialogTitle>{editing ? "Edit Event" : "Add Event"}</DialogTitle></DialogHeader>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); upsert.mutate(form); }}>
              <div>
                <Label>Title</Label>
                <Input
                  value={form.title}
                  // With "use exactly as typed" on, the override follows the
                  // title field — there is no second box to keep in step.
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      title: e.target.value,
                      ...(f.title_override.trim() ? { title_override: e.target.value } : {}),
                    }))
                  }
                  required
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="event-use-title-override"
                    checked={!!(form.title_override && form.title_override.trim())}
                    onCheckedChange={(v) => setForm({ ...form, title_override: v ? (form.title || "") : "" })}
                  />
                  <Label htmlFor="event-use-title-override" className="text-sm cursor-pointer font-normal">
                    Use the title exactly as typed (no auto-capitalisation)
                  </Label>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="h-4 w-4" />
                  <span className="text-sm font-medium">Featured event</span>
                  <span className="text-xs text-muted-foreground">(highlight on homepage / events page)</span>
                </label>
              </div>
              <div><Label>Description <span className="text-xs text-muted-foreground">(HTML supported)</span></Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div><Label>Date Text <span className="text-xs text-muted-foreground">(e.g. "Every Saturday")</span></Label><Input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="Optional — leave blank to use start/end dates" /></div>
              <div><Label>Location <span className="text-xs text-muted-foreground">(HTML supported)</span></Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Time</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
                <div><Label>End Time</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
              </div>
              <div><Label>Tag</Label><Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="e.g. Market, Sport, Dining" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Sub-tag 1 <span className="text-xs text-muted-foreground">(optional)</span></Label><Input value={form.sub_tag_1} onChange={(e) => setForm({ ...form, sub_tag_1: e.target.value })} placeholder="e.g. Family-friendly" /></div>
                <div><Label>Sub-tag 2</Label><Input value={form.sub_tag_2} onChange={(e) => setForm({ ...form, sub_tag_2: e.target.value })} placeholder="e.g. Outdoor" /></div>
              </div>
              <div className="space-y-2">
                <Label>Linked Business Listings</Label>
                {((form as any).business_ids || []).map((bid: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <select
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={bid || ""}
                      onChange={(e) => {
                        const arr = [...((form as any).business_ids || [])];
                        arr[idx] = e.target.value;
                        setForm({ ...form, business_ids: arr, business_id: arr[0] || "" } as any);
                      }}
                    >
                      <option value="">— Select a listing —</option>
                      {(listings || []).map((l: any) => (
                        <option key={l.id} value={l.id}>{l.title}</option>
                      ))}
                    </select>
                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                      const arr = [...((form as any).business_ids || [])];
                      arr.splice(idx, 1);
                      setForm({ ...form, business_ids: arr, business_id: arr[0] || "" } as any);
                    }}>Remove</Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  const arr = [...((form as any).business_ids || []), ""];
                  setForm({ ...form, business_ids: arr } as any);
                }}>+ Add Linked Listing</Button>
              </div>
              <div><Label>Recurrence</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value })}>
                  {RECURRENCE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt || "Not recurring"}</option>)}
                </select>
              </div>
              <div className={ADMIN_IMAGE_GRID}>
                {(["card", "detail"] as const).map((key) => {
                  const slot = eventImageSlot(key);
                  return (
                    <ImageSlotField
                      key={key}
                      slot={slot}
                      value={((form as any)[slot.field] as string) || ""}
                      onChange={(v) => setForm({ ...form, [slot.field]: v } as any)}
                    />
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                The remaining pictures — Happening Soon, homepage, saved and search — are set from the
                event's own page, where each one previews in the card it lands in.
              </p>
              <EventGalleryUpload value={form.gallery_images} onChange={(v) => setForm({ ...form, gallery_images: v })} />
              <div className="grid gap-4 lg:grid-cols-2">
                <div><Label>Google Maps Link</Label><Input value={form.google_maps_link} onChange={(e) => setForm({ ...form, google_maps_link: e.target.value })} placeholder="https://maps.google.com/..." /></div>
                <div><Label>Social Media Link</Label><Input value={form.social_media_link} onChange={(e) => setForm({ ...form, social_media_link: e.target.value })} placeholder="https://instagram.com/..." /></div>
                <div><Label>Social Media Label</Label><Input value={form.social_media_label} onChange={(e) => setForm({ ...form, social_media_label: e.target.value })} placeholder="e.g. Instagram, Facebook (display text)" /></div>
                <div><Label>Booking Link</Label><Input value={form.booking_link} onChange={(e) => setForm({ ...form, booking_link: e.target.value })} placeholder="https://booking-site.com/..." /></div>
              </div>
              <div><Label>Price</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. R150, Free, R50–R100" /></div>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>What's Included</Label>
                  <p className="text-xs text-muted-foreground">Press Enter or comma after each item. Only shown on the event page if populated.</p>
                  <IncludedChipsInput value={form.included} onChange={(v) => setForm({ ...form, included: v })} />
                </div>
                <div className="space-y-2">
                  <Label>Price Notes</Label>
                  <p className="text-xs text-muted-foreground">Add each note separately — they'll appear on new lines under the price (e.g. "Per person", "Includes wine"). In CSV, separate notes with the <code>|</code> symbol.</p>
                  <IncludedChipsInput value={(form as any).price_notes || []} onChange={(v) => setForm({ ...form, price_notes: v } as any)} placeholder="e.g. Per person, then press Enter" />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <p className="text-xs text-muted-foreground">Add each note separately — they'll appear on new lines in the details card. In CSV, separate notes with the <code>|</code> symbol.</p>
                  <IncludedChipsInput value={(form as any).notes || []} onChange={(v) => setForm({ ...form, notes: v } as any)} placeholder="e.g. Bring your own chair, then press Enter" />
                </div>
              </div>
              <ListingContactPicker
                listings={listings || []}
                onApply={(c) => setForm({ ...form, ...c })}
              />
              <div className="grid gap-4 lg:grid-cols-3">
                <MultiContactField
                  label="Contact Email"
                  type="email"
                  primary={form.contact_email}
                  onPrimaryChange={(v) => setForm({ ...form, contact_email: v })}
                  extras={form.additional_emails}
                  onExtrasChange={(v) => setForm({ ...form, additional_emails: v })}
                  placeholder="info@example.com"
                  addLabel="Add email"
                />
                <MultiContactField
                  label="Contact Phone"
                  type="tel"
                  primary={form.contact_phone}
                  onPrimaryChange={(v) => setForm({ ...form, contact_phone: v })}
                  extras={form.additional_phones}
                  onExtrasChange={(v) => setForm({ ...form, additional_phones: v })}
                  placeholder="+27 ..."
                  addLabel="Add phone"
                />
                <MultiContactField
                  label="Contact WhatsApp"
                  type="tel"
                  primary={form.contact_whatsapp}
                  onPrimaryChange={(v) => setForm({ ...form, contact_whatsapp: v })}
                  extras={form.additional_whatsapps}
                  onExtrasChange={(v) => setForm({ ...form, additional_whatsapps: v })}
                  placeholder="+27 ..."
                  addLabel="Add WhatsApp"
                />
              </div>
              <div className="pt-2 border-t"><Label className="text-base font-semibold text-slate-950">Hosted By</Label></div>
              {(() => {
                const initial = form.hosted_by_name_3 ? 3 : form.hosted_by_name_2 ? 2 : form.hosted_by_name ? 1 : 0;
                const shown = (form as any).__hostsShown ?? initial;
                const setShown = (n: number) => setForm({ ...form, __hostsShown: n } as any);
                if (shown === 0) {
                  return <Button type="button" variant="outline" onClick={() => setShown(1)}>+ Add Host</Button>;
                }
                return (
                  <>
                    {[1, 2, 3].slice(0, shown).map((n) => {
                      const nameKey = (n === 1 ? "hosted_by_name" : `hosted_by_name_${n}`) as keyof typeof form;
                      const subKey = (n === 1 ? "hosted_by_subtitle" : `hosted_by_subtitle_${n}`) as keyof typeof form;
                      const imgKey = (n === 1 ? "hosted_by_image_url" : `hosted_by_image_url_${n}`) as keyof typeof form;
                      const linkKey = (n === 1 ? "hosted_by_link" : `hosted_by_link_${n}`) as keyof typeof form;
                      const listingKey = (n === 1 ? "hosted_by_listing_id" : `hosted_by_listing_id_${n}`) as keyof typeof form;
                      return (
                        <div key={n} className="space-y-3 p-3 border rounded">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold text-slate-950">Host {n}</Label>
                            {n === shown && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => {
                                setForm({ ...form, [nameKey]: "", [subKey]: "", [imgKey]: "", [linkKey]: "", [listingKey]: "", __hostsShown: shown - 1 } as any);
                              }}>Remove</Button>
                            )}
                          </div>
                          <div><Label>Name</Label><Input value={(form[nameKey] as string) || ""} onChange={(e) => setForm({ ...form, [nameKey]: e.target.value })} placeholder="e.g. Kristi & Joëlle" /></div>
                          <div><Label>Subtitle</Label><Input value={(form[subKey] as string) || ""} onChange={(e) => setForm({ ...form, [subKey]: e.target.value })} placeholder="e.g. Yoga Teachers" /></div>
                          <HostLinkField
                            key={`${editing?.id ?? "new"}-${n}`}
                            value={{ link: (form[linkKey] as string) || "", listingId: (form[listingKey] as string) || "" }}
                            listings={(listings || []) as { id: string; title: string }[]}
                            onChange={(v) => setForm((f) => ({ ...f, [linkKey]: v.link, [listingKey]: v.listingId }))}
                          />
                          <ImageSlotField
                            slot={hostSlot}
                            label="Photo"
                            value={(form[imgKey] as string) || ""}
                            onChange={(url) => setForm({ ...form, [imgKey]: url })}
                          />
                        </div>
                      );
                    })}
                    {shown < 3 && (
                      <Button type="button" variant="outline" onClick={() => setShown(shown + 1)}>+ Add Another Host</Button>
                    )}
                  </>
                );
              })()}
              <Button type="submit" className="w-full" disabled={upsert.isPending}>{editing ? "Update" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (() => {
        const all = events ?? [];
        const filtered = all.filter((ev: any) => (tab === "active" ? isEventActive(ev) : !isEventActive(ev)));
        const activeCount = all.filter(isEventActive).length;
        const passedCount = all.length - activeCount;
        return (
          <>
            <div className="flex gap-2 mb-4">
              {(["active", "passed"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 h-9 rounded-full text-sm font-medium border transition-colors ${
                    tab === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary"
                  }`}
                >
                  {t === "active" ? "Active" : "Passed"} ({t === "active" ? activeCount : passedCount})
                </button>
              ))}
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium text-muted-foreground w-[22%]">Title</th>
                    <th className="text-left p-3 font-medium text-muted-foreground w-[22%]">Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground w-[22%]">Location</th>
                    <th className="text-left p-3 font-medium text-muted-foreground w-[10%]">Tag</th>
                    <th className="text-left p-3 font-medium text-muted-foreground w-[10%]">Featured</th>
                    <th className="p-3 w-[14%]"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ev) => (
                    <tr key={ev.id} className="border-t border-border">
                      <td className="p-3 font-medium text-foreground truncate">{ev.title}</td>
                      <td className="p-3 text-muted-foreground truncate">{ev.date}</td>
                      <td className="p-3 text-muted-foreground truncate">{ev.location ?? "—"}</td>
                      <td className="p-3 text-muted-foreground truncate">{ev.tag ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{(ev as any).is_featured ? "★ Yes" : "—"}</td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(ev)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(ev.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                      {tab === "active" ? "No active events." : "No passed events."}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        );
      })()}
    </div>
  );
};

export default AdminEvents;
