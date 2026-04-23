import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const EXPECTED_HEADERS = ["title", "description", "date", "location", "tag", "sub_tag_1", "sub_tag_2", "image_url", "start_time", "end_time", "recurrence", "google_maps_link", "social_media_link", "social_media_label", "contact_email", "contact_phone", "contact_whatsapp", "gallery_images", "booking_link", "booking_link_label", "price", "notes", "business_name", "is_featured"];

const parseBool = (v: string | undefined): boolean => {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1" || s === "★";
};

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const normalizedText = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText[i];
    const nextChar = normalizedText[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') { currentValue += '"'; i++; } else { inQuotes = !inQuotes; }
      continue;
    }
    if (char === "," && !inQuotes) { currentRow.push(currentValue.trim()); currentValue = ""; continue; }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      currentRow.push(currentValue.trim());
      if (currentRow.some((v) => v.length > 0)) rows.push(currentRow);
      currentRow = []; currentValue = ""; continue;
    }
    currentValue += char;
  }
  currentRow.push(currentValue.trim());
  if (currentRow.some((v) => v.length > 0)) rows.push(currentRow);
  if (rows.length === 0) return { headers: [], rows: [] };

  const headers = rows[0].map((h) => h.toLowerCase().replace(/["\s]/g, "").replace(/ /g, "_"));
  const dataRows = rows.slice(1).map((values) => {
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ""; });
    return row;
  });
  return { headers, rows: dataRows };
}

const AdminEventsImport = () => {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [fileName, setFileName] = useState("");
  const [importResult, setImportResult] = useState<{ created: number; updated: number; deleted: number; errors: string[] } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseCSV(text);
      if (result.rows.length === 0) { toast.error("CSV file is empty or has no data rows"); return; }
      if (!result.headers.includes("title")) { toast.error("CSV must have a 'title' column"); return; }
      setParsed(result);
    };
    reader.readAsText(file);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!parsed) throw new Error("No data");
      const results = { created: 0, updated: 0, deleted: 0, errors: [] as string[] };

      const { data: existing } = await supabase.from("events").select("id, title");
      const existingMap = new Map((existing ?? []).map((e) => [e.title.toLowerCase(), e.id]));
      const csvTitles = new Set<string>();

      // Build a lookup of business listings by title (case-insensitive) for linking
      const { data: allListings } = await supabase.from("listings").select("id, title");
      const listingMap = new Map((allListings ?? []).map((l) => [l.title.toLowerCase().trim(), l.id]));

      for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i];
        const title = row.title?.trim();
        if (!title) { results.errors.push(`Row ${i + 2}: Missing title, skipped`); continue; }
        csvTitles.add(title.toLowerCase());

        const isUpdate = !!existingMap.get(title.toLowerCase());
        const galleryArr = row.gallery_images ? row.gallery_images.split("|").map((s: string) => s.trim()).filter(Boolean) : [];

        // Resolve business linkage from business_name (case-insensitive title match)
        let businessId: string | null = null;
        if (row.business_name && row.business_name.trim()) {
          const matchId = listingMap.get(row.business_name.trim().toLowerCase());
          if (matchId) {
            businessId = matchId;
          } else {
            results.errors.push(`Row ${i + 2}: Business "${row.business_name}" not found in listings, link skipped`);
          }
        }

        const payload: Record<string, any> = {
          title,
          description: row.description || null,
          date: row.date || "",
          location: row.location || null,
          tag: row.tag || null,
          sub_tag_1: row.sub_tag_1 || null,
          sub_tag_2: row.sub_tag_2 || null,
          ...(row.image_url ? { image_url: row.image_url } : (!isUpdate ? { image_url: null } : {})),
          start_time: row.start_time || null,
          end_time: row.end_time || null,
          recurrence: row.recurrence || null,
          google_maps_link: row.google_maps_link || null,
          social_media_link: row.social_media_link || null,
          social_media_label: row.social_media_label || null,
          contact_email: row.contact_email || null,
          contact_phone: row.contact_phone || null,
          contact_whatsapp: row.contact_whatsapp || null,
          ...(galleryArr.length > 0 ? { gallery_images: galleryArr } : (!isUpdate ? { gallery_images: [] } : {})),
          booking_link: row.booking_link || null,
          booking_link_label: row.booking_link_label || null,
          price: row.price || null,
          notes: row.notes || null,
          business_id: businessId,
          is_featured: parseBool(row.is_featured),
        };

        const existingId = existingMap.get(title.toLowerCase());
        if (existingId) {
          const { error } = await supabase.from("events").update(payload as any).eq("id", existingId);
          if (error) results.errors.push(`Row ${i + 2}: Update failed - ${error.message}`);
          else results.updated++;
        } else {
          const { error } = await supabase.from("events").insert(payload as any);
          if (error) results.errors.push(`Row ${i + 2}: Insert failed - ${error.message}`);
          else results.created++;
        }
      }

      // Delete events not in CSV
      for (const [existingTitle, existingId] of existingMap) {
        if (!csvTitles.has(existingTitle)) {
          const { error } = await supabase.from("events").delete().eq("id", existingId);
          if (error) results.errors.push(`Delete failed for "${existingTitle}": ${error.message}`);
          else results.deleted++;
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setImportResult(results);
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success(`Import complete: ${results.created} created, ${results.updated} updated, ${results.deleted} deleted`);
    },
    onError: (e) => toast.error(e.message),
  });

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const csv = EXPECTED_HEADERS.join(",") + "\n" + '"Market Day","Weekly market with local produce","Every Saturday","Hoedspruit Town","Market","Family-friendly","Outdoor","https://example.com/img.jpg","08:00","13:00","Weekly","https://maps.google.com/example","https://instagram.com/example","Instagram","info@example.com","+27 123 456 789","+27 123 456 789","https://img1.jpg|https://img2.jpg","https://bookme.com/example","Book on Quicket","R150","Bring cash for stalls","Some Business Name","true"\n';
    downloadCSV(csv, "events_template.csv");
  };

  const downloadEvents = async () => {
    const { data: events } = await supabase.from("events").select("*").order("created_at", { ascending: false });
    if (!events?.length) { toast.error("No events to export"); return; }

    // Resolve linked business titles for export
    const linkedIds = Array.from(new Set(events.map((e: any) => e.business_id).filter(Boolean)));
    const idToTitle = new Map<string, string>();
    if (linkedIds.length) {
      const { data: linked } = await supabase.from("listings").select("id, title").in("id", linkedIds as string[]);
      (linked ?? []).forEach((l: any) => idToTitle.set(l.id, l.title));
    }

    const escapeCSV = (val: string) => val.includes(",") || val.includes('"') || val.includes("\n") ? `"${val.replace(/"/g, '""')}"` : val;
    const rows = events.map((e: any) => [
      e.title, e.description ?? "", e.date, e.location ?? "",
      e.tag ?? "", e.sub_tag_1 ?? "", e.sub_tag_2 ?? "",
      e.image_url ?? "", e.start_time ?? "", e.end_time ?? "", e.recurrence ?? "", e.google_maps_link ?? "",
      e.social_media_link ?? "", e.social_media_label ?? "", e.contact_email ?? "", e.contact_phone ?? "", e.contact_whatsapp ?? "",
      (e.gallery_images ?? []).join("|"), e.booking_link ?? "", e.booking_link_label ?? "", e.price ?? "", e.notes ?? "",
      e.business_id ? (idToTitle.get(e.business_id) ?? "") : "",
      e.is_featured ? "true" : "false",
    ].map(escapeCSV).join(","));
    downloadCSV(EXPECTED_HEADERS.join(",") + "\n" + rows.join("\n") + "\n", "events_export.csv");
    toast.success(`Exported ${events.length} events`);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/admin/events">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">Import/Export Events</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadEvents} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> <span className="hidden sm:inline">Download Events</span><span className="sm:hidden">Events</span>
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> <span className="hidden sm:inline">Download Template</span><span className="sm:hidden">Template</span>
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 lg:p-8 space-y-6">
        <div
          className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-foreground font-medium">{fileName || "Click to upload CSV file"}</p>
          <p className="text-sm text-muted-foreground mt-1">Columns: {EXPECTED_HEADERS.join(", ")}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Events are matched by title (case-insensitive). Missing events will be deleted.
          </p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </div>

        {parsed && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{parsed.rows.length}</strong> rows found. Matching events by title will be updated, new ones created.
              </p>
              <Button onClick={() => importMutation.mutate()} disabled={importMutation.isPending} className="gap-2">
                {importMutation.isPending ? "Importing..." : "Import All"}
              </Button>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left text-muted-foreground font-medium">#</th>
                    {parsed.headers.map((h) => (
                      <th key={h} className="p-2 text-left text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      {parsed.headers.map((h) => (
                        <td key={h} className="p-2 text-foreground max-w-[200px] truncate">{row[h] || "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsed.rows.length > 50 && (
              <p className="text-xs text-muted-foreground">Showing first 50 of {parsed.rows.length} rows</p>
            )}
          </div>
        )}

        {importResult && (
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-foreground"><strong>{importResult.created}</strong> created</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-foreground"><strong>{importResult.updated}</strong> updated</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-destructive" />
                <span className="text-foreground"><strong>{importResult.deleted}</strong> deleted</span>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-1">
                {importResult.errors.map((err, i) => (
                  <p key={i} className="text-sm text-destructive">{err}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEventsImport;
