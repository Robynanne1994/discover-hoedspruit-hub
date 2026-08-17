import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";
import MultiContactField from "@/components/admin/MultiContactField";
import ListingContactPicker from "@/components/admin/ListingContactPicker";
import IncludedChipsInput from "@/components/admin/IncludedChipsInput";
import { sanitizeContactArray } from "@/lib/contacts";
import MarkdownToolbar from "@/components/admin/MarkdownToolbar";
import HostLinkField from "@/components/admin/HostLinkField";
import { eventImageSlot } from "@/lib/eventImageSlots";
import ImageSlotField from "./ImageSlotField";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: any;
}

const FIELDS = [
  "title", "title_override", "description", "date", "start_date", "end_date", "start_time", "end_time", "location",
  "tag", "sub_tag_1", "sub_tag_2", "image_url", "poster_image_url", "detail_image_url", "homepage_image_url", "saved_image_url", "search_image_url", "recurrence", "performances", "price", "included", "price_notes", "notes", "booking_link", "booking_link_label",
  "google_maps_link", "social_media_link", "social_media_label", "contact_email", "contact_phone", "contact_whatsapp", "additional_emails", "additional_phones", "additional_whatsapps",
  "business_id", "business_ids", "is_featured",
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
      // Normalize business_ids -> ensure array, sync legacy single business_id to first entry
      const ids = Array.isArray(form.business_ids) ? form.business_ids.filter(Boolean) : [];
      payload.business_ids = ids;
      payload.business_id = ids[0] ?? null;
      payload.additional_emails = sanitizeContactArray(form.additional_emails);
      payload.additional_phones = sanitizeContactArray(form.additional_phones);
      payload.additional_whatsapps = sanitizeContactArray(form.additional_whatsapps);
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
      toast.success("Event updated");
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

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label>Title</Label><Textarea rows={2} className="resize-none" value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Switch
                id="event-dlg-use-title-override"
                checked={!!(form.title_override && String(form.title_override).trim())}
                onCheckedChange={(v) => set("title_override", v ? (form.title_override || form.title || "") : "")}
              />
              <Label htmlFor="event-dlg-use-title-override" className="text-sm cursor-pointer font-normal">
                Use custom title (overrides auto-capitalisation)
              </Label>
            </div>
            {!!(form.title_override && String(form.title_override).trim()) && (
              <Textarea
                rows={2}
                className="resize-none"
                placeholder="Custom title — rendered exactly as typed"
                value={form.title_override || ""}
                onChange={(e) => set("title_override", e.target.value)}
              />
            )}
          </div>
          <div><Label>Tag/Category</Label><Input value={form.tag || ""} onChange={(e) => set("tag", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Sub-tag 1</Label><Input value={form.sub_tag_1 || ""} onChange={(e) => set("sub_tag_1", e.target.value)} /></div>
            <div><Label>Sub-tag 2</Label><Input value={form.sub_tag_2 || ""} onChange={(e) => set("sub_tag_2", e.target.value)} /></div>
          </div>
          <div className="space-y-2">
            <Label>Linked Business Listings</Label>
            {(Array.isArray(form.business_ids) ? form.business_ids : []).map((bid: string, idx: number) => (
              <div key={idx} className="flex gap-2">
                <select
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={bid || ""}
                  onChange={(e) => {
                    const arr = [...(form.business_ids || [])];
                    arr[idx] = e.target.value || null;
                    set("business_ids", arr.filter((x) => x !== null));
                  }}
                >
                  <option value="">— Select a listing —</option>
                  {(listings || []).map((l: any) => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
                <Button type="button" variant="ghost" size="sm" onClick={() => {
                  const arr = [...(form.business_ids || [])];
                  arr.splice(idx, 1);
                  set("business_ids", arr);
                }}>Remove</Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => {
              const arr = [...(form.business_ids || []), ""];
              set("business_ids", arr);
            }}>+ Add Linked Listing</Button>
          </div>
          <div>
            <Label>Description</Label>
            <MarkdownToolbar textareaRef={descRef} value={form.description || ""} onChange={(val) => set("description", val)} />
            <Textarea ref={descRef} rows={4} value={form.description || ""} onChange={(e) => set("description", e.target.value)} />
            <p className="text-[11px] text-muted-foreground mt-1">
              Formatting: <code>**bold**</code>, <code>## Subtitle</code> on its own line, <code>[link text](https://link.com)</code>. Leave a blank line between paragraphs.
            </p>
          </div>
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
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Date</Label><Input type="date" value={form.start_date || ""} onChange={(e) => set("start_date", e.target.value || null)} /></div>
            <div><Label>End Date</Label><Input type="date" value={form.end_date || ""} onChange={(e) => set("end_date", e.target.value || null)} /></div>
          </div>
          <div><Label>Date <span className="text-xs text-muted-foreground">(e.g. "Every Saturday")</span></Label><Input value={form.date || ""} onChange={(e) => set("date", e.target.value)} placeholder="Optional fallback text" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Time</Label><Input type="time" value={form.start_time || ""} onChange={(e) => set("start_time", e.target.value || null)} /></div>
            <div><Label>End Time</Label><Input type="time" value={form.end_time || ""} onChange={(e) => set("end_time", e.target.value || null)} /></div>
          </div>
          <div className="space-y-2 p-3 border rounded">
            <Label className="text-sm font-semibold text-slate-950">Performances <span className="text-xs text-muted-foreground font-normal">(use for same show on multiple separate dates, e.g. a musical)</span></Label>
            <p className="text-xs text-muted-foreground">When set, each row becomes a separate performance. Start/End Date above are auto-filled from the first and last performance.</p>
            {(Array.isArray(form.performances) ? form.performances : []).map((p: any, idx: number) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1"><Label className="text-xs">Date</Label><Input type="date" value={p?.date || ""} onChange={(e) => {
                  const arr = [...(form.performances || [])]; arr[idx] = { ...arr[idx], date: e.target.value }; set("performances", arr);
                }} /></div>
                <div className="w-24"><Label className="text-xs">Start</Label><Input type="time" value={p?.time || ""} onChange={(e) => {
                  const arr = [...(form.performances || [])]; arr[idx] = { ...arr[idx], time: e.target.value }; set("performances", arr);
                }} /></div>
                <div className="w-24"><Label className="text-xs">End</Label><Input type="time" value={p?.end_time || ""} onChange={(e) => {
                  const arr = [...(form.performances || [])]; arr[idx] = { ...arr[idx], end_time: e.target.value }; set("performances", arr);
                }} /></div>
                <Button type="button" variant="ghost" size="sm" onClick={() => {
                  const arr = [...(form.performances || [])]; arr.splice(idx, 1); set("performances", arr.length ? arr : null);
                }}>×</Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => {
              const arr = [...(Array.isArray(form.performances) ? form.performances : []), { date: "", time: form.start_time || "", end_time: form.end_time || "" }];
              set("performances", arr);
            }}>+ Add performance date</Button>
          </div>
          <div><Label>Location</Label><Input value={form.location || ""} onChange={(e) => set("location", e.target.value)} /></div>
          <div><Label>Recurrence</Label><Input value={form.recurrence || ""} onChange={(e) => set("recurrence", e.target.value)} placeholder="None / Weekly / Monthly..." /></div>
          <div><Label>Price</Label><Input value={form.price || ""} onChange={(e) => set("price", e.target.value)} /></div>
          <div className="space-y-2">
            <Label>What's Included</Label>
            <p className="text-xs text-muted-foreground">Press Enter or comma after each item. Only shown on the event page if populated.</p>
            <IncludedChipsInput value={Array.isArray(form.included) ? form.included : []} onChange={(v) => set("included", v)} />
          </div>
          <div className="space-y-2">
            <Label>Price Notes</Label>
            <p className="text-xs text-muted-foreground">Add each note separately — each appears on a new line under the price. In CSV, separate notes with the <code>|</code> symbol.</p>
            <IncludedChipsInput value={Array.isArray(form.price_notes) ? form.price_notes : []} onChange={(v) => set("price_notes", v)} placeholder="e.g. Per person, then press Enter" />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <p className="text-xs text-muted-foreground">Add each note separately — each appears on a new line in the details card. In CSV, separate notes with the <code>|</code> symbol.</p>
            <IncludedChipsInput value={Array.isArray(form.notes) ? form.notes : (typeof form.notes === "string" && form.notes.trim() ? [form.notes] : [])} onChange={(v) => set("notes", v)} placeholder="e.g. Bring your own chair, then press Enter" />
          </div>
          <div><Label>Booking Link</Label><Input value={form.booking_link || ""} onChange={(e) => set("booking_link", e.target.value)} /></div>
          <div><Label>Booking Link Display Text</Label><Input value={form.booking_link_label || ""} onChange={(e) => set("booking_link_label", e.target.value)} placeholder="e.g. Book on Quicket" /></div>
          <div><Label>Google Maps Link</Label><Input value={form.google_maps_link || ""} onChange={(e) => set("google_maps_link", e.target.value)} /></div>
          <div><Label>Social Media Link</Label><Input value={form.social_media_link || ""} onChange={(e) => set("social_media_link", e.target.value)} /></div>
          <div><Label>Social Media Label</Label><Input value={form.social_media_label || ""} onChange={(e) => set("social_media_label", e.target.value)} placeholder="e.g. Instagram, Facebook" /></div>
          <ListingContactPicker
            listings={listings || []}
            onApply={(c) => setForm((f: any) => ({ ...f, ...c }))}
          />
          <MultiContactField
            label="Contact Email"
            type="email"
            primary={form.contact_email || ""}
            onPrimaryChange={(v) => set("contact_email", v)}
            extras={form.additional_emails || []}
            onExtrasChange={(v) => set("additional_emails", v)}
            addLabel="Add email"
          />
          <MultiContactField
            label="Contact Phone"
            type="tel"
            primary={form.contact_phone || ""}
            onPrimaryChange={(v) => set("contact_phone", v)}
            extras={form.additional_phones || []}
            onExtrasChange={(v) => set("additional_phones", v)}
            addLabel="Add phone"
          />
          <MultiContactField
            label="Contact WhatsApp"
            type="tel"
            primary={form.contact_whatsapp || ""}
            onPrimaryChange={(v) => set("contact_whatsapp", v)}
            extras={form.additional_whatsapps || []}
            onExtrasChange={(v) => set("additional_whatsapps", v)}
            placeholder="+27 ..."
            addLabel="Add WhatsApp"
          />
          <div className="flex items-center gap-2"><Switch checked={!!form.is_featured} onCheckedChange={(v) => set("is_featured", v)} /><Label>Featured</Label></div>
          <div className="pt-2 border-t"><Label className="text-base font-semibold text-slate-950">Hosted By</Label></div>
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
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-slate-950">Host {h.n}</Label>
                      {h.n === shown && shown > 0 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => {
                          setForm((f: any) => ({
                            ...f,
                            [h.nameKey]: "", [h.subKey]: "", [h.imgKey]: "", [h.linkKey]: "", [h.listingKey]: "",
                            __hostsShown: shown - 1,
                          }));
                        }}>Remove</Button>
                      )}
                    </div>
                    <div><Label>Name</Label><Input value={form[h.nameKey] || ""} onChange={(e) => set(h.nameKey, e.target.value)} placeholder="e.g. Kristi & Joëlle" /></div>
                    <div><Label>Subtitle</Label><Input value={form[h.subKey] || ""} onChange={(e) => set(h.subKey, e.target.value)} placeholder="e.g. Yoga Teachers" /></div>
                    <HostLinkField
                      key={`${event?.id ?? "new"}-${h.n}`}
                      value={{ link: form[h.linkKey] || "", listingId: form[h.listingKey] || "" }}
                      listings={listings || []}
                      onChange={(v) => setForm((f: any) => ({ ...f, [h.linkKey]: v.link, [h.listingKey]: v.listingId }))}
                    />
                    <ImageSlotField
                      slot={hostSlot}
                      label="Photo"
                      value={form[h.imgKey] || ""}
                      onChange={(url) => set(h.imgKey, url)}
                    />
                  </div>
                ))}
                {shown < 3 && (
                  <Button type="button" variant="outline" onClick={() => setShownLocal(shown + 1)}>+ Add Another Host</Button>
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
