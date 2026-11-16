import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import ImageSlotField from "@/components/admin/ImageSlotField";
import { eventImageSlot } from "@/lib/eventImageSlots";

const hostSlot = eventImageSlot("host");

type Host = { id: string; name: string; subtitle: string | null; image_url: string | null; link: string | null };
const empty = { id: "", name: "", subtitle: "", image_url: "", link: "" };

const AdminEventHosts = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState<typeof empty | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: hosts = [], isLoading } = useQuery({
    queryKey: ["admin-event-hosts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_hosts").select("id, name, subtitle, image_url, link").order("name");
      if (error) throw error;
      return data as Host[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-event-hosts"] });
    qc.invalidateQueries({ queryKey: ["event-hosts"] });
  };

  const save = async () => {
    if (!form) return;
    const name = form.name.trim().replace(/\s+/g, " ");
    if (!name) return toast.error("Please enter the host name.");
    setSaving(true);
    const row = { name, subtitle: form.subtitle.trim() || null, image_url: form.image_url || null, link: form.link.trim() || null };
    const { error } = form.id
      ? await supabase.from("event_hosts").update(row).eq("id", form.id)
      : await supabase.from("event_hosts").insert(row);
    setSaving(false);
    if (error) return toast.error(error.code === "23505" ? "A host with this name already exists." : error.message);
    toast.success("Host saved");
    setForm(null);
    refresh();
  };

  const remove = async (h: Host) => {
    if (!confirm(`Delete ${h.name}?`)) return;
    const { error } = await supabase.from("event_hosts").delete().eq("id", h.id);
    if (error) return toast.error(error.message);
    toast.success("Host deleted");
    refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-2xl lg:text-3xl font-[550] text-slate-950">Event Hosts</h1>
        <Button className="gap-2" onClick={() => setForm({ ...empty })}><Plus className="h-4 w-4" /> Add Host</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 text-[15px] font-bold text-foreground w-[8%]">Photo</th>
                <th className="text-left p-3 text-[15px] font-bold text-foreground w-[28%]">Host Name</th>
                <th className="text-left p-3 text-[15px] font-bold text-foreground w-[22%]">Subtitle</th>
                <th className="text-left p-3 text-[15px] font-bold text-foreground w-[32%]">Link</th>
                <th className="p-3 w-[10%]"></th>
              </tr>
            </thead>
            <tbody>
              {hosts.map((h) => (
                <tr key={h.id} className="border-t border-border">
                  <td className="p-3">
                    {h.image_url ? (
                      <img src={h.image_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted" />
                    )}
                  </td>
                  <td className="p-3 font-medium text-foreground truncate">{h.name}</td>
                  <td className="p-3 text-muted-foreground truncate">{h.subtitle || "—"}</td>
                  <td className="p-3 text-muted-foreground truncate">{h.link || "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${h.name}`}
                        onClick={() => setForm({ id: h.id, name: h.name, subtitle: h.subtitle || "", image_url: h.image_url || "", link: h.link || "" })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${h.name}`} onClick={() => remove(h)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {hosts.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No hosts yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form?.id ? "Edit Host" : "Add Host"}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-4">
              <div>
                <Label>Host Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Exactly as used on events" />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="e.g. Live Music" />
              </div>
              <div>
                <Label>Link</Label>
                <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://" />
              </div>
              <ImageSlotField slot={hostSlot} label="Photo" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={setForm.bind(null, null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving" : "Save Host"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEventHosts;
