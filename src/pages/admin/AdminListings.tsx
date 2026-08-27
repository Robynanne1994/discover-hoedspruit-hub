import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isShoppingCategory, isAccommodationCategory, isNGOCategory, isTradesCategory, isHomeGardenCategory, isWeddingsEventsCategory, isWellnessBeautyCategory } from "@/lib/categoryFields";
import { toast } from "sonner";
import { normalizeGooglePlaceId, placeIdImportUpdate } from "@/lib/googlePlaceId";
import { Plus, Pencil, Trash2, FileSpreadsheet, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate, useSearchParams } from "react-router-dom";
import ImageSlotField from "@/components/admin/ImageSlotField";
import { LISTING_IMAGE_SLOTS } from "@/lib/listingImageSlots";
import {
  ADMIN_EDITOR_DIALOG,
  ADMIN_FIELD_GRID,
  ADMIN_IMAGE_GRID,
  ADMIN_PICKER_LIST,
  ADMIN_TOGGLE_GRID,
} from "@/lib/adminEditorLayout";
import GalleryUpload from "@/components/admin/GalleryUpload";
import TriStateToggle from "@/components/admin/TriStateToggle";
import MultiContactField from "@/components/admin/MultiContactField";
import IncludedChipsInput from "@/components/admin/IncludedChipsInput";

import { sanitizeContactArray } from "@/lib/contacts";
import { parseAdditionalHours } from "@/lib/openHours";
import { formatServiceLabel } from "@/lib/serviceLabels";
import { DISPLAY_SECTIONS, sectionsForGroup, type DisplayMode, type SectionGroup, DISPLAY_DEFAULTS_SECTION } from "@/lib/detailsDisplayModes";
import { DetailsDisplayModeEditor, DetailsDisplayDefaultsEditor } from "@/components/admin/DetailsDisplayModeEditor";
import MarkdownToolbar from "@/components/admin/MarkdownToolbar";

type Listing = Tables<"listings">;

const DAY_LABELS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// An extra, named set of opening hours. Almost no listing needs one; the ones
// that do trade on two clocks under a single roof — Sleepers' kitchen closes at
// 21:00 while the bar carries on to midnight — and a single Opening Hours block
// can only tell one of those two stories.
type HoursSetForm = { label: string; hours: Record<string, string> };

const emptyHoursSet = (): HoursSetForm => ({ label: "", hours: Object.fromEntries(DAY_LABELS.map((d) => [d, ""])) });

// Drop the days left blank, and the whole set when nothing was filled in — an
// empty extra block is an abandoned edit, not hours to publish. Unnamed sets
// still save: the app falls back to "Hours 2", "Hours 3" so they never render
// nameless.
// What the editor was holding for a column the database turned away, so the
// warning only fires when something typed in actually failed to save.
const valuesForColumn = (values: typeof emptyForm, column: string): unknown => {
  if (column === "opening_hours_label") return values.opening_hours_label;
  if (column === "additional_hours") return cleanHoursSets(values.additional_hours ?? []);
  return (values as unknown as Record<string, unknown>)[column];
};

const cleanHoursSets = (sets: HoursSetForm[]): HoursSetForm[] =>
  sets
    .map((set) => ({
      label: (set.label || "").trim(),
      hours: Object.fromEntries(
        DAY_LABELS.map((d) => [d, (set.hours?.[d] || "").trim()]).filter(([, v]) => v),
      ) as Record<string, string>,
    }))
    .filter((set) => Object.keys(set.hours).length > 0)
    .map((set, i) => ({ label: set.label || `Hours ${i + 2}`, hours: set.hours }));

const MEAL_OPTIONS = ["Breakfast", "Lunch", "Dinner", "Brunch", "Pub Grub", "Snacks", "Light Meals"];
const VIBE_OPTIONS = ["Casual", "Social", "Fancy", "Scenic", "Romantic", "Hidden Gem", "Late Nights", "Good for Remote Work", "Cosy", "Rustic", "Lively", "Bushveld Feel", "Local Favourite", "Instagrammable", "Quiet Space"];
const CUISINE_OPTIONS = ["Italian", "Indian", "Mexican", "Asian", "Local", "Vegan", "Vegetarian", "Healthy Eats"];
const FOODS_OPTIONS = ["Burgers", "Pizzas", "Seafood", "Sushi", "Grill", "Ribs", "Steaks", "Tapas", "Pasta", "Baked Goods", "Desserts", "Fast Food", "Gelato", "Wraps", "Salads", "Chicken", "Sandwiches"];
const SEATING_OPTIONS = ["Indoor", "Outdoor", "Bar"];
const SERVICE_TYPE_OPTIONS = ["Sit Down", "Takeaway", "Delivery"];
const PAYMENT_METHOD_OPTIONS = ["Cash", "Card", "EFT", "Account"];
const SHOP_TYPE_OPTIONS = ["Shopping Centre", "Curios & Gifts", "General Store", "Boutique", "Hardware", "Grocery", "Clothing", "Electronics", "Pharmacy", "Pet Shop", "Stationery Shop", "Other"];
const ACCOMMODATION_PRICE_RANGE_OPTIONS = ["Budget", "Mid-range", "Luxury"];
const PROPERTY_TYPE_OPTIONS = ["Lodge", "Hotel", "Guest House", "Bed & Breakfast", "Self-Catering", "Villa", "Cottage", "Chalet", "Apartment", "Camping", "Glamping", "Bush Camp", "Backpackers", "Farm Stay", "Other"];

const SERVICES_OFFERED_OPTIONS = ["Nursery", "Landscaping", "Garden maintenance", "Irrigation", "Tree felling/pruning", "Bush Clearing", "Swimming Pool Services", "Interior design", "Upholstery", "Equipment rental", "Equipment servicing/repairs"];
const HG_SERVICES_SECTION = "home_garden_services";
const PLANT_TYPES_OPTIONS = ["Indigenous", "Water-wise", "Exotic", "Trees", "Succulents", "Veggies & Herbs", "Pot plants"];

const EVENT_TYPES_OPTIONS = ["Weddings", "Corporate", "Birthdays", "Private functions", "Conferences", "Baby showers", "Kids parties", "Fundraisers", "Festivals"];
const WEDDINGS_EVENT_TYPES_SECTION = "weddings_event_types";

const VENUE_STYLE_TAG_OPTIONS = ["Rustic", "Modern", "Classic", "Boho", "Safari", "Minimalist", "Vintage", "Romantic"];
const VENUE_SETTING_OPTIONS = ["Bush", "Garden", "Riverside", "Farm", "Town", "Lodge"];
const VENUE_INDOOR_OUTDOOR_OPTIONS = ["Indoor", "Outdoor", "Both"];

const emptyForm = { treatments: [] as string[], avg_price_per_person_per_night: "" as string, avg_price_per_couple_per_night: "" as string, rooms_count: null as number | null, star_rating: null as number | null, property_type: "" as string, drive_through: null as boolean | null, title: "", title_override: "" as string, card_primary_subcategory: "" as string, description: "", image_url: "", detail_image_url: "", saved_image_url: "", card_image_url: "", homepage_image_url: "", search_image_url: "", location: "", phone: "", phone_label: "" as string, email: "", email_label: "" as string, website: "", website_label: "" as string, additional_websites: [] as string[], additional_website_labels: [] as string[], action_phone_index: 0 as number, action_email_index: 0 as number, action_whatsapp_index: 0 as number, action_website_index: 0 as number, facebook: "" as string, instagram: "" as string, whatsapp: "", whatsapp_label: "" as string, additional_emails: [] as string[], additional_email_labels: [] as string[], additional_phones: [] as string[], additional_phone_labels: [] as string[], additional_whatsapps: [] as string[], additional_whatsapp_labels: [] as string[], google_maps_link: "", google_rating: null as number | null, google_reviews_count: null as number | null, google_reviews_url: "", google_place_id: "" as string, is_featured: false, long_description: "", good_to_know: [] as string[], gallery_images: "" as string, opening_hours: Object.fromEntries(DAY_LABELS.map((d) => [d, ""])) as Record<string, string>, opening_hours_label: "" as string, additional_hours: [] as HoursSetForm[], good_for_kids: null as boolean | null, pets_allowed: null as boolean | null, wheelchair_friendly: null as boolean | null, price_level: null as number | null, show_attributes: false, meal: [] as string[], vibe: [] as string[], cuisine: [] as string[], foods: [] as string[], seating: [] as string[], kids_playground: null as boolean | null, smoking_allowed: null as boolean | null, service_type: [] as string[], kids_menu: null as boolean | null, high_chairs: null as boolean | null, nappy_changing_station: null as boolean | null, wheelchair_car_park: null as boolean | null, wheelchair_entrance: null as boolean | null, wheelchair_seating: null as boolean | null, wheelchair_toilet: null as boolean | null, has_toilet: null as boolean | null, has_wifi: null as boolean | null, has_free_wifi: null as boolean | null, has_wine_list: null as boolean | null, has_cocktails: null as boolean | null, has_craft_beer: null as boolean | null, has_smoothies: null as boolean | null, has_coffee: null as boolean | null, has_champagne: null as boolean | null, has_milkshakes: null as boolean | null, has_mocktails: null as boolean | null, has_beers_ciders: null as boolean | null, has_iced_coffee: null as boolean | null, air_conditioned: null as boolean | null, payment_methods: [] as string[], delivery_available: null as boolean | null, order_online: null as boolean | null, parking_available: null as boolean | null, local_products: null as boolean | null, shop_type: "" as string, curio_or_gifts: null as boolean | null, product_categories: "" as string, price_range: "" as string, amenities: [] as string[], sleeps: null as number | null, sleeps_children: null as number | null, km_from_town: "" as string, has_restaurant: null as boolean | null, has_bar: null as boolean | null, has_room_service: null as boolean | null, has_breakfast: null as boolean | null, breakfast_included: null as boolean | null, has_swimming_pool: null as boolean | null, has_laundry: null as boolean | null, child_friendly: null as boolean | null, has_spa: null as boolean | null, has_fitness_centre: null as boolean | null, has_airport_shuttle: null as boolean | null, airport_shuttle_free: null as boolean | null, has_aircon: null as boolean | null, has_wifi_accom: null as boolean | null, has_free_parking: null as boolean | null, has_secure_parking: null as boolean | null, is_franchise: null as boolean | null, custom_title_1: "" as string, custom_text_1: "" as string, custom_title_2: "" as string, custom_text_2: "" as string, custom_title_3: "" as string, custom_text_3: "" as string, cause: "" as string, impact: "" as string, ways_to_give: "" as string, volunteering: "" as string, visiting: "" as string, business_started_year: null as number | null, after_hours_available: null as boolean | null, callout_fee: null as boolean | null, specialities: "" as string, services_offered: [] as string[], plant_types: [] as string[], event_types: [] as string[], venue_onsite_accommodation: null as boolean | null, venue_accommodation_sleeps: null as number | null, venue_guest_capacity: null as number | null, venue_indoor_outdoor: "" as string, venue_style_tags: [] as string[], venue_setting_types: [] as string[], details_display_mode: {} as Record<string, DisplayMode | "default"> };

const TreatmentsEditor = ({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) => {
  const items = Array.isArray(value) ? value : [];
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...items, t]);
    setDraft("");
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const edit = (i: number, v: string) => onChange(items.map((it, idx) => (idx === i ? v : it)));
  return (
    <div className="space-y-2 mt-1">
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((t, i) => (
            <div key={i} className="flex items-start gap-2">
              <Input value={t} onChange={(e) => edit(i, e.target.value)} />
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Remove treatment">
                <span aria-hidden>×</span>
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-start gap-2">
        <Input
          placeholder="e.g. Swedish massage"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); add(); }
          }}
        />
        <Button type="button" variant="outline" onClick={add} disabled={!draft.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
};

const AdminListings = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  // Card label chosen per category (category_id -> label). Lets a listing that
  // belongs to several categories show a different eyebrow on each category page.
  const [catCardLabels, setCatCardLabels] = useState<Record<string, string>>({});
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [selectedSubSubIds, setSelectedSubSubIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customRowsVisible, setCustomRowsVisible] = useState(0);
  const longDescRef = useRef<HTMLTextAreaElement>(null);
  const [newCatName, setNewCatName] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubParent, setNewSubParent] = useState<string>("");
  const [showNewSub, setShowNewSub] = useState(false);
  const [newSubSubName, setNewSubSubName] = useState("");
  const [newSubSubParent, setNewSubSubParent] = useState<string>("");
  const [showNewSubSub, setShowNewSubSub] = useState(false);
  const [customChipOption, setCustomChipOption] = useState<Record<string, string>>({});
  const [customShopTypes, setCustomShopTypes] = useState<string[]>([]);
  const [newShopType, setNewShopType] = useState("");
  const [newServiceInput, setNewServiceInput] = useState("");
  const [newEventTypeInput, setNewEventTypeInput] = useState("");

  /**
   * Add a shop type from the form itself: it joins the dropdown's options and
   * becomes this listing's type in one action. Typing one that already exists
   * just selects it rather than adding a near-duplicate.
   */
  const addShopType = (existing: string[]) => {
    const trimmed = newShopType.trim();
    if (!trimmed) return;
    const match = existing.find((o) => o.toLowerCase() === trimmed.toLowerCase());
    if (!match) setCustomShopTypes((prev) => Array.from(new Set([...prev, trimmed])));
    setForm((f) => ({ ...f, shop_type: match ?? trimmed }));
    setNewShopType("");
  };

  // Custom (admin-added) Home & Garden services, persisted in site_content
  const { data: customHGServices } = useQuery({
    queryKey: ["hg-custom-services"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", HG_SERVICES_SECTION)
        .maybeSingle();
      const items = (data?.content as any)?.items;
      return Array.isArray(items) ? (items as string[]) : [];
    },
  });

  const addHGServiceMutation = useMutation({
    mutationFn: async (label: string) => {
      const trimmed = label.trim();
      if (!trimmed) throw new Error("Empty");
      const existing = [...SERVICES_OFFERED_OPTIONS, ...(customHGServices ?? [])];
      if (existing.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
        throw new Error("This service is already in the list.");
      }
      const next = [...(customHGServices ?? []), trimmed];
      const { data: row } = await supabase
        .from("site_content")
        .select("id")
        .eq("section", HG_SERVICES_SECTION)
        .maybeSingle();
      if (row?.id) {
        const { error } = await supabase
          .from("site_content")
          .update({ content: { items: next } })
          .eq("section", HG_SERVICES_SECTION);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_content")
          .insert({ section: HG_SERVICES_SECTION, content: { items: next } });
        if (error) throw error;
      }
      return trimmed;
    },
    onSuccess: (label) => {
      qc.invalidateQueries({ queryKey: ["hg-custom-services"] });
      setForm((f) => ({ ...f, services_offered: f.services_offered.includes(label) ? f.services_offered : [...f.services_offered, label] }));
      setNewServiceInput("");
      toast.success("Service added");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not add service"),
  });

  // Custom (admin-added) Weddings & Events event types, persisted in site_content
  const { data: customEventTypes } = useQuery({
    queryKey: ["weddings-custom-event-types"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", WEDDINGS_EVENT_TYPES_SECTION)
        .maybeSingle();
      const items = (data?.content as any)?.items;
      return Array.isArray(items) ? (items as string[]) : [];
    },
  });

  const addEventTypeMutation = useMutation({
    mutationFn: async (label: string) => {
      const trimmed = label.trim();
      if (!trimmed) throw new Error("Empty");
      const existing = [...EVENT_TYPES_OPTIONS, ...(customEventTypes ?? [])];
      if (existing.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
        throw new Error("This event type is already in the list.");
      }
      const next = [...(customEventTypes ?? []), trimmed];
      const { data: row } = await supabase
        .from("site_content")
        .select("id")
        .eq("section", WEDDINGS_EVENT_TYPES_SECTION)
        .maybeSingle();
      if (row?.id) {
        const { error } = await supabase
          .from("site_content")
          .update({ content: { items: next } })
          .eq("section", WEDDINGS_EVENT_TYPES_SECTION);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_content")
          .insert({ section: WEDDINGS_EVENT_TYPES_SECTION, content: { items: next } });
        if (error) throw error;
      }
      return trimmed;
    },
    onSuccess: (label) => {
      qc.invalidateQueries({ queryKey: ["weddings-custom-event-types"] });
      setForm((f) => ({ ...f, event_types: f.event_types.includes(label) ? f.event_types : [...f.event_types, label] }));
      setNewEventTypeInput("");
      toast.success("Event type added");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not add event type"),
  });




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

  const { data: subSubcategories } = useQuery({
    queryKey: ["admin-sub-subcategories-select"],
    queryFn: async () => {
      const { data } = await supabase.from("sub_subcategories").select("id, title, subcategory_id").order("sort_order");
      return data ?? [];
    },
  });

  // Distinct values used across listings for free-form chip fields
  const { data: distinctChipValues } = useQuery({
    queryKey: ["admin-distinct-chip-values"],
    queryFn: async () => {
      const { data } = await supabase.from("listings").select("meal, vibe, cuisine, foods, seating, service_type");
      const collect = (key: string) => {
        const s = new Set<string>();
        (data ?? []).forEach((row: any) => (row[key] ?? []).forEach((v: string) => v && s.add(v)));
        return Array.from(s);
      };
      return {
        meal: collect("meal"),
        vibe: collect("vibe"),
        cuisine: collect("cuisine"),
        foods: collect("foods"),
        seating: collect("seating"),
        service_type: collect("service_type"),
      } as Record<string, string[]>;
    },
  });

  // Property types are free-form: suggest the presets plus anything already used,
  // grouped case-insensitively so "lodge" snaps to an existing "Lodge".
  const propertyTypeSuggestions = useMemo(() => {
    const seen = new Map<string, string>();
    [...PROPERTY_TYPE_OPTIONS, ...((listings ?? []) as any[]).map((l) => l.property_type)]
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean)
      .forEach((v) => { if (!seen.has(v.toLowerCase())) seen.set(v.toLowerCase(), v); });
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
  }, [listings]);


  // Fetch listing_categories for the editing listing, along with the per-category
  // card label. The label column may not exist yet (migration not applied), so
  // fall back to the plain category list rather than failing the edit dialog.
  const { data: editingCatRows } = useQuery({
    queryKey: ["listing-categories", editing?.id],
    queryFn: async () => {
      const withLabels = await supabase
        .from("listing_categories")
        .select("category_id, card_primary_subcategory")
        .eq("listing_id", editing!.id);
      if (!withLabels.error) return withLabels.data as any[];
      const { data, error } = await supabase
        .from("listing_categories")
        .select("category_id")
        .eq("listing_id", editing!.id);
      if (error) throw error;
      return data as any[];
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

  // Fetch listing_sub_subcategories for the editing listing
  const { data: editingSubSubIds } = useQuery({
    queryKey: ["listing-sub-subcategories", editing?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listing_sub_subcategories")
        .select("sub_subcategory_id")
        .eq("listing_id", editing!.id);
      if (error) throw error;
      return data.map((r: any) => r.sub_subcategory_id as string);
    },
    enabled: !!editing,
  });

  useEffect(() => {
    if (!editingCatRows) return;
    setSelectedCatIds(editingCatRows.map((r: any) => r.category_id as string));
    const labels: Record<string, string> = {};
    editingCatRows.forEach((r: any) => {
      const label = (r.card_primary_subcategory || "").trim();
      if (label) labels[r.category_id as string] = label;
    });
    setCatCardLabels(labels);
  }, [editingCatRows]);

  useEffect(() => {
    if (editingSubIds) setSelectedSubIds(editingSubIds);
  }, [editingSubIds]);

  useEffect(() => {
    if (editingSubSubIds) setSelectedSubSubIds(editingSubSubIds);
  }, [editingSubSubIds]);

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
        title_override: values.title_override?.trim() || null,
        // Legacy listing-wide label, kept in sync with the first selected
        // category's choice so non-category surfaces still have a sensible value.
        card_primary_subcategory:
          (selectedCatIds.length > 0
            ? catCardLabels[selectedCatIds[0]] || ""
            : values.card_primary_subcategory || ""
          ).trim() || null,
        description: null,
        // The individual page image is the one every other surface falls back
        // to, so it also feeds `image_url` — the column those fallback chains
        // read. The rest write only their own column: an empty one means
        // "use the fallback", not "copy the hero in and crop it again".
        image_url: (values.detail_image_url || values.image_url) || null,
        detail_image_url: (values.detail_image_url || values.image_url) || null,
        card_image_url: (values.card_image_url || "").trim() || null,
        homepage_image_url: (values.homepage_image_url || "").trim() || null,
        saved_image_url: (values.saved_image_url || "").trim() || null,
        search_image_url: (values.search_image_url || "").trim() || null,
        location: values.location || null,
        phone: values.phone || null,
        phone_label: (values.phone_label || "").trim() || null,
        email: values.email || null,
        email_label: (values.email_label || "").trim() || null,
        website: values.website || null,
        website_label: (values.website_label || "").trim() || null,
        additional_websites: sanitizeContactArray(values.additional_websites),
        additional_website_labels: (values.additional_website_labels || []).map((s: string) => (s || "").trim()),
        
        
        
        
        
        facebook: values.facebook || null,
        instagram: values.instagram || null,
        whatsapp: values.whatsapp || null,
        whatsapp_label: (values.whatsapp_label || "").trim() || null,
        additional_emails: sanitizeContactArray(values.additional_emails),
        additional_email_labels: (values.additional_email_labels || []).map((s: string) => (s || "").trim()),
        additional_phones: sanitizeContactArray(values.additional_phones),
        additional_phone_labels: (values.additional_phone_labels || []).map((s: string) => (s || "").trim()),
        additional_whatsapps: sanitizeContactArray(values.additional_whatsapps),
        additional_whatsapp_labels: (values.additional_whatsapp_labels || []).map((s: string) => (s || "").trim()),
          google_maps_link: values.google_maps_link || null,
          google_rating: values.google_rating,
          google_reviews_count: values.google_reviews_count,
          google_reviews_url: values.google_reviews_url || null,
          // Same reading as the CSV column: a Place ID typed here has to fix up
          // the sync bookkeeping around it, or the refresh never picks it up.
          ...(() => {
            const raw = (values.google_place_id || "").trim();
            if (raw === "" || raw === "-") return placeIdImportUpdate(null, editing as any);
            const id = normalizeGooglePlaceId(raw);
            if (!id) throw new Error("That Google Place ID doesn't look valid — paste the ID itself or a Google Maps link containing place_id=");
            return placeIdImportUpdate(id, editing as any);
          })(),
          category_id: selectedCatIds[0] || null, // keep legacy field in sync
        is_featured: values.is_featured,
        long_description: values.long_description || null,
        good_to_know: (values.good_to_know ?? []).map((s: string) => (s || "").trim()).filter(Boolean),
        gallery_images: galleryArr,
        opening_hours: values.opening_hours,
        opening_hours_label: (values.opening_hours_label || "").trim() || null,
        additional_hours: (() => {
          const sets = cleanHoursSets(values.additional_hours ?? []);
          return sets.length ? sets : null;
        })(),
        good_for_kids: values.good_for_kids,
        pets_allowed: values.pets_allowed,
        wheelchair_friendly: values.wheelchair_friendly,
        price_level: values.price_level,
        show_attributes: true,
        meal: values.meal,
        vibe: values.vibe,
        cuisine: values.cuisine,
        foods: values.foods,
        seating: values.seating,
        kids_playground: values.kids_playground,
        smoking_allowed: values.smoking_allowed,
        service_type: values.service_type,
        kids_menu: values.kids_menu,
        high_chairs: values.high_chairs,
        nappy_changing_station: values.nappy_changing_station,
        wheelchair_car_park: values.wheelchair_car_park,
        wheelchair_entrance: values.wheelchair_entrance,
        wheelchair_seating: values.wheelchair_seating,
        wheelchair_toilet: values.wheelchair_toilet,
        has_toilet: values.has_toilet,
        has_wifi: values.has_wifi,
        drive_through: values.drive_through,
        has_free_wifi: values.has_free_wifi,
        has_wine_list: values.has_wine_list,
        has_cocktails: values.has_cocktails,
        has_craft_beer: values.has_craft_beer,
        has_smoothies: values.has_smoothies,
        has_coffee: values.has_coffee,
        has_champagne: values.has_champagne,
        has_milkshakes: values.has_milkshakes,
        has_mocktails: values.has_mocktails,
        has_beers_ciders: values.has_beers_ciders,
        has_iced_coffee: values.has_iced_coffee,
        air_conditioned: values.air_conditioned,
        payment_methods: values.payment_methods,
        delivery_available: values.delivery_available,
        
        order_online: values.order_online,
        parking_available: values.parking_available,
        local_products: values.local_products,
        shop_type: values.shop_type || null,
        curio_or_gifts: values.curio_or_gifts,
        product_categories: values.product_categories ? values.product_categories.split(",").map(s => s.trim()).filter(Boolean) : [],
        price_range: values.price_range || null,
        amenities: values.amenities,
        sleeps: values.sleeps,
        sleeps_children: values.sleeps_children,
        km_from_town: values.km_from_town || null,
        avg_price_per_person_per_night: values.avg_price_per_person_per_night?.trim() || null,
        avg_price_per_couple_per_night: values.avg_price_per_couple_per_night?.trim() || null,
        rooms_count: values.rooms_count,
        star_rating: values.star_rating,
        property_type: values.property_type || null,
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
        airport_shuttle_free: values.airport_shuttle_free,
        has_aircon: values.has_aircon,
        has_wifi_accom: values.has_wifi_accom,
        has_free_parking: values.has_free_parking,
        has_secure_parking: values.has_secure_parking,
        is_franchise: values.is_franchise,
        custom_title_1: values.custom_title_1?.trim() || null,
        custom_text_1: values.custom_text_1?.trim() || null,
        custom_title_2: values.custom_title_2?.trim() || null,
        custom_text_2: values.custom_text_2?.trim() || null,
        custom_title_3: values.custom_title_3?.trim() || null,
        custom_text_3: values.custom_text_3?.trim() || null,
        cause: values.cause?.trim() || null,
        impact: values.impact?.trim() || null,
        ways_to_give: values.ways_to_give?.trim() || null,
        volunteering: values.volunteering?.trim() || null,
        visiting: values.visiting?.trim() || null,
        business_started_year: values.business_started_year,
        after_hours_available: values.after_hours_available,
        callout_fee: values.callout_fee,
        specialities: values.specialities?.trim() || null,
        services_offered: values.services_offered ?? [],
        plant_types: (values.services_offered ?? []).includes("Nursery") ? (values.plant_types ?? []) : [],
        event_types: values.event_types ?? [],
        venue_onsite_accommodation: values.venue_onsite_accommodation,
        venue_accommodation_sleeps: values.venue_onsite_accommodation === true ? values.venue_accommodation_sleeps : null,
        venue_guest_capacity: values.venue_guest_capacity,
        venue_indoor_outdoor: values.venue_indoor_outdoor?.trim() || null,
        venue_style_tags: values.venue_style_tags ?? [],
        venue_setting_types: values.venue_setting_types ?? [],
        treatments: values.treatments ?? [],
        details_display_mode: values.details_display_mode ?? {},
      };

      // Treat "-" as empty for any string field on save
      for (const k of Object.keys(payload)) {
        const v = (payload as any)[k];
        if (typeof v === "string" && v.trim() === "-") {
          (payload as any)[k] = null;
        }
      }

      const save = async (p: any): Promise<string> => {
        if (editing) {
          const { error } = await supabase.from("listings").update(p).eq("id", editing.id);
          if (error) throw error;
          return editing.id;
        }
        const { data, error } = await supabase.from("listings").insert(p).select("id").single();
        if (error) throw error;
        return data.id;
      };
      // PGRST204: a payload column is missing from the API schema cache (e.g. a
      // migration not applied yet). Drop that column and retry so the rest of the
      // listing still saves — once per missing column, since a single migration
      // can add several (opening_hours_label and additional_hours arrived
      // together) and stopping after the first would still fail the save.
      const droppedColumns: string[] = [];
      let listingId: string | undefined;
      for (;;) {
        try {
          listingId = await save(payload);
          break;
        } catch (e: any) {
          const missing = e?.code === "PGRST204" ? /'(\w+)' column/.exec(e?.message ?? "")?.[1] : undefined;
          if (!missing || !(missing in payload)) throw e;
          delete payload[missing];
          droppedColumns.push(missing);
        }
      }
      // Saving without a column silently loses whatever was typed into it, so
      // say so — but only when there was something to lose.
      const droppedWithValues = droppedColumns.filter((c) => {
        const v = valuesForColumn(values, c);
        return Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== "";
      });
      if (droppedWithValues.length > 0) {
        toast.warning(
          `Saved, but ${droppedWithValues.join(", ")} could not be stored — the database is missing those columns. Run the latest migration and save again.`,
        );
      }

      // Sync categories junction, carrying the per-category card label
      await supabase.from("listing_categories").delete().eq("listing_id", listingId);
      if (selectedCatIds.length > 0) {
        const rows = selectedCatIds.map((catId) => ({
          listing_id: listingId,
          category_id: catId,
          card_primary_subcategory: (catCardLabels[catId] || "").trim() || null,
        }));
        const { error: catErr } = await supabase.from("listing_categories").insert(rows as any);
        if (catErr) {
          // Label column missing from the API schema cache — save the categories
          // themselves so the rest of the listing isn't blocked.
          const missingLabelColumn =
            catErr.code === "PGRST204" || /card_primary_subcategory/.test(catErr.message ?? "");
          if (!missingLabelColumn) throw catErr;
          const { error: retryErr } = await supabase
            .from("listing_categories")
            .insert(rows.map(({ card_primary_subcategory, ...rest }) => rest));
          if (retryErr) throw retryErr;
        }
      }

      // Auto-include parent subcategories for any selected sub-subcategories
      // (sub-subcategories are refinements of their parent subcategory)
      const ssParentSubIds = (subSubcategories ?? [])
        .filter((ss: any) => selectedSubSubIds.includes(ss.id))
        .map((ss: any) => ss.subcategory_id as string);
      const effectiveSubIds = Array.from(new Set([...selectedSubIds, ...ssParentSubIds]));

      // Sync subcategories
      await supabase.from("listing_subcategories").delete().eq("listing_id", listingId);
      if (effectiveSubIds.length > 0) {
        const rows = effectiveSubIds.map((subId) => ({ listing_id: listingId, subcategory_id: subId }));
        const { error: subErr } = await supabase.from("listing_subcategories").insert(rows);
        if (subErr) throw subErr;
      }

      // Sync sub-subcategories
      await supabase.from("listing_sub_subcategories").delete().eq("listing_id", listingId);
      if (selectedSubSubIds.length > 0) {
        const rows = selectedSubSubIds.map((ssId) => ({ listing_id: listingId, sub_subcategory_id: ssId }));
        const { error: ssErr } = await supabase.from("listing_sub_subcategories").insert(rows);
        if (ssErr) throw ssErr;
      }

    },
    onSuccess: () => {
      // Refresh every cached read, not just the admin table: the same listing
      // (and its new images) is painted by the home rows, category pages,
      // search, saved cards and detail page, each under its own query key.
      qc.invalidateQueries();

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

  const resetForm = () => { setForm(emptyForm); setEditing(null); setSelectedCatIds([]); setCatCardLabels({}); setSelectedSubIds([]); setSelectedSubSubIds([]); setCustomRowsVisible(0); setOpen(false); };

  /**
   * Close without saving — the same path the dialog's own dismiss takes, so a
   * listing opened from another screen still returns there.
   */
  const closeEditor = () => {
    const ret = returnTo;
    resetForm();
    if (ret) {
      setReturnTo(null);
      navigate(ret, { replace: true });
    }
    setOpen(false);
  };

  const openEdit = (l: Listing) => {
    setEditing(l);
    const hours = l.opening_hours as Record<string, string> | null;
    const gallery = l.gallery_images as string[] | null;
    setForm({
      title: l.title,
      title_override: (l as any).title_override ?? "",
      card_primary_subcategory: (l as any).card_primary_subcategory ?? "",
      description: l.description ?? "",
      image_url: l.image_url ?? "",
      detail_image_url: (l as any).detail_image_url ?? "",
      saved_image_url: (l as any).saved_image_url ?? "",
      card_image_url: (l as any).card_image_url ?? "",
      homepage_image_url: (l as any).homepage_image_url ?? "",
      search_image_url: (l as any).search_image_url ?? "",
      location: l.location ?? "",
      phone: l.phone ?? "",
      phone_label: (l as any).phone_label ?? "",
      email: l.email ?? "",
      email_label: (l as any).email_label ?? "",
      website: l.website ?? "",
      website_label: (l as any).website_label ?? "",
      additional_websites: ((l as any).additional_websites ?? []) as string[],
      additional_website_labels: ((l as any).additional_website_labels ?? []) as string[],
      action_phone_index: (l as any).action_phone_index ?? 0,
      action_email_index: (l as any).action_email_index ?? 0,
      action_whatsapp_index: (l as any).action_whatsapp_index ?? 0,
      action_website_index: (l as any).action_website_index ?? 0,

      
      facebook: (l as any).facebook ?? "",
      instagram: (l as any).instagram ?? "",
      whatsapp: (l as any).whatsapp ?? "",
      whatsapp_label: (l as any).whatsapp_label ?? "",
      additional_emails: ((l as any).additional_emails ?? []) as string[],
      additional_email_labels: ((l as any).additional_email_labels ?? []) as string[],
      additional_phones: ((l as any).additional_phones ?? []) as string[],
      additional_phone_labels: ((l as any).additional_phone_labels ?? []) as string[],
      additional_whatsapps: ((l as any).additional_whatsapps ?? []) as string[],
      additional_whatsapp_labels: ((l as any).additional_whatsapp_labels ?? []) as string[],
      google_maps_link: (l as any).google_maps_link ?? "",
      google_rating: (l as any).google_rating ?? null,
      google_reviews_count: (l as any).google_reviews_count ?? null,
      google_reviews_url: (l as any).google_reviews_url ?? "",
      google_place_id: (l as any).google_place_id ?? "",
      is_featured: l.is_featured,
      long_description: l.long_description ?? "",
      good_to_know: (l as any).good_to_know ?? [],
      gallery_images: gallery?.join("\n") ?? "",
      opening_hours: { ...Object.fromEntries(DAY_LABELS.map((d) => [d, ""])), ...hours },
      opening_hours_label: l.opening_hours_label ?? "",
      // Every stored set is padded back out to all seven days so the editor
      // shows the same seven rows the primary block does.
      additional_hours: parseAdditionalHours(l.additional_hours).map((set) => ({
        label: set.label,
        hours: { ...Object.fromEntries(DAY_LABELS.map((d) => [d, ""])), ...set.hours },
      })),
      good_for_kids: l.good_for_kids ?? null,
      pets_allowed: l.pets_allowed ?? null,
      wheelchair_friendly: l.wheelchair_friendly ?? null,
      price_level: l.price_level ?? null,
      show_attributes: l.show_attributes ?? false,
      meal: (l as any).meal ?? [],
      vibe: (l as any).vibe ?? [],
      cuisine: (l as any).cuisine ?? [],
      foods: (l as any).foods ?? [],
      seating: (l as any).seating ?? [],
      kids_playground: (l as any).kids_playground ?? null,
      smoking_allowed: (l as any).smoking_allowed ?? null,
      service_type: (l as any).service_type ?? [],
      kids_menu: (l as any).kids_menu ?? null,
      high_chairs: (l as any).high_chairs ?? null,
      nappy_changing_station: (l as any).nappy_changing_station ?? null,
      wheelchair_car_park: (l as any).wheelchair_car_park ?? null,
      wheelchair_entrance: (l as any).wheelchair_entrance ?? null,
      wheelchair_seating: (l as any).wheelchair_seating ?? null,
      wheelchair_toilet: (l as any).wheelchair_toilet ?? null,
      has_toilet: (l as any).has_toilet ?? null,
      has_wifi: (l as any).has_wifi ?? null,
      drive_through: (l as any).drive_through ?? null,
      has_free_wifi: (l as any).has_free_wifi ?? null,
      has_wine_list: (l as any).has_wine_list ?? null,
      has_cocktails: (l as any).has_cocktails ?? null,
      has_craft_beer: (l as any).has_craft_beer ?? null,
      has_smoothies: (l as any).has_smoothies ?? null,
      has_coffee: (l as any).has_coffee ?? null,
      has_champagne: (l as any).has_champagne ?? null,
      has_milkshakes: (l as any).has_milkshakes ?? null,
      has_mocktails: (l as any).has_mocktails ?? null,
      has_beers_ciders: (l as any).has_beers_ciders ?? null,
      has_iced_coffee: (l as any).has_iced_coffee ?? null,
      air_conditioned: (l as any).air_conditioned ?? null,
      payment_methods: (l as any).payment_methods ?? [],
      delivery_available: (l as any).delivery_available ?? null,
      
      order_online: (l as any).order_online ?? null,
      parking_available: (l as any).parking_available ?? null,
      local_products: (l as any).local_products ?? null,
      shop_type: (l as any).shop_type ?? "",
      curio_or_gifts: (l as any).curio_or_gifts ?? null,
      product_categories: ((l as any).product_categories ?? []).join(", "),
      price_range: (l as any).price_range ?? "",
      amenities: (l as any).amenities ?? [],
      sleeps: (l as any).sleeps ?? null,
      sleeps_children: (l as any).sleeps_children ?? null,
      km_from_town: (l as any).km_from_town ?? "",
      avg_price_per_person_per_night: (l as any).avg_price_per_person_per_night ?? "",
      avg_price_per_couple_per_night: (l as any).avg_price_per_couple_per_night ?? "",
      rooms_count: (l as any).rooms_count ?? null,
      star_rating: (l as any).star_rating ?? null,
      property_type: (l as any).property_type ?? "",
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
      airport_shuttle_free: (l as any).airport_shuttle_free ?? null,
      has_aircon: (l as any).has_aircon ?? null,
      has_wifi_accom: (l as any).has_wifi_accom ?? null,
      has_free_parking: (l as any).has_free_parking ?? null,
      has_secure_parking: (l as any).has_secure_parking ?? null,
      is_franchise: (l as any).is_franchise ?? null,
      custom_title_1: (l as any).custom_title_1 ?? "",
      custom_text_1: (l as any).custom_text_1 ?? "",
      custom_title_2: (l as any).custom_title_2 ?? "",
      custom_text_2: (l as any).custom_text_2 ?? "",
      custom_title_3: (l as any).custom_title_3 ?? "",
      custom_text_3: (l as any).custom_text_3 ?? "",
      cause: (l as any).cause ?? "",
      impact: (l as any).impact ?? "",
      ways_to_give: (l as any).ways_to_give ?? "",
      volunteering: (l as any).volunteering ?? "",
      visiting: (l as any).visiting ?? "",
      business_started_year: (l as any).business_started_year ?? null,
      after_hours_available: (l as any).after_hours_available ?? null,
      callout_fee: (l as any).callout_fee ?? null,
      specialities: (l as any).specialities ?? "",
      services_offered: (l as any).services_offered ?? [],
      plant_types: (l as any).plant_types ?? [],
      event_types: (l as any).event_types ?? [],
      venue_onsite_accommodation: (l as any).venue_onsite_accommodation ?? null,
      venue_accommodation_sleeps: (l as any).venue_accommodation_sleeps ?? null,
      treatments: (l as any).treatments ?? [],
      venue_guest_capacity: (l as any).venue_guest_capacity ?? null,
      venue_indoor_outdoor: (l as any).venue_indoor_outdoor ?? "",
      venue_style_tags: (l as any).venue_style_tags ?? [],
      venue_setting_types: (l as any).venue_setting_types ?? [],
      details_display_mode: ((l as any).details_display_mode ?? {}) as Record<string, DisplayMode | "default">,
    });
    const populatedCustom = [1, 2, 3].filter((n) => ((l as any)[`custom_title_${n}`] || (l as any)[`custom_text_${n}`])).length;
    setCustomRowsVisible(populatedCustom);
    setOpen(true);
  };

  const toggleCat = (catId: string) => {
    const removing = selectedCatIds.includes(catId);
    setSelectedCatIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
    // Drop the card label for a category that's no longer assigned
    if (removing) {
      setCatCardLabels((prev) => {
        if (!(catId in prev)) return prev;
        const { [catId]: _removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const toggleSub = (subId: string) => {
    setSelectedSubIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const addCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    const existing = categories?.find((c) => c.title.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!selectedCatIds.includes(existing.id)) toggleCat(existing.id);
      setNewCatName(""); setShowNewCat(false);
      toast.info("Category already exists — selected it");
      return;
    }
    const nextOrder = (categories?.length ?? 0);
    const { data, error } = await supabase.from("categories").insert({ title: name, icon: "Folder", sort_order: nextOrder }).select("id, title").single();
    if (error || !data) { toast.error(error?.message || "Failed to add category"); return; }
    await qc.invalidateQueries({ queryKey: ["admin-categories-select"] });
    setSelectedCatIds((prev) => [...prev, data.id]);
    setNewCatName(""); setShowNewCat(false);
    toast.success("Category added");
  };

  const addSubcategory = async () => {
    const name = newSubName.trim();
    const parentId = newSubParent || selectedCatIds[0];
    if (!name || !parentId) { toast.error("Pick a parent category"); return; }
    const existing = subcategories?.find((s) => s.category_id === parentId && s.title.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!selectedSubIds.includes(existing.id)) toggleSub(existing.id);
      setNewSubName(""); setNewSubParent(""); setShowNewSub(false);
      toast.info("Subcategory already exists — selected it");
      return;
    }
    const siblings = subcategories?.filter((s) => s.category_id === parentId) ?? [];
    const { data, error } = await supabase.from("subcategories").insert({ title: name, category_id: parentId, sort_order: siblings.length }).select("id, title, category_id").single();
    if (error || !data) { toast.error(error?.message || "Failed to add subcategory"); return; }
    await qc.invalidateQueries({ queryKey: ["admin-subcategories-select"] });
    setSelectedSubIds((prev) => [...prev, data.id]);
    setNewSubName(""); setNewSubParent(""); setShowNewSub(false);
    toast.success("Subcategory added");
  };

  const toggleSubSub = (id: string) => {
    setSelectedSubSubIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addSubSubcategory = async () => {
    const name = newSubSubName.trim();
    const parentId = newSubSubParent || selectedSubIds[0];
    if (!name || !parentId) { toast.error("Pick a parent subcategory"); return; }
    const existing = subSubcategories?.find((s) => s.subcategory_id === parentId && s.title.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!selectedSubSubIds.includes(existing.id)) toggleSubSub(existing.id);
      setNewSubSubName(""); setNewSubSubParent(""); setShowNewSubSub(false);
      toast.info("Sub-subcategory already exists — selected it");
      return;
    }
    const siblings = subSubcategories?.filter((s) => s.subcategory_id === parentId) ?? [];
    const { data, error } = await supabase.from("sub_subcategories").insert({ title: name, subcategory_id: parentId, sort_order: siblings.length }).select("id, title, subcategory_id").single();
    if (error || !data) { toast.error(error?.message || "Failed to add sub-subcategory"); return; }
    await qc.invalidateQueries({ queryKey: ["admin-sub-subcategories-select"] });
    setSelectedSubSubIds((prev) => [...prev, data.id]);
    setNewSubSubName(""); setNewSubSubParent(""); setShowNewSubSub(false);
    toast.success("Sub-subcategory added");
  };

  // Show subcategories for all selected categories
  const availableSubs = subcategories?.filter((s) => selectedCatIds.includes(s.category_id)) ?? [];
  const availableSubSubs = subSubcategories?.filter((s) => selectedSubIds.includes(s.subcategory_id)) ?? [];

  // Check if any selected category is a restaurant type
  const isRestaurantType = categories?.some((c) => selectedCatIds.includes(c.id) && /restaurant|caf[eé]/i.test(c.title));
  const isShoppingType = categories?.some((c) => selectedCatIds.includes(c.id) && isShoppingCategory(c.title));
  const isAccommodationType = categories?.some((c) => selectedCatIds.includes(c.id) && isAccommodationCategory(c.title));
  // Accommodation doesn't keep opening hours — a lodge doesn't shut at five.
  // But a lodge that is *also* a restaurant does, and hiding the hours editor
  // on it left the kitchen with nowhere to be typed in at all.
  const selectedCatTitles = (categories ?? []).filter((c) => selectedCatIds.includes(c.id)).map((c) => c.title);
  const isAccommodationOnly = selectedCatTitles.length > 0 && selectedCatTitles.every((t) => isAccommodationCategory(t));
  const isNGOType = categories?.some((c) => selectedCatIds.includes(c.id) && isNGOCategory(c.title));
  const isTradesType = categories?.some((c) => selectedCatIds.includes(c.id) && isTradesCategory(c.title));
  const isHomeGardenType = categories?.some((c) => selectedCatIds.includes(c.id) && isHomeGardenCategory(c.title));
  const isWeddingsEventsType = categories?.some((c) => selectedCatIds.includes(c.id) && isWeddingsEventsCategory(c.title));
  const isWellnessBeautyType = categories?.some((c) => selectedCatIds.includes(c.id) && isWellnessBeautyCategory(c.title));
  const isEventVenueSub = subcategories?.some((s) => selectedSubIds.includes(s.id) && /event\s*venue/i.test(s.title)) ?? false;

  const filteredListings = (listings ?? []).filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return l.title.toLowerCase().includes(q) || (l.location ?? "").toLowerCase().includes(q) || ((l as any)._categoryNames ?? []).some((n: string) => n.toLowerCase().includes(q));
  });

  return (
    <div className="font-normal">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 lg:mb-8">
        <h1 className="font-heading text-2xl lg:text-3xl font-[550] text-slate-950">Listings</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2 bg-gray-400 text-slate-50 opacity-100 border-slate-950" onClick={() => navigate("/admin/import")}>
            <FileSpreadsheet className="h-4 w-4" /> <span className="hidden sm:inline">Import/Export CSV</span><span className="sm:hidden">CSV</span>
          </Button>
          <Dialog open={open} onOpenChange={(v) => { if (!v) { const ret = returnTo; resetForm(); if (ret) { setReturnTo(null); navigate(ret, { replace: true }); } } setOpen(v); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Add Listing</Button>
            </DialogTrigger>
            <DialogContent className={ADMIN_EDITOR_DIALOG}>
              <DialogHeader><DialogTitle>{editing ? "Edit Listing" : "Add Listing"}</DialogTitle></DialogHeader>
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
                        ...(f.title_override?.trim() ? { title_override: e.target.value } : {}),
                      }))
                    }
                    required
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="listing-use-title-override"
                      checked={!!(form.title_override && form.title_override.trim())}
                      onCheckedChange={(v) => setForm({ ...form, title_override: v ? (form.title || "") : "" })}
                    />
                    <Label htmlFor="listing-use-title-override" className="text-sm cursor-pointer font-normal">
                      Use the title exactly as typed (no auto-capitalisation)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="listing-featured" checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                    <Label htmlFor="listing-featured" className="text-sm cursor-pointer font-normal">Featured</Label>
                  </div>
                </div>

                <div>
                  <Label>Categories</Label>
                  
                  <div className={ADMIN_PICKER_LIST}>
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
                  {showNewCat ? (
                    <div className="flex gap-2 mt-2">
                      <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="New category name" className="h-8 text-sm border-gray-950 bg-slate-50" autoFocus />
                      <Button type="button" size="sm" onClick={addCategory}>Save</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => { setShowNewCat(false); setNewCatName(""); }}>Cancel</Button>
                    </div>
                  ) : (
                    <Button type="button" variant="ghost" size="sm" className="mt-2 h-8 px-2 gap-1 border-gray-950 bg-gray-400 text-gray-950 opacity-100" onClick={() => setShowNewCat(true)}>
                      <Plus className="h-3.5 w-3.5" /> Add category
                    </Button>
                  )}
                </div>
                {selectedCatIds.length > 0 && (
                  <div>
                    <Label>Subcategories</Label>
                    {availableSubs.length > 0 && (
                      <div className={ADMIN_PICKER_LIST}>
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
                    )}
                    {showNewSub ? (
                      <div className="flex flex-wrap gap-2 mt-2 items-center">
                        {selectedCatIds.length > 1 && (
                          <Select value={newSubParent} onValueChange={setNewSubParent}>
                            <SelectTrigger className="h-8 text-sm w-[160px] border-gray-950 bg-slate-50"><SelectValue placeholder="Parent category" /></SelectTrigger>
                            <SelectContent>
                              {categories?.filter((c) => selectedCatIds.includes(c.id)).map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Input value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="New subcategory name" className="h-8 text-sm flex-1 min-w-[140px] border-gray-950 bg-slate-50" autoFocus />
                        <Button type="button" size="sm" onClick={addSubcategory}>Save</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => { setShowNewSub(false); setNewSubName(""); setNewSubParent(""); }}>Cancel</Button>
                      </div>
                    ) : (
                      <Button type="button" variant="ghost" size="sm" className="mt-2 h-8 px-2 gap-1 border-gray-950 bg-gray-400 text-gray-950 opacity-100" onClick={() => setShowNewSub(true)}>
                        <Plus className="h-3.5 w-3.5" /> Add subcategory
                      </Button>
                    )}
                    {(() => {
                      const selectedCats = (categories ?? []).filter((c) => selectedCatIds.includes(c.id));
                      if (selectedCats.length === 0) return null;
                      return (
                        <div className="mt-3">
                          <Label>Listing Card Label</Label>
                          <p className="text-xs text-muted-foreground mt-1 mb-2">
                            The single line shown under the title on listing cards. Set it per category —
                            a listing in more than one category can read differently depending on which
                            category page it's being browsed from.
                          </p>
                          <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-3">
                            {selectedCats.map((cat) => {
                              // Only this category's own selected subcategories are valid options,
                              // plus the category title itself.
                              const catSubTitles = Array.from(new Set(
                                (subcategories ?? [])
                                  .filter((s) => s.category_id === cat.id && selectedSubIds.includes(s.id))
                                  .map((s) => s.title),
                              ));
                              const options = [cat.title, ...catSubTitles.filter((t) => t.toLowerCase() !== cat.title.toLowerCase())];
                              const current = (catCardLabels[cat.id] || "").trim();
                              const matched = current
                                ? options.find((t) => t.toLowerCase() === current.toLowerCase())
                                : undefined;
                              const autoLabel = catSubTitles[0] || cat.title;
                              return (
                                <div key={cat.id}>
                                  <Label className="text-xs font-normal text-muted-foreground">
                                    On the {cat.title} page
                                  </Label>
                                  <Select
                                    value={matched ?? "__auto__"}
                                    onValueChange={(v) =>
                                      setCatCardLabels((prev) => ({ ...prev, [cat.id]: v === "__auto__" ? "" : v }))
                                    }
                                  >
                                    <SelectTrigger className="border-gray-950 bg-slate-50">
                                      <SelectValue placeholder={`Automatic (${autoLabel})`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__auto__">Automatic ({autoLabel})</SelectItem>
                                      {options.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                {selectedSubIds.length > 0 && (
                  <div>
                    <Label>Sub-subcategories</Label>
                    {availableSubSubs.length > 0 && (
                      <div className={ADMIN_PICKER_LIST}>
                        {availableSubSubs.map((ss) => {
                          const parent = subcategories?.find((s) => s.id === ss.subcategory_id);
                          return (
                            <div key={ss.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`subsub-${ss.id}`}
                                checked={selectedSubSubIds.includes(ss.id)}
                                onCheckedChange={() => toggleSubSub(ss.id)}
                              />
                              <label htmlFor={`subsub-${ss.id}`} className="text-sm text-foreground cursor-pointer">
                                {ss.title}
                                {parent && selectedSubIds.length > 1 && (
                                  <span className="text-xs text-muted-foreground ml-1">({parent.title})</span>
                                )}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {showNewSubSub ? (
                      <div className="flex flex-wrap gap-2 mt-2 items-center">
                        {selectedSubIds.length > 1 && (
                          <Select value={newSubSubParent} onValueChange={setNewSubSubParent}>
                            <SelectTrigger className="h-8 text-sm w-[160px] border-gray-950 bg-slate-50"><SelectValue placeholder="Parent subcategory" /></SelectTrigger>
                            <SelectContent>
                              {subcategories?.filter((s) => selectedSubIds.includes(s.id)).map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Input value={newSubSubName} onChange={(e) => setNewSubSubName(e.target.value)} placeholder="New sub-subcategory name" className="h-8 text-sm flex-1 min-w-[140px] border-gray-950 bg-slate-50" autoFocus />
                        <Button type="button" size="sm" onClick={addSubSubcategory}>Save</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => { setShowNewSubSub(false); setNewSubSubName(""); setNewSubSubParent(""); }}>Cancel</Button>
                      </div>
                    ) : (
                      <Button type="button" variant="ghost" size="sm" className="mt-2 h-8 px-2 gap-1 border-gray-950 bg-gray-400 text-gray-950 opacity-100" onClick={() => setShowNewSubSub(true)}>
                        <Plus className="h-3.5 w-3.5" /> Add sub-subcategory
                      </Button>
                    )}
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <Label>Images</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Anything left empty borrows one of the others.
                    </p>
                  </div>
                  <div className={ADMIN_IMAGE_GRID}>
                    {LISTING_IMAGE_SLOTS.map((slot) => (
                      <ImageSlotField
                        key={slot.key}
                        slot={slot}
                        value={(form[slot.field] as string) || ""}
                        onChange={(url) =>
                          setForm((f) => ({
                            ...f,
                            [slot.field]: url,
                            // `image_url` is the column every fallback chain reads,
                            // so the individual page image keeps feeding it.
                            ...(slot.key === "detail" ? { image_url: url } : {}),
                          }))
                        }
                      />
                    ))}
                  </div>
                  {/* The gallery lives with the rest of the pictures — one place
                      in the form where every upload for this listing is done. */}
                  <GalleryUpload
                    value={form.gallery_images}
                    onChange={(val) => setForm({ ...form, gallery_images: val })}
                  />
                </div>
                <div className={ADMIN_FIELD_GRID}>
                  <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                  <div>
                    <Label>KM from Town</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={form.km_from_town}
                      onChange={(e) => {
                        const v = e.target.value.replace(",", ".").replace(/[^0-9.]/g, "");
                        setForm({ ...form, km_from_town: v });
                      }}
                      placeholder="e.g. 5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Numeric kilometres from Hoedspruit town centre. Used by the Distance filter on category pages.</p>
                  </div>
                </div>

                <div className={ADMIN_FIELD_GRID}>
                  <div className="space-y-2">
                    <MultiContactField
                      label="Phone"
                      type="tel"
                      primary={form.phone}
                      onPrimaryChange={(v) => setForm({ ...form, phone: v })}
                      primaryLabel={form.phone_label}
                      onPrimaryLabelChange={(v) => setForm({ ...form, phone_label: v })}
                      extras={form.additional_phones}
                      onExtrasChange={(v) => setForm({ ...form, additional_phones: v })}
                      extraLabels={form.additional_phone_labels}
                      onExtraLabelsChange={(v) => setForm({ ...form, additional_phone_labels: v })}
                      addLabel="Add phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <MultiContactField
                      label="Email"
                      type="email"
                      primary={form.email}
                      onPrimaryChange={(v) => setForm({ ...form, email: v })}
                      primaryLabel={form.email_label}
                      onPrimaryLabelChange={(v) => setForm({ ...form, email_label: v })}
                      extras={form.additional_emails}
                      onExtrasChange={(v) => setForm({ ...form, additional_emails: v })}
                      extraLabels={form.additional_email_labels}
                      onExtraLabelsChange={(v) => setForm({ ...form, additional_email_labels: v })}
                      addLabel="Add email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <MultiContactField
                    label="Website"
                    type="text"
                    primary={form.website}
                    onPrimaryChange={(v) => setForm({ ...form, website: v })}
                    primaryLabel={form.website_label}
                    onPrimaryLabelChange={(v) => setForm({ ...form, website_label: v })}
                    extras={form.additional_websites}
                    onExtrasChange={(v) => setForm({ ...form, additional_websites: v })}
                    extraLabels={form.additional_website_labels}
                    onExtraLabelsChange={(v) => setForm({ ...form, additional_website_labels: v })}
                    placeholder="https://..."
                    addLabel="Add website"
                  />
                </div>
                <div className={ADMIN_FIELD_GRID}>
                  <div><Label>Facebook</Label><Input value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} placeholder="https://facebook.com/..." /></div>
                  <div><Label>Instagram</Label><Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="https://instagram.com/..." /></div>
                </div>
                <div className="space-y-2">
                  <MultiContactField
                    label="WhatsApp Number"
                    type="tel"
                    primary={form.whatsapp}
                    onPrimaryChange={(v) => setForm({ ...form, whatsapp: v })}
                    primaryLabel={form.whatsapp_label}
                    onPrimaryLabelChange={(v) => setForm({ ...form, whatsapp_label: v })}
                    extras={form.additional_whatsapps}
                    onExtrasChange={(v) => setForm({ ...form, additional_whatsapps: v })}
                    extraLabels={form.additional_whatsapp_labels}
                    onExtraLabelsChange={(v) => setForm({ ...form, additional_whatsapp_labels: v })}
                    placeholder="e.g. +27791234567"
                    addLabel="Add WhatsApp"
                  />
                </div>
                <div className={ADMIN_FIELD_GRID}>
                  <div><Label>Google Maps Link</Label><Input value={form.google_maps_link} onChange={(e) => setForm({ ...form, google_maps_link: e.target.value })} placeholder="https://maps.google.com/..." /></div>
                  <div><Label>Google Reviews URL</Label><Input value={form.google_reviews_url} onChange={(e) => setForm({ ...form, google_reviews_url: e.target.value })} placeholder="https://search.google.com/local/reviews?placeid=..." /></div>
                  <div>
                    <Label>Google Place ID</Label>
                    <Input value={form.google_place_id} onChange={(e) => setForm({ ...form, google_place_id: e.target.value })} placeholder="ChIJ... (or paste a Maps link with place_id=)" />
                    <p className="text-xs text-muted-foreground mt-1">Used only by the nightly Google ratings sync. Never shown on the front end.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <div><Label>Google Rating</Label><Input type="number" step="0.1" min="0" max="5" value={form.google_rating ?? ""} onChange={(e) => setForm({ ...form, google_rating: e.target.value ? parseFloat(e.target.value) : null })} placeholder="e.g. 4.5" /></div>
                   <div><Label>Review Count</Label><Input type="number" min="0" value={form.google_reviews_count ?? ""} onChange={(e) => setForm({ ...form, google_reviews_count: e.target.value ? parseInt(e.target.value, 10) : null })} placeholder="e.g. 128" /></div>
                </div>
                <div className="border-t border-border pt-4 mt-2">
                  <p className="text-foreground mb-3 text-xl font-bold border-2 border-zinc-900 text-center bg-zinc-700 text-slate-50">Detail Page</p>
                </div>

                <div>
                  <Label>Long Description</Label>
                  <MarkdownToolbar
                    textareaRef={longDescRef}
                    value={form.long_description}
                    onChange={(val) => setForm({ ...form, long_description: val })}
                  />
                  <Textarea
                    ref={longDescRef}
                    value={form.long_description}
                    onChange={(e) => setForm({ ...form, long_description: e.target.value })}
                    rows={6}
                    placeholder="Detailed information shown on the listing's own page..."
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Formatting: <code>**bold**</code> for bold, <code>## Subtitle</code> on its own line for a heading,
                    <code>[link text](https://link.com)</code> for a link. Leave a blank line between paragraphs.
                  </p>
                </div>

                <div>
                  <Label>Good To Know</Label>
                  <p className="text-[11px] text-muted-foreground mt-1 mb-2">
                    Short highlights shown as ticked chips under the About tab (e.g. Self-catering, Rim-flow pool, Pet friendly).
                    Leave empty to hide the card.
                  </p>
                  <IncludedChipsInput
                    value={form.good_to_know}
                    onChange={(v) => setForm({ ...form, good_to_know: v })}
                    placeholder="e.g. Self-catering, then press Enter"
                  />
                </div>

                <div className="border-t border-border pt-4 mt-2 space-y-3">
                  <p className="text-foreground mb-3 text-xl font-bold border-2 border-zinc-900 text-center bg-zinc-700 text-slate-50">Custom Detail Rows</p>
                  
                  {[1, 2, 3].slice(0, customRowsVisible).map((n) => {
                    const titleKey = `custom_title_${n}` as keyof typeof form;
                    const textKey = `custom_text_${n}` as keyof typeof form;
                    return (
                      <div key={n} className="border border-border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Custom row {n}</Label>
                          {n === customRowsVisible && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setForm({ ...form, [titleKey]: "", [textKey]: "" } as any);
                                setCustomRowsVisible(customRowsVisible - 1);
                              }}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
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
                  {customRowsVisible < 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomRowsVisible(customRowsVisible + 1)}
                    >
                      <Plus className="h-4 w-4" /> Add custom field
                    </Button>
                  )}
                </div>

                <DetailsDisplayModeEditor
                  value={form.details_display_mode}
                  onChange={(v) => setForm({ ...form, details_display_mode: v })}
                  groups={[
                    ...(isRestaurantType ? ["restaurant" as SectionGroup] : []),
                    ...(isAccommodationType ? ["accommodation" as SectionGroup] : []),
                    ...(isShoppingType ? ["shopping" as SectionGroup] : []),
                    ...(isTradesType ? ["trades" as SectionGroup] : []),
                  ]}
                />



                {!isAccommodationOnly && (
                <div>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <Label>Opening Hours</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setForm({ ...form, additional_hours: [...form.additional_hours, emptyHoursSet()] })}
                    >
                      <Plus className="h-4 w-4" /> Add another set of hours
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Most listings need one set. Add a second when the same place keeps two clocks — a kitchen
                    that closes at 21:00 while the bar stays open to midnight — and name each one so the app
                    can say which hours are which instead of picking one and misleading people.
                  </p>

                  {/* A single set needs no name: the app just calls it "Opening Hours". */}
                  {form.additional_hours.length > 0 && (
                    <Input
                      className="mt-3"
                      value={form.opening_hours_label}
                      onChange={(e) => setForm({ ...form, opening_hours_label: e.target.value })}
                      placeholder="Name this set of hours, e.g. Kitchen"
                    />
                  )}

                  <div className="space-y-2 mt-2 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-2">
                    {DAY_LABELS.map((day) => (
                      <div key={day} className="grid grid-cols-[100px_1fr] gap-2 items-center">
                        <span className="text-sm text-muted-foreground capitalize text-zinc-800">{day}</span>
                        <Input
                          value={form.opening_hours[day] ?? ""}
                          onChange={(e) => setForm({ ...form, opening_hours: { ...form.opening_hours, [day]: e.target.value } })}
                          placeholder="e.g. 08:00 - 17:00"
                        />
                      </div>
                    ))}
                  </div>

                  {form.additional_hours.map((set, idx) => (
                    <div key={idx} className="border-t border-border pt-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Input
                          value={set.label}
                          onChange={(e) => setForm({
                            ...form,
                            additional_hours: form.additional_hours.map((s2, i) => i === idx ? { ...s2, label: e.target.value } : s2),
                          })}
                          placeholder={`Name this set of hours, e.g. ${idx === 0 ? "Bar" : "Deli"}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setForm({ ...form, additional_hours: form.additional_hours.filter((_, i) => i !== idx) })}
                        >
                          <Trash2 className="h-4 w-4" /> Remove
                        </Button>
                      </div>
                      <div className="space-y-2 mt-2 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-2">
                        {DAY_LABELS.map((day) => (
                          <div key={day} className="grid grid-cols-[100px_1fr] gap-2 items-center">
                            <span className="text-sm text-muted-foreground capitalize text-zinc-800">{day}</span>
                            <Input
                              value={set.hours[day] ?? ""}
                              onChange={(e) => setForm({
                                ...form,
                                additional_hours: form.additional_hours.map((s2, i) =>
                                  i === idx ? { ...s2, hours: { ...s2.hours, [day]: e.target.value } } : s2),
                              })}
                              placeholder="e.g. 16:00 - 00:00"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                )}

                {isRestaurantType && (
                  <div className="border-t border-border pt-4 mt-2 space-y-4">
                    {/* Kids Section */}
                    <div>
                      <p className="text-foreground mb-3 text-xl font-bold border-2 border-zinc-900 text-center bg-zinc-700 text-slate-50">Kids</p>
                      <div className={ADMIN_TOGGLE_GRID}>
                        <TriStateToggle label="Good for Kids" value={form.good_for_kids} onChange={(v) => setForm({ ...form, good_for_kids: v })} />
                        <TriStateToggle label="Kids Playground" value={form.kids_playground} onChange={(v) => setForm({ ...form, kids_playground: v })} />
                        <TriStateToggle label="Kids Menu" value={form.kids_menu} onChange={(v) => setForm({ ...form, kids_menu: v })} />
                        <TriStateToggle label="High Chairs" value={form.high_chairs} onChange={(v) => setForm({ ...form, high_chairs: v })} />
                        <TriStateToggle label="Nappy Changing Station" value={form.nappy_changing_station} onChange={(v) => setForm({ ...form, nappy_changing_station: v })} />
                      </div>
                    </div>

                    {/* Accessibility Section */}
                    <div className="border-t border-border pt-3 mt-2">
                      <p className="text-foreground mb-3 text-xl font-bold border-2 border-zinc-900 text-center bg-zinc-700 text-slate-50">Accessibility</p>
                      <div className={ADMIN_TOGGLE_GRID}>
                        <TriStateToggle label="Wheelchair Friendly" value={form.wheelchair_friendly} onChange={(v) => setForm({ ...form, wheelchair_friendly: v })} />
                        <TriStateToggle label="Wheelchair-accessible Car Park" value={form.wheelchair_car_park} onChange={(v) => setForm({ ...form, wheelchair_car_park: v })} />
                        <TriStateToggle label="Wheelchair-accessible Entrance" value={form.wheelchair_entrance} onChange={(v) => setForm({ ...form, wheelchair_entrance: v })} />
                        <TriStateToggle label="Wheelchair-accessible Seating" value={form.wheelchair_seating} onChange={(v) => setForm({ ...form, wheelchair_seating: v })} />
                        <TriStateToggle label="Wheelchair-accessible Toilet" value={form.wheelchair_toilet} onChange={(v) => setForm({ ...form, wheelchair_toilet: v })} />
                      </div>
                    </div>

                    {/* Amenities Section */}
                    <div className="border-t border-border pt-3 mt-2">
                      <p className="text-foreground mb-3 text-xl font-bold border-2 border-zinc-900 text-center bg-zinc-700 text-slate-50">Amenities</p>
                      <div className={ADMIN_TOGGLE_GRID}>
                        <TriStateToggle label="Toilet" value={form.has_toilet} onChange={(v) => setForm({ ...form, has_toilet: v })} />
                        <TriStateToggle label="WiFi" value={form.has_wifi} onChange={(v) => setForm({ ...form, has_wifi: v })} />
                        <TriStateToggle label="Free WiFi" value={form.has_free_wifi} onChange={(v) => setForm({ ...form, has_free_wifi: v })} />
                        <TriStateToggle label="Pets Allowed" value={form.pets_allowed} onChange={(v) => setForm({ ...form, pets_allowed: v })} />
                        <TriStateToggle label="Smoking Section" value={form.smoking_allowed} onChange={(v) => setForm({ ...form, smoking_allowed: v })} />
                        <TriStateToggle label="Drive-Through" value={form.drive_through} onChange={(v) => setForm({ ...form, drive_through: v })} />
                      </div>
                    </div>


                    {/* Drinks Section */}
                    <div className="border-t border-border pt-3 mt-2">
                      <p className="text-foreground mb-3 text-xl font-bold border-2 border-zinc-900 text-center bg-zinc-700 text-slate-50">Drinks</p>
                      <div className={ADMIN_TOGGLE_GRID}>
                        <TriStateToggle label="Wine List" value={form.has_wine_list} onChange={(v) => setForm({ ...form, has_wine_list: v })} />
                        <TriStateToggle label="Cocktails" value={form.has_cocktails} onChange={(v) => setForm({ ...form, has_cocktails: v })} />
                        <TriStateToggle label="Craft Beer" value={form.has_craft_beer} onChange={(v) => setForm({ ...form, has_craft_beer: v })} />
                        <TriStateToggle label="Smoothies" value={form.has_smoothies} onChange={(v) => setForm({ ...form, has_smoothies: v })} />
                        <TriStateToggle label="Coffee" value={form.has_coffee} onChange={(v) => setForm({ ...form, has_coffee: v })} />
                        <TriStateToggle label="Champagne" value={form.has_champagne} onChange={(v) => setForm({ ...form, has_champagne: v })} />
                        <TriStateToggle label="Milkshakes" value={form.has_milkshakes} onChange={(v) => setForm({ ...form, has_milkshakes: v })} />
                        <TriStateToggle label="Mocktails" value={form.has_mocktails} onChange={(v) => setForm({ ...form, has_mocktails: v })} />
                        <TriStateToggle label="Beers / Ciders" value={form.has_beers_ciders} onChange={(v) => setForm({ ...form, has_beers_ciders: v })} />
                        <TriStateToggle label="Iced Coffee" value={form.has_iced_coffee} onChange={(v) => setForm({ ...form, has_iced_coffee: v })} />
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
                      { label: "Foods", options: FOODS_OPTIONS, key: "foods" as const },
                      { label: "Seating", options: SEATING_OPTIONS, key: "seating" as const },
                      { label: "Service Type", options: SERVICE_TYPE_OPTIONS, key: "service_type" as const },
                    ].map(({ label, options, key }) => {
                      const CUISINE_EXCLUDE = new Set(["light meals", "pub grub", "breakfast", "farm to fork", "farm food", "bak contemporary", "health bowls", "health food", "fried chicken", "farm-to-fork", "contemporary", "smoked meats", "bakery", "artisan bakery", "gelato", "wraps", "salads", "chicken", "sandwiches", "sandwhiches"]);
                      const extras = (distinctChipValues?.[key] ?? []).filter((v) => !options.includes(v));
                      let merged = [...options, ...extras];
                      if (key === "cuisine") {
                        merged = merged.filter((v) => !CUISINE_EXCLUDE.has(v.trim().toLowerCase()));
                      }
                      return (
                        <div key={key}>
                          <Label>{label}</Label>
                          <div className="flex flex-wrap gap-2">
                            {merged.map((opt) => {
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
                          <div className="flex gap-2 mt-2">
                            <Input
                              value={customChipOption[key] ?? ""}
                              onChange={(e) => setCustomChipOption({ ...customChipOption, [key]: e.target.value })}
                              placeholder={`Add new ${label.toLowerCase()} option`}
                              className="h-8 text-sm border-gray-950 bg-slate-50"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const val = (customChipOption[key] ?? "").trim();
                                if (!val) return;
                                if (!form[key].includes(val)) {
                                  setForm({ ...form, [key]: [...form[key], val] });
                                }
                                setCustomChipOption({ ...customChipOption, [key]: "" });
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Business Type Section */}
                    <div className="border-t border-border pt-3 mt-2">
                      <p className="text-foreground mb-3 text-xl font-bold border-2 border-zinc-900 text-center bg-zinc-700 text-slate-50">Business Type</p>
                      <div className="space-y-3">
                        <TriStateToggle label="Franchise" value={form.is_franchise} onChange={(v) => setForm({ ...form, is_franchise: v })} />
                      </div>
                    </div>
                  </div>
                )}

                {isShoppingType && (
                  <div className="border-t border-border pt-4 mt-2 space-y-4">
                    <p className="text-foreground mb-3 text-xl font-bold border-2 border-zinc-900 text-center bg-zinc-700 text-slate-50">Shopping Fields</p>

                    <div className={ADMIN_TOGGLE_GRID}>
                      {[
                        { label: "Air Conditioned", key: "air_conditioned" as const },
                        { label: "Delivery Available", key: "delivery_available" as const },
                        { label: "Order Online", key: "order_online" as const },
                        { label: "Parking Available", key: "parking_available" as const },
                        { label: "Wheelchair Friendly", key: "wheelchair_friendly" as const },
                        { label: "Local Products", key: "local_products" as const },
                        { label: "Curio / Gifts", key: "curio_or_gifts" as const },
                      ].map(({ label, key }) => (
                        <TriStateToggle key={key} label={label} value={form[key] as boolean | null} onChange={(v) => setForm({ ...form, [key]: v })} />
                      ))}
                    </div>

                    <div>
                      <Label>Payment Methods</Label>
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
                      {(() => {
                        const dbTypes = Array.from(new Set((listings ?? []).map((l: any) => l.shop_type).filter(Boolean))) as string[];
                        const merged = Array.from(new Set([...SHOP_TYPE_OPTIONS, ...customShopTypes, ...dbTypes]));
                        return (
                          <>
                            <Select value={form.shop_type || "__none__"} onValueChange={(v) => setForm({ ...form, shop_type: v === "__none__" ? "" : v })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select shop type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">— None —</SelectItem>
                                {merged.map((opt) => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {/* Typed in the form, not in a browser prompt: the
                                new type joins the list and is selected for this
                                listing in one go. */}
                            <div className="flex gap-2 mt-2">
                              <Input
                                value={newShopType}
                                onChange={(e) => setNewShopType(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key !== "Enter") return;
                                  e.preventDefault();
                                  addShopType(merged);
                                }}
                                placeholder="Add another shop type"
                                className="h-9 text-sm"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="shrink-0"
                                disabled={!newShopType.trim()}
                                onClick={() => addShopType(merged)}
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" /> Add
                              </Button>
                            </div>
                          </>
                        );
                      })()}
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
                    <p className="text-foreground mb-3 text-xl font-bold border-2 border-zinc-900 text-center bg-zinc-700 text-slate-50">Accommodation Fields</p>

                    <div className={ADMIN_TOGGLE_GRID}>
                      {[
                        { label: "Restaurant", key: "has_restaurant" as const },
                        { label: "Bar", key: "has_bar" as const },
                        { label: "Room Service", key: "has_room_service" as const },
                        { label: "Breakfast", key: "has_breakfast" as const },
                      ].map(({ label, key }) => (
                        <TriStateToggle key={key} label={label} value={form[key] as boolean | null} onChange={(v) => setForm({ ...form, [key]: v })} />
                      ))}

                      {form.has_breakfast === true && (
                        <div className="ml-6">
                          <TriStateToggle label="Breakfast Included (Yes = free, No = paid)" value={form.breakfast_included} onChange={(v) => setForm({ ...form, breakfast_included: v })} />
                        </div>
                      )}

                      {[
                        { label: "Swimming Pool", key: "has_swimming_pool" as const },
                        { label: "Laundry Service", key: "has_laundry" as const },
                        { label: "Child Friendly", key: "child_friendly" as const },
                        { label: "Spa", key: "has_spa" as const },
                        { label: "Fitness Centre", key: "has_fitness_centre" as const },
                        { label: "Airport Shuttle", key: "has_airport_shuttle" as const },
                        { label: "Airport Shuttle Free (No = extra charge)", key: "airport_shuttle_free" as const },
                        { label: "Aircon", key: "has_aircon" as const },
                        { label: "WiFi", key: "has_wifi_accom" as const },
                        { label: "Free Parking", key: "has_free_parking" as const },
                        { label: "Secure Parking", key: "has_secure_parking" as const },
                        { label: "Pets Allowed", key: "pets_allowed" as const },
                      ].map(({ label, key }) => (
                        <TriStateToggle key={key} label={label} value={form[key] as boolean | null} onChange={(v) => setForm({ ...form, [key]: v })} />
                      ))}
                    </div>

                    <div className={ADMIN_FIELD_GRID}>
                      <div>
                        <Label>Sleeps (number of guests) (Adults)</Label>
                        <Input
                          type="number"
                          value={form.sleeps ?? ""}
                          onChange={(e) => setForm({ ...form, sleeps: e.target.value ? parseInt(e.target.value, 10) : null })}
                          placeholder="e.g. 4"
                        />
                      </div>

                      <div>
                        <Label>Sleeps (number of guests) (Children)</Label>
                        <Input
                          type="number"
                          value={form.sleeps_children ?? ""}
                          onChange={(e) => setForm({ ...form, sleeps_children: e.target.value ? parseInt(e.target.value, 10) : null })}
                          placeholder="e.g. 2"
                        />
                      </div>

                      <div>
                        <Label>Property Type</Label>
                        <Input
                          list="property-type-options"
                          value={form.property_type}
                          onChange={(e) => setForm({ ...form, property_type: e.target.value })}
                          onBlur={(e) => {
                            const raw = e.target.value.trim();
                            if (!raw) { setForm({ ...form, property_type: "" }); return; }
                            const match = propertyTypeSuggestions.find((o) => o.toLowerCase() === raw.toLowerCase());
                            setForm({ ...form, property_type: match ?? raw });
                          }}
                          placeholder="e.g. Lodge (type to add a new one)"
                        />
                        <datalist id="property-type-options">
                          {propertyTypeSuggestions.map((opt) => (
                            <option key={opt} value={opt} />
                          ))}
                        </datalist>
                      </div>


                      <div>
                        <Label>Star Rating</Label>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={form.star_rating ?? ""}
                          onChange={(e) => setForm({ ...form, star_rating: e.target.value === "" ? null : Number(e.target.value) })}
                          placeholder="e.g. 5"
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
                        <Label>Average Price Per Person Per Night</Label>
                        <Input
                          value={form.avg_price_per_person_per_night}
                          onChange={(e) => setForm({ ...form, avg_price_per_person_per_night: e.target.value })}
                          placeholder="e.g. R 1 250"
                        />
                      </div>

                      <div>
                        <Label>Average Price Per Couple Per Night</Label>
                        <Input
                          value={form.avg_price_per_couple_per_night}
                          onChange={(e) => setForm({ ...form, avg_price_per_couple_per_night: e.target.value })}
                          placeholder="e.g. R 2 400"
                        />
                      </div>

                      <div>
                        <Label>Number of Rooms</Label>
                        <Input
                          type="number"
                          value={form.rooms_count ?? ""}
                          onChange={(e) => setForm({ ...form, rooms_count: e.target.value ? parseInt(e.target.value, 10) : null })}
                          placeholder="e.g. 12"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {isNGOType && (
                  <div className="border-t border-border pt-4 mt-2 space-y-4">
                    <p className="text-foreground mb-3 text-xl font-bold border-2 border-zinc-900 text-center bg-zinc-700 text-slate-50">NGO & Volunteering Fields</p>
                    <div className={ADMIN_FIELD_GRID}>
                      <div><Label>Cause</Label><Textarea value={form.cause} onChange={(e) => setForm({ ...form, cause: e.target.value })} placeholder="What cause does this NGO support?" /></div>
                      <div><Label>Impact</Label><Textarea value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value })} placeholder="What impact have they made?" /></div>
                      <div><Label>Ways To Give</Label><Textarea value={form.ways_to_give} onChange={(e) => setForm({ ...form, ways_to_give: e.target.value })} placeholder="How can people donate or contribute?" /></div>
                      <div><Label>Volunteering</Label><Textarea value={form.volunteering} onChange={(e) => setForm({ ...form, volunteering: e.target.value })} placeholder="How can people volunteer?" /></div>
                      <div><Label>Visiting</Label><Textarea value={form.visiting} onChange={(e) => setForm({ ...form, visiting: e.target.value })} placeholder="Visiting information" /></div>
                    </div>
                  </div>
                )}

                {isTradesType && (
                  <div className="border-t border-border pt-4 mt-2 space-y-4">
                    <p className="text-foreground mb-3 text-xl font-bold border-2 border-zinc-900 text-center bg-zinc-700 text-slate-50">Trades & Services Fields</p>
                    <div className="space-y-2">
                      <Label>Year Business Started</Label>
                      <Input
                        type="number"
                        value={form.business_started_year ?? ""}
                        onChange={(e) => setForm({ ...form, business_started_year: e.target.value ? parseInt(e.target.value, 10) : null })}
                        placeholder="e.g. 2008"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">Displayed on the front end as "Since YYYY".</p>
                    </div>

                    <div className={ADMIN_TOGGLE_GRID}>
                      <TriStateToggle label="After Hours Available" value={form.after_hours_available} onChange={(v) => setForm({ ...form, after_hours_available: v })} />
                      <TriStateToggle label="Callout Fee" value={form.callout_fee} onChange={(v) => setForm({ ...form, callout_fee: v })} />
                    </div>
                    <div>
                      <Label>Specialities</Label>
                      <Textarea
                        value={form.specialities}
                        onChange={(e) => setForm({ ...form, specialities: e.target.value })}
                        placeholder="e.g. Solar installs, certified wireman, game fencing"
                      />
                    </div>
                  </div>
                )}

                {isHomeGardenType && (
                  <div className="border-t border-border pt-4 mt-2 space-y-4">
                    <p className="text-foreground mb-3 text-xl font-bold border-2 border-zinc-900 text-center bg-zinc-700 text-slate-50">Home & Garden Fields</p>

                    {[
                      { label: "Services Offered", options: Array.from(new Set([...SERVICES_OFFERED_OPTIONS, ...(customHGServices ?? []), ...form.services_offered])), key: "services_offered" as const },
                      ...(form.services_offered.includes("Nursery")
                        ? [{ label: "Plant Types", options: PLANT_TYPES_OPTIONS as readonly string[], key: "plant_types" as const }]
                        : []),
                    ].map(({ label, options, key }) => (
                      <div key={key}>
                        <Label>{label}</Label>
                        <div className="flex flex-wrap gap-2">
                          {options.map((opt) => {
                            const selected = (form[key] as string[]).includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setForm({ ...form, [key]: selected ? (form[key] as string[]).filter((v) => v !== opt) : [...(form[key] as string[]), opt] })}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:border-primary/50"}`}
                              >
                                {formatServiceLabel(opt)}
                              </button>
                            );
                          })}
                        </div>
                        {key === "services_offered" && (
                          <div className="mt-2 flex gap-2">
                            <Input
                              value={newServiceInput}
                              onChange={(e) => setNewServiceInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (newServiceInput.trim()) addHGServiceMutation.mutate(newServiceInput);
                                }
                              }}
                              placeholder="Add another service (e.g. Paving)"
                              className="h-9"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => newServiceInput.trim() && addHGServiceMutation.mutate(newServiceInput)}
                              disabled={addHGServiceMutation.isPending || !newServiceInput.trim()}
                            >
                              Add
                            </Button>
                          </div>
                        )}
                        {key === "plant_types" && (
                          <p className="text-[11px] text-muted-foreground mt-1">Only shown because "Nursery" is selected above.</p>
                        )}
                      </div>
                    ))}


                    <div className="space-y-2">
                      <Label>Year Business Started</Label>
                      <Input
                        type="number"
                        value={form.business_started_year ?? ""}
                        onChange={(e) => setForm({ ...form, business_started_year: e.target.value ? parseInt(e.target.value, 10) : null })}
                        placeholder="e.g. 2008"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">Displayed on the front end as "Since YYYY".</p>
                    </div>


                    <div>
                      <Label>Specialities</Label>
                      <Textarea
                        value={form.specialities}
                        onChange={(e) => setForm({ ...form, specialities: e.target.value })}
                        placeholder="e.g. Permaculture design, indigenous plants, water-wise landscaping"
                      />
                    </div>
                  </div>
                )}

                {isWeddingsEventsType && (() => {
                  const allEventTypes = Array.from(new Set([...EVENT_TYPES_OPTIONS, ...(customEventTypes ?? []), ...form.event_types]));
                  return (
                    <div className="border-t border-border pt-4 mt-2 space-y-4">
                      <p className="text-foreground mb-3 text-xl font-bold border-2 border-zinc-900 text-center bg-zinc-700 text-slate-50">Weddings & Events Fields</p>
                      <div>
                        <Label>Event types supported</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {allEventTypes.map((opt) => {
                            const selected = form.event_types.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setForm({ ...form, event_types: selected ? form.event_types.filter((v) => v !== opt) : [...form.event_types, opt] })}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:border-primary/50"}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Input
                            value={newEventTypeInput}
                            onChange={(e) => setNewEventTypeInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (newEventTypeInput.trim()) addEventTypeMutation.mutate(newEventTypeInput);
                              }
                            }}
                            placeholder="Add another event type (e.g. Anniversaries)"
                            className="h-9"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => newEventTypeInput.trim() && addEventTypeMutation.mutate(newEventTypeInput)}
                            disabled={addEventTypeMutation.isPending || !newEventTypeInput.trim()}
                          >
                            Add
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">Custom types you add here are saved and available for all future Weddings & Events listings.</p>
                      </div>
                    </div>
                  );
                })()}

                {isWeddingsEventsType && isEventVenueSub && (
                  <div className="border-t border-border pt-4 mt-2 space-y-4">
                    <p className="text-foreground mb-3 text-xl font-bold border-2 border-zinc-900 text-center bg-zinc-700 text-slate-50">Event Venue Fields</p>

                    <TriStateToggle
                      label="On-site Accommodation"
                      value={form.venue_onsite_accommodation}
                      onChange={(v) => setForm({ ...form, venue_onsite_accommodation: v })}
                    />

                    {form.venue_onsite_accommodation === true && (
                      <div>
                        <Label>How many can be accommodated</Label>
                        <Input
                          type="number"
                          min={0}
                          value={form.venue_accommodation_sleeps ?? ""}
                          onChange={(e) => setForm({ ...form, venue_accommodation_sleeps: e.target.value ? parseInt(e.target.value, 10) : null })}
                          placeholder="e.g. 24"
                        />
                      </div>
                    )}

                    <div>
                      <Label>Guest Capacity</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.venue_guest_capacity ?? ""}
                        onChange={(e) => setForm({ ...form, venue_guest_capacity: e.target.value ? parseInt(e.target.value, 10) : null })}
                        placeholder="e.g. 150"
                      />
                    </div>

                    <div>
                      <Label>Indoor / Outdoor</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {VENUE_INDOOR_OUTDOOR_OPTIONS.map((opt) => {
                          const selected = form.venue_indoor_outdoor === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setForm({ ...form, venue_indoor_outdoor: selected ? "" : opt })}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:border-primary/50"}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <Label>Style Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {VENUE_STYLE_TAG_OPTIONS.map((opt) => {
                          const selected = form.venue_style_tags.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setForm({ ...form, venue_style_tags: selected ? form.venue_style_tags.filter((v) => v !== opt) : [...form.venue_style_tags, opt] })}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:border-primary/50"}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <Label>Setting Type</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {VENUE_SETTING_OPTIONS.map((opt) => {
                          const selected = form.venue_setting_types.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setForm({ ...form, venue_setting_types: selected ? form.venue_setting_types.filter((v) => v !== opt) : [...form.venue_setting_types, opt] })}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:border-primary/50"}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {isWellnessBeautyType && (
                  <div className="border-t border-border pt-4 mt-2 space-y-4">
                    <p className="text-foreground mb-3 text-xl font-bold border-2 border-zinc-900 text-center bg-zinc-700 text-slate-50">Wellness & Beauty Fields</p>
                    <div>
                      <Label>Treatments</Label>
                      <p className="text-[11px] text-muted-foreground mt-1 mb-2">Add one treatment at a time, then click Add. These appear on the listing's Details tab.</p>
                      <TreatmentsEditor
                        value={form.treatments}
                        onChange={(v) => setForm({ ...form, treatments: v })}
                      />
                    </div>
                  </div>
                )}










                <div className="flex gap-2">
                  {editing && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Delete this listing? This cannot be undone.")) {
                          supabase.from("listings").delete().eq("id", editing.id).then(({ error }) => {
                            if (error) { toast.error(error.message); return; }
                            qc.invalidateQueries({ queryKey: ["admin-listings"] });
                            toast.success("Listing deleted");
                            resetForm();
                          });
                        }
                      }}
                    >
                      Delete
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={closeEditor} disabled={upsert.isPending}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={upsert.isPending}>{editing ? "Update" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <details className="mb-4 rounded-lg border border-border bg-background">
        <summary className="cursor-pointer px-4 py-2 text-sm font-semibold text-slate-950">
          Details cards — global display defaults
        </summary>
        <div className="p-4 pt-0">
          <DetailsDisplayDefaultsEditor />
        </div>
      </details>



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
          <Button size="sm" variant="outline" className="opacity-100 bg-gray-400 text-slate-50 border-slate-950" onClick={() => navigate(`/admin/listings/bulk-edit?ids=${Array.from(selectedIds).join(",")}`)}>
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
                <th className="p-3 w-[40px] bg-slate-400 text-slate-950 border-slate-950 border">
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
                <th className="text-left p-3 font-medium text-muted-foreground w-[28%] bg-slate-400 border-slate-950 border text-slate-950">Title</th>
                <th className="text-left p-3 font-medium text-muted-foreground w-[25%] bg-slate-400 text-slate-950 border-slate-950 border">Categories</th>
                <th className="text-left p-3 font-medium text-muted-foreground w-[18%] bg-slate-400 text-slate-950 border-slate-950 border">Location</th>
                <th className="text-left p-3 font-medium text-muted-foreground w-[8%] bg-slate-400 text-slate-950 border-slate-950 border">Featured</th>
                <th className="p-3 w-[12%] border border-slate-950 bg-slate-400 text-slate-950"></th>
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
