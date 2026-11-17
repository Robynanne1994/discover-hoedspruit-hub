import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, FileSpreadsheet, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  channelBusinessToCsv,
  resolveChannelBusiness,
  type ChannelBusiness,
} from "@/lib/channelBusiness";
import { channelCsvYears, channelYearStarted } from "@/lib/channelYears";
import { channelButtonLabelFromCsv, channelButtonLabelToCsv } from "@/lib/channelButtonLabel";
import { activeCsvPatch } from "@/lib/contentActive";

const HEADERS = ["title", "platform", "meta", "meta_2", "associated_business", "description", "url", "resource_type", "button_label", "admin_name", "year_started", "post_frequency", "tag_1", "tag_2", "is_featured", "is_active"];

type Resource = Tables<"bush_telegraph_resources">;

type ParsedCsv = { headers: string[]; rows: Record<string, string>[] };

function parseCSV(text: string): ParsedCsv {
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

const AdminLocalChannelsImport = () => {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [fileName, setFileName] = useState("");
  const [importResult, setImportResult] = useState<{ created: number; updated: number; deleted: number; errors: string[] } | null>(null);

  const { data: businessListings = [], isLoading: businessesLoading, isError: businessesError } = useQuery({
    queryKey: ["channel-business-listings"],
    queryFn: async () => {
      const listings: ChannelBusiness[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from("listings").select("id, title").order("title").order("id").range(from, from + 999);
        if (error) throw error;
        listings.push(...(data ?? []));
        if (!data || data.length < 1000) return listings;
      }
    },
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["admin-bush-telegraph"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bush_telegraph_resources")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

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
      if (businessesLoading || businessesError) throw new Error("Business listings could not be loaded. Please try again before importing.");
      const businessesByRow = parsed.rows.map((row, i) => {
        if (row.associated_business === undefined) return {};
        try { return { associated_business_id: resolveChannelBusiness(row.associated_business, businessListings) }; }
        catch (error) { throw new Error(`Row ${i + 2}: ${error instanceof Error ? error.message : "Invalid associated business"}`); }
      });
      const importNow = new Date();
      const yearsByRow = parsed.rows.map((row, i) => {
        try { return channelCsvYears(row, importNow); }
        catch (error) { throw new Error(`Row ${i + 2}: ${error instanceof Error ? error.message : "Invalid year started"}`); }
      });
      const results = { created: 0, updated: 0, deleted: 0, errors: [] as string[] };
      const { data: existing } = await supabase.from("bush_telegraph_resources").select("id, title");
      const existingMap = new Map((existing ?? []).map((e) => [e.title.toLowerCase(), e.id]));
      const csvTitles = new Set<string>();

      for (let i = 0; i < parsed.rows.length; i++) {
        const r = parsed.rows[i];
        const title = r.title?.trim();
        if (!title) { results.errors.push(`Row ${i + 2}: Missing title`); continue; }
        csvTitles.add(title.toLowerCase());

        const platform = r.platform?.trim() || "Facebook";
        const payload: any = {
          title,
          platform,
          meta: r.meta || null,
          meta_2: r.meta_2 || null,
          ...businessesByRow[i],
          description: r.description || null,
          url: r.url?.trim() || "",
          resource_type: r.resource_type?.trim() || "link",
          ...channelButtonLabelFromCsv(r),
          // Images are backend-only: CSV never sets or clears them.
          admin_name: r.admin_name?.trim() || null,
          admins: (r.admin_name || "")
            .split("|")
            .map((n) => n.trim())
            .filter(Boolean)
            .map((name) => ({ name })),
          ...yearsByRow[i],
          post_frequency: r.post_frequency?.trim() || null,
          tag_1: r.tag_1?.trim() || null,
          tag_2: r.tag_2?.trim() || null,
          is_featured: r.is_featured?.toLowerCase() === "true" || r.is_featured === "1",
          ...activeCsvPatch(r.is_active),
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
      qc.invalidateQueries({ queryKey: ["local-channel"] });
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
    if (businessesLoading || businessesError) { toast.error("Business listings could not be loaded. Please try again."); return; }
    const rows = resources.map((r: Resource) => [
      r.title, r.platform, r.meta ?? "", r.meta_2 ?? "", channelBusinessToCsv(r.associated_business_id, businessListings), r.description ?? "", r.url ?? "",
      r.resource_type ?? "link",
      channelButtonLabelToCsv(r),
      (Array.isArray(r.admins) && r.admins.length
        ? r.admins.map((a: any) => (a?.name || "").trim()).filter(Boolean).join("|")
        : (r.admin_name ?? "")),
      String(channelYearStarted(r) ?? ""), r.post_frequency ?? "",
      r.tag_1 ?? "", r.tag_2 ?? "",
      r.is_featured ? "true" : "false",
      r.is_active !== false ? "true" : "false",
    ].map(escapeCSV).join(","));
    downloadCSV(HEADERS.join(",") + "\n" + rows.join("\n") + "\n", "local_channels_export.csv");
    toast.success(`Exported ${resources.length} resources`);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/admin/local-channels" aria-label="Back to Local Channels">
            <Button variant="ghost" size="icon" aria-label="Back to Local Channels"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-[550] text-foreground truncate">Import/Export Local Channels</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadExport} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Template
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 lg:p-8 space-y-6">
        <div
          className="border-2 border-dashed border-border rounded-xl p-4 sm:p-12 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => { if (!importMutation.isPending) fileRef.current?.click(); }}
        >
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-foreground font-medium">{fileName || "Click to upload CSV file"}</p>
          <p className="text-sm text-muted-foreground mt-1">Columns: {HEADERS.join(", ")}</p>
          <p className="text-xs text-muted-foreground mt-1">Matched by title (case-insensitive). Missing rows will be deleted.</p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" disabled={importMutation.isPending} onChange={handleFile} />
        </div>

        {parsed && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground"><strong className="text-foreground">{parsed.rows.length}</strong> rows ready.</p>
            <Button onClick={() => importMutation.mutate()} disabled={importMutation.isPending} className="shrink-0">
              {importMutation.isPending ? "Importing..." : "Import All"}
            </Button>
          </div>
        )}

        {importResult && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /><strong>{importResult.created}</strong> created</span>
              <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /><strong>{importResult.updated}</strong> updated</span>
              <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-destructive" /><strong>{importResult.deleted}</strong> deleted</span>
            </div>
            {importResult.errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-1">
                {importResult.errors.map((err, i) => <p key={i} className="text-sm text-destructive">{err}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLocalChannelsImport;
