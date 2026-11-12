import { parseSocials, serializeSocials, type SocialPair } from "@/lib/eventSocials";
import { isLateEndTime, LATE_END_TIME } from "@/lib/eventEndTime";
import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, Plus, Tag, X } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";
import MultiContactField from "@/components/admin/MultiContactField";
import ListingContactPicker from "@/components/admin/ListingContactPicker";
import IncludedChipsInput from "@/components/admin/IncludedChipsInput";
import { sanitizeContactArray, sanitizeContactPairs } from "@/lib/contacts";
import { BOOKING_LINK_TYPES, editorBookingLinkType } from "@/lib/bookingLink";
import MarkdownToolbar from "@/components/admin/MarkdownToolbar";
import HostLinkField from "@/components/admin/HostLinkField";
import { eventImageSlot } from "@/lib/eventImageSlots";
import ImageSlotField from "./ImageSlotField";
import GalleryUpload from "./GalleryUpload";
import {
  ADMIN_EDITOR_DIALOG,
  ADMIN_FIELD_GRID_TIGHT,
  ADMIN_IMAGE_GRID,
} from "@/lib/adminEditorLayout";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: any;
}

const FIELDS = [
  "title", "title_override", "description", "date", "start_date", "end_date", "start_time", "end_time", "location",
  "tag", "sub_tag_1", "sub_tag_2", "image_url", "poster_image_url", "detail_image_url", "homepage_image_url", "saved_image_url", "search_image_url", "recurrence", "performances", "price", "included", "price_notes", "notes", "booking_link", "booking_link_label", "booking_link_type",
  "google_maps_link", "social_media_link", "social_media_label", "contact_email", "contact_phone", "contact_whatsapp", "additional_emails", "additional_phones", "additional_whatsapps",
  "business_id", "business_ids", "is_featured", "gallery_images",
  "hosted_by_name", "hosted_by_subtitle", "hosted_by_image_url", "hosted_by_link", "hosted_by_listing_id",
  "hosted_by_name_2", "hosted_by_subtitle_2", "hosted_by_image_url_2", "hosted_by_link_2", "hosted_by_listing_id_2",
  "hosted_by_name_3", "hosted_by_subtitle_3", "hosted_by_image_url_3", "hosted_by_link_3", "hosted_by_listing_id_3",
];

const HOST_LISTING_KEYS = ["hosted_by_listing_id", "hosted_by_listing_id_2", "hosted_by_listing_id_3"];

// All three host photos land in the same 48px circle, so they share one slot.
const hostSlot = eventImageSlot("host");

const EventEditDialog = ({ open, onOpenChange, event }: Props) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(event);
  const [tagSlots, setTagSlots] = useState(1);
  const [bookingLabelOpen, setBookingLabelOpen] = useState(false);
  const [socialLabelOpen, setSocialLabelOpen] = useState<number | false>(false);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!event) { setForm(event); return; }
    const seeded = { ...event };
    if (!Array.isArray(seeded.business_ids) || seeded.business_ids.length === 0) {
      seeded.business_ids = seeded.business_id ? [seeded.business_id] : [];
    }
    setForm(seeded);
  }, [event, open]);

  const { data: listings } = useQuery({
    queryKey: ["all-listings-for-events"],
    queryFn: async () => {
      const { data } = await supabase.from("listings").select("id, title").order("title");
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {};
      FIELDS.forEach((k) => { payload[k] = form[k] ?? null; });
      // uuid columns reject "": a host with no listing picked must go in as null.
      HOST_LISTING_KEYS.forEach((k) => { if (!payload[k]) payload[k] = null; });
      // A host linked to an app listing shows that listing's image — drop any stored host photo.
      const HOST_IMG_BY_LISTING: Record<string, string> = {
        hosted_by_listing_id: "hosted_by_image_url",
        hosted_by_listing_id_2: "hosted_by_image_url_2",
        hosted_by_listing_id_3: "hosted_by_image_url_3",
      };
      HOST_LISTING_KEYS.forEach((k) => { if (payload[k]) payload[HOST_IMG_BY_LISTING[k]] = null; });
      // Normalize business_ids -> ensure array, sync legacy single business_id to first entry
      const ids = Array.isArray(form.business_ids) ? form.business_ids.filter(Boolean) : [];
      { const so = serializeSocials(parseSocials(form.social_media_link, form.social_media_label)); payload.social_media_link = so.link || null; payload.social_media_label = so.label || null; }
      payload.business_ids = ids;
      payload.business_id = ids[0] ?? null;
      { const pr = sanitizeContactPairs(form.additional_emails, form.additional_email_labels); payload.additional_emails = pr.values; payload.additional_email_labels = pr.labels; payload.email_label = (form.email_label || "").trim() || null; }
      { const pr = sanitizeContactPairs(form.additional_phones, form.additional_phone_labels); payload.additional_phones = pr.values; payload.additional_phone_labels = pr.labels; payload.phone_label = (form.phone_label || "").trim() || null; }
      { const pr = sanitizeContactPairs(form.additional_whatsapps, form.additional_whatsapp_labels); payload.additional_whatsapps = pr.values; payload.additional_whatsapp_labels = pr.labels; payload.whatsapp_label = (form.whatsapp_label || "").trim() || null; }
      payload.price_notes = Array.isArray(form.price_notes)
        ? form.price_notes.map((s: string) => (s ?? "").toString().trim()).filter(Boolean)
        : [];
      payload.notes = Array.isArray(form.notes)
        ? form.notes.map((s: string) => (s ?? "").toString().trim()).filter(Boolean)
        : (typeof form.notes === "string" && form.notes.trim() ? [form.notes.trim()] : []);
      // Normalize performances: keep only rows with a valid date, sort by date+time,
      // and auto-derive start_date/end_date so existing queries/calendar still work.
      const rawPerfs = Array.isArray(form.performances) ? form.performances : [];
      const cleanPerfs = rawPerfs
        .filter((p: any) => p && typeof p.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.date))
        .map((p: any) => ({
          date: p.date,
          time: p.time && /^\d{1,2}:\d{2}/.test(p.time) ? p.time.slice(0, 5) : null,
          end_time: p.end_time && /^\d{1,2}:\d{2}/.test(p.end_time) ? p.end_time.slice(0, 5) : null,
        }))
        .sort((a: any, b: any) => (a.date === b.date ? (a.time || "").localeCompare(b.time || "") : a.date.localeCompare(b.date)));
      payload.performances = cleanPerfs.length > 0 ? cleanPerfs : null;
      if (cleanPerfs.length > 0) {
        payload.start_date = cleanPerfs[0].date;
        payload.end_date = cleanPerfs[cleanPerfs.length - 1].date;
      }
      // `date` is required (NOT NULL). Auto-fill from start/end dates if left blank.
      if (!payload.date || !String(payload.date).trim()) {
        if (payload.start_date && payload.end_date && payload.start_date !== payload.end_date) {
          payload.date = `${payload.start_date} to ${payload.end_date}`;
        } else if (payload.start_date) {
          payload.date = payload.start_date;
        } else {
          payload.date = "";
        }
      }
      const { error } = await supabase.from("events").update(payload).eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-detail", event.id] });
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message || "Failed to save"),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("events").delete().eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event deleted");
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      qc.invalidateQueries({ queryKey: ["event-detail", event.id] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete"),
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={ADMIN_EDITOR_DIALOG}>
        <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Title</Label>
            {/* Titles are one line, so the box is one line too. */}
            <Input
              value={form.title || ""}
              // With "use exactly as typed" on, the override follows the title
              // field — there is no second box to keep in step.
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  title: e.target.value,
                  ...(String(f.title_override || "").trim() ? { title_override: e.target.value } : {}),
                }))
              }
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <Switch
                id="event-dlg-use-title-override"
                checked={!!(form.title_override && String(form.title_override).trim())}
                onCheckedChange={(v) => set("title_override", v ? (form.title || "") : "")}
              />
              <Label htmlFor="event-dlg-use-title-override" className="text-sm cursor-pointer font-normal">
                Use the title exactly as typed (no auto-capitalisation)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="event-dlg-featured" checked={!!form.is_featured} onCheckedChange={(v) => set("is_featured", v)} />
              <Label htmlFor="event-dlg-featured" className="text-sm cursor-pointer font-normal">Featured</Label>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-2 items-start">
          <div className="space-y-1.5">
            <Label>Tags / Categories</Label>
            {(() => {
              const keys = ["tag", "sub_tag_1", "sub_tag_2"] as const;
              const filled = keys.reduce((n, k, i) => ((form[k] || "").trim() ? i + 1 : n), 0);
              const count = Math.min(3, Math.max(1, filled, tagSlots));
              return (
                <>
                  {keys.slice(0, count).map((k, idx) => (
                    <div key={k} className="flex gap-2">
                      <Input value={form[k] || ""} onChange={(e) => set(k, e.target.value)} />
                      {count > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remove tag"
                          className="h-7 w-7 shrink-0 self-center rounded-full bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
                          onClick={() => {
                            const vals = keys.map((kk) => form[kk] || "");
                            vals.splice(idx, 1);
                            vals.push("");
                            setForm((f) => ({ ...f, tag: vals[0], sub_tag_1: vals[1], sub_tag_2: vals[2] }));
                            setTagSlots(count - 1);
                          }}
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </Button>
                      )}
                    </div>
                  ))}
                  {count < 3 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setTagSlots(count + 1)}>+ Add Tag</Button>
                  )}
                </>
              );
            })()}
          </div>
          <div className="space-y-2">
            <Label>Linked Business Listings</Label>
            {(Array.isArray(form.business_ids) ? form.business_ids : []).slice(0, 1).map((bid: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <Select
                  value={bid || "__none__"}
                  onValueChange={(v) => {
                    const arr = [...(form.business_ids || [])];
                    arr[idx] = v === "__none__" ? null : v;
                    set("business_ids", arr.filter((x) => x !== null));
                  }}
                >
                  <SelectTrigger className="flex-1 border-gray-950 bg-slate-50">
                    <SelectValue placeholder="— Select a listing —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Select a listing —</SelectItem>
                    {(listings || []).map((l: any) => (
                      <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove linked listing"
                  className="h-7 w-7 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
                  onClick={() => {
                    const arr = [...(form.business_ids || [])];
                    arr.splice(idx, 1);
                    set("business_ids", arr);
                  }}
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                </Button>
              </div>
            ))}
            {(Array.isArray(form.business_ids) ? form.business_ids : []).length === 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => set("business_ids", [""])}>+ Add Linked Listing</Button>
            )}
          </div>
          </div>
          <p className="mt-6 mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">Description</p>
          <div>
            <MarkdownToolbar textareaRef={descRef} value={form.description || ""} onChange={(val) => set("description", val)} />
            <Textarea ref={descRef} rows={4} value={form.description || ""} onChange={(e) => set("description", e.target.value)} />
            <p className="text-[11px] text-muted-foreground mt-1">
              Formatting: <code>**bold**</code>, <code>## Subtitle</code> on its own line, <code>[link text](https://link.com)</code>. Leave a blank line between paragraphs.
            </p>
          </div>
          <p className="mt-6 mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">Images</p>
          <div className={ADMIN_IMAGE_GRID}>
            {(["card", "poster", "detail", "homepage", "saved", "search"] as const).map((key) => {
              const slot = eventImageSlot(key);
              return (
                <ImageSlotField
                  key={key}
                  slot={slot}
                  value={form[slot.field] || ""}
                  onChange={(url) => set(slot.field, url)}
                />
              );
            })}
          </div>
          <GalleryUpload
            folder="events"
            value={(form.gallery_images ?? []).join("\n")}
            onChange={(value) => set("gallery_images", value.split("\n").map((url) => url.trim()).filter(Boolean))}
          />
          <p className="mt-6 mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">Date &amp; Time</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Date</Label><Input type="date" value={form.start_date || ""} onChange={(e) => set("start_date", e.target.value || null)} /></div>
            <div><Label>End Date</Label><Input type="date" value={form.end_date || ""} onChange={(e) => set("end_date", e.target.value || null)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date Text</Label><Input value={form.date || ""} onChange={(e) => set("date", e.target.value)} placeholder="Optional fallback text" /></div>
            <div><Label>Recurrence</Label><Input value={form.recurrence || ""} onChange={(e) => set("recurrence", e.target.value)} placeholder="None / Weekly / Monthly..." /></div>
          </div>
          <div className="grid gap-3 lg:grid-cols-2 items-start">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="block">Start Time</Label><Input type="time" value={form.start_time || ""} onChange={(e) => set("start_time", e.target.value || null)} /></div>
              <div className="space-y-2">
                <Label className="block">End Time</Label>
                <Input type="time" disabled={isLateEndTime(form.end_time)} value={isLateEndTime(form.end_time) ? "" : (form.end_time || "")} onChange={(e) => set("end_time", e.target.value || null)} />
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isLateEndTime(form.end_time)} onChange={(e) => set("end_time", e.target.checked ? LATE_END_TIME : null)} />
                  Late
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="block">Performances</Label>
              {(Array.isArray(form.performances) ? form.performances : []).map((p: any, idx: number) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1"><Label className="text-xs">Date</Label><Input type="date" value={p?.date || ""} onChange={(e) => {
                    const arr = [...(form.performances || [])]; arr[idx] = { ...arr[idx], date: e.target.value }; set("performances", arr);
                  }} /></div>
                  <div className="w-20"><Label className="text-xs">Start</Label><Input type="time" value={p?.time || ""} onChange={(e) => {
                    const arr = [...(form.performances || [])]; arr[idx] = { ...arr[idx], time: e.target.value }; set("performances", arr);
                  }} /></div>
                  <div className="w-20"><Label className="text-xs">End</Label><Input type="time" value={p?.end_time || ""} onChange={(e) => {
                    const arr = [...(form.performances || [])]; arr[idx] = { ...arr[idx], end_time: e.target.value }; set("performances", arr);
                  }} /></div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => {
                    const arr = [...(form.performances || [])]; arr.splice(idx, 1); set("performances", arr.length ? arr : null);
                  }}>×</Button>
                </div>
              ))}
              <div><Button type="button" size="sm" className="h-7 px-2.5 text-xs" onClick={() => {
                const arr = [...(Array.isArray(form.performances) ? form.performances : []), { date: "", time: form.start_time || "", end_time: form.end_time || "" }];
                set("performances", arr);
              }}>Add</Button></div>
            </div>
          </div>
          <p className="mt-6 mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">Pricing</p>
          <div className="grid gap-3 lg:grid-cols-2 items-start">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="block">Price</Label>
                <Input value={form.price || ""} onChange={(e) => set("price", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="block">Price Notes</Label>
                <IncludedChipsInput value={Array.isArray(form.price_notes) ? form.price_notes : []} onChange={(v) => set("price_notes", v)} placeholder="e.g. Per person, then press Enter" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="block">What's Included</Label>
              <IncludedChipsInput value={Array.isArray(form.included) ? form.included : []} onChange={(v) => set("included", v)} />
            </div>
          </div>
          <p className="mt-6 mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">Event Notes</p>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>Notes</Label>
              <IncludedChipsInput value={Array.isArray(form.notes) ? form.notes : (typeof form.notes === "string" && form.notes.trim() ? [form.notes] : [])} onChange={(v) => set("notes", v)} placeholder="e.g. Bring your own chair, then press Enter" />
            </div>
          </div>
          <p className="mt-6 mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">Booking</p>
          <div className="grid gap-3 lg:grid-cols-2 items-start">
            <div className="space-y-2">
              <Label className="block">Booking Type</Label>
              <div className="relative">
              <select
                className="flex h-10 w-full appearance-none rounded-md border border-gray-950 bg-slate-50 px-3 py-2 pr-9 text-sm text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editorBookingLinkType(form.booking_link, form.booking_link_type)}
                onChange={(e) => set("booking_link_type", e.target.value)}
              >
                <option value=""></option>
                {BOOKING_LINK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" strokeWidth={2.75} aria-hidden />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="block">Booking Link / Email / Number</Label>
              <Input value={form.booking_link || ""} onChange={(e) => set("booking_link", e.target.value)} placeholder="https://… or name@email.com or +27 82 000 0000" />
              {bookingLabelOpen || (form.booking_link_label || "").trim() ? (
                <div className="flex gap-2 items-center">
                  <Input value={form.booking_link_label || ""} placeholder='Custom label (e.g. "Book on Quicket")' onChange={(e) => set("booking_link_label", e.target.value)} className="h-8 text-xs" />
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground" aria-label="Remove label" onClick={() => { set("booking_link_label", ""); setBookingLabelOpen(false); }}>
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </Button>
                </div>
              ) : (
                <button type="button" onClick={() => setBookingLabelOpen(true)} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Add custom label
                </button>
              )}
            </div>
          </div>
          <p className="mt-6 mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">Location</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Location</Label><Input value={form.location || ""} onChange={(e) => set("location", e.target.value)} /></div>
            <div><Label>Google Maps Link</Label><Input value={form.google_maps_link || ""} onChange={(e) => set("google_maps_link", e.target.value)} /></div>
          </div>
          <p className="mt-10 mb-1 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">Contacts</p>
          <ListingContactPicker
            listings={listings || []}
            onApply={(c) => setForm((f) => ({ ...f, ...c }))}
          />
          <div className="grid gap-3 lg:grid-cols-2">
            <MultiContactField
              label="Contact Email"
              type="email"
              primary={form.contact_email || ""}
              onPrimaryChange={(v) => set("contact_email", v)}
              extras={form.additional_emails || []}
              onExtrasChange={(v) => set("additional_emails", v)}
              primaryLabel={form.email_label || ""}
              onPrimaryLabelChange={(v) => set("email_label", v)}
              extraLabels={form.additional_email_labels || []}
              onExtraLabelsChange={(v) => set("additional_email_labels", v)}
              addLabel="Add"
            />
            <MultiContactField
              label="Contact Phone"
              type="tel"
              primary={form.contact_phone || ""}
              onPrimaryChange={(v) => set("contact_phone", v)}
              extras={form.additional_phones || []}
              onExtrasChange={(v) => set("additional_phones", v)}
              primaryLabel={form.phone_label || ""}
              onPrimaryLabelChange={(v) => set("phone_label", v)}
              extraLabels={form.additional_phone_labels || []}
              onExtraLabelsChange={(v) => set("additional_phone_labels", v)}
              addLabel="Add"
            />
            <MultiContactField
              label="Contact WhatsApp"
              type="tel"
              primary={form.contact_whatsapp || ""}
              onPrimaryChange={(v) => set("contact_whatsapp", v)}
              extras={form.additional_whatsapps || []}
              onExtrasChange={(v) => set("additional_whatsapps", v)}
              primaryLabel={form.whatsapp_label || ""}
              onPrimaryLabelChange={(v) => set("whatsapp_label", v)}
              extraLabels={form.additional_whatsapp_labels || []}
              onExtraLabelsChange={(v) => set("additional_whatsapp_labels", v)}
              placeholder="+27 ..."
              addLabel="Add"
            />
            <div className="space-y-1.5">
              <Label>Social Media</Label>
              {(() => {
                const pairs = parseSocials(form.social_media_link, form.social_media_label);
                const write = (next: SocialPair[]) => setForm((f: any) => {
                  const links = next.map((p) => p.link).join("|");
                  const labels = next.some((p) => p.label.trim()) ? next.map((p) => p.label.trim() || "-").join("|") : "";
                  return { ...f, social_media_link: links, social_media_label: labels };
                });
                return (
                  <>
                    {pairs.map((p, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex gap-2 items-center">
                          <Input value={p.link} onChange={(e) => write(pairs.map((x, j) => (j === i ? { ...x, link: e.target.value } : x)))} />
                          {pairs.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground" aria-label="Remove social link" onClick={() => write(pairs.filter((_, j) => j !== i))}>
                              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </Button>
                          )}
                        </div>
                        {p.label || socialLabelOpen === (i as any) ? (
                          <div className="flex gap-2 items-center">
                            <Input value={p.label} placeholder='Custom label (e.g. "Instagram")' onChange={(e) => write(pairs.map((x, j) => (j === i ? { ...x, label: e.target.value.replace(/\|/g, "") } : x)))} className="h-8 text-xs" />
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground" aria-label="Remove label" onClick={() => { write(pairs.map((x, j) => (j === i ? { ...x, label: "" } : x))); setSocialLabelOpen(false as any); }}>
                              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </Button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setSocialLabelOpen(i as any)} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                            <Tag className="h-3 w-3" /> Add custom label
                          </button>
                        )}
                      </div>
                    ))}
                    <Button type="button" size="sm" className="h-7 px-2.5 text-xs" onClick={() => write([...pairs, { link: "", label: "" }])}>
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                  </>
                );
              })()}
            </div>
          </div>
          <p className="mt-6 mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">Hosts</p>
          {(() => {
            const hostCount = form.hosted_by_name_3 ? 3 : form.hosted_by_name_2 ? 2 : form.hosted_by_name ? 1 : 0;
            const [shown, setShownLocal] = [form.__hostsShown ?? hostCount, (n: number) => set("__hostsShown", n)];
            if (shown === 0) {
              return (
                <Button type="button" variant="outline" onClick={() => setShownLocal(1)}>+ Add Host</Button>
              );
            }
            const hosts: Array<{ n: number; nameKey: string; subKey: string; imgKey: string; linkKey: string; listingKey: string }> = [
              { n: 1, nameKey: "hosted_by_name", subKey: "hosted_by_subtitle", imgKey: "hosted_by_image_url", linkKey: "hosted_by_link", listingKey: "hosted_by_listing_id" },
              { n: 2, nameKey: "hosted_by_name_2", subKey: "hosted_by_subtitle_2", imgKey: "hosted_by_image_url_2", linkKey: "hosted_by_link_2", listingKey: "hosted_by_listing_id_2" },
              { n: 3, nameKey: "hosted_by_name_3", subKey: "hosted_by_subtitle_3", imgKey: "hosted_by_image_url_3", linkKey: "hosted_by_link_3", listingKey: "hosted_by_listing_id_3" },
            ];
            return (
              <>
                {hosts.slice(0, shown).map((h) => (
                  <div key={h.n} className="space-y-3 p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <span className="inline-block rounded-md bg-primary px-3 py-1 text-lg font-bold text-primary-foreground">Host {h.n}</span>
                      {h.n === shown && shown > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove host ${h.n}`}
                          className="h-7 w-7 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              [h.nameKey]: "", [h.subKey]: "", [h.imgKey]: "", [h.linkKey]: "", [h.listingKey]: "",
                              __hostsShown: shown - 1,
                            }));
                          }}
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                    <div><Label>Name</Label><Input value={form[h.nameKey] || ""} onChange={(e) => set(h.nameKey, e.target.value)} placeholder="e.g. Kristi & Joëlle" /></div>
                    <div><Label>Subtitle</Label><Input value={form[h.subKey] || ""} onChange={(e) => set(h.subKey, e.target.value)} placeholder="e.g. Yoga Teachers" /></div>
                    </div>
                    <HostLinkField
                      key={`${event?.id ?? "new"}-${h.n}`}
                      value={{ link: form[h.linkKey] || "", listingId: form[h.listingKey] || "" }}
                      listings={listings || []}
                      onChange={(v) => setForm((f) => ({ ...f, [h.linkKey]: v.link, [h.listingKey]: v.listingId }))}
                    />
                    {/* Linked app listings already have their own image — the host photo is only for non-linked hosts. */}
                    {!form[h.listingKey] && (
                      <ImageSlotField
                        slot={hostSlot}
                        label="Photo"
                        value={form[h.imgKey] || ""}
                        onChange={(url) => set(h.imgKey, url)}
                      />
                    )}
                  </div>
                ))}
                {shown < 3 && (
                  <Button type="button" variant="outline" size="sm" className="h-7 px-2.5 text-xs" onClick={() => setShownLocal(shown + 1)}>+ Add Another Host</Button>
                )}
              </>
            );
          })()}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="destructive"
            onClick={() => { if (confirm("Delete this event? This cannot be undone.")) del.mutate(); }}
            disabled={del.isPending || save.isPending}
          >
            {del.isPending ? "Deleting..." : "Delete"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventEditDialog;
