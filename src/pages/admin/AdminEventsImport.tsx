import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { stripImageCsvColumns, omitImageKeys } from "@/lib/csvImageColumns";

// Image columns are deliberately excluded, exactly as in the listings import /
// export: pictures are cropped and set in the admin editor only, so a CSV can
// never carry, overwrite or clear them.
const EXPECTED_HEADERS = stripImageCsvColumns([

  "title",
  "title_override",
  "description",
  "date",
  "start_date",
  "end_date",
  "location",
  "tag",
  "sub_tag_1",
  "sub_tag_2",
  "start_time",
  "end_time",
  "recurrence",
  "performances",
  "google_maps_link",
  "social_media_link",
  "social_media_label",
  "contact_email",
  "contact_phone",
  "contact_whatsapp",
  "additional_emails",
  "additional_phones",
  "additional_whatsapps",
  "booking_link",
  "booking_link_label",
  "price",
  "included",
  "price_notes",
  "notes",
  "business_names",
  "hosted_by_name",
  "hosted_by_subtitle",
  "hosted_by_link",
  "hosted_by_listing",
  "hosted_by_name_2",
  "hosted_by_subtitle_2",
  "hosted_by_link_2",
  "hosted_by_listing_2",
  "hosted_by_name_3",
  "hosted_by_subtitle_3",
  "hosted_by_link_3",
  "hosted_by_listing_3",
  "is_featured",
]);


// Performances format in CSV: pipe-separated entries, each entry uses
// semicolons between fields: "YYYY-MM-DD;HH:MM;HH:MM" (date;start;end).
// End time is optional. Example: "2026-01-15;19:00;21:00|2026-01-16;19:00;"
const parsePerformances = (v: string | undefined): { date: string; time: string | null; end_time: string | null }[] | null => {
  if (!v || !v.trim()) return null;
  const out: { date: string; time: string | null; end_time: string | null }[] = [];
  for (const raw of v.split("|")) {
    const parts = raw.split(";").map((s) => s.trim());
    const date = parts[0];
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const time = parts[1] && /^\d{1,2}:\d{2}/.test(parts[1]) ? parts[1].slice(0, 5) : null;
    const end_time = parts[2] && /^\d{1,2}:\d{2}/.test(parts[2]) ? parts[2].slice(0, 5) : null;
    out.push({ date, time, end_time });
  }
  return out.length ? out : null;
};

const stringifyPerformances = (perfs: any): string => {
  if (!Array.isArray(perfs) || perfs.length === 0) return "";
  return perfs
    .filter((p) => p && typeof p.date === "string")
    .map((p) => `${p.date};${p.time ?? ""};${p.end_time ?? ""}`)
    .join("|");
};


const parseBool = (v: string | undefined): boolean => {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1" || s === "★";
};

const splitPipe = (v: string | undefined): string[] =>
  v ? String(v).split("|").map((s) => s.trim()).filter(Boolean) : [];

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

      const { data: allListings } = await supabase.from("listings").select("id, title");
      const listingMap = new Map((allListings ?? []).map((l) => [l.title.toLowerCase().trim(), l.id]));

      const resolveListing = (name: string, rowIdx: number): string | null => {
        const matchId = listingMap.get(name.toLowerCase().trim());
        if (matchId) return matchId;
        results.errors.push(`Row ${rowIdx + 2}: Business "${name}" not found in listings, link skipped`);
        return null;
      };

      // A host's link column is either an outbound URL (hosted_by_link) or a
      // listing on the app, named here the way business_names are.
      const resolveHostListing = (name: string | undefined, rowIdx: number): string | null =>
        name && name.trim() ? resolveListing(name.trim(), rowIdx) : null;

      for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i];
        const title = row.title?.trim();
        if (!title) { results.errors.push(`Row ${i + 2}: Missing title, skipped`); continue; }
        csvTitles.add(title.toLowerCase());

        // Resolve linked businesses — supports single business_name and multi business_names (pipe-separated)
        const businessNames = [
          ...(row.business_name && row.business_name.trim() ? [row.business_name.trim()] : []),
          ...splitPipe(row.business_names),
        ];
        const businessIds = businessNames
          .map((n) => resolveListing(n, i))
          .filter((v): v is string => !!v);
        const businessId = businessIds[0] ?? null;

        const payload: Record<string, any> = {
          title,
          title_override: row.title_override?.trim() || null,
          description: row.description || null,
          date: row.date || (row.start_date && row.end_date && row.start_date !== row.end_date ? `${row.start_date} to ${row.end_date}` : (row.start_date || "")),
          start_date: row.start_date || null,
          end_date: row.end_date || null,
          location: row.location || null,
          tag: row.tag || null,
          sub_tag_1: row.sub_tag_1 || null,
          sub_tag_2: row.sub_tag_2 || null,
          start_time: row.start_time || null,
          end_time: row.end_time || null,
          recurrence: row.recurrence || null,
          google_maps_link: row.google_maps_link || null,
          social_media_link: row.social_media_link || null,
          social_media_label: row.social_media_label || null,
          contact_email: row.contact_email || null,
          contact_phone: row.contact_phone || null,
          contact_whatsapp: row.contact_whatsapp || null,
          additional_emails: splitPipe(row.additional_emails),
          additional_phones: splitPipe(row.additional_phones),
          additional_whatsapps: splitPipe(row.additional_whatsapps),
          booking_link: row.booking_link || null,
          booking_link_label: row.booking_link_label || null,
          price: row.price || null,
          included: splitPipe(row.included),
          notes: splitPipe(row.notes),
          price_notes: splitPipe(row.price_notes),
          business_id: businessId,
          business_ids: businessIds,
          hosted_by_name: row.hosted_by_name || null,
          hosted_by_subtitle: row.hosted_by_subtitle || null,
          hosted_by_link: row.hosted_by_link || null,
          hosted_by_listing_id: resolveHostListing(row.hosted_by_listing, i),
          hosted_by_name_2: row.hosted_by_name_2 || null,
          hosted_by_subtitle_2: row.hosted_by_subtitle_2 || null,
          hosted_by_link_2: row.hosted_by_link_2 || null,
          hosted_by_listing_id_2: resolveHostListing(row.hosted_by_listing_2, i),
          hosted_by_name_3: row.hosted_by_name_3 || null,
          hosted_by_subtitle_3: row.hosted_by_subtitle_3 || null,
          hosted_by_link_3: row.hosted_by_link_3 || null,
          hosted_by_listing_id_3: resolveHostListing(row.hosted_by_listing_3, i),
          performances: parsePerformances(row.performances),
          is_featured: parseBool(row.is_featured),
        };

        // If performances provided, auto-derive start/end_date to match the editor's behaviour.
        if (Array.isArray(payload.performances) && payload.performances.length > 0) {
          const sorted = [...payload.performances].sort((a: any, b: any) =>
            a.date === b.date ? (a.time || "").localeCompare(b.time || "") : a.date.localeCompare(b.date),
          );
          payload.start_date = sorted[0].date;
          payload.end_date = sorted[sorted.length - 1].date;
        }

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

  const escapeCSV = (val: string) =>
    val.includes(",") || val.includes('"') || val.includes("\n") ? `"${val.replace(/"/g, '""')}"` : val;

  const downloadTemplate = () => {
    const sample: Record<string, string> = {
      title: "Market Day",
      title_override: "",
      description: "Weekly market with local produce",
      date: "Every Saturday",
      start_date: "",
      end_date: "",
      location: "Hoedspruit Town",
      tag: "Market",
      sub_tag_1: "Family-friendly",
      sub_tag_2: "Outdoor",
      start_time: "08:00",
      end_time: "13:00",
      recurrence: "Weekly",
      performances: "2026-01-15;19:00;21:00|2026-01-16;19:00;21:00",
      google_maps_link: "https://maps.google.com/example",
      social_media_link: "https://instagram.com/example",
      social_media_label: "Instagram",
      contact_email: "info@example.com",
      contact_phone: "+27 123 456 789",
      contact_whatsapp: "+27 123 456 789",
      additional_emails: "second@example.com|third@example.com",
      additional_phones: "+27 987 654 321",
      additional_whatsapps: "+27 987 654 321",
      booking_link: "https://bookme.com/example",
      booking_link_label: "Book on Quicket",
      price: "R150",
      included: "Welcome drink|Live music|Parking",
      notes: "Doors open 30 minutes before the show|Bring your own chair",
      price_notes: "Per person|Includes welcome drink|Minimum 4 people",
      business_names: "Some Business Name|Another Linked Listing",
      hosted_by_name: "Kristi & Joëlle",
      hosted_by_subtitle: "Yoga Teachers",
      hosted_by_link: "https://example.com/kristi",
      hosted_by_listing: "",
      hosted_by_name_2: "Another Linked Listing",
      hosted_by_subtitle_2: "Venue",
      hosted_by_link_2: "",
      hosted_by_listing_2: "Another Linked Listing",
      hosted_by_name_3: "",
      hosted_by_subtitle_3: "",
      hosted_by_link_3: "",
      hosted_by_listing_3: "",
      is_featured: "true",

    };
    const csv =
      EXPECTED_HEADERS.join(",") +
      "\n" +
      EXPECTED_HEADERS.map((h) => escapeCSV(sample[h] ?? "")).join(",") +
      "\n";
    downloadCSV(csv, "events_template.csv");
  };

  const downloadEvents = async () => {
    const { data: events } = await supabase.from("events").select("*").order("created_at", { ascending: false });
    if (!events?.length) { toast.error("No events to export"); return; }

    // Resolve linked business titles for export
    const linkedIds = Array.from(new Set(
      events.flatMap((e: any) => [
        ...(e.business_id ? [e.business_id] : []),
        ...((e.business_ids ?? []) as string[]),
        e.hosted_by_listing_id,
        e.hosted_by_listing_id_2,
        e.hosted_by_listing_id_3,
      ]).filter(Boolean),
    ));
    const idToTitle = new Map<string, string>();
    if (linkedIds.length) {
      const { data: linked } = await supabase.from("listings").select("id, title").in("id", linkedIds as string[]);
      (linked ?? []).forEach((l: any) => idToTitle.set(l.id, l.title));
    }

    const rows = events.map((e: any) => {
      const allIds: string[] = Array.isArray(e.business_ids) && e.business_ids.length
        ? e.business_ids
        : (e.business_id ? [e.business_id] : []);
      const allNames = allIds.map((id) => idToTitle.get(id) ?? "").filter(Boolean);
      const record: Record<string, string> = {
        title: e.title ?? "",
        title_override: e.title_override ?? "",
        description: e.description ?? "",
        date: e.date ?? "",
        start_date: e.start_date ?? "",
        end_date: e.end_date ?? "",
        location: e.location ?? "",
        tag: e.tag ?? "",
        sub_tag_1: e.sub_tag_1 ?? "",
        sub_tag_2: e.sub_tag_2 ?? "",
        start_time: e.start_time ?? "",
        end_time: e.end_time ?? "",
        recurrence: e.recurrence ?? "",
        performances: stringifyPerformances(e.performances),
        google_maps_link: e.google_maps_link ?? "",
        social_media_link: e.social_media_link ?? "",
        social_media_label: e.social_media_label ?? "",
        contact_email: e.contact_email ?? "",
        contact_phone: e.contact_phone ?? "",
        contact_whatsapp: e.contact_whatsapp ?? "",
        additional_emails: (e.additional_emails ?? []).join("|"),
        additional_phones: (e.additional_phones ?? []).join("|"),
        additional_whatsapps: (e.additional_whatsapps ?? []).join("|"),
        booking_link: e.booking_link ?? "",
        booking_link_label: e.booking_link_label ?? "",
        price: e.price ?? "",
        included: (e.included ?? []).join("|"),
        notes: (Array.isArray((e as any).notes) ? (e as any).notes : ((e as any).notes ? [(e as any).notes] : [])).join("|"),
        price_notes: (e.price_notes ?? []).join("|"),
        business_names: allNames.join("|"),
        hosted_by_name: e.hosted_by_name ?? "",
        hosted_by_subtitle: e.hosted_by_subtitle ?? "",
        hosted_by_link: e.hosted_by_link ?? "",
        hosted_by_listing: idToTitle.get(e.hosted_by_listing_id) ?? "",
        hosted_by_name_2: e.hosted_by_name_2 ?? "",
        hosted_by_subtitle_2: e.hosted_by_subtitle_2 ?? "",
        hosted_by_link_2: e.hosted_by_link_2 ?? "",
        hosted_by_listing_2: idToTitle.get(e.hosted_by_listing_id_2) ?? "",
        hosted_by_name_3: e.hosted_by_name_3 ?? "",
        hosted_by_subtitle_3: e.hosted_by_subtitle_3 ?? "",
        hosted_by_link_3: e.hosted_by_link_3 ?? "",
        hosted_by_listing_3: idToTitle.get(e.hosted_by_listing_id_3) ?? "",
        is_featured: e.is_featured ? "true" : "false",
      };
      return EXPECTED_HEADERS.map((h) => escapeCSV(record[h] ?? "")).join(",");
    });
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
          <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-[550] text-foreground truncate">Import/Export Events</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadEvents} className="gap-2 opacity-100 bg-gray-400 text-slate-50 border-slate-950">
            <FileSpreadsheet className="h-4 w-4" /> <span className="hidden sm:inline">Download Events</span><span className="sm:hidden">Events</span>
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
            Events are matched by title (case-insensitive). Missing events will be deleted. Use <code>|</code> to separate list values (gallery, included, additional contacts, business_names).
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
