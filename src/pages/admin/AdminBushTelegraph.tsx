import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ImageUpload from "@/components/admin/ImageUpload";
import ImageSlotField from "@/components/admin/ImageSlotField";
import { CHANNEL_IMAGE_SLOTS } from "@/lib/channelImageSlots";
import { ADMIN_EDITOR_DIALOG, ADMIN_IMAGE_GRID } from "@/lib/adminEditorLayout";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, FileSpreadsheet, CheckCircle, ArrowUpDown, X } from "lucide-react";

type AdminEntry = { name: string };
type YearsMode = "years" | "since";

const RESOURCE_TYPES = [
  { value: "link", label: "External link" },
  { value: "qr", label: "QR code" },
  { value: "image", label: "Image" },
  { value: "internal", label: "Internal page" },
] as const;

const HEADERS = ["title", "title_override", "platform", "meta", "meta_2", "description", "url", "resource_type", "admin_name", "years_running", "post_frequency", "tag_1", "tag_2", "is_featured", "sort_order"];

type Resource = {
  id: string;
  title: string;
  title_override: string | null;
  platform: string;
  meta: string | null;
  meta_2: string | null;
  description: string | null;
  url: string;
  resource_type: string;
  image_url: string | null;
  detail_image_url: string | null;
  homepage_image_url: string | null;
  saved_image_url: string | null;
  search_image_url: string | null;
  qr_image_url: string | null;
  admin_name: string | null;
  admins: AdminEntry[] | null;
  years_running: number | null;
  since_year: number | null;
  post_frequency: string | null;
  tag_1: string | null;
  tag_2: string | null;
  is_featured: boolean;
  sort_order: number;
  slug: string | null;
  cta_label: string | null;
};

const emptyForm = {
  title: "",
  title_override: "",
  use_title_override: false,
  platform: "Facebook",
  meta: "",
  meta_2: "",
  description: "",
  url: "",
  resource_type: "link",
  image_url: "",
  detail_image_url: "",
  homepage_image_url: "",
  saved_image_url: "",
  search_image_url: "",
  qr_image_url: "",
  admins: [] as AdminEntry[],
  years_mode: "years" as YearsMode,
  years_running: "" as string | number,
  since_year: "" as string | number,
  post_frequency: "",
  tag_1: "",
  tag_2: "",
  is_featured: false,
  sort_order: 0,
  cta_label: "",
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [newPlatformOpen, setNewPlatformOpen] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState("");
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
      return (data as any[]) as Resource[];
    },
  });

  const { data: platforms = [] } = useQuery({
    queryKey: ["local-channel-platforms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("local_channel_platforms" as any)
        .select("name")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data as any[]).map((p) => p.name as string);
    },
  });

  const addPlatformMutation = useMutation({
    mutationFn: async (name: string) => {
      const clean = name.trim();
      if (!clean) throw new Error("Platform name required");
      const { error } = await supabase.from("local_channel_platforms" as any).insert({ name: clean, sort_order: 999 });
      if (error) throw error;
      return clean;
    },
    onSuccess: (name) => {
      qc.invalidateQueries({ queryKey: ["local-channel-platforms"] });
      setForm((f) => ({ ...f, platform: name }));
      setNewPlatformOpen(false);
      setNewPlatformName("");
      toast.success(`Platform "${name}" added`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: typeof emptyForm & { id?: string }) => {
      const { id, use_title_override, years_running, since_year, years_mode, admins, ...rest } = payload;
      const cleanAdmins = (admins || [])
        .map((a) => ({ name: (a.name || "").trim() }))
        .filter((a) => a.name);
      const data: any = {
        ...rest,
        sort_order: Number(rest.sort_order) || 0,
        title_override: use_title_override && rest.title_override?.trim() ? rest.title_override.trim() : null,
        meta: rest.meta || null,
        meta_2: rest.meta_2 || null,
        description: rest.description || null,
        image_url: rest.image_url || null,
        detail_image_url: rest.detail_image_url || null,
        homepage_image_url: rest.homepage_image_url || null,
        saved_image_url: rest.saved_image_url || null,
        search_image_url: rest.search_image_url || null,
        qr_image_url: rest.qr_image_url || null,
        admins: cleanAdmins,
        admin_name: cleanAdmins.map((a) => a.name).join("|") || null,
        years_running: years_mode === "years" && years_running !== "" ? Number(years_running) || null : null,
        since_year: years_mode === "since" && since_year !== "" ? Number(since_year) || null : null,
        post_frequency: rest.post_frequency?.trim() || null,
        tag_1: rest.tag_1?.trim() || null,
        tag_2: rest.tag_2?.trim() || null,
        cta_label: rest.cta_label?.trim() || null,
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
      qc.invalidateQueries({ queryKey: ["home-local-channels"] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      if (returnTo) {
        const dest = returnTo;
        setReturnTo(null);
        navigate(dest);
      }
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
      qc.invalidateQueries({ queryKey: ["home-local-channels"] });
      toast.success("Resource deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, platform: platforms[0] || "Facebook" });
    setOpen(true);
  };

  const startEdit = (r: Resource) => {
    setEditing(r);
    setForm({
      title: r.title,
      title_override: r.title_override ?? "",
      use_title_override: !!(r.title_override && r.title_override.trim()),
      platform: r.platform,
      meta: r.meta ?? "",
      meta_2: r.meta_2 ?? "",
      description: r.description ?? "",
      url: r.url ?? "",
      resource_type: r.resource_type || "link",
      image_url: r.image_url ?? "",
      detail_image_url: r.detail_image_url ?? "",
      homepage_image_url: r.homepage_image_url ?? "",
      saved_image_url: r.saved_image_url ?? "",
      search_image_url: r.search_image_url ?? "",
      qr_image_url: r.qr_image_url ?? "",
      admins: Array.isArray(r.admins) && r.admins.length
        ? r.admins.map((a: any) => ({ name: a?.name ?? "" })).filter((a: any) => a.name)
        : (r.admin_name ? r.admin_name.split("|").map((n) => n.trim()).filter(Boolean).map((name) => ({ name })) : []),
      years_mode: r.since_year != null ? "since" : "years",
      years_running: r.years_running ?? "",
      since_year: r.since_year ?? "",
      post_frequency: r.post_frequency ?? "",
      tag_1: r.tag_1 ?? "",
      tag_2: r.tag_2 ?? "",
      is_featured: r.is_featured,
      sort_order: r.sort_order,
      cta_label: r.cta_label ?? "",
    });
    setOpen(true);
  };

  useEffect(() => {
    const editId = searchParams.get("edit");
    const ret = searchParams.get("returnTo");
    if (editId && resources.length && !open) {
      const r = resources.find((x) => x.id === editId);
      if (r) {
        if (ret) setReturnTo(ret);
        startEdit(r);
        searchParams.delete("edit");
        searchParams.delete("returnTo");
        setSearchParams(searchParams, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resources, searchParams]);

  const submit = () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    const needsUrl = form.resource_type === "link" || form.resource_type === "internal";
    const needsImage = form.resource_type === "qr" || form.resource_type === "image";
    if (needsUrl && !form.url.trim()) {
      toast.error("URL is required for link/internal resource types");
      return;
    }
    if (needsImage && !form.qr_image_url.trim()) {
      toast.error("Please upload an image / QR code");
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

        const platform = r.platform?.trim() || "Facebook";

        const payload: any = {
          title,
          title_override: r.title_override?.trim() || null,
          platform,
          meta: r.meta || null,
          meta_2: r.meta_2 || null,
          description: r.description || null,
          url: r.url?.trim() || "",
          resource_type: r.resource_type?.trim() || "link",
          // Images are backend-only: CSV never sets or clears them.
          admin_name: r.admin_name?.trim() || null,
          admins: (r.admin_name || "")
            .split("|")
            .map((n) => n.trim())
            .filter(Boolean)
            .map((name) => ({ name })),
          years_running: r.years_running ? parseInt(r.years_running) || null : null,
          post_frequency: r.post_frequency?.trim() || null,
          tag_1: r.tag_1?.trim() || null,
          tag_2: r.tag_2?.trim() || null,
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
    const csv = HEADERS.join(",") + "\n";
    downloadCSV(csv, "local_channels_template.csv");
  };

  const downloadExport = () => {
    if (!resources.length) { toast.error("No resources to export"); return; }
    const rows = resources.map((r) => [
      r.title, r.title_override ?? "", r.platform, r.meta ?? "", r.meta_2 ?? "", r.description ?? "", r.url ?? "",
      r.resource_type ?? "link",
      (Array.isArray(r.admins) && r.admins.length
        ? r.admins.map((a: any) => (a?.name || "").trim()).filter(Boolean).join("|")
        : (r.admin_name ?? "")),
      r.years_running != null ? String(r.years_running) : "", r.post_frequency ?? "",
      r.tag_1 ?? "", r.tag_2 ?? "",
      r.is_featured ? "true" : "false", String(r.sort_order ?? 0),
    ].map(escapeCSV).join(","));
    downloadCSV(HEADERS.join(",") + "\n" + rows.join("\n") + "\n", "local_channels_export.csv");
    toast.success(`Exported ${resources.length} resources`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-[550] text-slate-950">Local Channels</h1>
          <p className="text-sm text-muted-foreground mb-6 text-slate-950">Manage off-app resources, groups and feeds.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadExport} className="gap-2 opacity-100 bg-gray-400 text-slate-50 border-slate-950">
            <FileSpreadsheet className="h-4 w-4" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 opacity-100 bg-gray-400 text-slate-50 border-slate-950">
            <FileSpreadsheet className="h-4 w-4" /> Template
          </Button>
          <Button size="sm" onClick={startAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Add Resource
          </Button>
        </div>
      </div>

      {/* CSV Import */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
        <h2 className="font-medium text-slate-950">CSV Import / Export</h2>
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
                  <th className="p-3 text-left">Image</th>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Platform</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Featured</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3 text-muted-foreground">{r.sort_order}</td>
                    <td className="p-3">
                      {r.image_url ? (
                        <img src={r.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 font-medium">{r.title_override?.trim() || r.title}</td>
                    <td className="p-3">{r.platform}</td>
                    <td className="p-3 text-muted-foreground">{r.resource_type}</td>
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
      <Dialog open={open} onOpenChange={(o) => {
        setOpen(o);
        if (!o && returnTo) {
          const dest = returnTo;
          setReturnTo(null);
          setEditing(null);
          navigate(dest);
        }
      }}>
        <DialogContent className={ADMIN_EDITOR_DIALOG}>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Resource" : "Add Resource"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>

            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Use custom display title</Label>
                <Switch
                  checked={form.use_title_override}
                  onCheckedChange={(c) => setForm({ ...form, use_title_override: c })}
                />
              </div>
              {form.use_title_override && (
                <Input
                  value={form.title_override}
                  onChange={(e) => setForm({ ...form, title_override: e.target.value })}
                  placeholder="Custom title shown to users (exact casing)"
                />
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div>
                <Label>Platform *</Label>
                <div className="flex gap-2">
                  <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="sm" onClick={() => setNewPlatformOpen(true)} className="gap-1 shrink-0">
                    <Plus className="h-3 w-3" /> New
                  </Button>
                </div>
              </div>
              <div>
                <Label>Resource type *</Label>
                <Select value={form.resource_type} onValueChange={(v) => setForm({ ...form, resource_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(form.resource_type === "link" || form.resource_type === "internal") && (
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <Label>URL {form.resource_type === "internal" ? "(in-app path, e.g. /events)" : "*"}</Label>
                  <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <Label>Button Label</Label>
                  <Input
                    value={form.cta_label}
                    onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
                    placeholder={form.resource_type === "internal" ? "Open Page" : "Open Channel"}
                  />
                </div>
              </div>
            )}

            {(form.resource_type === "qr" || form.resource_type === "image") && (
              <div>
                <Label>{form.resource_type === "qr" ? "QR code image *" : "Image *"}</Label>
                <ImageUpload
                  bucket="local-channels-images"
                  value={form.qr_image_url}
                  onChange={(url) => setForm({ ...form, qr_image_url: url })}
                />
              </div>
            )}

            <div className="space-y-3">
              <div>
                <Label>Images</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  One picture per place the channel appears. Each opens in the crop tool with the
                  best shape for that screen as a starting point.
                </p>
              </div>
              <div className={ADMIN_IMAGE_GRID}>
                {CHANNEL_IMAGE_SLOTS.map((slot) => (
                  <ImageSlotField
                    key={slot.key}
                    slot={slot}
                    value={(form[slot.field] as string) || ""}
                    onChange={(url) => setForm((f) => ({ ...f, [slot.field]: url }))}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div>
                <Label>Meta 1 (Platform)</Label>
                <Input value={form.meta} onChange={(e) => setForm({ ...form, meta: e.target.value })} />
              </div>
              <div>
                <Label>Meta 2 (Members)</Label>
                <Input value={form.meta_2} onChange={(e) => setForm({ ...form, meta_2: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div>
                <Label>Tag 1</Label>
                <Input value={form.tag_1} onChange={(e) => setForm({ ...form, tag_1: e.target.value })} />
              </div>
              <div>
                <Label>Tag 2</Label>
                <Input value={form.tag_2} onChange={(e) => setForm({ ...form, tag_2: e.target.value })} />
              </div>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">

              {/* Admins (array) */}
              <div className="space-y-3">
                <Label>Admins</Label>
                {form.admins.length === 0 && (
                  <p className="text-xs text-muted-foreground">No admins yet.</p>
                )}
                {form.admins.map((a, idx) => (
                  <div key={idx} className="rounded-md border border-border p-3 space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Admin {idx + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setForm({ ...form, admins: form.admins.filter((_, i) => i !== idx) })}
                        aria-label="Remove admin"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={a.name}
                        onChange={(e) => {
                          const next = [...form.admins];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setForm({ ...form, admins: next });
                        }}
                        placeholder="e.g. Jane Smith"
                      />
                    </div>
                  </div>

                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setForm({ ...form, admins: [...form.admins, { name: "" }] })}
                >
                  <Plus className="h-3 w-3" /> Add another admin
                </Button>
              </div>

              {/* Years / Since */}
              <div className="space-y-2">
                <Label>How long it's been running</Label>
                <Select
                  value={form.years_mode}
                  onValueChange={(v: YearsMode) =>
                    setForm({ ...form, years_mode: v, years_running: v === "years" ? form.years_running : "", since_year: v === "since" ? form.since_year : "" })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="years">Years running</SelectItem>
                    <SelectItem value="since">Since year</SelectItem>
                  </SelectContent>
                </Select>
                {form.years_mode === "years" ? (
                  <Input
                    type="number"
                    value={form.years_running}
                    onChange={(e) => setForm({ ...form, years_running: e.target.value })}
                    placeholder="e.g. 5"
                  />
                ) : (
                  <Input
                    type="number"
                    value={form.since_year}
                    onChange={(e) => setForm({ ...form, since_year: e.target.value })}
                    placeholder="e.g. 2018"
                  />
                )}
              </div>

              <div className="lg:col-start-2">
                <Label>Avg. Posts Frequency</Label>
                <Input value={form.post_frequency} onChange={(e) => setForm({ ...form, post_frequency: e.target.value })} placeholder="e.g. 3 / week" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <Label>Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={form.is_featured} onCheckedChange={(c) => setForm({ ...form, is_featured: c })} />
                <Label>Featured</Label>
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

      {/* New platform dialog */}
      <Dialog open={newPlatformOpen} onOpenChange={setNewPlatformOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add new platform</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Platform name</Label>
            <Input
              value={newPlatformName}
              onChange={(e) => setNewPlatformName(e.target.value)}
              placeholder="e.g. Telegram"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPlatformOpen(false)}>Cancel</Button>
            <Button
              onClick={() => addPlatformMutation.mutate(newPlatformName)}
              disabled={addPlatformMutation.isPending || !newPlatformName.trim()}
            >
              {addPlatformMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBushTelegraph;
