import { useEffect, useMemo, useState, useRef } from "react";
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
import ListingContactPicker from "@/components/admin/ListingContactPicker";
import { sanitizeContactArray } from "@/lib/contacts";
import MarkdownToolbar from "@/components/admin/MarkdownToolbar";
import DayOfWeekPicker from "@/components/admin/DayOfWeekPicker";
import { discountTypeHint, discountTypeUsesValue } from "@/lib/discountFields";
import { parseDays } from "@/lib/specialDays";


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  special: any;
}

const TermsEditor = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const items = value ? value.split("\n").map((s) => s.trim()).filter(Boolean) : [];
  const [draft, setDraft] = useState("");
  const commit = (next: string[]) => onChange(next.join("\n"));
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    commit([...items, t]);
    setDraft("");
  };
  const remove = (i: number) => commit(items.filter((_, idx) => idx !== i));
  const edit = (i: number, v: string) => commit(items.map((it, idx) => (idx === i ? v : it)));
  return (
    <div className="space-y-2 mt-1">
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((t, i) => (
            <div key={i} className="flex items-start gap-2">
              <Textarea rows={2} value={t} onChange={(e) => edit(i, e.target.value)} />
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Remove term">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-start gap-2">
        <Textarea
          rows={2}
          placeholder="Type a term, then click Add"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); add(); }
          }}
        />
        <Button type="button" variant="outline" onClick={add} disabled={!draft.trim()}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
};

const FIELDS: (keyof any)[] = [
  "title", "title_override", "description", "business_name", "business_id",
  "image_url", "detail_image_url", "homepage_image_url", "saved_image_url", "badge_override",
  "deal_type", "day_of_week", "discount_type", "discount_value", "freebie_text", "card_deal_text", "redemption_note",
  "valid_from", "valid_until", "card_footer_text", "is_active", "is_featured",
  "price", "price_label", "original_price", "savings",
  "promo_code", "contact_phone", "contact_whatsapp", "contact_email", "additional_phones", "additional_whatsapps",
  "booking_link", "booking_link_label", "terms", "tag", "sub_tag_1", "sub_tag_2",
];

const SELECT_CLS = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1";
const DEAL_TYPES = ["weekly", "date_range", "monthly", "ongoing"];
const DISCOUNT_TYPES = ["percent_off", "amount_off", "fixed_price", "buy_x_get_y", "freebie"];

const SpecialEditDialog = ({ open, onOpenChange, special }: Props) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(special);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setForm(special);
  }, [special, open]);

  // Always-active toggle: no valid_until means ongoing
  const isAlwaysActive = !form?.valid_from && !form?.valid_until;

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {};
      FIELDS.forEach((k) => { payload[k] = form[k] ?? null; });
      payload.additional_phones = sanitizeContactArray(form.additional_phones);
      payload.additional_whatsapps = sanitizeContactArray(form.additional_whatsapps);
      payload.title_override = (form.title_override || "").trim() || null;
      payload.tag = (form.tag || "").trim() || null;
      payload.sub_tag_1 = (form.sub_tag_1 || "").trim() || null;
      payload.sub_tag_2 = (form.sub_tag_2 || "").trim() || null;
      // Legacy rows may still hold a bare day name; the column takes a list.
      const days = parseDays(form.day_of_week);
      payload.day_of_week = days.length ? days : null;
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
      qc.invalidateQueries({ queryKey: ["all-specials"] });
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
              <Textarea
                rows={2}
                className="resize-none"
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
          <div><Label>Deal Label <span className="text-xs text-muted-foreground">(card pill text, e.g. "20% OFF")</span></Label><Input value={form.badge_override || ""} onChange={(e) => set("badge_override", e.target.value)} placeholder="Badge override, leave blank to auto-generate" /></div>

          {/* Structured deal fields — the badge is generated from these when no override is set */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Deal Type</Label>
              <select className={SELECT_CLS} value={form.deal_type || ""} onChange={(e) => set("deal_type", e.target.value || null)}>
                <option value="">None</option>
                {DEAL_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>
              Days Of The Week{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (pick as many as the deal runs on)
              </span>
            </Label>
            <DayOfWeekPicker
              value={form.day_of_week}
              onChange={(days) => set("day_of_week", days)}
              hint={form.deal_type === "weekly" ? "Pick the days this weekly deal runs on" : "No day set"}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Discount Type</Label>
              <select
                className={SELECT_CLS}
                value={form.discount_type || ""}
                onChange={(e) => {
                  const next = e.target.value || null;
                  set("discount_type", next);
                  if (!discountTypeUsesValue(next)) set("discount_value", null);
                }}
              >
                <option value="">None</option>
                {DISCOUNT_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              {discountTypeHint(form.discount_type) && (
                <p className="text-xs text-muted-foreground mt-1">{discountTypeHint(form.discount_type)}</p>
              )}
            </div>
            {discountTypeUsesValue(form.discount_type) && (
              <div>
                <Label>{form.discount_type === "percent_off" ? "Percent off" : "Amount off"}</Label>
                <div className="relative">
                  {form.discount_type === "amount_off" && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R</span>
                  )}
                  <Input
                    type="number"
                    className={form.discount_type === "amount_off" ? "pl-7" : "pr-7"}
                    value={form.discount_value ?? ""}
                    onChange={(e) => set("discount_value", e.target.value === "" ? null : Number(e.target.value))}
                  />
                  {form.discount_type === "percent_off" && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <div>
            <Label>Freebie Text</Label>
            <Input value={form.freebie_text || ""} onChange={(e) => set("freebie_text", e.target.value)} placeholder="e.g. Free breakfast and game drive included" />
            {form.discount_type === "freebie" && (
              <p className="text-xs text-muted-foreground mt-1">Shown on the card in place of a price</p>
            )}
          </div>
          <div>
            <Label>Short Card Deal Text <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
            <Input value={form.card_deal_text || ""} onChange={(e) => set("card_deal_text", e.target.value)} placeholder="e.g. Free breakfast" />
            <p className="text-xs text-muted-foreground mt-1">
              Shown in place of the deal text on the listing, homepage and saved cards when the full wording is too long. Leave blank to use the freebie / savings text everywhere.
            </p>
          </div>
          <div><Label>Redemption Note</Label><Input value={form.redemption_note || ""} onChange={(e) => set("redemption_note", e.target.value)} placeholder="e.g. Book direct on their website" /></div>


          {/* Tag + sub-tags (same as events) */}
          <div><Label>Tag / Main Category</Label><Input value={form.tag || ""} onChange={(e) => set("tag", e.target.value)} placeholder="e.g. Restaurant" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Sub-tag 1</Label><Input value={form.sub_tag_1 || ""} onChange={(e) => set("sub_tag_1", e.target.value)} /></div>
            <div><Label>Sub-tag 2</Label><Input value={form.sub_tag_2 || ""} onChange={(e) => set("sub_tag_2", e.target.value)} /></div>
          </div>


          <div>
            <Label>Description</Label>
            <MarkdownToolbar textareaRef={descRef} value={form.description || ""} onChange={(val) => set("description", val)} />
            <Textarea ref={descRef} rows={4} value={form.description || ""} onChange={(e) => set("description", e.target.value)} />
            <p className="text-[11px] text-muted-foreground mt-1">
              Formatting: <code>**bold**</code>, <code>## Subtitle</code> on its own line, <code>[link text](https://link.com)</code>. Leave a blank line between paragraphs.
            </p>
          </div>

          {/* Dual images with locked default crop */}
          <div>
            <Label>Card Cover Image <span className="text-xs text-muted-foreground font-normal">(shown on the specials listing — 3:4)</span></Label>
            <ImageUpload bucket="listing-images" value={form.image_url || ""} onChange={(url) => set("image_url", url)} aspect={4/3} />
          </div>
          <div>
            <Label>Detail Cover Image <span className="text-xs text-muted-foreground font-normal">(shown on the individual special page — 4:3)</span></Label>
            <ImageUpload bucket="listing-images" value={form.detail_image_url || ""} onChange={(url) => set("detail_image_url", url)} aspect={4/3} />
          </div>
          <div>
            <Label>Homepage Featured Image <span className="text-xs text-muted-foreground font-normal">(shown in the homepage Active Specials section — 1:1. Falls back to card image if empty.)</span></Label>
            <ImageUpload bucket="listing-images" value={form.homepage_image_url || ""} onChange={(url) => set("homepage_image_url", url)} aspect={1} />
          </div>
          <div>
            <Label>Saved Card Cover Image <span className="text-xs text-muted-foreground font-normal">(shown on user Saved cards — 4:3. Falls back to card image if empty.)</span></Label>
            <ImageUpload bucket="listing-images" value={form.saved_image_url || ""} onChange={(url) => set("saved_image_url", url)} aspect={4/3} />
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

          <div className="flex items-center gap-2">
            <Switch
              id="special-dlg-featured"
              checked={!!form.is_featured}
              onCheckedChange={(v) => set("is_featured", v)}
            />
            <Label htmlFor="special-dlg-featured" className="text-sm cursor-pointer font-normal">
              Featured — pinned to the top of the specials list and homepage
            </Label>
          </div>


          {/* Simplified price block */}
          <div className="border rounded-md p-3 space-y-3">
            <p className="text-sm font-medium">Price</p>
            <div><Label>Price</Label><Input value={form.price || ""} onChange={(e) => set("price", e.target.value)} placeholder="e.g. R480 or 20% OFF" /></div>
            <div><Label>Price Notes <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label><Input value={form.price_label || ""} onChange={(e) => set("price_label", e.target.value)} placeholder="e.g. per person, weekends only" /></div>
            <div><Label>Original Price <span className="text-xs text-muted-foreground font-normal">(optional — strikethrough)</span></Label><Input value={form.original_price || ""} onChange={(e) => set("original_price", e.target.value)} /></div>
            
          </div>

          <div><Label>Promo Code</Label><Input value={form.promo_code || ""} onChange={(e) => set("promo_code", e.target.value)} /></div>
          <ListingContactPicker
            listings={listings || []}
            onApply={(c) => setForm((f: any) => ({ ...f, ...c }))}
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
            label="WhatsApp"
            type="tel"
            primary={form.contact_whatsapp || ""}
            onPrimaryChange={(v) => set("contact_whatsapp", v)}
            extras={form.additional_whatsapps || []}
            onExtrasChange={(v) => set("additional_whatsapps", v)}
            addLabel="Add WhatsApp"
          />
          <div><Label>Contact Email</Label><Input type="email" value={form.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} placeholder="e.g. info@example.com" /></div>
          <div><Label>Booking Link</Label><Input value={form.booking_link || ""} onChange={(e) => set("booking_link", e.target.value)} /></div>
          <div><Label>Booking Link Display Text <span className="text-xs text-muted-foreground"></span></Label><Input value={form.booking_link_label || ""} onChange={(e) => set("booking_link_label", e.target.value)} placeholder="e.g. Book on Quicket" /></div>
          
          <div>
            <Label>Terms <span className="text-xs text-muted-foreground font-normal">(add one per line — each appears as its own bullet)</span></Label>
            <TermsEditor value={form.terms || ""} onChange={(v) => set("terms", v)} />
          </div>
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
