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
import { Plus, Pencil, Trash2, FileSpreadsheet } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

type Listing = Tables<"listings">;

const DAY_LABELS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const MEAL_OPTIONS = ["Breakfast", "Lunch", "Dinner", "Brunch", "Pub Grub"];
const VIBE_OPTIONS = ["Casual", "Social", "Fancy", "Scenic"];
const CUISINE_OPTIONS = ["Seafood", "Sushi", "Burgers", "Pizzas", "Indian", "Grill", "Italian", "Local", "Fast Food"];
const SEATING_OPTIONS = ["Indoor", "Outdoor", "No Seating", "Bar"];
const SERVICE_TYPE_OPTIONS = ["Sit Down", "Take Away"];

const emptyForm = { title: "", description: "", image_url: "", location: "", phone: "", email: "", website: "", is_featured: false, long_description: "", gallery_images: "" as string, opening_hours: Object.fromEntries(DAY_LABELS.map((d) => [d, ""])) as Record<string, string>, good_for_kids: null as boolean | null, pets_allowed: null as boolean | null, wheelchair_friendly: null as boolean | null, price_level: null as number | null, show_attributes: false, meal: [] as string[], vibe: [] as string[], cuisine: [] as string[], seating: [] as string[], kids_playground: null as boolean | null, smoking_allowed: null as boolean | null, service_type: [] as string[] };

const AdminListings = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      // Fetch category names for each listing via junction
      const { data: junctions } = await supabase.from("listing_categories").select("listing_id, category_id");
      const { data: cats } = await supabase.from("categories").select("id, title");
      const catMap = new Map((cats ?? []).map((c) => [c.id, c.title]));
      const listingCatMap = new Map<string, string[]>();
      (junctions ?? []).forEach((j) => {
        const name = catMap.get(j.category_id);
        if (name) {
          const arr = listingCatMap.get(j.listing_id) ?? [];
          arr.push(name);
          listingCatMap.set(j.listing_id, arr);
        }
      });
      return data.map((l) => ({ ...l, _categoryNames: listingCatMap.get(l.id) ?? [] }));
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

  // Fetch listing_categories for the editing listing
  const { data: editingCatIds } = useQuery({
    queryKey: ["listing-categories", editing?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listing_categories")
        .select("category_id")
        .eq("listing_id", editing!.id);
      if (error) throw error;
      return data.map((r: any) => r.category_id as string);
    },
    enabled: !!editing,
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
    if (editingCatIds) setSelectedCatIds(editingCatIds);
  }, [editingCatIds]);

  useEffect(() => {
    if (editingSubIds) setSelectedSubIds(editingSubIds);
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
        category_id: selectedCatIds[0] || null, // keep legacy field in sync
        is_featured: values.is_featured,
        long_description: values.long_description || null,
        gallery_images: galleryArr,
        opening_hours: values.opening_hours,
        good_for_kids: values.good_for_kids,
        pets_allowed: values.pets_allowed,
        wheelchair_friendly: values.wheelchair_friendly,
        price_level: values.price_level,
        show_attributes: values.show_attributes,
        meal: values.meal,
        vibe: values.vibe,
        cuisine: values.cuisine,
        seating: values.seating,
        kids_playground: values.kids_playground,
        smoking_allowed: values.smoking_allowed,
        service_type: values.service_type,
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

      // Sync categories junction
      await supabase.from("listing_categories").delete().eq("listing_id", listingId);
      if (selectedCatIds.length > 0) {
        const rows = selectedCatIds.map((catId) => ({ listing_id: listingId, category_id: catId }));
        const { error: catErr } = await supabase.from("listing_categories").insert(rows);
        if (catErr) throw catErr;
      }

      // Sync subcategories
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

  const resetForm = () => { setForm(emptyForm); setEditing(null); setSelectedCatIds([]); setSelectedSubIds([]); setOpen(false); };

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
      is_featured: l.is_featured,
      long_description: l.long_description ?? "",
      gallery_images: gallery?.join("\n") ?? "",
      opening_hours: { ...Object.fromEntries(DAY_LABELS.map((d) => [d, ""])), ...hours },
      good_for_kids: l.good_for_kids ?? null,
      pets_allowed: l.pets_allowed ?? null,
      wheelchair_friendly: l.wheelchair_friendly ?? null,
      price_level: l.price_level ?? null,
      show_attributes: l.show_attributes ?? false,
      meal: (l as any).meal ?? [],
      vibe: (l as any).vibe ?? [],
      cuisine: (l as any).cuisine ?? [],
      seating: (l as any).seating ?? [],
      kids_playground: (l as any).kids_playground ?? null,
      smoking_allowed: (l as any).smoking_allowed ?? null,
      service_type: (l as any).service_type ?? [],
    });
    setOpen(true);
  };

  const toggleCat = (catId: string) => {
    setSelectedCatIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const toggleSub = (subId: string) => {
    setSelectedSubIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  // Show subcategories for all selected categories
  const availableSubs = subcategories?.filter((s) => selectedCatIds.includes(s.category_id)) ?? [];

  // Check if any selected category is a restaurant type
  const isRestaurantType = categories?.some((c) => selectedCatIds.includes(c.id) && /restaurant|cafe/i.test(c.title));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Listings</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/import")}>
            <FileSpreadsheet className="h-4 w-4" /> Import/Export CSV
          </Button>
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
                  <Label>Categories</Label>
                  <p className="text-xs text-muted-foreground mb-2">Select all that apply</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-lg p-3">
                    {categories?.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`cat-${cat.id}`}
                          checked={selectedCatIds.includes(cat.id)}
                          onCheckedChange={() => toggleCat(cat.id)}
                        />
                        <label htmlFor={`cat-${cat.id}`} className="text-sm text-foreground cursor-pointer">{cat.title}</label>
                      </div>
                    ))}
                  </div>
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

                {isRestaurantType && (
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
                          <div className="flex items-center gap-2">
                            <Switch checked={form.kids_playground === true} onCheckedChange={(v) => setForm({ ...form, kids_playground: v })} />
                            <Label>Kids Playground</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={form.smoking_allowed === true} onCheckedChange={(v) => setForm({ ...form, smoking_allowed: v })} />
                            <Label>Smoking Allowed</Label>
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

                        {[
                          { label: "Meal", options: MEAL_OPTIONS, key: "meal" as const },
                          { label: "Vibe", options: VIBE_OPTIONS, key: "vibe" as const },
                          { label: "Cuisine", options: CUISINE_OPTIONS, key: "cuisine" as const },
                          { label: "Seating", options: SEATING_OPTIONS, key: "seating" as const },
                          { label: "Service Type", options: SERVICE_TYPE_OPTIONS, key: "service_type" as const },
                        ].map(({ label, options, key }) => (
                          <div key={key}>
                            <Label>{label}</Label>
                            <p className="text-xs text-muted-foreground mb-2">Select all that apply</p>
                            <div className="flex flex-wrap gap-2">
                              {options.map((opt) => {
                                const selected = form[key].includes(opt);
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setForm({ ...form, [key]: selected ? form[key].filter((v) => v !== opt) : [...form[key], opt] })}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:border-primary/50"}`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={upsert.isPending}>{editing ? "Update" : "Create"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium text-muted-foreground w-[30%]">Title</th>
                <th className="text-left p-3 font-medium text-muted-foreground w-[30%]">Categories</th>
                <th className="text-left p-3 font-medium text-muted-foreground w-[20%]">Location</th>
                <th className="text-left p-3 font-medium text-muted-foreground w-[8%]">Featured</th>
                <th className="p-3 w-[12%]"></th>
              </tr>
            </thead>
            <tbody>
              {listings?.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="p-3 font-medium text-foreground truncate">{l.title}</td>
                  <td className="p-3 text-muted-foreground truncate">{(l as any)._categoryNames?.join(", ") || "—"}</td>
                  <td className="p-3 text-muted-foreground truncate">{l.location ?? "—"}</td>
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
