import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";
import { Plus, Pencil, Trash2, X } from "lucide-react";

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
};

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
    });
  };

  const showForm = creating;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Specials</h1>
        {!showForm && (
          <Button onClick={() => { setCreating(true); setForm(emptyForm); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Special
          </Button>
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
          <div><Label>Valid Until (leave empty for ongoing)</Label><Input type="date" value={form.valid_until || ""} onChange={(e) => setForm({ ...form, valid_until: e.target.value || null })} /></div>
          <div className="flex items-center gap-3">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            <Label>Active</Label>
          </div>
          <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} /></div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title || !form.deal_label || !form.business_name}>
            {editing ? "Update Special" : "Create Special"}
          </Button>
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
