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
  "title", "description", "date", "start_time", "end_time", "location",
  "tag", "sub_tag_1", "sub_tag_2", "image_url", "recurrence", "price", "notes", "booking_link",
  "google_maps_link", "social_media_link", "social_media_label", "contact_email", "contact_phone", "contact_whatsapp",
  "business_id", "is_featured",
];

const EventEditDialog = ({ open, onOpenChange, event }: Props) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(event);

  useEffect(() => { setForm(event); }, [event, open]);

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

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label>Title</Label><Input value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></div>
          <div><Label>Tag/Category</Label><Input value={form.tag || ""} onChange={(e) => set("tag", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Sub-tag 1 <span className="text-xs text-muted-foreground">(optional)</span></Label><Input value={form.sub_tag_1 || ""} onChange={(e) => set("sub_tag_1", e.target.value)} /></div>
            <div><Label>Sub-tag 2 <span className="text-xs text-muted-foreground">(optional)</span></Label><Input value={form.sub_tag_2 || ""} onChange={(e) => set("sub_tag_2", e.target.value)} /></div>
          </div>
          <div>
            <Label>Linked Business Listing <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.business_id || ""}
              onChange={(e) => set("business_id", e.target.value || null)}
            >
              <option value="">— Not linked —</option>
              {(listings || []).map((l: any) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
          <div><Label>Description</Label><Textarea rows={4} value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></div>
          <div><Label>Image</Label><ImageUpload bucket="listing-images" value={form.image_url || ""} onChange={(url) => set("image_url", url)} /></div>
          <div><Label>Date</Label><Input value={form.date || ""} onChange={(e) => set("date", e.target.value)} placeholder="YYYY-MM-DD or text" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Time</Label><Input type="time" value={form.start_time || ""} onChange={(e) => set("start_time", e.target.value || null)} /></div>
            <div><Label>End Time</Label><Input type="time" value={form.end_time || ""} onChange={(e) => set("end_time", e.target.value || null)} /></div>
          </div>
          <div><Label>Location</Label><Input value={form.location || ""} onChange={(e) => set("location", e.target.value)} /></div>
          <div><Label>Recurrence</Label><Input value={form.recurrence || ""} onChange={(e) => set("recurrence", e.target.value)} placeholder="None / Weekly / Monthly..." /></div>
          <div><Label>Price</Label><Input value={form.price || ""} onChange={(e) => set("price", e.target.value)} /></div>
          <div><Label>Notes</Label><Textarea rows={3} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} placeholder="Additional info shown under price" /></div>
          <div><Label>Booking Link</Label><Input value={form.booking_link || ""} onChange={(e) => set("booking_link", e.target.value)} /></div>
          <div><Label>Google Maps Link</Label><Input value={form.google_maps_link || ""} onChange={(e) => set("google_maps_link", e.target.value)} /></div>
          <div><Label>Social Media Link</Label><Input value={form.social_media_link || ""} onChange={(e) => set("social_media_link", e.target.value)} /></div>
          <div><Label>Social Media Label</Label><Input value={form.social_media_label || ""} onChange={(e) => set("social_media_label", e.target.value)} placeholder="e.g. Instagram, Facebook" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Contact Email</Label><Input value={form.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} /></div>
            <div><Label>Contact Phone</Label><Input value={form.contact_phone || ""} onChange={(e) => set("contact_phone", e.target.value)} /></div>
          </div>
          <div><Label>Contact WhatsApp</Label><Input value={form.contact_whatsapp || ""} onChange={(e) => set("contact_whatsapp", e.target.value)} placeholder="+27 ..." /></div>
          <div className="flex items-center gap-2"><Switch checked={!!form.is_featured} onCheckedChange={(v) => set("is_featured", v)} /><Label>Featured</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventEditDialog;
