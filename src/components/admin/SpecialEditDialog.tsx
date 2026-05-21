import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";
import MultiContactField from "@/components/admin/MultiContactField";
import { sanitizeContactArray } from "@/lib/contacts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  special: any;
}

const FIELDS: (keyof any)[] = [
  "title", "title_override", "description", "business_name", "business_id",
  "image_url", "detail_image_url", "deal_label",
  "valid_from", "valid_until", "card_footer_text", "is_active", "special_type",
  "price", "price_label", "original_price",
  "offer_headline", "offer_sublabel", "duration_headline", "duration_sublabel",
  "promo_code", "contact_phone", "contact_whatsapp", "contact_email", "additional_phones", "additional_whatsapps",
  "booking_link", "booking_link_label", "terms", "category", "eyebrow_categories",
];

const SpecialEditDialog = ({ open, onOpenChange, special }: Props) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(special);
  const [newCategory, setNewCategory] = useState("");
  const [localExtraCategories, setLocalExtraCategories] = useState<string[]>([]);

  useEffect(() => {
    setForm(special);
    setNewCategory("");
    setLocalExtraCategories([]);
  }, [special, open]);

  // Always-active toggle: no valid_until means ongoing
  const isAlwaysActive = !form?.valid_from && !form?.valid_until;

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {};
      FIELDS.forEach((k) => { payload[k] = form[k] ?? null; });
      payload.additional_phones = sanitizeContactArray(form.additional_phones);
      payload.additional_whatsapps = sanitizeContactArray(form.additional_whatsapps);
      // Normalise category arrays
      const cats: string[] = Array.isArray(form.eyebrow_categories)
        ? form.eyebrow_categories.map((c: any) => String(c || "").trim()).filter(Boolean)
        : [];
      payload.eyebrow_categories = cats;
      payload.category = cats[0] || null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      payload.is_active = !(form.valid_until && new Date(form.valid_until) < today);
      const { error } = await supabase.from("specials").update(payload).eq("id", special.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Special updated");
      qc.invalidateQueries({ queryKey: ["special-detail", special.id] });
      qc.invalidateQueries({ queryKey: ["home-specials"] });
      qc.invalidateQueries({ queryKey: ["homepage-specials"] });
      qc.invalidateQueries({ queryKey: ["admin-specials"] });
      qc.invalidateQueries({ queryKey: ["admin-special-categories"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message || "Failed to save"),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("specials").delete().eq("id", special.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Special deleted");
      qc.invalidateQueries({ queryKey: ["admin-specials"] });
      qc.invalidateQueries({ queryKey: ["home-specials"] });
      qc.invalidateQueries({ queryKey: ["homepage-specials"] });
      qc.invalidateQueries({ queryKey: ["special-detail", special.id] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete"),
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const { data: listings } = useQuery({
    queryKey: ["admin-listings-picker"],
    queryFn: async () => {
      const { data } = await supabase.from("listings").select("id, title").order("title", { ascending: true }).limit(2000);
      return data || [];
    },
  });

  // Pull all existing categories from all specials so they're available as pills
  const { data: allCategoryRows } = useQuery({
    queryKey: ["admin-special-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("specials").select("category, eyebrow_categories").limit(5000);
      return data || [];
    },
  });

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    (allCategoryRows || []).forEach((r: any) => {
      if (r.category && typeof r.category === "string") set.add(r.category.trim());
      if (Array.isArray(r.eyebrow_categories)) {
        r.eyebrow_categories.forEach((c: any) => {
          if (c && typeof c === "string") set.add(c.trim());
        });
      }
    });
    localExtraCategories.forEach((c) => set.add(c));
    (form?.eyebrow_categories || []).forEach((c: string) => { if (c) set.add(c.trim()); });
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [allCategoryRows, localExtraCategories, form?.eyebrow_categories]);

  const selectedCategories: string[] = useMemo(
    () => (form?.eyebrow_categories || []).filter((c: any) => c && String(c).trim()),
    [form?.eyebrow_categories]
  );

  const toggleCategory = (cat: string) => {
    const current = new Set(selectedCategories.map((c) => c.trim()));
    if (current.has(cat)) current.delete(cat);
    else current.add(cat);
    set("eyebrow_categories", Array.from(current));
  };

  const addNewCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    if (!availableCategories.includes(name)) {
      setLocalExtraCategories((prev) => [...prev, name]);
    }
    if (!selectedCategories.includes(name)) {
      set("eyebrow_categories", [...selectedCategories, name]);
    }
    setNewCategory("");
  };

  const [businessQuery, setBusinessQuery] = useState("");
  useEffect(() => {
    if (open) setBusinessQuery("");
  }, [open]);

  const selectedListing = useMemo(
    () => (listings || []).find((l: any) => l.id === form?.business_id),
    [listings, form?.business_id]
  );

  const filteredListings = useMemo(() => {
    const q = businessQuery.trim().toLowerCase();
    if (!q) return (listings || []).slice(0, 8);
    return (listings || []).filter((l: any) => l.title.toLowerCase().includes(q)).slice(0, 8);
  }, [listings, businessQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Special</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label>Title</Label><Input value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Switch
                id="special-dlg-use-title-override"
                checked={!!(form.title_override && String(form.title_override).trim())}
                onCheckedChange={(v) => set("title_override", v ? (form.title_override || form.title || "") : null)}
              />
              <Label htmlFor="special-dlg-use-title-override" className="text-sm cursor-pointer font-normal">
                Use custom title (overrides auto-capitalisation)
              </Label>
            </div>
            {!!(form.title_override && String(form.title_override).trim()) && (
              <Input
                placeholder="Custom title — rendered exactly as typed"
                value={form.title_override || ""}
                onChange={(e) => set("title_override", e.target.value)}
              />
            )}
          </div>
          <div><Label>Business Name</Label><Input value={form.business_name || ""} onChange={(e) => set("business_name", e.target.value)} /></div>
          <div>
            <Label>Linked Business Listing</Label>
            {selectedListing ? (
              <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 mt-1">
                <span className="text-sm">{selectedListing.title}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => set("business_id", null)}>Clear</Button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Search listings to link..."
                  value={businessQuery}
                  onChange={(e) => setBusinessQuery(e.target.value)}
                  className="mt-1"
                />
                {filteredListings.length > 0 && (
                  <div className="mt-1 border rounded-md max-h-48 overflow-y-auto">
                    {filteredListings.map((l: any) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => { set("business_id", l.id); if (!form.business_name) set("business_name", l.title); }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      >
                        {l.title}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            
          </div>
          <div><Label>Deal Label <span className="text-xs text-muted-foreground">(legacy — used only if no categories set)</span></Label><Input value={form.deal_label || ""} onChange={(e) => set("deal_label", e.target.value)} /></div>

          {/* Categories — multi-select pills + add new */}
          <div className="border rounded-md p-3 space-y-3">
            <div>
              <Label>Categories <span className="text-xs text-muted-foreground font-normal">(tap to select — appears above title)</span></Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableCategories.length === 0 && (
                  <p className="text-xs text-muted-foreground">No categories yet — add one below.</p>
                )}
                {availableCategories.map((cat) => {
                  const isSelected = selectedCategories.map((c) => c.trim()).includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {cat}
                      {isSelected && <X className="inline-block h-3 w-3 ml-1.5 -mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Add new category..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addNewCategory(); }
                }}
              />
              <Button type="button" variant="outline" onClick={addNewCategory} disabled={!newCategory.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          <div><Label>Description</Label><Textarea rows={4} value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></div>

          {/* Dual images with locked default crop */}
          <div>
            <Label>Card Cover Image <span className="text-xs text-muted-foreground font-normal">(shown on the specials listing — 3:4)</span></Label>
            <ImageUpload bucket="listing-images" value={form.image_url || ""} onChange={(url) => set("image_url", url)} aspect={3/4} />
          </div>
          <div>
            <Label>Detail Cover Image <span className="text-xs text-muted-foreground font-normal">(shown on the individual special page — 4:3)</span></Label>
            <ImageUpload bucket="listing-images" value={form.detail_image_url || ""} onChange={(url) => set("detail_image_url", url)} aspect={4/3} />
          </div>

          {/* Validity + always active */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="special-always-active"
                checked={isAlwaysActive}
                onCheckedChange={(v) => {
                  if (v) {
                    set("valid_from", null);
                    set("valid_until", null);
                  }
                }}
              />
              <Label htmlFor="special-always-active" className="text-sm cursor-pointer font-normal">
                Always active — ongoing until further notice
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valid From</Label>
                <Input
                  type="date"
                  value={form.valid_from || ""}
                  onChange={(e) => set("valid_from", e.target.value || null)}
                  disabled={isAlwaysActive}
                />
              </div>
              <div>
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={form.valid_until || ""}
                  onChange={(e) => set("valid_until", e.target.value || null)}
                  disabled={isAlwaysActive}
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Card Footer Text <span className="text-xs text-muted-foreground font-normal">(optional — overrides the auto "Valid until..." text on the listing card)</span></Label>
            <Input value={form.card_footer_text || ""} onChange={(e) => set("card_footer_text", e.target.value)} placeholder="e.g. Weekends only" />
          </div>

          {/* Simplified price block */}
          <div className="border rounded-md p-3 space-y-3">
            <p className="text-sm font-medium">Price</p>
            <div><Label>Price</Label><Input value={form.price || ""} onChange={(e) => set("price", e.target.value)} placeholder="e.g. R480 or 20% OFF" /></div>
            <div><Label>Price Notes <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label><Input value={form.price_label || ""} onChange={(e) => set("price_label", e.target.value)} placeholder="e.g. per person, weekends only" /></div>
            <div><Label>Original Price <span className="text-xs text-muted-foreground font-normal">(optional — strikethrough)</span></Label><Input value={form.original_price || ""} onChange={(e) => set("original_price", e.target.value)} /></div>
          </div>

          <div><Label>Promo Code</Label><Input value={form.promo_code || ""} onChange={(e) => set("promo_code", e.target.value)} /></div>
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
            label="WhatsApp"
            type="tel"
            primary={form.contact_whatsapp || ""}
            onPrimaryChange={(v) => set("contact_whatsapp", v)}
            extras={form.additional_whatsapps || []}
            onExtrasChange={(v) => set("additional_whatsapps", v)}
            addLabel="Add WhatsApp"
          />
          <div><Label>Booking Link</Label><Input value={form.booking_link || ""} onChange={(e) => set("booking_link", e.target.value)} /></div>
          <div><Label>Booking Link Display Text <span className="text-xs text-muted-foreground"></span></Label><Input value={form.booking_link_label || ""} onChange={(e) => set("booking_link_label", e.target.value)} placeholder="e.g. Book on Quicket" /></div>
          <div><Label>Special Type</Label><Input value={form.special_type || ""} onChange={(e) => set("special_type", e.target.value)} /></div>
          <div><Label>Terms</Label><Textarea rows={3} value={form.terms || ""} onChange={(e) => set("terms", e.target.value)} /></div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="destructive"
            onClick={() => { if (confirm("Delete this special? This cannot be undone.")) del.mutate(); }}
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

export default SpecialEditDialog;
