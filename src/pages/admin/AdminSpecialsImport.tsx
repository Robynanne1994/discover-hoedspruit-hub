import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { daysToCsv, parseDays } from "@/lib/specialDays";

const stripTrailingZeros = (val: string | null | undefined) => {
  if (!val) return val ?? null;
  return val.replace(/(\d)\.00\b/g, "$1").replace(/(\d\.\d)0\b/g, "$1");
};

const EXPECTED_HEADERS = [
  "title", "title_override", "badge_override", "deal_type", "day_of_week",
  "discount_type", "discount_value", "freebie_text", "redemption_note", "business_name", "description",
  // image_url & detail_image_url deliberately excluded: images are backend-only
  "valid_from", "valid_until",
  "price", "price_label", "original_price",
  "booking_required", "booking_link", "booking_link_label", "promo_code",
  "contact_phone", "contact_whatsapp", "contact_email",
  "additional_phones", "additional_whatsapps",
  "terms", "tag", "sub_tag_1", "sub_tag_2",
  "is_active", "is_featured",
];

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
    headers.forEach((h, idx) => {
      const v = values[idx] ?? "";
      row[h] = v.trim() === "-" ? "" : v;
    });
    return row;
  });
  return { headers, rows: dataRows };
}

const AdminSpecialsImport = () => {
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

      const { data: existing } = await supabase.from("specials").select("id, title");
      const existingMap = new Map((existing ?? []).map((e) => [e.title.toLowerCase(), e.id]));
      const csvTitles = new Set<string>();

      for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i];
        const title = row.title?.trim();
        if (!title) { results.errors.push(`Row ${i + 2}: Missing title, skipped`); continue; }
        csvTitles.add(title.toLowerCase());

        // "Wednesday|Thursday" — a weekly deal can run on several days. Commas,
        // slashes and short forms ("Wed") are accepted too; anything that isn't
        // a day name is dropped rather than stored.
        const days = parseDays(row.day_of_week);

        const payload: Record<string, any> = {
          title,
          title_override: row.title_override?.trim() || null,
          badge_override: row.badge_override || null,
          deal_type: row.deal_type || null,
          day_of_week: days.length ? days : null,
          discount_type: row.discount_type || null,
          discount_value: row.discount_value ? Number(row.discount_value) : null,
          freebie_text: row.freebie_text || null,
          redemption_note: row.redemption_note || null,
          business_name: row.business_name || "",
          description: row.description || null,
          // image_url & detail_image_url ignored — managed via Lovable editor only
          valid_from: row.valid_from || null,
          valid_until: row.valid_until || null,
          price: stripTrailingZeros(row.price) || null,
          price_label: row.price_label || null,
          original_price: stripTrailingZeros(row.original_price) || null,
          booking_required: row.booking_required?.toLowerCase() === "true" || row.booking_required === "1",
          booking_link: row.booking_link || null,
          booking_link_label: row.booking_link_label || null,
          promo_code: row.promo_code || null,
          contact_phone: row.contact_phone || null,
          contact_whatsapp: row.contact_whatsapp || null,
          contact_email: row.contact_email || null,
          additional_phones: row.additional_phones ? row.additional_phones.split("|").map((s: string) => s.trim()).filter(Boolean) : [],
          additional_whatsapps: row.additional_whatsapps ? row.additional_whatsapps.split("|").map((s: string) => s.trim()).filter(Boolean) : [],
          terms: row.terms ? row.terms.split("|").map((s: string) => s.trim()).filter(Boolean).join("\n") || null : null,
          tag: row.tag || null,
          sub_tag_1: row.sub_tag_1 || null,
          sub_tag_2: row.sub_tag_2 || null,
          is_active: row.is_active ? (row.is_active.toLowerCase() !== "false" && row.is_active !== "0") : true,
          is_featured: row.is_featured?.toLowerCase() === "true" || row.is_featured === "1",
        };


        // Legacy columns are no longer part of the template, but an older file
        // may still carry them — honour them when present, ignore when absent.
        for (const legacy of ["card_footer_text", "savings"]) {
          if (parsed.headers.includes(legacy)) payload[legacy] = row[legacy] || null;
        }
        // An older file without the column must not wipe a stored override.
        if (!parsed.headers.includes("title_override")) delete payload.title_override;

        const existingId = existingMap.get(title.toLowerCase());
        if (existingId) {
          const { error } = await supabase.from("specials").update(payload as any).eq("id", existingId);
          if (error) results.errors.push(`Row ${i + 2}: Update failed - ${error.message}`);
          else results.updated++;
        } else {
          const { error } = await supabase.from("specials").insert(payload as any);
          if (error) results.errors.push(`Row ${i + 2}: Insert failed - ${error.message}`);
          else results.created++;
        }
      }

      for (const [existingTitle, existingId] of existingMap) {
        if (!csvTitles.has(existingTitle)) {
          const { error } = await supabase.from("specials").delete().eq("id", existingId);
          if (error) results.errors.push(`Delete failed for "${existingTitle}": ${error.message}`);
          else results.deleted++;
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setImportResult(results);
      qc.invalidateQueries({ queryKey: ["admin-specials"] });
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
    // One value per header, in header order — a short row silently shifts every
    // column after it, so the two lists are kept side by side.
    const example = [
      "Sunset Dinner Deal", "", "50% OFF", "weekly", "Wednesday|Thursday",
      "percent_off", "50", "", "Book direct", "Bush Lodge", "Half-price dinner with wine pairing",
      "2026-01-01", "2026-06-30",
      "R450pp", "per person", "R900pp",
      "true", "https://bookme.com/example", "Book on Quicket", "WINTER2026",
      "+27 123 456 789", "+27 123 456 789", "info@example.com",
      "", "",
      "T's & C's apply. Sit down only.", "Restaurant", "Dinner", "Wine pairing",
      "true", "false",
    ];
    const escapeCSV = (val: string) => val.includes(",") || val.includes('"') || val.includes("\n") ? `"${val.replace(/"/g, '""')}"` : val;
    const csv = EXPECTED_HEADERS.join(",") + "\n" + example.map(escapeCSV).join(",") + "\n";
    downloadCSV(csv, "specials_template.csv");
  };

  const downloadSpecials = async () => {
    const { data: specials } = await supabase.from("specials").select("*").order("created_at", { ascending: false });
    if (!specials?.length) { toast.error("No specials to export"); return; }
    const escapeCSV = (val: string) => val.includes(",") || val.includes('"') || val.includes("\n") ? `"${val.replace(/"/g, '""')}"` : val;
    const rows = specials.map((s: any) => [
      s.title ?? "", s.title_override ?? "", s.badge_override ?? "", s.deal_type ?? "", daysToCsv(s.day_of_week),
      s.discount_type ?? "", s.discount_value ?? "", s.freebie_text ?? "", s.redemption_note ?? "", s.business_name ?? "", s.description ?? "",
      s.valid_from ?? "", s.valid_until ?? "",
      stripTrailingZeros(s.price) ?? "", s.price_label ?? "", stripTrailingZeros(s.original_price) ?? "",
      s.booking_required ? "true" : "false", s.booking_link ?? "", s.booking_link_label ?? "", s.promo_code ?? "",
      s.contact_phone ?? "", s.contact_whatsapp ?? "", s.contact_email ?? "",
      (s.additional_phones ?? []).join("|"), (s.additional_whatsapps ?? []).join("|"),
      (s.terms ?? "").split("\n").map((t: string) => t.trim()).filter(Boolean).join("|"),
      s.tag ?? "", s.sub_tag_1 ?? "", s.sub_tag_2 ?? "",
      s.is_active ? "true" : "false", s.is_featured ? "true" : "false",
    ].map((v: any) => escapeCSV(String(v))).join(","));
    downloadCSV(EXPECTED_HEADERS.join(",") + "\n" + rows.join("\n") + "\n", "specials_export.csv");
    toast.success(`Exported ${specials.length} specials`);
  };


  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/admin/specials">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-[550] text-foreground truncate">Import/Export Specials</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadSpecials} className="gap-2 opacity-100 bg-gray-400 text-slate-50 border-slate-950">
            <FileSpreadsheet className="h-4 w-4" /> <span className="hidden sm:inline">Download Specials</span><span className="sm:hidden">Specials</span>
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 opacity-100 bg-gray-400 text-slate-50 border-slate-950">
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
            Specials are matched by title (case-insensitive). Missing specials will be deleted.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            day_of_week, additional_phones, additional_whatsapps and terms take several
            values separated by | — e.g. <code>Wednesday|Thursday</code> for a deal that
            runs on both nights.
          </p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </div>

        {parsed && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{parsed.rows.length}</strong> rows found. Matching specials by title will be updated, new ones created.
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

export default AdminSpecialsImport;
