import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Listing = Tables<"listings">;

const DAY_LABELS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const emptyForm = { title: "", description: "", image_url: "", location: "", phone: "", email: "", website: "", category_id: "", is_featured: false, long_description: "", gallery_images: "" as string, opening_hours: Object.fromEntries(DAY_LABELS.map((d) => [d, ""])) as Record<string, string> };

const AdminListings = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*, categories(title)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories-select"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, title").order("sort_order");
      return data ?? [];
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: typeof emptyForm) => {
      const galleryArr = values.gallery_images
        ? values.gallery_images.split("\n").map((u) => u.trim()).filter(Boolean)
        : [];
      const payload: any = {
        title: values.title,
        description: values.description || null,
        image_url: values.image_url || null,
        location: values.location || null,
        phone: values.phone || null,
        email: values.email || null,
        website: values.website || null,
        category_id: values.category_id || null,
        is_featured: values.is_featured,
        long_description: values.long_description || null,
        gallery_images: galleryArr,
        opening_hours: values.opening_hours,
      };
      if (editing) {
        const { error } = await supabase.from("listings").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("listings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success(editing ? "Listing updated" : "Listing created");
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success("Listing deleted");
    },
  });

  const resetForm = () => { setForm(emptyForm); setEditing(null); setOpen(false); };

  const openEdit = (l: Listing) => {
    setEditing(l);
    const hours = (l as any).opening_hours as Record<string, string> | null;
    const gallery = (l as any).gallery_images as string[] | null;
    setForm({
      title: l.title,
      description: l.description ?? "",
      image_url: l.image_url ?? "",
      location: l.location ?? "",
      phone: l.phone ?? "",
      email: l.email ?? "",
      website: l.website ?? "",
      category_id: l.category_id ?? "",
      is_featured: l.is_featured,
      long_description: (l as any).long_description ?? "",
      gallery_images: gallery?.join("\n") ?? "",
      opening_hours: { ...Object.fromEntries(DAY_LABELS.map((d) => [d, ""])), ...hours },
    });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Listings</h1>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Listing</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit Listing" : "Add Listing"}</DialogTitle></DialogHeader>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); upsert.mutate(form); }}>
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div>
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                <Label>Featured</Label>
              </div>

              <div className="border-t border-border pt-4 mt-2">
                <p className="text-sm font-medium text-foreground mb-3">Detail Page Fields (optional)</p>
              </div>

              <div>
                <Label>Long Description</Label>
                <Textarea
                  value={form.long_description}
                  onChange={(e) => setForm({ ...form, long_description: e.target.value })}
                  rows={5}
                  placeholder="Detailed information shown on the listing's own page..."
                />
              </div>

              <div>
                <Label>Gallery Images (one URL per line)</Label>
                <Textarea
                  value={form.gallery_images}
                  onChange={(e) => setForm({ ...form, gallery_images: e.target.value })}
                  rows={3}
                  placeholder={"https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg"}
                />
              </div>

              <div>
                <Label>Opening Hours</Label>
                <div className="space-y-2 mt-1">
                  {DAY_LABELS.map((day) => (
                    <div key={day} className="grid grid-cols-[100px_1fr] gap-2 items-center">
                      <span className="text-sm text-muted-foreground capitalize">{day}</span>
                      <Input
                        value={form.opening_hours[day] ?? ""}
                        onChange={(e) => setForm({ ...form, opening_hours: { ...form.opening_hours, [day]: e.target.value } })}
                        placeholder="e.g. 08:00 - 17:00"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={upsert.isPending}>{editing ? "Update" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Location</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Featured</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {listings?.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="p-3 font-medium text-foreground">{l.title}</td>
                  <td className="p-3 text-muted-foreground">{(l.categories as any)?.title ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{l.location ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{l.is_featured ? "Yes" : "No"}</td>
                  <td className="p-3 flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
              {listings?.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No listings yet. Add your first one!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminListings;
