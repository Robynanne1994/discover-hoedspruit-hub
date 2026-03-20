import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";

interface ParsedRow {
  title: string;
  description: string;
  image_url: string;
  location: string;
  phone: string;
  email: string;
  website: string;
  category: string;
  is_featured: boolean;
}

const EXPECTED_HEADERS = ["title", "description", "image_url", "location", "phone", "email", "website", "category", "is_featured"];

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
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentValue.trim());
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      currentRow.push(currentValue.trim());
      if (currentRow.some((value) => value.length > 0)) rows.push(currentRow);
      currentRow = [];
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  currentRow.push(currentValue.trim());
  if (currentRow.some((value) => value.length > 0)) rows.push(currentRow);
  if (rows.length === 0) return { headers: [], rows: [] };

  const headers = rows[0].map((header) => header.toLowerCase().replace(/["\s]/g, "").replace(/ /g, "_"));
  const dataRows = rows.slice(1).map((values) => {
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });

  return { headers, rows: dataRows };
}

const AdminImport = () => {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [fileName, setFileName] = useState("");
  const [importResult, setImportResult] = useState<{ created: number; updated: number; deleted: number; errors: string[] } | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["admin-categories-for-import"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, title").order("sort_order");
      return data ?? [];
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseCSV(text);
      if (result.rows.length === 0) {
        toast.error("CSV file is empty or has no data rows");
        return;
      }
      if (!result.headers.includes("title")) {
        toast.error("CSV must have a 'title' column");
        return;
      }
      setParsed(result);
    };
    reader.readAsText(file);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!parsed || !categories) throw new Error("No data");

      const catMap = new Map(categories.map((c) => [c.title.toLowerCase(), c.id]));
      const results = { created: 0, updated: 0, deleted: 0, errors: [] as string[] };

      // Fetch existing listings for upsert matching
      const { data: existing } = await supabase.from("listings").select("id, title");
      const existingMap = new Map((existing ?? []).map((l) => [l.title.toLowerCase(), l.id]));

      // Track which existing listings appear in the CSV
      const csvTitles = new Set<string>();

      for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i];
        const title = row.title?.trim();
        if (!title) {
          results.errors.push(`Row ${i + 2}: Missing title, skipped`);
          continue;
        }

        csvTitles.add(title.toLowerCase());

        const categoryId = row.category ? catMap.get(row.category.toLowerCase()) ?? null : null;
        if (row.category && !categoryId) {
          results.errors.push(`Row ${i + 2}: Category "${row.category}" not found, set to none`);
        }

        const payload = {
          title,
          description: row.description || null,
          image_url: row.image_url || null,
          location: row.location || null,
          phone: row.phone || null,
          email: row.email || null,
          website: row.website || null,
          category_id: categoryId,
          is_featured: row.is_featured?.toLowerCase() === "true" || row.is_featured === "1",
        };

        const existingId = existingMap.get(title.toLowerCase());
        if (existingId) {
          const { error } = await supabase.from("listings").update(payload).eq("id", existingId);
          if (error) results.errors.push(`Row ${i + 2}: Update failed - ${error.message}`);
          else results.updated++;
        } else {
          const { error } = await supabase.from("listings").insert(payload);
          if (error) results.errors.push(`Row ${i + 2}: Insert failed - ${error.message}`);
          else results.created++;
        }
      }

      // Delete listings not present in the CSV
      for (const [existingTitle, existingId] of existingMap) {
        if (!csvTitles.has(existingTitle)) {
          const { error } = await supabase.from("listings").delete().eq("id", existingId);
          if (error) results.errors.push(`Delete failed for "${existingTitle}": ${error.message}`);
          else results.deleted++;
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setImportResult(results);
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success(`Import complete: ${results.created} created, ${results.updated} updated, ${results.deleted} deleted`);
    },
    onError: (e) => toast.error(e.message),
  });

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const csv = EXPECTED_HEADERS.join(",") + "\n" + 'Example Lodge,"A beautiful lodge in the bush",https://example.com/image.jpg,"Main Road, Hoedspruit",012-345-6789,info@example.com,https://example.com,Accommodation,false\n';
    downloadCSV(csv, "listings_template.csv");
  };

  const downloadListings = async () => {
    const { data: listings } = await supabase.from("listings").select("title, description, image_url, location, phone, email, website, category_id, is_featured");
    if (!listings?.length) { toast.error("No listings to export"); return; }
    const catMap = new Map((categories ?? []).map((c) => [c.id, c.title]));
    const escapeCSV = (val: string) => val.includes(",") || val.includes('"') || val.includes("\n") ? `"${val.replace(/"/g, '""')}"` : val;
    const rows = listings.map((l) => [
      l.title, l.description ?? "", l.image_url ?? "", l.location ?? "",
      l.phone ?? "", l.email ?? "", l.website ?? "",
      catMap.get(l.category_id ?? "") ?? "", String(l.is_featured),
    ].map(escapeCSV).join(","));
    downloadCSV(EXPECTED_HEADERS.join(",") + "\n" + rows.join("\n") + "\n", "listings_export.csv");
    toast.success(`Exported ${listings.length} listings`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Import Listings</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadListings} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Download Listings
          </Button>
          <Button variant="outline" onClick={downloadTemplate} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Download Template
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 space-y-6">
        {/* Upload area */}
        <div
          className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-foreground font-medium">{fileName || "Click to upload CSV file"}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Columns: title, description, image_url, location, phone, email, website, category, is_featured
          </p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </div>

        {/* Preview */}
        {parsed && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{parsed.rows.length}</strong> rows found. Matching listings by title will be updated, new ones created.
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

        {/* Results */}
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
                <p className="text-sm font-medium text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> {importResult.errors.length} warning(s)
                </p>
                {importResult.errors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive/80">{err}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminImport;
