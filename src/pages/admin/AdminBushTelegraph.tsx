import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, FileSpreadsheet, CheckCircle, ArrowUpDown } from "lucide-react";

const PLATFORMS = ["Facebook", "Whatsapp", "Instagram", "Websites", "Radio"] as const;
const TONES = ["warm", "warm-grey", "coral", "dark"] as const;
const HEADERS = ["title", "platform", "meta", "description", "url", "tone", "is_featured", "sort_order"];

type Resource = {
  id: string;
  title: string;
  platform: string;
  meta: string | null;
  description: string | null;
  url: string;
  tone: string;
  is_featured: boolean;
  sort_order: number;
};

const emptyForm = {
  title: "",
  platform: "Facebook",
  meta: "",
  description: "",
  url: "",
  tone: "warm",
  is_featured: false,
  sort_order: 0,
};

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const t = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let val = "";
  let inQ = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    const n = t[i + 1];
    if (c === '"') {
      if (inQ && n === '"') { val += '"'; i++; } else inQ = !inQ;
      continue;
    }
    if (c === "," && !inQ) { row.push(val.trim()); val = ""; continue; }
    if ((c === "\n" || c === "\r") && !inQ) {
      if (c === "\r" && n === "\n") i++;
      row.push(val.trim());
      if (row.some((v) => v.length)) rows.push(row);
      row = []; val = ""; continue;
    }
    val += c;
  }
  row.push(val.trim());
  if (row.some((v) => v.length)) rows.push(row);
  if (!rows.length) return { headers: [], rows: [] };
  const headers = rows[0].map((h) => h.toLowerCase().replace(/["\s]/g, "").replace(/ /g, "_"));
  const data = rows.slice(1).map((vs) => {
    const o: Record<string, string> = {};
    headers.forEach((h, i) => (o[h] = vs[i] ?? ""));
    return o;
  });
  return { headers, rows: data };
}

const escapeCSV = (v: string) =>
  v.includes(",") || v.includes('"') || v.includes("\n") ? `"${v.replace(/"/g, '""')}"` : v;

const AdminBushTelegraph = () => {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [fileName, setFileName] = useState("");
  const [importResult, setImportResult] = useState<{ created: number; updated: number; deleted: number; errors: string[] } | null>(null);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["admin-bush-telegraph"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bush_telegraph_resources")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Resource[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: typeof emptyForm & { id?: string }) => {
      const { id, ...rest } = payload;
      const data = {
        ...rest,
        sort_order: Number(rest.sort_order) || 0,
        meta: rest.meta || null,
        description: rest.description || null,
      };
      if (id) {
        const { error } = await supabase.from("bush_telegraph_resources").update(data).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bush_telegraph_resources").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bush-telegraph"] });
      qc.invalidateQueries({ queryKey: ["bush-telegraph"] });
      toast.success(editing ? "Resource updated" : "Resource added");
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bush_telegraph_resources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bush-telegraph"] });
      qc.invalidateQueries({ queryKey: ["bush-telegraph"] });
      toast.success("Resource deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const startEdit = (r: Resource) => {
    setEditing(r);
    setForm({
      title: r.title,
      platform: r.platform,
      meta: r.meta ?? "",
      description: r.description ?? "",
      url: r.url,
      tone: r.tone,
      is_featured: r.is_featured,
      sort_order: r.sort_order,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.title.trim() || !form.url.trim()) {
      toast.error("Title and URL are required");
      return;
    }
    upsertMutation.mutate({ ...form, id: editing?.id });
  };

  // CSV
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = parseCSV(ev.target?.result as string);
      if (!result.rows.length) { toast.error("CSV is empty"); return; }
      if (!result.headers.includes("title")) { toast.error("CSV must have a 'title' column"); return; }
      setParsed(result);
    };
    reader.readAsText(file);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!parsed) throw new Error("No data");
      const results = { created: 0, updated: 0, deleted: 0, errors: [] as string[] };
      const { data: existing } = await supabase.from("bush_telegraph_resources").select("id, title");
      const existingMap = new Map((existing ?? []).map((e: any) => [e.title.toLowerCase(), e.id]));
      const csvTitles = new Set<string>();

      for (let i = 0; i < parsed.rows.length; i++) {
        const r = parsed.rows[i];
        const title = r.title?.trim();
        if (!title) { results.errors.push(`Row ${i + 2}: Missing title`); continue; }
        csvTitles.add(title.toLowerCase());

        const platform = r.platform?.trim();
        const url = r.url?.trim();
        if (!platform || !PLATFORMS.includes(platform as any)) {
          results.errors.push(`Row ${i + 2}: Invalid platform "${platform}"`); continue;
        }
        if (!url) { results.errors.push(`Row ${i + 2}: Missing url`); continue; }

        const tone = r.tone?.trim() || "warm";
        const payload = {
          title,
          platform,
          meta: r.meta || null,
          description: r.description || null,
          url,
          tone: TONES.includes(tone as any) ? tone : "warm",
          is_featured: r.is_featured?.toLowerCase() === "true" || r.is_featured === "1",
          sort_order: r.sort_order ? parseInt(r.sort_order) || 0 : 0,
        };

        const id = existingMap.get(title.toLowerCase());
        if (id) {
          const { error } = await supabase.from("bush_telegraph_resources").update(payload).eq("id", id);
          if (error) results.errors.push(`Row ${i + 2}: ${error.message}`);
          else results.updated++;
        } else {
          const { error } = await supabase.from("bush_telegraph_resources").insert(payload);
          if (error) results.errors.push(`Row ${i + 2}: ${error.message}`);
          else results.created++;
        }
      }

      for (const [title, id] of existingMap) {
        if (!csvTitles.has(title)) {
          const { error } = await supabase.from("bush_telegraph_resources").delete().eq("id", id);
          if (error) results.errors.push(`Delete failed for "${title}": ${error.message}`);
          else results.deleted++;
        }
      }

      return results;
    },
    onSuccess: (r) => {
      setImportResult(r);
      qc.invalidateQueries({ queryKey: ["admin-bush-telegraph"] });
      qc.invalidateQueries({ queryKey: ["bush-telegraph"] });
      toast.success(`Import complete: ${r.created} created, ${r.updated} updated, ${r.deleted} deleted`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const csv = HEADERS.join(",") + "\n" +
      '"Hoedspruit Helpers","Facebook","Facebook Group · 14.2k members","The unofficial town hall...","https://facebook.com/groups/example","warm","true","0"\n';
    downloadCSV(csv, "bush_telegraph_template.csv");
  };

  const downloadExport = () => {
    if (!resources.length) { toast.error("No resources to export"); return; }
    const rows = resources.map((r) => [
      r.title, r.platform, r.meta ?? "", r.description ?? "", r.url, r.tone,
      r.is_featured ? "true" : "false", String(r.sort_order ?? 0),
    ].map(escapeCSV).join(","));
    downloadCSV(HEADERS.join(",") + "\n" + rows.join("\n") + "\n", "bush_telegraph_export.csv");
    toast.success(`Exported ${resources.length} resources`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bush Telegraph</h1>
          <p className="text-muted-foreground text-sm">Manage off-app resources (Facebook, Whatsapp, Instagram, Websites, Radio).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadExport} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Template
          </Button>
          <Button size="sm" onClick={startAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Add Resource
          </Button>
        </div>
      </div>

      {/* CSV Import */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
        <h2 className="font-semibold">CSV Import / Export</h2>
        <div
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="font-medium">{fileName || "Click to upload CSV"}</p>
          <p className="text-xs text-muted-foreground mt-1">Columns: {HEADERS.join(", ")}</p>
          <p className="text-xs text-muted-foreground mt-1">Matched by title (case-insensitive). Missing rows will be deleted.</p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </div>

        {parsed && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground"><strong className="text-foreground">{parsed.rows.length}</strong> rows ready.</p>
              <Button onClick={() => importMutation.mutate()} disabled={importMutation.isPending}>
                {importMutation.isPending ? "Importing..." : "Import All"}
              </Button>
            </div>
            <div className="overflow-x-auto max-h-64 overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    {parsed.headers.map((h) => <th key={h} className="p-2 text-left whitespace-nowrap">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {parsed.headers.map((h) => <td key={h} className="p-2 max-w-[180px] truncate">{row[h] || "—"}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {importResult && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /><strong>{importResult.created}</strong> created</span>
              <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-blue-600" /><strong>{importResult.updated}</strong> updated</span>
              <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-destructive" /><strong>{importResult.deleted}</strong> deleted</span>
            </div>
            {importResult.errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-1">
                {importResult.errors.map((err, i) => <p key={i} className="text-xs text-destructive">{err}</p>)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resources list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : resources.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No resources yet. Add your first one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left"><ArrowUpDown className="h-3 w-3 inline mr-1" />Order</th>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Platform</th>
                  <th className="p-3 text-left">Meta</th>
                  <th className="p-3 text-left">Featured</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3 text-muted-foreground">{r.sort_order}</td>
                    <td className="p-3 font-medium">{r.title}</td>
                    <td className="p-3">{r.platform}</td>
                    <td className="p-3 text-muted-foreground max-w-[240px] truncate">{r.meta || "—"}</td>
                    <td className="p-3">{r.is_featured ? "★" : ""}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(r)}><Pencil className="h-4 w-4" /></Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { if (confirm(`Delete "${r.title}"?`)) deleteMutation.mutate(r.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Resource" : "Add Resource"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Platform *</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Avatar Tone</Label>
                <Select value={form.tone} onValueChange={(v) => setForm({ ...form, tone: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Meta (e.g. "Facebook Group · 9.8k members")</Label>
              <Input value={form.meta} onChange={(e) => setForm({ ...form, meta: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>URL *</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <Label>Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={form.is_featured} onCheckedChange={(c) => setForm({ ...form, is_featured: c })} />
                <Label>Featured (This Week's Pick)</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBushTelegraph;
