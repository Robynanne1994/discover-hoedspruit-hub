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
import { Plus, X, Tag, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import ImageSlotField from "@/components/admin/ImageSlotField";
import GalleryUpload from "@/components/admin/GalleryUpload";
import { specialTagList, tagColumns } from "@/lib/specialTags";
import { SPECIAL_IMAGE_SLOTS } from "@/lib/specialImageSlots";
import MultiContactField from "@/components/admin/MultiContactField";
import ListingContactPicker from "@/components/admin/ListingContactPicker";
import { BOOKING_LINK_TYPES, editorBookingLinkType } from "@/lib/bookingLink";
import { parseLinkPairs, serializeLinkPairs, parseBookings, serializeBookings, type LinkPair, type BookingEntry } from "@/lib/specialLinks";
import { sanitizeContactArray, sanitizeContactPairs } from "@/lib/contacts";
import MarkdownToolbar from "@/components/admin/MarkdownToolbar";
import DayOfWeekPicker from "@/components/admin/DayOfWeekPicker";
import { discountTypeHint, discountTypeUsesValue } from "@/lib/discountFields";
import { parseDays } from "@/lib/specialDays";
import SpecialAudienceField from "@/components/admin/SpecialAudienceField";
import {
  ADMIN_EDITOR_DIALOG,
  ADMIN_FIELD_GRID_TIGHT,
  ADMIN_IMAGE_GRID,
} from "@/lib/adminEditorLayout";


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  special: any;
}

/**
 * The special's terms, one bullet per line.
 *
 * Built like the listings' "Good to know" editor — a single line per term and
 * one line to add the next — rather than a stack of two-row textareas. A term
 * is a short sentence, so the tall boxes bought nothing and pushed the rest of
 * the form off the screen.
 */
export const TermsEditor = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
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
    <div className="space-y-1.5 mt-1">
      {items.map((t, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Input value={t} onChange={(e) => edit(i, e.target.value)} className="h-9 text-sm" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
            onClick={() => remove(i)}
            aria-label="Remove term"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <Input
          className="h-9 text-sm"
          placeholder="e.g. Sit-down only, then press Enter"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); add(); }
          }}
          onBlur={add}
        />
        <Button type="button" variant="default" size="sm" className="h-7 px-2.5 text-xs shrink-0" onClick={add} disabled={!draft.trim()}>
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
};

const FIELDS: (keyof any)[] = [
  "title", "title_override", "description", "business_name", "business_id",
  "image_url", "detail_image_url", "homepage_image_url", "saved_image_url", "featured_image_url", "search_image_url", "gallery_images", "badge_override",
  "deal_type", "day_of_week", "discount_type", "discount_value", "special_type", "freebie_text", "card_deal_text", "redemption_note",
  "valid_from", "valid_until", "card_footer_text", "is_active", "auto_activate_on_image", "is_featured",
  "price", "price_label", "original_price", "savings",
  "promo_code", "contact_phone", "contact_whatsapp", "contact_email", "additional_phones", "additional_whatsapps", "additional_emails",
  "phone_label", "email_label", "whatsapp_label",
  "booking_link", "booking_link_label", "booking_link_type", "terms", "tag", "sub_tag_1", "sub_tag_2",
  "social_media_link", "social_media_label", "special_link", "special_link_label", "booking_required", "is_done", "whos_it_for",
];

const SELECT_CLS = "flex h-10 w-full appearance-none rounded-md border border-gray-950 bg-slate-50 px-3 py-2 pr-9 text-sm text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const DEAL_TYPES = ["weekly", "date_range", "monthly", "ongoing"];
const DISCOUNT_TYPES = ["percent_off", "amount_off", "fixed_price", "buy_x_get_y", "freebie"];

const SpecialEditDialog = ({ open, onOpenChange, special }: Props) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(special);
  const descRef = useRef<HTMLTextAreaElement>(null);

  // Always-active toggle: on means no dates (ongoing). Turning it off unlocks
  // the date fields so dates can be added.
  const [isAlwaysActive, setIsAlwaysActive] = useState<boolean>(
    !special?.valid_from && !special?.valid_until
  );

  useEffect(() => {
    setForm(special);
    setIsAlwaysActive(!special?.valid_from && !special?.valid_until);
  }, [special, open]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {};
      FIELDS.forEach((k) => { payload[k] = form[k] ?? null; });
      payload.gallery_images = form.gallery_images ?? [];
      for (const k of ["phone", "email", "whatsapp"] as const) {
        const pr = sanitizeContactPairs(form[`additional_${k}s`], form[`additional_${k}_labels`]);
        payload[`additional_${k}s`] = pr.values;
        payload[`additional_${k}_labels`] = pr.labels;
        payload[`${k}_label`] = (form[`${k}_label`] || "").trim() || null;
      }
      payload.title_override = (form.title_override || "").trim() || null;
      for (const k of ["social_media", "special_link"] as const) {
        const col = k === "social_media" ? "social_media_link" : "special_link";
        const lab = k === "social_media" ? "social_media_label" : "special_link_label";
        const so = serializeLinkPairs(parseLinkPairs(form[col], form[lab]));
        payload[col] = so.link || null;
        payload[lab] = so.label || null;
      }
      const bk = serializeBookings(parseBookings(form.booking_link_type, form.booking_link, form.booking_link_label));
      payload.booking_required = !!form.booking_required;
      payload.booking_link = bk.link || null;
      payload.booking_link_type = bk.type || null;
      payload.booking_link_label = bk.label || null;
      payload.is_done = form.deal_type === "ongoing" && !form.valid_until && !!form.is_done;
      Object.assign(payload, tagColumns(specialTagList(form)));
      // Legacy rows may still hold a bare day name; the column takes a list.
      const days = parseDays(form.day_of_week);
      payload.day_of_week = days.length ? days : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Expiry still retires a deal, but saving can never reactivate a deliberate FALSE.
      payload.is_active = !payload.is_done && form.is_active !== false && !(form.valid_until && new Date(form.valid_until) < today);
      const { error } = await supabase.from("specials").update(payload).eq("id", special.id);
      if (error) throw error;
    },
    onSuccess: () => {
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

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

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
      <DialogContent className={ADMIN_EDITOR_DIALOG}>
        <DialogHeader><DialogTitle>Edit Special</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          {/* Title takes three columns; the Featured toggle sits beside it in the fourth. */}
          <div className="grid grid-cols-1 gap-3 items-end sm:grid-cols-4">
            <div className="space-y-2 sm:col-span-3">
              <Label>Title</Label>
              <Input
                value={form.title || ""}
                // With "use exactly as typed" on, the override follows the title
                // field — there is no second box to keep in step.
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    title: e.target.value,
                    ...(String(f.title_override || "").trim() ? { title_override: e.target.value } : {}),
                  }))
                }
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-2 sm:col-span-1">
              <div className="flex items-center gap-2">
                <Switch
                  id="special-dlg-featured"
                  className="h-7 w-12 origin-left scale-110"
                  checked={!!form.is_featured}
                  onCheckedChange={(v) => set("is_featured", v)}
                />
                <Label htmlFor="special-dlg-featured" className="cursor-pointer font-normal">Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="special-dlg-active"
                  className="h-7 w-12 origin-left scale-110"
                  checked={!!form.is_active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v, auto_activate_on_image: false }))}
                />
                <Label htmlFor="special-dlg-active" className="cursor-pointer font-normal">Active</Label>
              </div>
            </div>
          </div>
          <p className="mt-6 mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">Business</p>
          <div className={ADMIN_FIELD_GRID_TIGHT}>
            <div><Label>Business Name</Label><Input value={form.business_name || ""} onChange={(e) => set("business_name", e.target.value)} /></div>
            <div>
              <Label>Linked Business Listing</Label>
              {selectedListing ? (
                <div className="flex items-center gap-2">
                  <Input readOnly value={selectedListing.title} />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove linked listing"
                    className="h-7 w-7 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
                    onClick={() => set("business_id", null)}>
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </Button>
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tags / Categories</Label><TagRowsEditor value={specialTagList(form)} onChange={(t) => setForm((f: any) => ({ ...f, tags: t, tag: t[0] ?? null, sub_tag_1: null, sub_tag_2: null }))} /></div>
          </div>
          <p className="mt-6 mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">Card Display</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Badge Override <span className="text-xs text-muted-foreground">(card pill text, e.g. "20% OFF")</span></Label><Input value={form.badge_override || ""} onChange={(e) => set("badge_override", e.target.value)} placeholder="Badge override, leave blank to auto-generate" /></div>
            <div>
              <Label>Short Card Deal Text</Label>
              <Input value={form.card_deal_text || ""} onChange={(e) => set("card_deal_text", e.target.value)} placeholder="e.g. Free breakfast" />
              <p className="text-xs text-muted-foreground mt-1">
                Shown in place of the deal text on the listing, homepage and saved cards when the full wording is too long. Leave blank to use the freebie / savings text everywhere.
              </p>
            </div>
          </div>
          <p className="mt-6 mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">The Special</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="special-type">Special Type</Label><Input id="special-type" value={form.special_type || ""} onChange={(e) => set("special_type", e.target.value)} placeholder="e.g. Dinner Deal" /></div>
            <div><SpecialAudienceField value={form.whos_it_for} onChange={(value) => set("whos_it_for", value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Deal Type</Label>
              <div className="relative mt-1"><select className={SELECT_CLS} value={form.deal_type || ""} onChange={(e) => set("deal_type", e.target.value || null)}>
                <option value="">None</option>
                {DEAL_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" strokeWidth={2.75} aria-hidden /></div>
            </div>
            <div>
              <Label>Days Of The Week</Label>
              <DayOfWeekPicker
                value={form.day_of_week}
                onChange={(days) => set("day_of_week", days)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 items-start">
            <div className="space-y-2">
              <Label className="block">Discount Type</Label>
              <div className="relative"><select
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
              </select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" strokeWidth={2.75} aria-hidden /></div>
              {discountTypeHint(form.discount_type) && (
                <p className="text-xs text-muted-foreground">{discountTypeHint(form.discount_type)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="block">Redemption Note</Label>
              <Input value={form.redemption_note || ""} onChange={(e) => set("redemption_note", e.target.value)} placeholder="e.g. Book direct on their website" />
            </div>
          </div>
          <div className={ADMIN_FIELD_GRID_TIGHT}>
            <div>
              <Label>Freebie Text</Label>
              <Input value={form.freebie_text || ""} onChange={(e) => set("freebie_text", e.target.value)} placeholder="e.g. Free breakfast and game drive included" />
              {form.discount_type === "freebie" && (
                <p className="text-xs text-muted-foreground mt-1">Shown on the card in place of a price</p>
              )}
            </div>
            {discountTypeUsesValue(form.discount_type) && (
              <div>
                <Label>{form.discount_type === "percent_off" ? "Percent Off" : "Amount off"}</Label>
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




          <p className="mt-6 mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">Description</p>
          <div>
            <MarkdownToolbar textareaRef={descRef} value={form.description || ""} onChange={(val) => set("description", val)} />
            <Textarea ref={descRef} rows={4} value={form.description || ""} onChange={(e) => set("description", e.target.value)} />
            <p className="text-[11px] text-muted-foreground mt-1">
              Formatting: <code>**bold**</code>, <code>## Subtitle</code> on its own line, <code>[link text](https://link.com)</code>. Leave a blank line between paragraphs.
            </p>
          </div>

          {/* One picture per place the special appears, each locked to that
              screen's box and drawn with the chrome it lands under. */}
          <div className="space-y-3">
            <p className="mt-6 mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">Images</p>
            <div className={ADMIN_IMAGE_GRID}>
              {SPECIAL_IMAGE_SLOTS.map((slot) => (
                <ImageSlotField
                  key={slot.key}
                  slot={slot}
                  value={form[slot.field] || ""}
                  onChange={(url) => set(slot.field, url)}
                />
              ))}
            </div>
            <GalleryUpload
              folder="specials"
              value={(form.gallery_images ?? []).join("\n")}
              onChange={(value) => set("gallery_images", value.split("\n").map((url) => url.trim()).filter(Boolean))}
            />
          </div>

          {/* Validity + always active */}
          <div className="space-y-2">
            <p className="mt-6 mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">Validity</p>
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
            <div className="flex items-center gap-2">
              <Checkbox
                id="special-always-active"
                checked={isAlwaysActive}
                onCheckedChange={(v) => {
                  const on = v === true;
                  setIsAlwaysActive(on);
                  if (on) {
                    set("valid_from", null);
                    set("valid_until", null);
                  }
                }}
              />
              <Label htmlFor="special-always-active" className="text-sm cursor-pointer font-normal">
                Always active — ongoing until further notice
              </Label>
            </div>
            {form.deal_type === "ongoing" && !form.valid_until && (
              <div className="flex items-center gap-2">
                <Switch
                  id="special-done"
                  className="h-7 w-12 origin-left scale-110"
                  checked={!!form.is_done}
                  onCheckedChange={(v) => setForm((f: any) => ({ ...f, is_done: v, is_active: !v }))}
                />
                <Label htmlFor="special-done" className="text-sm cursor-pointer font-normal">
                  Done: {form.is_done ? "Yes, moved to Past Specials" : "No"}
                </Label>
              </div>
            )}
          </div>

          <p className="mt-6 mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">Pricing</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Price</Label><Input value={form.price || ""} onChange={(e) => set("price", e.target.value)} placeholder="e.g. R480 or 20% OFF" /></div>
            <div><Label>Price Notes</Label><Input value={form.price_label || ""} onChange={(e) => set("price_label", e.target.value)} placeholder="e.g. per person, weekends only" /></div>
            <div><Label>Original Price</Label><Input value={form.original_price || ""} onChange={(e) => set("original_price", e.target.value)} /></div>
            <div><Label>Promo Code</Label><Input value={form.promo_code || ""} onChange={(e) => set("promo_code", e.target.value)} /></div>
          </div>
          <p className="mt-6 mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">Contacts</p>
          <ListingContactPicker
            listings={listings || []}
            onApply={(c) => setForm((f) => ({ ...f, ...c }))}
            className="mb-3"
          />
          <div className={ADMIN_FIELD_GRID_TIGHT}>
            <MultiContactField
              label="WhatsApp"
              type="tel"
              primary={form.contact_whatsapp || ""}
              onPrimaryChange={(v) => set("contact_whatsapp", v)}
              extras={form.additional_whatsapps || []}
              onExtrasChange={(v, labels) => {
                set("additional_whatsapps", v);
                if (labels) set("additional_whatsapp_labels", labels);
              }}
              primaryLabel={form.whatsapp_label || ""}
              onPrimaryLabelChange={(v) => set("whatsapp_label", v)}
              extraLabels={form.additional_whatsapp_labels || []}
              onExtraLabelsChange={(v) => set("additional_whatsapp_labels", v)}
              addLabel="Add"
            />
            <MultiContactField
              label="Email"
              type="email"
              primary={form.contact_email || ""}
              onPrimaryChange={(v) => set("contact_email", v)}
              extras={form.additional_emails || []}
              onExtrasChange={(v, labels) => {
                set("additional_emails", v);
                if (labels) set("additional_email_labels", labels);
              }}
              primaryLabel={form.email_label || ""}
              onPrimaryLabelChange={(v) => set("email_label", v)}
              extraLabels={form.additional_email_labels || []}
              onExtraLabelsChange={(v) => set("additional_email_labels", v)}
              addLabel="Add"
            />
            <MultiContactField
              label="Phone"
              type="tel"
              primary={form.contact_phone || ""}
              onPrimaryChange={(v) => set("contact_phone", v)}
              extras={form.additional_phones || []}
              onExtrasChange={(v, labels) => {
                set("additional_phones", v);
                if (labels) set("additional_phone_labels", labels);
              }}
              primaryLabel={form.phone_label || ""}
              onPrimaryLabelChange={(v) => set("phone_label", v)}
              extraLabels={form.additional_phone_labels || []}
              onExtraLabelsChange={(v) => set("additional_phone_labels", v)}
              addLabel="Add"
            />
            <LinkPairsField
              label="Special Link"
              requireLabel
              pairs={parseLinkPairs(form.special_link, form.special_link_label)}
              onChange={(pairs) => setForm((f: any) => ({ ...f, ...pairFields("special_link", pairs) }))}
            />
            <LinkPairsField
              label="Social Media"
              pairs={parseLinkPairs(form.social_media_link, form.social_media_label)}
              onChange={(pairs) => setForm((f: any) => ({ ...f, ...pairFields("social_media", pairs) }))}
            />
          </div>
          <p className="mt-6 mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">Booking</p>
          <div className="flex items-center gap-2 mb-3">
            <Switch
              id="special-dlg-booking-required"
              className="h-7 w-12 origin-left scale-110"
              checked={!!form.booking_required}
              onCheckedChange={(v) => set("booking_required", v)}
            />
            <Label htmlFor="special-dlg-booking-required" className="cursor-pointer font-normal">Booking Required</Label>
          </div>
          {form.booking_required && (
            <BookingRows
              entries={parseBookings(form.booking_link_type, form.booking_link, form.booking_link_label)}
              onChange={(entries) => setForm((f: any) => {
                const raw = {
                  booking_link: entries.map((e) => e.link).join("|"),
                  booking_link_type: entries.map((e) => e.type || "-").join("|"),
                  booking_link_label: entries.map((e) => e.label || "-").join("|"),
                };
                return { ...f, ...raw };
              })}
            />
          )}

          <div>
            <p className="mt-6 mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">Terms &amp; Conditions</p>
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

function TagRowsEditor({ value, onChange }: { value: string[]; onChange: (t: string[]) => void }) {
  const [rows, setRows] = useState<string[]>(value.length ? value : [""]);
  const push = (next: string[]) => {
    setRows(next);
    onChange(next.map((t) => t.trim()).filter(Boolean));
  };
  return (
    <div className="space-y-2">
      {rows.map((t, i) => (
        <div key={i} className="flex gap-2">
          <Input value={t} onChange={(e) => push(rows.map((r, j) => (j === i ? e.target.value : r)))} />
          {rows.length > 1 && (
            <Button type="button" variant="ghost" size="icon" aria-label="Remove tag"
              className="h-7 w-7 shrink-0 self-center rounded-full bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
              onClick={() => push(rows.filter((_, j) => j !== i))}>
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="h-7 px-2.5 text-xs" onClick={() => setRows([...rows, ""])}>
        <Plus className="h-3 w-3 mr-1" />
        Add
      </Button>
    </div>
  );
}


const pairFields = (k: "social_media" | "special_link", pairs: LinkPair[]) => {
  const col = k === "social_media" ? "social_media_link" : "special_link";
  const lab = k === "social_media" ? "social_media_label" : "special_link_label";
  // Kept raw while editing so a blank new row survives; tidied on save.
  return { [col]: pairs.map((p) => p.link).join("|"), [lab]: pairs.map((p) => p.label || "-").join("|") };
};

const ROUND_X = "h-7 w-7 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground";
const LABEL_BTN = "h-auto p-0 text-xs font-semibold text-foreground hover:text-primary no-underline hover:no-underline inline-flex items-center gap-1";

function CustomLabel({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  if (!open && !value.trim()) {
    return (
      <Button variant="link" type="button" onClick={() => setOpen(true)} className={LABEL_BTN}>
        <Tag className="h-3 w-3" /> Add Custom Label
      </Button>
    );
  }
  return (
    <div className="flex gap-2 items-center">
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs" />
      <Button type="button" variant="ghost" size="icon" className={ROUND_X} aria-label="Remove label" onClick={() => { onChange(""); setOpen(false); }}>
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
      </Button>
    </div>
  );
}

function LinkPairsField({ label, pairs, onChange, requireLabel }: { label: string; pairs: LinkPair[]; onChange: (p: LinkPair[]) => void; requireLabel?: boolean }) {
  const rows = pairs.length ? pairs : [{ link: "", label: "" }];
  const edit = (i: number, patch: Partial<LinkPair>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={i} className="space-y-1.5">
          <Label>{rows.length > 1 ? `${label} ${i + 1}` : label}</Label>
          <div className="flex gap-2 items-center">
            <Input value={r.link} onChange={(e) => edit(i, { link: e.target.value })} placeholder="https://…" />
            {rows.length > 1 && (
              <Button type="button" variant="ghost" size="icon" className={ROUND_X} aria-label={`Remove ${label}`} onClick={() => onChange(rows.filter((_, j) => j !== i))}>
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </Button>
            )}
          </div>
          <CustomLabel value={r.label} onChange={(v) => edit(i, { label: v })} placeholder={requireLabel ? 'Custom label (e.g. "Shop the Sale")' : 'Custom label (e.g. "Facebook Post")'} />
          {requireLabel && r.link.trim() && !r.label.trim() && (
            <p className="text-xs text-destructive">Add a label, the link only shows with one.</p>
          )}
        </div>
      ))}
      <Button type="button" variant="default" size="sm" className="h-7 px-2.5 text-xs" onClick={() => onChange([...rows, { link: "", label: "" }])}>
        <Plus className="h-3 w-3 mr-1" /> Add
      </Button>
    </div>
  );
}

export function BookingRows({ entries, onChange }: { entries: BookingEntry[]; onChange: (e: BookingEntry[]) => void }) {
  const rows = entries.length ? entries : [{ type: "", link: "", label: "" }];
  const edit = (i: number, patch: Partial<BookingEntry>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-4">
      {rows.map((r, i) => (
        <div key={i} className="grid gap-3 sm:grid-cols-2 items-start">
          <div>
            <Label className="block">{rows.length > 1 ? `Booking Type ${i + 1}` : "Booking Type"}</Label>
            <div className="relative mt-1"><select
              className={SELECT_CLS}
              value={editorBookingLinkType(r.link, r.type)}
              onChange={(e) => edit(i, { type: e.target.value })}
            >
              <option value=""></option>
              {BOOKING_LINK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" strokeWidth={2.75} aria-hidden /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Booking Link / Email / Number</Label>
            <div className="flex gap-2 items-center">
              <Input value={r.link} onChange={(e) => edit(i, { link: e.target.value })} />
              {rows.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className={ROUND_X} aria-label="Remove booking" onClick={() => onChange(rows.filter((_, j) => j !== i))}>
                  <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                </Button>
              )}
            </div>
            <CustomLabel value={r.label} onChange={(v) => edit(i, { label: v })} placeholder='Custom label (e.g. "Book on Quicket")' />
          </div>
        </div>
      ))}
      <Button type="button" variant="default" size="sm" className="h-7 px-2.5 text-xs" onClick={() => onChange([...rows, { type: "", link: "", label: "" }])}>
        <Plus className="h-3 w-3 mr-1" /> Add
      </Button>
    </div>
  );
}
