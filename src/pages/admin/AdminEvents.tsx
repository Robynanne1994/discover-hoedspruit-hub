import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileSpreadsheet, Upload, X, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Event = Tables<"events">;
const RECURRENCE_OPTIONS = ["", "Daily", "Weekly", "Biweekly", "Monthly", "Bimonthly", "Quarterly", "Annually"];
const emptyForm = { title: "", description: "", date: "", location: "", tag: "", image_url: "", start_time: "", end_time: "", recurrence: "", google_maps_link: "", social_media_link: "", contact_email: "", contact_phone: "", gallery_images: "", booking_link: "", price: "" };

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

const AdminEvents = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: typeof form) => {
      const galleryArr = values.gallery_images ? values.gallery_images.split("\n").filter(Boolean) : [];
      const payload: any = {
        title: values.title,
        description: values.description || null,
        date: values.date,
        location: values.location || null,
        tag: values.tag || null,
        image_url: values.image_url || null,
        start_time: values.start_time || null,
        end_time: values.end_time || null,
        recurrence: values.recurrence || null,
        google_maps_link: values.google_maps_link || null,
        social_media_link: values.social_media_link || null,
        contact_email: values.contact_email || null,
        contact_phone: values.contact_phone || null,
        gallery_images: galleryArr,
        booking_link: values.booking_link || null,
        price: values.price || null,
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
      toast.success(editing ? "Event updated" : "Event created");
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
      description: ev.description ?? "",
      date: ev.date,
      location: ev.location ?? "",
      tag: ev.tag ?? "",
      image_url: ev.image_url ?? "",
      start_time: ev.start_time ?? "",
      end_time: ev.end_time ?? "",
      recurrence: ev.recurrence ?? "",
      google_maps_link: ev.google_maps_link ?? "",
      social_media_link: (ev as any).social_media_link ?? "",
      contact_email: (ev as any).contact_email ?? "",
      contact_phone: (ev as any).contact_phone ?? "",
      gallery_images: ((ev as any).gallery_images ?? []).join("\n"),
      booking_link: (ev as any).booking_link ?? "",
      price: (ev as any).price ?? "",
    });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Events</h1>
        <div className="flex gap-2">
          <Link to="/admin/events/import">
            <Button variant="outline" className="gap-2"><FileSpreadsheet className="h-4 w-4" /> Import/Export CSV</Button>
          </Link>
          <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Event</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit Event" : "Add Event"}</DialogTitle></DialogHeader>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); upsert.mutate(form); }}>
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div><Label>Description <span className="text-xs text-muted-foreground">(HTML supported)</span></Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} /></div>
              <div><Label>Date <span className="text-xs text-muted-foreground">(HTML supported)</span></Label><Input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required placeholder="e.g. 22 March 2026 or Every Saturday" /></div>
              <div><Label>Location <span className="text-xs text-muted-foreground">(HTML supported)</span></Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Time</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
                <div><Label>End Time</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
              </div>
              <div><Label>Tag</Label><Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="e.g. Market, Sport, Dining" /></div>
              <div><Label>Recurrence</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value })}>
                  {RECURRENCE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt || "Not recurring"}</option>)}
                </select>
              </div>
              <div><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
              <div><Label>Google Maps Link</Label><Input value={form.google_maps_link} onChange={(e) => setForm({ ...form, google_maps_link: e.target.value })} placeholder="https://maps.google.com/..." /></div>
              <div><Label>Social Media Link</Label><Input value={form.social_media_link} onChange={(e) => setForm({ ...form, social_media_link: e.target.value })} placeholder="https://instagram.com/..." /></div>
              <div><Label>Booking Link</Label><Input value={form.booking_link} onChange={(e) => setForm({ ...form, booking_link: e.target.value })} placeholder="https://booking-site.com/..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Contact Email</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="info@example.com" /></div>
                <div><Label>Contact Phone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="+27 ..." /></div>
              </div>
              <EventGalleryUpload value={form.gallery_images} onChange={(v) => setForm({ ...form, gallery_images: v })} />
              <Button type="submit" className="w-full" disabled={upsert.isPending}>{editing ? "Update" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium text-muted-foreground w-[25%]">Title</th>
                <th className="text-left p-3 font-medium text-muted-foreground w-[25%]">Date</th>
                <th className="text-left p-3 font-medium text-muted-foreground w-[25%]">Location</th>
                <th className="text-left p-3 font-medium text-muted-foreground w-[10%]">Tag</th>
                <th className="p-3 w-[15%]"></th>
              </tr>
            </thead>
            <tbody>
              {events?.map((ev) => (
                <tr key={ev.id} className="border-t border-border">
                  <td className="p-3 font-medium text-foreground truncate">{ev.title}</td>
                  <td className="p-3 text-muted-foreground truncate">{ev.date}</td>
                  <td className="p-3 text-muted-foreground truncate">{ev.location ?? "—"}</td>
                  <td className="p-3 text-muted-foreground truncate">{ev.tag ?? "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(ev)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(ev.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {events?.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No events yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
