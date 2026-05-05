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
import { isShoppingCategory, isAccommodationCategory } from "@/lib/categoryFields";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileSpreadsheet, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate, useSearchParams } from "react-router-dom";
import ImageUpload from "@/components/admin/ImageUpload";
import GalleryUpload from "@/components/admin/GalleryUpload";

type Listing = Tables<"listings">;

const DAY_LABELS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const MEAL_OPTIONS = ["Breakfast", "Lunch", "Dinner", "Brunch", "Pub Grub"];
const VIBE_OPTIONS = ["Casual", "Social", "Fancy", "Scenic"];
const CUISINE_OPTIONS = ["Seafood", "Sushi", "Burgers", "Pizzas", "Indian", "Grill", "Italian", "Local", "Fast Food"];
const SEATING_OPTIONS = ["Indoor", "Outdoor", "No Seating", "Bar"];
const SERVICE_TYPE_OPTIONS = ["Sit down", "Take away", "Delivery"];
const PAYMENT_METHOD_OPTIONS = ["Cash", "Card", "EFT", "Account"];
const SHOP_TYPE_OPTIONS = ["General Store", "Boutique", "Hardware", "Grocery", "Clothing", "Electronics", "Pharmacy", "Pet Shop", "Other"];
const ACCOMMODATION_PRICE_RANGE_OPTIONS = ["Budget", "Mid-range", "Luxury"];

const emptyForm = { title: "", description: "", image_url: "", location: "", phone: "", email: "", website: "", website_label: "", whatsapp: "", google_maps_link: "", google_rating: null as number | null, google_reviews_count: null as number | null, google_reviews_url: "", is_featured: false, long_description: "", gallery_images: "" as string, opening_hours: Object.fromEntries(DAY_LABELS.map((d) => [d, ""])) as Record<string, string>, good_for_kids: null as boolean | null, pets_allowed: null as boolean | null, wheelchair_friendly: null as boolean | null, price_level: null as number | null, show_attributes: false, meal: [] as string[], vibe: [] as string[], cuisine: [] as string[], seating: [] as string[], kids_playground: null as boolean | null, smoking_allowed: null as boolean | null, service_type: [] as string[], kids_menu: null as boolean | null, high_chairs: null as boolean | null, wheelchair_car_park: null as boolean | null, wheelchair_entrance: null as boolean | null, wheelchair_seating: null as boolean | null, wheelchair_toilet: null as boolean | null, has_toilet: null as boolean | null, has_wifi: null as boolean | null, has_free_wifi: null as boolean | null, air_conditioned: null as boolean | null, payment_methods: [] as string[], delivery_available: null as boolean | null, click_and_collect: null as boolean | null, order_online: null as boolean | null, parking_available: null as boolean | null, local_products: null as boolean | null, shop_type: "" as string, curio_or_gifts: null as boolean | null, product_categories: "" as string, price_range: "" as string, amenities: [] as string[], sleeps: null as number | null, km_from_town: "" as string, has_restaurant: null as boolean | null, has_bar: null as boolean | null, has_room_service: null as boolean | null, has_breakfast: null as boolean | null, breakfast_included: null as boolean | null, has_swimming_pool: null as boolean | null, has_laundry: null as boolean | null, child_friendly: null as boolean | null, has_spa: null as boolean | null, has_fitness_centre: null as boolean | null, has_airport_shuttle: null as boolean | null, has_aircon: null as boolean | null, has_wifi_accom: null as boolean | null, has_free_parking: null as boolean | null, has_secure_parking: null as boolean | null, custom_title_1: "" as string, custom_text_1: "" as string, custom_title_2: "" as string, custom_text_2: "" as string, custom_title_3: "" as string, custom_text_3: "" as string };

const AdminListings = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  // Auto-open edit dialog from ?edit= query param
  useEffect(() => {
    const editId = searchParams.get("edit");
    const ret = searchParams.get("returnTo");
    if (editId && listings && !editing) {
      const found = listings.find((l) => l.id === editId);
      if (found) {
        if (ret) setReturnTo(ret);
        openEdit(found);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, listings]);

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
        website_label: values.website_label || null,
        whatsapp: values.whatsapp || null,
          google_maps_link: values.google_maps_link || null,
          google_rating: values.google_rating,
          google_reviews_count: values.google_reviews_count,
          google_reviews_url: values.google_reviews_url || null,
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
        kids_menu: values.kids_menu,
        high_chairs: values.high_chairs,
        wheelchair_car_park: values.wheelchair_car_park,
        wheelchair_entrance: values.wheelchair_entrance,
        wheelchair_seating: values.wheelchair_seating,
        wheelchair_toilet: values.wheelchair_toilet,
        has_toilet: values.has_toilet,
        has_wifi: values.has_wifi,
        has_free_wifi: values.has_free_wifi,
        air_conditioned: values.air_conditioned,
        payment_methods: values.payment_methods,
        delivery_available: values.delivery_available,
        click_and_collect: values.click_and_collect,
        order_online: values.order_online,
        parking_available: values.parking_available,
        local_products: values.local_products,
        shop_type: values.shop_type || null,
        curio_or_gifts: values.curio_or_gifts,
        product_categories: values.product_categories ? values.product_categories.split(",").map(s => s.trim()).filter(Boolean) : [],
        price_range: values.price_range || null,
        amenities: values.amenities,
        sleeps: values.sleeps,
        km_from_town: values.km_from_town || null,
        has_restaurant: values.has_restaurant,
        has_bar: values.has_bar,
        has_room_service: values.has_room_service,
        has_breakfast: values.has_breakfast,
        breakfast_included: values.breakfast_included,
        has_swimming_pool: values.has_swimming_pool,
        has_laundry: values.has_laundry,
        child_friendly: values.child_friendly,
        has_spa: values.has_spa,
        has_fitness_centre: values.has_fitness_centre,
        has_airport_shuttle: values.has_airport_shuttle,
        has_aircon: values.has_aircon,
        has_wifi_accom: values.has_wifi_accom,
        has_free_parking: values.has_free_parking,
        has_secure_parking: values.has_secure_parking,
        custom_title_1: values.custom_title_1?.trim() || null,
        custom_text_1: values.custom_text_1?.trim() || null,
        custom_title_2: values.custom_title_2?.trim() || null,
        custom_text_2: values.custom_text_2?.trim() || null,
        custom_title_3: values.custom_title_3?.trim() || null,
        custom_text_3: values.custom_text_3?.trim() || null,
      };

      // Treat "-" as empty for any string field on save
      for (const k of Object.keys(payload)) {
        const v = (payload as any)[k];
        if (typeof v === "string" && v.trim() === "-") {
          (payload as any)[k] = null;
        }
      }

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
      const ret = returnTo;
      resetForm();
      if (ret) {
        setReturnTo(null);
        navigate(ret, { replace: true });
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkDelete = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selectedIds);
      const { error } = await supabase.from("listings").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success(`${selectedIds.size} listing(s) deleted`);
      setSelectedIds(new Set());
    },
    onError: (e) => toast.error(e.message),
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
      website_label: (l as any).website_label ?? "",
      whatsapp: (l as any).whatsapp ?? "",
      google_maps_link: (l as any).google_maps_link ?? "",
      google_rating: (l as any).google_rating ?? null,
      google_reviews_count: (l as any).google_reviews_count ?? null,
      google_reviews_url: (l as any).google_reviews_url ?? "",
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
      kids_menu: (l as any).kids_menu ?? null,
      high_chairs: (l as any).high_chairs ?? null,
      wheelchair_car_park: (l as any).wheelchair_car_park ?? null,
      wheelchair_entrance: (l as any).wheelchair_entrance ?? null,
      wheelchair_seating: (l as any).wheelchair_seating ?? null,
      wheelchair_toilet: (l as any).wheelchair_toilet ?? null,
      has_toilet: (l as any).has_toilet ?? null,
      has_wifi: (l as any).has_wifi ?? null,
      has_free_wifi: (l as any).has_free_wifi ?? null,
      air_conditioned: (l as any).air_conditioned ?? null,
      payment_methods: (l as any).payment_methods ?? [],
      delivery_available: (l as any).delivery_available ?? null,
      click_and_collect: (l as any).click_and_collect ?? null,
      order_online: (l as any).order_online ?? null,
      parking_available: (l as any).parking_available ?? null,
      local_products: (l as any).local_products ?? null,
      shop_type: (l as any).shop_type ?? "",
      curio_or_gifts: (l as any).curio_or_gifts ?? null,
      product_categories: ((l as any).product_categories ?? []).join(", "),
      price_range: (l as any).price_range ?? "",
      amenities: (l as any).amenities ?? [],
      sleeps: (l as any).sleeps ?? null,
      km_from_town: (l as any).km_from_town ?? "",
      has_restaurant: (l as any).has_restaurant ?? null,
      has_bar: (l as any).has_bar ?? null,
      has_room_service: (l as any).has_room_service ?? null,
      has_breakfast: (l as any).has_breakfast ?? null,
      breakfast_included: (l as any).breakfast_included ?? null,
      has_swimming_pool: (l as any).has_swimming_pool ?? null,
      has_laundry: (l as any).has_laundry ?? null,
      child_friendly: (l as any).child_friendly ?? null,
      has_spa: (l as any).has_spa ?? null,
      has_fitness_centre: (l as any).has_fitness_centre ?? null,
      has_airport_shuttle: (l as any).has_airport_shuttle ?? null,
      has_aircon: (l as any).has_aircon ?? null,
      has_wifi_accom: (l as any).has_wifi_accom ?? null,
      has_free_parking: (l as any).has_free_parking ?? null,
      has_secure_parking: (l as any).has_secure_parking ?? null,
      custom_title_1: (l as any).custom_title_1 ?? "",
      custom_text_1: (l as any).custom_text_1 ?? "",
      custom_title_2: (l as any).custom_title_2 ?? "",
      custom_text_2: (l as any).custom_text_2 ?? "",
      custom_title_3: (l as any).custom_title_3 ?? "",
      custom_text_3: (l as any).custom_text_3 ?? "",
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
  const isRestaurantType = categories?.some((c) => selectedCatIds.includes(c.id) && /restaurant|caf[eé]/i.test(c.title));
  const isShoppingType = categories?.some((c) => selectedCatIds.includes(c.id) && isShoppingCategory(c.title));
  const isAccommodationType = categories?.some((c) => selectedCatIds.includes(c.id) && isAccommodationCategory(c.title));

  const filteredListings = (listings ?? []).filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return l.title.toLowerCase().includes(q) || (l.location ?? "").toLowerCase().includes(q) || ((l as any)._categoryNames ?? []).some((n: string) => n.toLowerCase().includes(q));
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 lg:mb-8">
        <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">Listings</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/import")}>
            <FileSpreadsheet className="h-4 w-4" /> <span className="hidden sm:inline">Import/Export CSV</span><span className="sm:hidden">CSV</span>
          </Button>
          <Dialog open={open} onOpenChange={(v) => { if (!v) { const ret = returnTo; resetForm(); if (ret) { setReturnTo(null); navigate(ret, { replace: true }); } } setOpen(v); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Add Listing</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
                <div><Label>Cover Image</Label><ImageUpload bucket="listing-images" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} /></div>
                <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." /></div>
                <div>
                  <Label>Website Display Text <span className="text-xs text-muted-foreground">(optional — shown instead of the URL)</span></Label>
                  <Input value={form.website_label} onChange={(e) => setForm({ ...form, website_label: e.target.value })} placeholder="e.g. Visit our Facebook page" />
                </div>
                <div><Label>WhatsApp Number</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="e.g. +27791234567" /></div>
                <div><Label>Google Maps Link</Label><Input value={form.google_maps_link} onChange={(e) => setForm({ ...form, google_maps_link: e.target.value })} placeholder="https://maps.google.com/..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Google Rating (0-5)</Label><Input type="number" step="0.1" min="0" max="5" value={form.google_rating ?? ""} onChange={(e) => setForm({ ...form, google_rating: e.target.value ? parseFloat(e.target.value) : null })} placeholder="e.g. 4.5" /></div>
                   <div><Label>Google Reviews Count</Label><Input type="number" min="0" value={form.google_reviews_count ?? ""} onChange={(e) => setForm({ ...form, google_reviews_count: e.target.value ? parseInt(e.target.value, 10) : null })} placeholder="e.g. 128" /></div>
                </div>
                <div><Label>Google Reviews URL</Label><Input value={form.google_reviews_url} onChange={(e) => setForm({ ...form, google_reviews_url: e.target.value })} placeholder="https://search.google.com/local/reviews?placeid=..." /></div>
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

                <GalleryUpload
                  value={form.gallery_images}
                  onChange={(val) => setForm({ ...form, gallery_images: val })}
                />

                <div className="border-t border-border pt-4 mt-2 space-y-3">
                  <p className="text-sm font-medium text-foreground">Custom Detail Rows (optional)</p>
                  <p className="text-xs text-muted-foreground -mt-2">Add up to 3 custom rows. Each appears as the last item(s) in the Details card. Empty rows are hidden.</p>
                  {[1, 2, 3].map((n) => {
                    const titleKey = `custom_title_${n}` as keyof typeof form;
                    const textKey = `custom_text_${n}` as keyof typeof form;
                    return (
                      <div key={n} className="border border-border rounded-lg p-3 space-y-2">
                        <Label className="text-xs text-muted-foreground">Custom row {n}</Label>
                        <Input
                          placeholder="Title (e.g. Dress Code)"
                          value={(form[titleKey] as string) || ""}
                          onChange={(e) => setForm({ ...form, [titleKey]: e.target.value } as any)}
                        />
                        <Textarea
                          placeholder="Text (shown when expanded). Add a link with [link text](https://example.com)"
                          rows={3}
                          value={(form[textKey] as string) || ""}
                          onChange={(e) => setForm({ ...form, [textKey]: e.target.value } as any)}
                        />
                        <p className="text-[11px] text-muted-foreground">Tip: use <code>[your text](https://link.com)</code> to embed a clickable link.</p>
                      </div>
                    );
                  })}
                </div>

                {!isAccommodationType && (
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
                )}

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
                            <Switch checked={form.smoking_allowed === true} onCheckedChange={(v) => setForm({ ...form, smoking_allowed: v })} />
                            <Label>Smoking Allowed</Label>
                          </div>
                        </div>

                        {/* Kids Section */}
                        <div className="border-t border-border pt-3 mt-2">
                          <p className="text-sm font-medium text-foreground mb-3">Kids</p>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Switch checked={form.kids_playground === true} onCheckedChange={(v) => setForm({ ...form, kids_playground: v })} />
                              <Label>Kids Playground</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={form.kids_menu === true} onCheckedChange={(v) => setForm({ ...form, kids_menu: v })} />
                              <Label>Kids Menu</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={form.high_chairs === true} onCheckedChange={(v) => setForm({ ...form, high_chairs: v })} />
                              <Label>High Chairs</Label>
                            </div>
                          </div>
                        </div>

                        {/* Accessibility Section */}
                        <div className="border-t border-border pt-3 mt-2">
                          <p className="text-sm font-medium text-foreground mb-3">Accessibility</p>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Switch checked={form.wheelchair_car_park === true} onCheckedChange={(v) => setForm({ ...form, wheelchair_car_park: v })} />
                              <Label>Wheelchair-accessible Car Park</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={form.wheelchair_entrance === true} onCheckedChange={(v) => setForm({ ...form, wheelchair_entrance: v })} />
                              <Label>Wheelchair-accessible Entrance</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={form.wheelchair_seating === true} onCheckedChange={(v) => setForm({ ...form, wheelchair_seating: v })} />
                              <Label>Wheelchair-accessible Seating</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={form.wheelchair_toilet === true} onCheckedChange={(v) => setForm({ ...form, wheelchair_toilet: v })} />
                              <Label>Wheelchair-accessible Toilet</Label>
                            </div>
                          </div>
                        </div>

                        {/* Amenities Section */}
                        <div className="border-t border-border pt-3 mt-2">
                          <p className="text-sm font-medium text-foreground mb-3">Amenities</p>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Switch checked={form.has_toilet === true} onCheckedChange={(v) => setForm({ ...form, has_toilet: v })} />
                              <Label>Toilet</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={form.has_wifi === true} onCheckedChange={(v) => setForm({ ...form, has_wifi: v })} />
                              <Label>Wi-Fi</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={form.has_free_wifi === true} onCheckedChange={(v) => setForm({ ...form, has_free_wifi: v })} />
                              <Label>Free Wi-Fi</Label>
                            </div>
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

                {isShoppingType && (
                  <div className="border-t border-border pt-4 mt-2 space-y-4">
                    <p className="text-sm font-medium text-foreground">Shopping Fields</p>

                    <div className="space-y-3">
                      {[
                        { label: "Air Conditioned", key: "air_conditioned" as const },
                        { label: "Delivery Available", key: "delivery_available" as const },
                        { label: "Click & Collect", key: "click_and_collect" as const },
                        { label: "Order Online", key: "order_online" as const },
                        { label: "Parking Available", key: "parking_available" as const },
                        { label: "Wheelchair Friendly", key: "wheelchair_friendly" as const },
                        { label: "Local Products", key: "local_products" as const },
                        { label: "Curio / Gifts", key: "curio_or_gifts" as const },
                      ].map(({ label, key }) => (
                        <div key={key} className="flex items-center gap-2">
                          <Switch checked={form[key] === true} onCheckedChange={(v) => setForm({ ...form, [key]: v })} />
                          <Label>{label}</Label>
                        </div>
                      ))}
                    </div>

                    <div>
                      <Label>Payment Methods</Label>
                      <p className="text-xs text-muted-foreground mb-2">Select all that apply</p>
                      <div className="flex flex-wrap gap-2">
                        {PAYMENT_METHOD_OPTIONS.map((opt) => {
                          const selected = form.payment_methods.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setForm({ ...form, payment_methods: selected ? form.payment_methods.filter((v) => v !== opt) : [...form.payment_methods, opt] })}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:border-primary/50"}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <Label>Shop Type</Label>
                      <Select value={form.shop_type} onValueChange={(v) => setForm({ ...form, shop_type: v })}>
                        <SelectTrigger><SelectValue placeholder="Select shop type" /></SelectTrigger>
                        <SelectContent>
                          {SHOP_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Product Categories</Label>
                      <Input
                        value={form.product_categories}
                        onChange={(e) => setForm({ ...form, product_categories: e.target.value })}
                        placeholder="e.g. Clothing, Food, Hardware (comma-separated)"
                      />
                    </div>

                    <div>
                      <Label>Price Range</Label>
                      <Input
                        value={form.price_range}
                        onChange={(e) => setForm({ ...form, price_range: e.target.value })}
                        placeholder="e.g. Budget, Mid-range, Premium"
                      />
                    </div>
                  </div>
                )}

                {isAccommodationType && (
                  <div className="border-t border-border pt-4 mt-2 space-y-4">
                    <p className="text-sm font-medium text-foreground">Accommodation Fields</p>

                    <div className="space-y-3">
                      {[
                        { label: "Restaurant", key: "has_restaurant" as const },
                        { label: "Bar", key: "has_bar" as const },
                        { label: "Room Service", key: "has_room_service" as const },
                        { label: "Breakfast", key: "has_breakfast" as const },
                      ].map(({ label, key }) => (
                        <div key={key} className="flex items-center gap-2">
                          <Switch checked={form[key] === true} onCheckedChange={(v) => setForm({ ...form, [key]: v })} />
                          <Label>{label}</Label>
                        </div>
                      ))}

                      {form.has_breakfast === true && (
                        <div className="ml-6 flex items-center gap-2">
                          <Switch checked={form.breakfast_included === true} onCheckedChange={(v) => setForm({ ...form, breakfast_included: v })} />
                          <Label>{form.breakfast_included ? "Breakfast Included (Free)" : "Breakfast Paid"}</Label>
                        </div>
                      )}

                      {[
                        { label: "Swimming Pool", key: "has_swimming_pool" as const },
                        { label: "Laundry Service", key: "has_laundry" as const },
                        { label: "Child Friendly", key: "child_friendly" as const },
                        { label: "Spa", key: "has_spa" as const },
                        { label: "Fitness Centre", key: "has_fitness_centre" as const },
                        { label: "Airport Shuttle", key: "has_airport_shuttle" as const },
                        { label: "Aircon", key: "has_aircon" as const },
                        { label: "Wi-Fi", key: "has_wifi_accom" as const },
                        { label: "Free Parking", key: "has_free_parking" as const },
                        { label: "Secure Parking", key: "has_secure_parking" as const },
                        { label: "Pets Allowed", key: "pets_allowed" as const },
                      ].map(({ label, key }) => (
                        <div key={key} className="flex items-center gap-2">
                          <Switch checked={form[key] === true} onCheckedChange={(v) => setForm({ ...form, [key]: v })} />
                          <Label>{label}</Label>
                        </div>
                      ))}
                    </div>

                    <div>
                      <Label>Sleeps (number of guests)</Label>
                      <Input
                        type="number"
                        value={form.sleeps ?? ""}
                        onChange={(e) => setForm({ ...form, sleeps: e.target.value ? parseInt(e.target.value, 10) : null })}
                        placeholder="e.g. 4"
                      />
                    </div>

                    <div>
                      <Label>Price Range</Label>
                      <Select value={form.price_range} onValueChange={(v) => setForm({ ...form, price_range: v })}>
                        <SelectTrigger><SelectValue placeholder="Select price range" /></SelectTrigger>
                        <SelectContent>
                          {ACCOMMODATION_PRICE_RANGE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>KM from Town</Label>
                      <Input
                        value={form.km_from_town}
                        onChange={(e) => setForm({ ...form, km_from_town: e.target.value })}
                        placeholder="e.g. 5"
                      />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={upsert.isPending}>{editing ? "Update" : "Create"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search listings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium text-foreground">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => navigate(`/admin/listings/bulk-edit?ids=${Array.from(selectedIds).join(",")}`)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Bulk Edit
          </Button>
          <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { if (confirm(`Delete ${selectedIds.size} listing(s)?`)) bulkDelete.mutate(); }}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}



      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 w-[40px]">
                  <Checkbox
                    checked={filteredListings.length > 0 && filteredListings.every((l) => selectedIds.has(l.id))}
                    onCheckedChange={(v) => {
                      if (v) {
                        setSelectedIds(new Set(filteredListings.map((l) => l.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                </th>
                <th className="text-left p-3 font-medium text-muted-foreground w-[28%]">Title</th>
                <th className="text-left p-3 font-medium text-muted-foreground w-[25%]">Categories</th>
                <th className="text-left p-3 font-medium text-muted-foreground w-[18%]">Location</th>
                <th className="text-left p-3 font-medium text-muted-foreground w-[8%]">Featured</th>
                <th className="p-3 w-[12%]"></th>
              </tr>
            </thead>
            <tbody>
              {filteredListings.map((l) => (
                <tr key={l.id} className={`border-t border-border ${selectedIds.has(l.id) ? "bg-primary/5" : ""}`}>
                  <td className="p-3">
                    <Checkbox
                      checked={selectedIds.has(l.id)}
                      onCheckedChange={(v) => {
                        const next = new Set(selectedIds);
                        if (v) next.add(l.id); else next.delete(l.id);
                        setSelectedIds(next);
                      }}
                    />
                  </td>
                  <td className="p-3 font-medium text-foreground truncate">{l.title}</td>
                  <td className="p-3 text-muted-foreground truncate">{(l as any)._categoryNames?.join(", ") || "—"}</td>
                  <td className="p-3 text-muted-foreground truncate">{l.location ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{l.is_featured ? "Yes" : "No"}</td>
                  <td className="p-3 flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this listing?")) { supabase.from("listings").delete().eq("id", l.id).then(() => { qc.invalidateQueries({ queryKey: ["admin-listings"] }); toast.success("Listing deleted"); }); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
              {filteredListings.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No listings found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminListings;
