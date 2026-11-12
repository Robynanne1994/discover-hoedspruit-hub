import { resolveBookingLinkType } from "@/lib/bookingLink";
import { specialAudienceCsvPatch, specialAudienceToCsv } from "@/lib/specialAudience";
import { parseTagCell, specialTagList, tagColumns } from "@/lib/specialTags";
import { parseEventContactCells, serializeEventContactCells } from "@/lib/eventContacts";
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { daysToCsv, parseDays } from "@/lib/specialDays";
import { formatSpecialPriceCell } from "@/lib/specialPrice";
import { specialCsvAction, specialCsvScope, type SpecialCsvImportMode, type SpecialCsvScope } from "@/lib/specialCsvScope";

const stripTrailingZeros = (val: string | null | undefined) => {
  if (!val) return val ?? null;
  return val.replace(/(\d)\.00\b/g, "$1").replace(/(\d\.\d)0\b/g, "$1");
};

// Only these values exist in the database. "none", "n/a", "-" or anything
// unrecognised means "not set", which is stored as blank rather than failing.
const VALID_DISCOUNT_TYPES = ["percent_off", "amount_off", "fixed_price", "buy_x_get_y", "freebie"];
const VALID_DEAL_TYPES = ["weekly", "date_range", "monthly", "ongoing"];
const normalizeEnum = (allowed: string[], val?: string) => {
  const v = (val ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return allowed.includes(v) ? v : null;
};
const normalizeDiscountType = (val?: string) => normalizeEnum(VALID_DISCOUNT_TYPES, val);
const normalizeDealType = (val?: string) => normalizeEnum(VALID_DEAL_TYPES, val);

const EXPECTED_HEADERS = [
  "id", "title", "badge_override", "deal_type", "day_of_week",
  "discount_type", "discount_value", "special_type", "freebie_text", "card_deal_text", "redemption_note", "business_name", "description",
  // image_url & detail_image_url deliberately excluded: images are backend-only
  "valid_from", "valid_until",
  "price", "price_label", "original_price",
  "booking_required", "booking_link_type", "booking_link", "booking_link_label", "promo_code",
  "whos_it_for", "social_media_link", "social_media_label",
  "contact_phone", "phone_label", "contact_whatsapp", "whatsapp_label", "contact_email", "email_label",
  "terms", "tag",
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
  const [importResult, setImportResult] = useState<{ created: number; updated: number; deleted: number; skipped?: number; errors: string[] } | null>(null);
  const [importMode, setImportMode] = useState<SpecialCsvImportMode>("new");
  const changeImportMode = (mode: SpecialCsvImportMode) => {
    setImportMode(mode);
    setParsed(null);
    setFileName("");
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

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
      const results = { created: 0, updated: 0, deleted: 0, skipped: 0, errors: [] as string[] };

      const now = new Date();
      const { data: existing, error: existingError } = await supabase.from("specials").select("id, title, is_active, valid_from, valid_until");
      if (existingError) throw existingError;
      const existingMap = new Map((existing ?? []).map((e) => [e.title.trim().toLowerCase(), e]));
      const existingById = new Map((existing ?? []).map((e) => [e.id, e]));
      // Link each special to the listing whose title matches its business name.
      const { data: listingRows } = await supabase.from("listings").select("id, title");
      const listingByTitle = new Map<string, string>();
      for (const l of listingRows ?? []) {
        const key = (l.title ?? "").trim().toLowerCase();
        if (key && !listingByTitle.has(key)) listingByTitle.set(key, l.id);
      }

      for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i];
        const title = row.title?.trim();
        if (!title) { results.errors.push(`Row ${i + 2}: Missing title, skipped`); continue; }
        const match = row.id?.trim()
          ? existingById.get(row.id.trim())
          : existingMap.get(title.toLowerCase());
        if (row.id?.trim() && !match) {
          results.skipped++;
          results.errors.push(`Row ${i + 2}: Special ID not found, left untouched`);
          continue;
        }
        if (match && importMode === "new") { results.skipped++; continue; }

        // "Wednesday|Thursday" — a weekly deal can run on several days. Commas,
        // slashes and short forms ("Wed") are accepted too; anything that isn't
        // a day name is dropped rather than stored.
        const days = parseDays(row.day_of_week);

        const payload: Record<string, any> = {
          ...specialAudienceCsvPatch(row),
          title,
          badge_override: row.badge_override || null,
          deal_type: normalizeDealType(row.deal_type),
          day_of_week: days.length ? days : null,
          discount_type: normalizeDiscountType(row.discount_type),
          discount_value: Number.isFinite(Number(row.discount_value)) && row.discount_value ? Number(row.discount_value) : null,
          special_type: (row.special_type || "").trim() || null,
          freebie_text: row.freebie_text || null,
          card_deal_text: row.card_deal_text || null,
          redemption_note: row.redemption_note || null,
          business_name: row.business_name || "",
          description: row.description || null,
          // image_url & detail_image_url ignored — managed via Lovable editor only
          valid_from: row.valid_from || null,
          valid_until: row.valid_until || null,
          price: formatSpecialPriceCell(row.price),
          price_label: row.price_label || null,
          original_price: formatSpecialPriceCell(row.original_price),
          booking_required: row.booking_required?.toLowerCase() === "true" || row.booking_required === "1",
          booking_link_type: (() => { const t = (row.booking_link_type || "").trim(); return t ? resolveBookingLinkType(row.booking_link, t) : null; })(),
          booking_link: row.booking_link || null,
          booking_link_label: row.booking_link_label || null,
          promo_code: row.promo_code || null,
          // Combined cells: "a|b" with labels "x|y"; older files' additional_* columns are appended.
          ...(() => {
            const out: Record<string, any> = {};
            for (const k of ["phone", "whatsapp", "email"] as const) {
              const legacy = (row[`additional_${k}s`] || "").trim();
              const legacyLabels = (row[`additional_${k}_labels`] || "").trim();
              const cell = [row[`contact_${k}`] || "", legacy].filter(Boolean).join("|");
              const labelCell = legacy ? [row[`${k}_label`] || "", legacyLabels].join("|") : (row[`${k}_label`] || "");
              const p = parseEventContactCells(cell, labelCell);
              out[`contact_${k}`] = p.primary;
              out[`${k}_label`] = p.label;
              out[`additional_${k}s`] = p.extras;
              out[`additional_${k}_labels`] = p.extraLabels;
            }
            return out;
          })(),
          terms: row.terms ? row.terms.split("|").map((s: string) => s.trim()).filter(Boolean).join("\n") || null : null,
          ...tagColumns(parseTagCell(row.tag, row.sub_tag_1, row.sub_tag_2)),
          is_active: row.is_active ? (row.is_active.toLowerCase() !== "false" && row.is_active !== "0") : true,
          is_featured: row.is_featured?.toLowerCase() === "true" || row.is_featured === "1",
        };


        // Legacy columns are no longer part of the template, but an older file
        // may still carry them — honour them when present, ignore when absent.
        for (const legacy of ["card_footer_text", "savings", "social_media_link", "social_media_label"]) {
          if (parsed.headers.includes(legacy)) payload[legacy] = row[legacy] || null;
        }
        if (!parsed.headers.includes("special_type")) delete payload.special_type;
        const matchedListingId = listingByTitle.get((row.business_name ?? "").trim().toLowerCase());
        if (matchedListingId) payload.business_id = matchedListingId;

        const action = specialCsvAction(importMode, {
          is_active: payload.is_active,
          valid_from: payload.valid_from,
          valid_until: payload.valid_until,
        }, match, now);
        if (action === "skip") {
          results.skipped++;
          results.errors.push(`Row ${i + 2}: Outside the selected scope or not an existing passed special, left untouched`);
          continue;
        }
        if (action === "update" && match) {
          const { error } = await supabase.from("specials").update(payload as any).eq("id", match.id);
          if (error) results.errors.push(`Row ${i + 2}: Update failed - ${error.message}`);
          else results.updated++;
        } else {
          const { data: inserted, error } = await supabase.from("specials").insert(payload as any).select("id, title, is_active, valid_from, valid_until").single();
          if (error) results.errors.push(`Row ${i + 2}: Insert failed - ${error.message}`);
          else {
            results.created++;
            if (inserted) {
              existingMap.set(title.toLowerCase(), inserted);
              existingById.set(inserted.id, inserted);
            }
          }
        }
      }

      // Omitted specials are never deleted by these separate-sheet imports.

      return results;
    },
    onSuccess: (results) => {
      setImportResult(results);
      qc.invalidateQueries({ queryKey: ["admin-specials"] });
      qc.invalidateQueries({ queryKey: ["special-detail"] });
      qc.invalidateQueries({ queryKey: ["all-specials"] });
      qc.invalidateQueries({ queryKey: ["home-specials"] });
      toast.success(`Import complete: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`);
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
      "", "Sunset Dinner Deal", "false", "50% OFF", "weekly", "Wednesday|Thursday",
      "percent_off", "50", "Dinner Deal", "", "Half-price dinner", "Book direct", "Bush Lodge", "Half-price dinner with wine pairing",
      "2026-01-01", "2026-06-30",
      "R450pp", "per person", "R900pp",
      "true", "link", "https://bookme.com/example", "Book on Quicket", "WINTER2026",
      "Couples|Seniors", "https://www.facebook.com/example/posts/123", "Facebook Post",
      "+27 123 456 789|+27 987 654 321", "Reception|After Hours", "+27 123 456 789", "Bookings", "info@example.com", "",
      "T's & C's apply. Sit down only.", "Restaurant|Dinner|Wine pairing",
      "true", "false",
    ];
    const escapeCSV = (val: string) => val.includes(",") || val.includes('"') || val.includes("\n") ? `"${val.replace(/"/g, '""')}"` : val;
    const csv = EXPECTED_HEADERS.join(",") + "\n" + example.map(escapeCSV).join(",") + "\n";
    downloadCSV(csv, "specials_template.csv");
  };

  const downloadSpecials = async (scope: SpecialCsvScope) => {
    const { data, error } = await supabase.from("specials").select("*").order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    const now = new Date();
    const specials = (data ?? []).filter((special) => specialCsvScope(special, now) === scope);
    if (!specials.length) { toast.error(`No ${scope} specials to export`); return; }
    const escapeCSV = (val: string) => val.includes(",") || val.includes('"') || val.includes("\n") ? `"${val.replace(/"/g, '""')}"` : val;
    const rows = specials.map((s: any) => [
      s.id, s.title ?? "", s.badge_override ?? "", s.deal_type ?? "", daysToCsv(s.day_of_week),
      s.discount_type ?? "", s.discount_value ?? "", s.special_type ?? "", s.freebie_text ?? "", s.card_deal_text ?? "", s.redemption_note ?? "", s.business_name ?? "", s.description ?? "",
      s.valid_from ?? "", s.valid_until ?? "",
      stripTrailingZeros(s.price) ?? "", s.price_label ?? "", stripTrailingZeros(s.original_price) ?? "",
      s.booking_required ? "true" : "false", s.booking_link_type ?? "", s.booking_link ?? "", s.booking_link_label ?? "", s.promo_code ?? "",
      specialAudienceToCsv(s.whos_it_for), s.social_media_link ?? "", s.social_media_label ?? "",
      ...(["phone", "whatsapp", "email"] as const).flatMap((k) => {
        const c = serializeEventContactCells(s[`contact_${k}`], s[`${k}_label`], s[`additional_${k}s`], s[`additional_${k}_labels`]);
        return [c.contacts, c.labels];
      }),
      (s.terms ?? "").split("\n").map((t: string) => t.trim()).filter(Boolean).join("|"),
      specialTagList(s).join("|"),
      s.is_active ? "true" : "false", s.is_featured ? "true" : "false",
    ].map((v: any) => escapeCSV(String(v))).join(","));
    downloadCSV(EXPECTED_HEADERS.join(",") + "\n" + rows.join("\n") + "\n", `specials_${scope}.csv`);
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
          <Button variant="outline" size="sm" onClick={() => downloadSpecials("active")} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Download Active
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadSpecials("passed")} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Download Passed
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> <span className="hidden sm:inline">Download Template</span><span className="sm:hidden">Template</span>
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap gap-2" role="group" aria-label="CSV import scope">
          {(["new", "active", "passed"] as const).map((mode) => (
            <Button key={mode} variant={importMode === mode ? "default" : "outline"}
              aria-pressed={importMode === mode} disabled={importMutation.isPending}
              onClick={() => changeImportMode(mode)}>
              {mode === "new" ? "New Only" : mode === "active" ? "Active" : "Passed"}
            </Button>
          ))}
        </div>
        <div
          className="border-2 border-dashed border-border rounded-xl p-4 sm:p-12 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => { if (!importMutation.isPending) fileRef.current?.click(); }}
        >
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-foreground font-medium">{fileName || "Click to upload CSV file"}</p>
          <p className="text-sm text-muted-foreground mt-1">Columns: {EXPECTED_HEADERS.join(", ")}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Specials match by ID, or by title when ID is blank. New Only adds new specials without changing existing ones. Active updates and adds enabled, unexpired specials. Passed updates existing expired or inactive specials only. No import deletes specials. Dates use Johannesburg time.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            day_of_week, contact_phone, contact_whatsapp, contact_email, their labels and terms take several
            values separated by | — e.g. <code>Wednesday|Thursday</code> for a deal that
            runs on both nights.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            price and original_price: a plain number like 4999 is stored as R4,999;
            free-text prices like R450pp are kept exactly as written.
          </p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" disabled={importMutation.isPending} onChange={handleFile} />
        </div>

        {parsed && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{parsed.rows.length}</strong> rows found.{" "}
                {importMode === "passed"
                  ? "Only matching passed specials will be updated. Active specials stay untouched."
                  : importMode === "active"
                    ? "Only active specials will be updated or added. Passed specials stay untouched."
                    : "Only new specials will be added. Existing specials stay exactly as they are."}
              </p>
              <Button onClick={() => importMutation.mutate()} disabled={importMutation.isPending} className="gap-2 shrink-0">
                {importMutation.isPending ? "Importing..." : importMode === "new" ? "Add New" : importMode === "active" ? "Import Active" : "Import Passed"}
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
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-foreground"><strong>{importResult.created}</strong> created</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-foreground"><strong>{importResult.updated}</strong> updated</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-destructive" />
                <span className="text-foreground"><strong>{importResult.deleted}</strong> deleted</span>
              </div>
              {(importResult.skipped ?? 0) > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground"><strong>{importResult.skipped}</strong> skipped, left untouched</span>
                </div>
              )}
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
