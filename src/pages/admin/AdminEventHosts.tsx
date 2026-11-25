import AdminSearchBar, { matchesSearch } from "@/components/admin/AdminSearchBar";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Download, Upload, FileSpreadsheet } from "lucide-react";
import ImageSlotField from "@/components/admin/ImageSlotField";
import { eventImageSlot } from "@/lib/eventImageSlots";
import { downloadHostCsv, planHostImport, type HostImport } from "@/lib/eventHostDirectoryCsv";

const hostSlot = eventImageSlot("host");

type Host = { id: string; name: string; subtitle: string | null; image_url: string | null; link: string | null };
const empty = { id: "", name: "", subtitle: "", image_url: "", link: "" };

async function fetchHosts(): Promise<Host[]> {
  const hosts: Host[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("event_hosts").select("id, name, subtitle, image_url, link").order("name").order("id").range(from, from + 999);
    if (error) throw error;
    hosts.push(...(data ?? []));
    if (!data || data.length < 1000) return hosts;
  }
}

const AdminEventHosts = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState<typeof empty | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [csv, setCsv] = useState<{ name: string; text: string; plan: HostImport[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [reading, setReading] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null);

  const { data: hosts = [], isLoading, isError } = useQuery({
    queryKey: ["admin-event-hosts"],
    queryFn: fetchHosts,
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

  const selectCsv = async (file: File | undefined) => {
    if (!file) return;
    setReading(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const current = await fetchHosts();
      setCsv({ name: file.name, text, plan: planHostImport(text, current) });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not read the CSV."); }
    finally { setReading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const importCsv = async () => {
    if (!csv) return;
    setImporting(true);
    const result = { created: 0, updated: 0, errors: [] as string[] };
    try {
      const plan = planHostImport(csv.text, await fetchHosts());
      for (const item of plan) {
        const { error } = item.id
          ? await supabase.from("event_hosts").update(item.payload).eq("id", item.id)
          : await supabase.from("event_hosts").insert(item.payload);
        if (error) result.errors.push(`Row ${item.row}: ${error.message}`);
        else if (item.id) result.updated++;
        else result.created++;
      }
      setImportResult(result);
      setCsv(null);
      refresh();
      if (result.errors.length) toast.error("Some hosts could not be uploaded. See the results below.");
      else toast.success(`Upload complete: ${result.created} created, ${result.updated} updated.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed."); }
    finally { setImporting(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="font-heading text-2xl lg:text-3xl font-[550] text-foreground">Event Hosts</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => downloadHostCsv([], "event_hosts_template.csv")}><FileSpreadsheet className="h-4 w-4" /> Download Template</Button>
          <Button className="gap-2" disabled={isLoading || isError} onClick={() => downloadHostCsv(hosts, "event_hosts.csv")}><Download className="h-4 w-4" /> Download CSV</Button>
          <Button className="gap-2" disabled={reading || importing} onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> {reading ? "Reading CSV..." : "Upload CSV"}</Button>
          <Button className="gap-2" onClick={() => setForm({ ...empty })}><Plus className="h-4 w-4" /> Add Host</Button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" aria-label="Upload event hosts CSV" onChange={(e) => void selectCsv(e.target.files?.[0])} />

      {importResult && <div role="status" className="mb-4 rounded-xl border border-border bg-card p-4 text-sm">
        <p>{importResult.created} hosts created, {importResult.updated} hosts updated.</p>
        {importResult.errors.map((error, index) => <p key={index} className="mt-2 text-destructive">{error}</p>)}
      </div>}

      <AdminSearchBar value={search} onChange={setSearch} placeholder="Search event hosts..." />

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : isError ? <p className="text-destructive">Event hosts could not be loaded. Please refresh and try again.</p> : (
        <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full table-fixed text-sm min-w-[720px]">
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
              {hosts.filter((h) => matchesSearch(search, h.name, h.subtitle, h.link)).map((h) => (
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

      <Dialog open={!!csv} onOpenChange={(open) => { if (!open && !importing) setCsv(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Event Hosts</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="break-all font-medium">{csv?.name}</p>
            <p>{csv?.plan.filter(item => !item.id).length ?? 0} new hosts. {csv?.plan.filter(item => item.id).length ?? 0} existing hosts to update.</p>
            <p className="text-muted-foreground">Hosts missing from this file will not be deleted. Blank optional cells clear those fields; omitted columns leave them unchanged.</p>
            <div className="max-h-64 overflow-y-auto divide-y divide-border">
              {csv?.plan.map(item => <div key={item.row} className="flex items-center justify-between gap-3 py-2"><span className="break-words min-w-0">{item.payload.name}</span><span className="shrink-0 text-muted-foreground">{item.id ? "Update" : "New"}</span></div>)}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={importing} onClick={() => setCsv(null)}>Cancel</Button>
            <Button disabled={importing} onClick={() => void importCsv()}>{importing ? "Uploading..." : "Import Hosts"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <div className="grid grid-cols-2 gap-3">
                <ImageSlotField slot={hostSlot} label="Photo" asField value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
              </div>
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
