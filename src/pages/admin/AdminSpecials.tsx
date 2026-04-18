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
import ImageUpload from "@/components/admin/ImageUpload";
import { Plus, Pencil, Trash2, X, FileSpreadsheet } from "lucide-react";
import { Link } from "react-router-dom";

interface Special {
  id: string;
  title: string;
  description: string | null;
  business_name: string;
  business_id: string | null;
  image_url: string | null;
  deal_label: string;
  valid_until: string | null;
  is_active: boolean;
  sort_order: number;
  special_type: string | null;
  day_of_week: string[] | null;
  valid_from: string | null;
  price: string | null;
  original_price: string | null;
  booking_required: boolean;
  booking_link: string | null;
  promo_code: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  terms: string | null;
  category: string | null;
}

const emptyForm: Omit<Special, "id"> = {
  title: "",
  description: "",
  business_name: "",
  business_id: null,
  image_url: null,
  deal_label: "",
  valid_until: null,
  is_active: true,
  sort_order: 0,
  special_type: null,
  day_of_week: null,
  valid_from: null,
  price: null,
  original_price: null,
  booking_required: false,
  booking_link: null,
  promo_code: null,
  contact_phone: null,
  contact_whatsapp: null,
  terms: null,
  category: null,
};

const SPECIAL_TYPES = [
  { value: "daily", label: "Daily Special" },
  { value: "weekly", label: "Weekly Special" },
  { value: "monthly", label: "Monthly Special" },
  { value: "seasonal", label: "Seasonal Special" },
  { value: "ongoing", label: "Ongoing" },
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const CATEGORIES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "accommodation", label: "Accommodation" },
  { value: "activity", label: "Activity" },
  { value: "wellness", label: "Wellness" },
  { value: "shopping", label: "Shopping" },
  { value: "other", label: "Other" },
];

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

  const { data: specials, isLoading } = useQuery({
    queryKey: ["admin-specials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specials")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Special[];
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
      if (editing) {
        const { error } = await supabase
          .from("specials")
          .update(form as any)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("specials").insert(form as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-specials"] });
      toast.success(editing ? "Special updated" : "Special created");
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
      description: s.description,
      business_name: s.business_name,
      business_id: s.business_id,
      image_url: s.image_url,
      deal_label: s.deal_label,
      valid_until: s.valid_until,
      is_active: s.is_active,
      sort_order: s.sort_order,
      special_type: s.special_type,
      day_of_week: s.day_of_week,
      valid_from: s.valid_from,
      price: s.price,
      original_price: s.original_price,
      booking_required: s.booking_required,
      booking_link: s.booking_link,
      promo_code: s.promo_code,
      contact_phone: s.contact_phone,
      contact_whatsapp: s.contact_whatsapp,
      terms: s.terms,
      category: s.category,
    });
  };

  const toggleDay = (day: string) => {
    const current = form.day_of_week || [];
    if (day === "all") {
      setForm({ ...form, day_of_week: current.includes("all") ? [] : ["all"] });
      return;
    }
    const without = current.filter((d) => d !== "all");
    const updated = without.includes(day) ? without.filter((d) => d !== day) : [...without, day];
    setForm({ ...form, day_of_week: updated.length ? updated : null });
  };

  const showForm = creating;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 lg:mb-8">
        <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">Specials</h1>
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
            <h2 className="font-heading text-xl font-semibold text-foreground">
              {editing ? "Edit Special" : "New Special"}
            </h2>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </div>

          <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Deal Label * (e.g. "20% OFF", "2 FOR 1")</Label><Input value={form.deal_label} onChange={(e) => setForm({ ...form, deal_label: e.target.value })} /></div>
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
          <div>
            <Label>Image</Label>
            <ImageUpload bucket="listing-images" value={form.image_url || ""} onChange={(url) => setForm({ ...form, image_url: url })} />
          </div>

          <GroupLabel>Type &amp; Timing</GroupLabel>
          <div>
            <Label>Special Type</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.special_type || ""}
              onChange={(e) => setForm({ ...form, special_type: e.target.value || null })}
            >
              <option value="">— Select —</option>
              {SPECIAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {(form.special_type === "daily" || form.special_type === "weekly") && (
            <div>
              <Label className="mb-2 block">Day(s) of Week</Label>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={(form.day_of_week || []).includes("all")}
                    onCheckedChange={() => toggleDay("all")}
                  />
                  All
                </label>
                {DAYS.map((day) => (
                  <label key={day} className="flex items-center gap-1.5 text-sm capitalize">
                    <Checkbox
                      checked={(form.day_of_week || []).includes(day)}
                      onCheckedChange={() => toggleDay(day)}
                      disabled={(form.day_of_week || []).includes("all")}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div><Label>Valid From (optional)</Label><Input type="date" value={form.valid_from || ""} onChange={(e) => setForm({ ...form, valid_from: e.target.value || null })} /></div>
          <div><Label>Valid Until (leave empty for ongoing)</Label><Input type="date" value={form.valid_until || ""} onChange={(e) => setForm({ ...form, valid_until: e.target.value || null })} /></div>

          <GroupLabel>Pricing</GroupLabel>
          <div><Label>Deal Price (e.g. R145, R450pp)</Label><Input placeholder="R" value={form.price || ""} onChange={(e) => setForm({ ...form, price: e.target.value || null })} /></div>
          <div><Label>Original Price (optional, for showing savings)</Label><Input placeholder="R" value={form.original_price || ""} onChange={(e) => setForm({ ...form, original_price: e.target.value || null })} /></div>

          <GroupLabel>Booking</GroupLabel>
          <div className="flex items-center gap-3">
            <Switch checked={form.booking_required} onCheckedChange={(v) => setForm({ ...form, booking_required: v })} />
            <Label>Booking required</Label>
          </div>
          <div><Label>Booking Link (optional)</Label><Input placeholder="https://" value={form.booking_link || ""} onChange={(e) => setForm({ ...form, booking_link: e.target.value || null })} /></div>
          <div><Label>Promo Code (optional)</Label><Input placeholder="e.g. WINTER2026" value={form.promo_code || ""} onChange={(e) => setForm({ ...form, promo_code: e.target.value || null })} /></div>

          <GroupLabel>Contact</GroupLabel>
          <div><Label>Contact Phone (optional)</Label><Input value={form.contact_phone || ""} onChange={(e) => setForm({ ...form, contact_phone: e.target.value || null })} /></div>
          <div><Label>WhatsApp (optional)</Label><Input value={form.contact_whatsapp || ""} onChange={(e) => setForm({ ...form, contact_whatsapp: e.target.value || null })} /></div>

          <GroupLabel>Other</GroupLabel>
          <div><Label>Terms & Conditions (optional)</Label><Textarea placeholder="e.g. T's & C's apply. Sit down only." value={form.terms || ""} onChange={(e) => setForm({ ...form, terms: e.target.value || null })} style={{ minHeight: 80 }} /></div>
          <div>
            <Label>Category</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.category || ""}
              onChange={(e) => setForm({ ...form, category: e.target.value || null })}
            >
              <option value="">— Select —</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-border pt-4 mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
            <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} /></div>

            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title || !form.deal_label || !form.business_name}>
              {editing ? "Update Special" : "Create Special"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !specials?.length ? (
        <p className="text-muted-foreground">No specials yet. Click "Add Special" to create one.</p>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {specials.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              {s.image_url && (
                <img src={s.image_url} alt={s.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground truncate">{s.title}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">{s.deal_label}</span>
                  {!s.is_active && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">Inactive</span>}
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
    </div>
  );
};

export default AdminSpecials;
