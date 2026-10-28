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

type Host = { id: string; name: string; image_url: string | null; link: string | null };
const empty = { id: "", name: "", image_url: "", link: "" };

const AdminEventHosts = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState<typeof empty | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: hosts = [], isLoading } = useQuery({
    queryKey: ["admin-event-hosts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_hosts").select("id, name, image_url, link").order("name");
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
    const row = { name, image_url: form.image_url || null, link: form.link.trim() || null };
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
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Event Hosts</h1>
        <Button onClick={() => setForm({ ...empty })}><Plus className="h-4 w-4 mr-1" /> Add Host</Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        For hosts that aren't listings. When an event's host name matches a name here exactly (capitals and extra spaces are ignored),
        the event shows this photo and link automatically. A photo or link added on the event itself still wins.
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading</p>
      ) : hosts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hosts yet.</p>
      ) : (
        <div className="space-y-2">
          {hosts.map((h) => (
            <div key={h.id} className="flex items-center gap-3 bg-card border rounded-xl p-3">
              {h.image_url ? (
                <img src={h.image_url} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-muted" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{h.name}</p>
                <p className="text-xs text-muted-foreground truncate">{h.link || "No link"}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setForm({ id: h.id, name: h.name, image_url: h.image_url || "", link: h.link || "" })}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => remove(h)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
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
                <Label>Link</Label>
                <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://" />
              </div>
              <ImageSlotField slot={hostSlot} label="Photo" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving" : "Save Host"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEventHosts;
