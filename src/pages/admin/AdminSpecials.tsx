import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import ImageSlotField from "@/components/admin/ImageSlotField";
import { specialImageSlot } from "@/lib/specialImageSlots";
import MultiContactField from "@/components/admin/MultiContactField";
import ListingContactPicker from "@/components/admin/ListingContactPicker";
import { sanitizeContactArray } from "@/lib/contacts";
import { Plus, Pencil, Trash2, X, FileSpreadsheet } from "lucide-react";
import { Link } from "react-router-dom";
import { getSpecialBadge } from "@/lib/specialBadge";
import { discountTypeHint, discountTypeUsesValue } from "@/lib/discountFields";
import DayOfWeekPicker from "@/components/admin/DayOfWeekPicker";
import { parseDays } from "@/lib/specialDays";


interface Special {
  id: string;
  title: string;
  title_override: string | null;
  description: string | null;
  business_name: string;
  business_id: string | null;
  image_url: string | null;
  badge_override: string | null;
  deal_type: string | null;
  // A list of days — "every Wednesday and Thursday" is a single special.
  day_of_week: string[] | null;
  discount_type: string | null;
  discount_value: number | null;
  freebie_text: string | null;
  card_deal_text: string | null;
  redemption_note: string | null;
  valid_until: string | null;
  valid_from: string | null;
  is_active: boolean;
  is_featured: boolean;
  price: string | null;
  price_label: string | null;
  original_price: string | null;
  booking_required: boolean;
  booking_link: string | null;
  booking_link_label: string | null;
  promo_code: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  additional_emails: string[];
  additional_phones: string[];
  additional_whatsapps: string[];
  terms: string | null;
  tag: string | null;
  sub_tag_1: string | null;
  sub_tag_2: string | null;
}

const SELECT_CLS = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const DEAL_TYPES = ["weekly","date_range","monthly","ongoing"];
const DISCOUNT_TYPES = ["percent_off","amount_off","fixed_price","buy_x_get_y","freebie"];

const emptyForm: Omit<Special, "id"> = {
  title: "",
  title_override: null,
  description: "",
  business_name: "",
  business_id: null,
  image_url: null,
  badge_override: null,
  deal_type: null,
  day_of_week: null,
  discount_type: null,
  discount_value: null,
  freebie_text: null,
  card_deal_text: null,
  redemption_note: null,
  valid_until: null,
  valid_from: null,
  is_active: true,
  is_featured: false,
  price: null,
  price_label: null,
  original_price: null,
  booking_required: false,
  booking_link: null,
  booking_link_label: null,
  promo_code: null,
  contact_phone: null,
  contact_whatsapp: null,
  contact_email: null,
  additional_emails: [],
  additional_phones: [],
  additional_whatsapps: [],
  terms: null,
  tag: null,
  sub_tag_1: null,
  sub_tag_2: null,
};

const stripTrailingZeros = (val: string | null) => {
  if (!val) return val;
  return val.replace(/(\d)\.00\b/g, "$1").replace(/(\d\.\d)0\b/g, "$1");
};

const GroupLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 2, marginTop: 24, marginBottom: 12 }}>
    {children}
  </div>
);

const AdminSpecials = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Special | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<Special, "id">>(emptyForm);
  const [tab, setTab] = useState<"active" | "passed">("active");

  const todayStr = new Date().toISOString().slice(0, 10);
  const isSpecialActive = (s: Special) =>
    s.is_active && (!s.valid_until || s.valid_until >= todayStr);

  const { data: specials, isLoading } = useQuery({
    queryKey: ["admin-specials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Special[];
    },
  });

  const { data: listings } = useQuery({
    queryKey: ["admin-listings-minimal"],
    queryFn: async () => {
      const { data } = await supabase.from("listings").select("id, title").order("title");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isExpired = !!form.valid_until && new Date(form.valid_until) < today;
      const days = parseDays(form.day_of_week);
      const cleaned = {
        ...form,
        is_active: !isExpired,
        day_of_week: days.length ? days : null,
        additional_emails: sanitizeContactArray(form.additional_emails),
        additional_phones: sanitizeContactArray(form.additional_phones),
        additional_whatsapps: sanitizeContactArray(form.additional_whatsapps),
        title_override: (form.title_override || "").trim() || null,
      };
      if (editing) {
        const { error } = await supabase
          .from("specials")
          .update(cleaned as any)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("specials").insert(cleaned as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-specials"] });
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("specials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-specials"] });
      toast.success("Special deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setEditing(null);
    setCreating(false);
    setForm(emptyForm);
  };

  const startEdit = (s: Special) => {
    setEditing(s);
    setCreating(true);
    setForm({
      title: s.title,
      title_override: s.title_override ?? null,
      description: s.description,
      business_name: s.business_name,
      business_id: s.business_id,
      image_url: s.image_url,
      badge_override: (s as any).badge_override ?? null,
      deal_type: (s as any).deal_type ?? null,
      day_of_week: parseDays((s as any).day_of_week),
      discount_type: (s as any).discount_type ?? null,
      discount_value: (s as any).discount_value ?? null,
      freebie_text: (s as any).freebie_text ?? null,
      card_deal_text: (s as any).card_deal_text ?? null,
      redemption_note: (s as any).redemption_note ?? null,
      valid_until: s.valid_until,
      valid_from: s.valid_from,
      is_active: s.is_active,
      is_featured: !!(s as any).is_featured,
      price: s.price,
      price_label: s.price_label ?? null,
      original_price: s.original_price,
      booking_required: s.booking_required,
      booking_link: s.booking_link,
      booking_link_label: s.booking_link_label ?? null,
      promo_code: s.promo_code,
      contact_phone: s.contact_phone,
      contact_whatsapp: s.contact_whatsapp,
      contact_email: s.contact_email ?? null,
      additional_emails: (s.additional_emails ?? []) as string[],
      additional_phones: (s.additional_phones ?? []) as string[],
      additional_whatsapps: (s.additional_whatsapps ?? []) as string[],
      terms: s.terms,
      tag: s.tag ?? null,
      sub_tag_1: s.sub_tag_1 ?? null,
      sub_tag_2: s.sub_tag_2 ?? null,
    });
  };

  const showForm = creating;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 lg:mb-8">
        <h1 className="font-heading text-2xl lg:text-3xl font-[550] text-slate-950">Specials</h1>
        {!showForm && (
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/specials/import">
              <Button variant="outline" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" /> <span className="hidden sm:inline">Import / Export</span><span className="sm:hidden">CSV</span>
              </Button>
            </Link>
            <Button onClick={() => { setCreating(true); setForm(emptyForm); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Special
            </Button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 mb-8 space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-medium text-slate-950">
              {editing ? "Edit Special" : "New Special"}
            </h2>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </div>

          <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Switch
                id="special-use-title-override"
                checked={!!(form.title_override && String(form.title_override).trim())}
                onCheckedChange={(v) => setForm({ ...form, title_override: v ? (form.title_override || form.title || "") : null })}
              />
              <Label htmlFor="special-use-title-override" className="text-sm cursor-pointer font-normal">
                Use custom title (overrides auto-capitalisation)
              </Label>
            </div>
            {!!(form.title_override && String(form.title_override).trim()) && (
              <Textarea
                rows={2}
                className="resize-none"
                placeholder="Custom title — rendered exactly as typed"
                value={form.title_override || ""}
                onChange={(e) => setForm({ ...form, title_override: e.target.value })}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Deal Type</Label>
              <select
                className={SELECT_CLS}
                value={form.deal_type || ""}
                onChange={(e) => setForm({ ...form, deal_type: e.target.value || null })}
              >
                <option value="">None</option>
                {DEAL_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>Days Of The Week (pick as many as the deal runs on)</Label>
            <DayOfWeekPicker
              value={form.day_of_week}
              onChange={(days) => setForm({ ...form, day_of_week: days })}
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
                  setForm({
                    ...form,
                    discount_type: next,
                    discount_value: discountTypeUsesValue(next) ? form.discount_value : null,
                  });
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
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value === "" ? null : Number(e.target.value) })}
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
            <Input value={form.freebie_text || ""} onChange={(e) => setForm({ ...form, freebie_text: e.target.value || null })} placeholder="e.g. Free breakfast and game drive included" />
            {form.discount_type === "freebie" && (
              <p className="text-xs text-muted-foreground mt-1">Shown on the card in place of a price</p>
            )}
          </div>
          <div>
            <Label>Short Card Deal Text (optional)</Label>
            <Input value={form.card_deal_text || ""} onChange={(e) => setForm({ ...form, card_deal_text: e.target.value || null })} placeholder="e.g. Free breakfast" />
            <p className="text-xs text-muted-foreground mt-1">Shown on the listing, homepage and saved cards instead of the full deal text. Leave blank to use the full wording everywhere.</p>
          </div>
          <div><Label>Redemption Note</Label><Input value={form.redemption_note || ""} onChange={(e) => setForm({ ...form, redemption_note: e.target.value || null })} placeholder="e.g. Book direct on their website" /></div>

          <div><Label>Badge override, leave blank to auto-generate</Label><Input value={form.badge_override || ""} onChange={(e) => setForm({ ...form, badge_override: e.target.value || null })} /></div>
          <div><Label>Business Name *</Label><Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></div>
          <div>
            <Label>Link to Listing (optional)</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.business_id || ""}
              onChange={(e) => setForm({ ...form, business_id: e.target.value || null })}
            >
              <option value="">— None —</option>
              {listings?.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
          <div><Label>Description</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          <ImageSlotField
            slot={specialImageSlot("card")}
            value={form.image_url || ""}
            onChange={(url) => setForm({ ...form, image_url: url })}
          />
          <p className="text-[11px] text-muted-foreground">
            The rest of the pictures — individual page, homepage, Top Deals, saved and search — are
            set from the special's own page, where each one previews in the card it lands in.
          </p>

          <GroupLabel>Categories</GroupLabel>
          <div><Label>Tag / Main Category</Label><Input placeholder="e.g. Restaurant" value={form.tag || ""} onChange={(e) => setForm({ ...form, tag: e.target.value || null })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Sub-tag 1</Label><Input value={form.sub_tag_1 || ""} onChange={(e) => setForm({ ...form, sub_tag_1: e.target.value || null })} /></div>
            <div><Label>Sub-tag 2</Label><Input value={form.sub_tag_2 || ""} onChange={(e) => setForm({ ...form, sub_tag_2: e.target.value || null })} /></div>
          </div>

          <GroupLabel>Timing</GroupLabel>
          <div><Label>Valid From (optional)</Label><Input type="date" value={form.valid_from || ""} onChange={(e) => setForm({ ...form, valid_from: e.target.value || null })} /></div>
          <div><Label>Valid Until (leave empty for ongoing)</Label><Input type="date" value={form.valid_until || ""} onChange={(e) => setForm({ ...form, valid_until: e.target.value || null })} /></div>

          <GroupLabel>Pricing</GroupLabel>
          <div><Label>Deal Price (e.g. R145, R450pp)</Label><Input placeholder="R" value={form.price || ""} onChange={(e) => setForm({ ...form, price: stripTrailingZeros(e.target.value) || null })} onBlur={(e) => setForm({ ...form, price: stripTrailingZeros(e.target.value) || null })} /></div>
          <div><Label>Price Notes (shown next to price, optional)</Label><Input placeholder="e.g. per person" value={form.price_label || ""} onChange={(e) => setForm({ ...form, price_label: e.target.value || null })} /></div>
          <div><Label>Original Price (optional, for showing savings)</Label><Input placeholder="R" value={form.original_price || ""} onChange={(e) => setForm({ ...form, original_price: stripTrailingZeros(e.target.value) || null })} onBlur={(e) => setForm({ ...form, original_price: stripTrailingZeros(e.target.value) || null })} /></div>

          <GroupLabel>Visibility</GroupLabel>
          <div className="flex items-center gap-3">
            <Switch checked={!!form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
            <Label>Featured</Label>
          </div>

          <GroupLabel>Booking</GroupLabel>
          <div className="flex items-center gap-3">
            <Switch checked={form.booking_required} onCheckedChange={(v) => setForm({ ...form, booking_required: v })} />
            <Label>Booking required</Label>
          </div>
          <div><Label>Booking Link (optional)</Label><Input placeholder="https://" value={form.booking_link || ""} onChange={(e) => setForm({ ...form, booking_link: e.target.value || null })} /></div>
          <div><Label>Booking Link Display Text (optional)</Label><Input placeholder="e.g. Book on Quicket" value={form.booking_link_label || ""} onChange={(e) => setForm({ ...form, booking_link_label: e.target.value || null })} /></div>
          <div><Label>Promo Code (optional)</Label><Input placeholder="e.g. WINTER2026" value={form.promo_code || ""} onChange={(e) => setForm({ ...form, promo_code: e.target.value || null })} /></div>

          <GroupLabel>Contact</GroupLabel>
          <ListingContactPicker
            listings={listings || []}
            onApply={(c) => setForm({
              ...form,
              contact_phone: c.contact_phone || null,
              contact_whatsapp: c.contact_whatsapp || null,
              additional_phones: c.additional_phones,
              additional_whatsapps: c.additional_whatsapps,
            })}
          />
          <MultiContactField
            label="Contact Phone (optional)"
            type="tel"
            primary={form.contact_phone || ""}
            onPrimaryChange={(v) => setForm({ ...form, contact_phone: v || null })}
            extras={form.additional_phones || []}
            onExtrasChange={(v) => setForm({ ...form, additional_phones: v })}
            addLabel="Add phone"
          />
          <MultiContactField
            label="WhatsApp (optional)"
            type="tel"
            primary={form.contact_whatsapp || ""}
            onPrimaryChange={(v) => setForm({ ...form, contact_whatsapp: v || null })}
            extras={form.additional_whatsapps || []}
            onExtrasChange={(v) => setForm({ ...form, additional_whatsapps: v })}
            addLabel="Add WhatsApp"
          />
          <div><Label>Contact Email (optional)</Label><Input type="email" value={form.contact_email || ""} onChange={(e) => setForm({ ...form, contact_email: e.target.value || null })} /></div>

          <GroupLabel>Other</GroupLabel>
          <div><Label>Terms & Conditions (optional)</Label><Textarea placeholder="e.g. T's & C's apply. Sit down only." value={form.terms || ""} onChange={(e) => setForm({ ...form, terms: e.target.value || null })} style={{ minHeight: 80 }} /></div>

          <div className="border-t border-border pt-4 mt-4 space-y-4">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title || !form.business_name}>
              {editing ? "Update Special" : "Create Special"}
            </Button>
          </div>
        </div>
      )}

      {(() => {
        const filtered = (specials ?? []).filter((s) =>
          tab === "active" ? isSpecialActive(s) : !isSpecialActive(s),
        );
        const activeCount = (specials ?? []).filter(isSpecialActive).length;
        const passedCount = (specials ?? []).length - activeCount;
        return (
          <>
            <div className="flex gap-2 mb-4 max-w-3xl">
              {(["active", "passed"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 h-9 rounded-full text-sm font-medium border transition-colors ${
                    tab === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary"
                  }`}
                >
                  {t === "active" ? "Active" : "Passed"} ({t === "active" ? activeCount : passedCount})
                </button>
              ))}
            </div>

            {isLoading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground">
                {tab === "active" ? "No active specials." : "No passed specials."}
              </p>
            ) : (
              <div className="space-y-3 max-w-3xl">
                {filtered.map((s) => (
                  <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                    {s.image_url && (
                      <img src={s.image_url} alt={s.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-950 truncate">{s.title}</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold text-slate-950">{getSpecialBadge(s as any)}</span>
                        {!isSpecialActive(s) && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">Passed</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{s.business_name} · {s.valid_until ? `Until ${s.valid_until}` : "Ongoing"}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this special?")) deleteMutation.mutate(s.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
};

export default AdminSpecials;
