import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Listing = Tables<"listings">;

const DAY_LABELS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const emptyForm = { title: "", description: "", image_url: "", location: "", phone: "", email: "", website: "", category_id: "", is_featured: false, long_description: "", gallery_images: "" as string, opening_hours: Object.fromEntries(DAY_LABELS.map((d) => [d, ""])) as Record<string, string>, good_for_kids: null as boolean | null, pets_allowed: null as boolean | null, wheelchair_friendly: null as boolean | null, price_level: null as number | null, show_attributes: false };

const AdminListings = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);

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

  const { data: subcategories } = useQuery({
    queryKey: ["admin-subcategories-select"],
    queryFn: async () => {
      const { data } = await supabase.from("subcategories").select("id, title, category_id").order("sort_order");
      return data ?? [];
    },
  });

  // Fetch listing_subcategories for the editing listing
  const { data: editingSubIds } = useQuery({
    queryKey: ["listing-subcategories", editing?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listing_subcategories")
        .select("subcategory_id")
        .eq("listing_id", editing!.id);
      if (error) throw error;
      return data.map((r: any) => r.subcategory_id as string);
    },
    enabled: !!editing,
  });

  useEffect(() => {
    if (editingSubIds) {
      setSelectedSubIds(editingSubIds);
    }
  }, [editingSubIds]);

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
        good_for_kids: values.good_for_kids,
        pets_allowed: values.pets_allowed,
        wheelchair_friendly: values.wheelchair_friendly,
        price_level: values.price_level,
        show_attributes: values.show_attributes,
      };

      let listingId: string;
      if (editing) {
        const { error } = await supabase.from("listings").update(payload).eq("id", editing.id);
        if (error) throw error;
        listingId = editing.id;
      } else {
        const { data, error } = await supabase.from("listings").insert(payload).select("id").single();
        if (error) throw error;
        listingId = data.id;
      }

      // Sync subcategories: delete all then re-insert
      await supabase.from("listing_subcategories").delete().eq("listing_id", listingId);
      if (selectedSubIds.length > 0) {
        const rows = selectedSubIds.map((subId) => ({ listing_id: listingId, subcategory_id: subId }));
        const { error: subErr } = await supabase.from("listing_subcategories").insert(rows);
        if (subErr) throw subErr;
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

  const resetForm = () => { setForm(emptyForm); setEditing(null); setSelectedSubIds([]); setOpen(false); };

  const openEdit = (l: Listing) => {
    setEditing(l);
    const hours = l.opening_hours as Record<string, string> | null;
    const gallery = l.gallery_images as string[] | null;
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
      long_description: l.long_description ?? "",
      gallery_images: gallery?.join("\n") ?? "",
      opening_hours: { ...Object.fromEntries(DAY_LABELS.map((d) => [d, ""])), ...hours },
      good_for_kids: l.good_for_kids ?? null,
      pets_allowed: l.pets_allowed ?? null,
      wheelchair_friendly: l.wheelchair_friendly ?? null,
      price_level: l.price_level ?? null,
      show_attributes: l.show_attributes ?? false,
    });
    setOpen(true);
  };

  const toggleSub = (subId: string) => {
    setSelectedSubIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const availableSubs = subcategories?.filter((s) => s.category_id === form.category_id) ?? [];

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
                <Select value={form.category_id} onValueChange={(v) => { setForm({ ...form, category_id: v }); setSelectedSubIds([]); }}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {availableSubs.length > 0 && (
                <div>
                  <Label>Subcategories</Label>
                  <p className="text-xs text-muted-foreground mb-2">Select all that apply</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-lg p-3">
                    {availableSubs.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`sub-${sub.id}`}
                          checked={selectedSubIds.includes(sub.id)}
                          onCheckedChange={() => toggleSub(sub.id)}
                        />
                        <label htmlFor={`sub-${sub.id}`} className="text-sm text-foreground cursor-pointer">{sub.title}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

              {categories?.some((c) => c.id === form.category_id && /restaurant|cafe/i.test(c.title)) && (
                <div className="border-t border-border pt-4 mt-2 space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={form.show_attributes} onCheckedChange={(v) => setForm({ ...form, show_attributes: v })} />
                    <Label>Show restaurant attributes on detail page</Label>
                  </div>

                  {form.show_attributes && (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Switch checked={form.good_for_kids === true} onCheckedChange={(v) => setForm({ ...form, good_for_kids: v })} />
                          <Label>Good for Kids</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={form.pets_allowed === true} onCheckedChange={(v) => setForm({ ...form, pets_allowed: v })} />
                          <Label>Pets Allowed</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={form.wheelchair_friendly === true} onCheckedChange={(v) => setForm({ ...form, wheelchair_friendly: v })} />
                          <Label>Wheelchair Friendly</Label>
                        </div>
                      </div>

                      <div>
                        <Label>Price Level</Label>
                        <Select value={form.price_level?.toString() ?? ""} onValueChange={(v) => setForm({ ...form, price_level: v ? parseInt(v) : null })}>
                          <SelectTrigger><SelectValue placeholder="Select price level" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">$ — Budget</SelectItem>
                            <SelectItem value="2">$$ — Moderate</SelectItem>
                            <SelectItem value="3">$$$ — Upscale</SelectItem>
                            <SelectItem value="4">$$$$ — Fine Dining</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              )}

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
