import { useEffect, useState } from "react";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: any;
}

const FIELDS = [
  "title", "description", "date", "start_date", "end_date", "start_time", "end_time", "location",
  "tag", "sub_tag_1", "sub_tag_2", "image_url", "detail_image_url", "recurrence", "price", "notes", "booking_link", "booking_link_label",
  "google_maps_link", "social_media_link", "social_media_label", "contact_email", "contact_phone", "contact_whatsapp",
  "business_id", "business_ids", "is_featured",
  "hosted_by_name", "hosted_by_subtitle", "hosted_by_image_url",
  "hosted_by_name_2", "hosted_by_subtitle_2", "hosted_by_image_url_2",
  "hosted_by_name_3", "hosted_by_subtitle_3", "hosted_by_image_url_3",
];

const EventEditDialog = ({ open, onOpenChange, event }: Props) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(event);

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
      // Normalize business_ids -> ensure array, sync legacy single business_id to first entry
      const ids = Array.isArray(form.business_ids) ? form.business_ids.filter(Boolean) : [];
      payload.business_ids = ids;
      payload.business_id = ids[0] ?? null;
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label>Title</Label><Input value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></div>
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
          <div><Label>Description</Label><Textarea rows={4} value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></div>
          <div><Label>Card Cover Image</Label><ImageUpload bucket="listing-images" value={form.image_url || ""} onChange={(url) => set("image_url", url)} aspect={16/9} /></div>
          <div><Label>Detail Cover Image</Label><ImageUpload bucket="listing-images" value={form.detail_image_url || ""} onChange={(url) => set("detail_image_url", url)} aspect={4/3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Date</Label><Input type="date" value={form.start_date || ""} onChange={(e) => set("start_date", e.target.value || null)} /></div>
            <div><Label>End Date</Label><Input type="date" value={form.end_date || ""} onChange={(e) => set("end_date", e.target.value || null)} /></div>
          </div>
          <div><Label>Date <span className="text-xs text-muted-foreground">(e.g. "Every Saturday")</span></Label><Input value={form.date || ""} onChange={(e) => set("date", e.target.value)} placeholder="Optional fallback text" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Time</Label><Input type="time" value={form.start_time || ""} onChange={(e) => set("start_time", e.target.value || null)} /></div>
            <div><Label>End Time</Label><Input type="time" value={form.end_time || ""} onChange={(e) => set("end_time", e.target.value || null)} /></div>
          </div>
          <div><Label>Location</Label><Input value={form.location || ""} onChange={(e) => set("location", e.target.value)} /></div>
          <div><Label>Recurrence</Label><Input value={form.recurrence || ""} onChange={(e) => set("recurrence", e.target.value)} placeholder="None / Weekly / Monthly..." /></div>
          <div><Label>Price</Label><Input value={form.price || ""} onChange={(e) => set("price", e.target.value)} /></div>
          <div><Label>Notes</Label><Textarea rows={3} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} placeholder="Additional info shown under price" /></div>
          <div><Label>Booking Link</Label><Input value={form.booking_link || ""} onChange={(e) => set("booking_link", e.target.value)} /></div>
          <div><Label>Booking Link Display Text</Label><Input value={form.booking_link_label || ""} onChange={(e) => set("booking_link_label", e.target.value)} placeholder="e.g. Book on Quicket" /></div>
          <div><Label>Google Maps Link</Label><Input value={form.google_maps_link || ""} onChange={(e) => set("google_maps_link", e.target.value)} /></div>
          <div><Label>Social Media Link</Label><Input value={form.social_media_link || ""} onChange={(e) => set("social_media_link", e.target.value)} /></div>
          <div><Label>Social Media Label</Label><Input value={form.social_media_label || ""} onChange={(e) => set("social_media_label", e.target.value)} placeholder="e.g. Instagram, Facebook" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Contact Email</Label><Input value={form.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} /></div>
            <div><Label>Contact Phone</Label><Input value={form.contact_phone || ""} onChange={(e) => set("contact_phone", e.target.value)} /></div>
          </div>
          <div><Label>Contact WhatsApp</Label><Input value={form.contact_whatsapp || ""} onChange={(e) => set("contact_whatsapp", e.target.value)} placeholder="+27 ..." /></div>
          <div className="flex items-center gap-2"><Switch checked={!!form.is_featured} onCheckedChange={(v) => set("is_featured", v)} /><Label>Featured</Label></div>
          <div className="pt-2 border-t"><Label className="text-base font-semibold">Hosted By</Label></div>
          {(() => {
            const hostCount = form.hosted_by_name_3 ? 3 : form.hosted_by_name_2 ? 2 : form.hosted_by_name ? 1 : 0;
            const [shown, setShownLocal] = [form.__hostsShown ?? hostCount, (n: number) => set("__hostsShown", n)];
            if (shown === 0) {
              return (
                <Button type="button" variant="outline" onClick={() => setShownLocal(1)}>+ Add Host</Button>
              );
            }
            const hosts: Array<{ n: number; nameKey: string; subKey: string; imgKey: string }> = [
              { n: 1, nameKey: "hosted_by_name", subKey: "hosted_by_subtitle", imgKey: "hosted_by_image_url" },
              { n: 2, nameKey: "hosted_by_name_2", subKey: "hosted_by_subtitle_2", imgKey: "hosted_by_image_url_2" },
              { n: 3, nameKey: "hosted_by_name_3", subKey: "hosted_by_subtitle_3", imgKey: "hosted_by_image_url_3" },
            ];
            return (
              <>
                {hosts.slice(0, shown).map((h) => (
                  <div key={h.n} className="space-y-3 p-3 border rounded">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Host {h.n}</Label>
                      {h.n === shown && shown > 0 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => {
                          set(h.nameKey, ""); set(h.subKey, ""); set(h.imgKey, "");
                          setShownLocal(shown - 1);
                        }}>Remove</Button>
                      )}
                    </div>
                    <div><Label>Name</Label><Input value={form[h.nameKey] || ""} onChange={(e) => set(h.nameKey, e.target.value)} placeholder="e.g. Kristi & Joëlle" /></div>
                    <div><Label>Subtitle</Label><Input value={form[h.subKey] || ""} onChange={(e) => set(h.subKey, e.target.value)} placeholder="e.g. Yoga Teachers" /></div>
                    <div><Label>Photo</Label><ImageUpload bucket="listing-images" value={form[h.imgKey] || ""} onChange={(url) => set(h.imgKey, url)} /></div>
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
