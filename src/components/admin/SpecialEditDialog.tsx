import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  special: any;
}

const FIELDS: (keyof any)[] = [
  "title", "description", "business_name", "business_id", "image_url", "deal_label",
  "valid_from", "valid_until", "is_active", "special_type", "price",
  "original_price", "promo_code", "contact_phone", "contact_whatsapp",
  "booking_link", "booking_link_label", "terms", "category",
];

const SpecialEditDialog = ({ open, onOpenChange, special }: Props) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(special);

  useEffect(() => { setForm(special); }, [special, open]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {};
      FIELDS.forEach((k) => { payload[k] = form[k] ?? null; });
      const { error } = await supabase.from("specials").update(payload).eq("id", special.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Special updated");
      qc.invalidateQueries({ queryKey: ["special-detail", special.id] });
      qc.invalidateQueries({ queryKey: ["home-specials"] });
      qc.invalidateQueries({ queryKey: ["homepage-specials"] });
      qc.invalidateQueries({ queryKey: ["admin-specials"] });
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
            <p className="text-xs text-muted-foreground mt-1">Linking allows users to tap the business name to view the full listing.</p>
          </div>
          <div><Label>Deal Label</Label><Input value={form.deal_label || ""} onChange={(e) => set("deal_label", e.target.value)} /></div>
          <div><Label>Description</Label><Textarea rows={4} value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></div>
          <div><Label>Image</Label><ImageUpload bucket="listing-images" value={form.image_url || ""} onChange={(url) => set("image_url", url)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Valid From</Label><Input type="date" value={form.valid_from || ""} onChange={(e) => set("valid_from", e.target.value || null)} /></div>
            <div><Label>Valid Until</Label><Input type="date" value={form.valid_until || ""} onChange={(e) => set("valid_until", e.target.value || null)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Price</Label><Input value={form.price || ""} onChange={(e) => set("price", e.target.value)} /></div>
            <div><Label>Original Price</Label><Input value={form.original_price || ""} onChange={(e) => set("original_price", e.target.value)} /></div>
          </div>
          <div><Label>Promo Code</Label><Input value={form.promo_code || ""} onChange={(e) => set("promo_code", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Contact Phone</Label><Input value={form.contact_phone || ""} onChange={(e) => set("contact_phone", e.target.value)} /></div>
            <div><Label>WhatsApp</Label><Input value={form.contact_whatsapp || ""} onChange={(e) => set("contact_whatsapp", e.target.value)} /></div>
          </div>
          <div><Label>Booking Link</Label><Input value={form.booking_link || ""} onChange={(e) => set("booking_link", e.target.value)} /></div>
          <div><Label>Booking Link Display Text <span className="text-xs text-muted-foreground">(optional — shown instead of the URL)</span></Label><Input value={form.booking_link_label || ""} onChange={(e) => set("booking_link_label", e.target.value)} placeholder="e.g. Book on Quicket" /></div>
          <div><Label>Category</Label><Input value={form.category || ""} onChange={(e) => set("category", e.target.value)} /></div>
          <div><Label>Special Type</Label><Input value={form.special_type || ""} onChange={(e) => set("special_type", e.target.value)} /></div>
          <div><Label>Terms</Label><Textarea rows={3} value={form.terms || ""} onChange={(e) => set("terms", e.target.value)} /></div>
          <div className="flex items-center gap-2"><Switch checked={!!form.is_active} onCheckedChange={(v) => set("is_active", v)} /><Label>Active</Label></div>
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
