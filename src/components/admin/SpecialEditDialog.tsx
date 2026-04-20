import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  "title", "description", "business_name", "image_url", "deal_label",
  "valid_from", "valid_until", "is_active", "special_type", "price",
  "original_price", "promo_code", "contact_phone", "contact_whatsapp",
  "booking_link", "terms", "category",
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

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Special</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label>Title</Label><Input value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></div>
          <div><Label>Business Name</Label><Input value={form.business_name || ""} onChange={(e) => set("business_name", e.target.value)} /></div>
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
          <div><Label>Category</Label><Input value={form.category || ""} onChange={(e) => set("category", e.target.value)} /></div>
          <div><Label>Special Type</Label><Input value={form.special_type || ""} onChange={(e) => set("special_type", e.target.value)} /></div>
          <div><Label>Terms</Label><Textarea rows={3} value={form.terms || ""} onChange={(e) => set("terms", e.target.value)} /></div>
          <div className="flex items-center gap-2"><Switch checked={!!form.is_active} onCheckedChange={(v) => set("is_active", v)} /><Label>Active</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SpecialEditDialog;
