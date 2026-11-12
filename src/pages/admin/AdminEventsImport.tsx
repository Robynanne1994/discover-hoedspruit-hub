import { isLateEndTime, LATE_END_TIME } from "@/lib/eventEndTime";
import { parseHostCells, serializeHostCells, hostsToColumns } from "@/lib/eventHostsCsv";
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseTitleOverrideCell, titleOverrideValue, titleOverrideToCsv } from "@/lib/displayTitle";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { stripImageCsvColumns, omitImageKeys } from "@/lib/csvImageColumns";
import { parseEventContactCells, serializeEventContactCells } from "@/lib/eventContacts";
import { eventCsvAction, eventCsvScope, type EventCsvImportMode, type EventCsvScope } from "@/lib/eventCsvScope";

// Image columns are deliberately excluded, exactly as in the listings import /
// export: pictures are cropped and set in the admin editor only, so a CSV can
// never carry, overwrite or clear them.
const EXPECTED_HEADERS = stripImageCsvColumns([
  "id",
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
  "email_label",
  "contact_phone",
  "phone_label",
  "contact_whatsapp",
  "whatsapp_label",
  "booking_link",
  "booking_link_type",
  "booking_link_label",
  "price",
  "included",
  "price_notes",
  "notes",
  "business_names",
  "hosted_by_name",
  "hosted_by_subtitle",
  "hosted_by_link",
  "is_featured",
]);


// Normalise a CSV time cell to "HH:MM". A one-digit hour gets a leading 0
// ("6:30" → "06:30"); anything that isn't a time returns null.
const normalizeTime = (v: string | undefined): string | null => {
  if (!v) return null;
  const m = v.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  if (h > 23) return null;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
};

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
    const time = normalizeTime(parts[1]);
    const end_time = normalizeTime(parts[2]);
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
  const [importResult, setImportResult] = useState<{ created: number; updated: number; deleted: number; skipped?: number; errors: string[] } | null>(null);
  const [importMode, setImportMode] = useState<EventCsvImportMode>("upcoming");
  const changeImportMode = (mode: EventCsvImportMode) => {
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
      // Ignore any image columns a spreadsheet happens to carry, so they never
      // show in the preview table nor reach the database.
      setParsed({
        headers: stripImageCsvColumns(result.headers),
        rows: result.rows.map((r) => omitImageKeys({ ...r })),
      });

    };
    reader.readAsText(file);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!parsed) throw new Error("No data");
      const results = { created: 0, updated: 0, deleted: 0, skipped: 0, errors: [] as string[] };

      const now = new Date();
      const { data: existing, error: existingError } = await supabase.from("events").select("id, title, date, start_date, end_date, recurrence, performances");
      if (existingError) throw existingError;
      const existingMap = new Map((existing ?? []).map((e) => [e.title.trim().toLowerCase(), e]));
      const existingById = new Map((existing ?? []).map((e) => [e.id, e]));

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
        const match = row.id?.trim()
          ? existingById.get(row.id.trim())
          : existingMap.get(title.toLowerCase());
        if (row.id?.trim() && !match) {
          results.skipped++;
          results.errors.push(`Row ${i + 2}: Event ID not found, left untouched`);
          continue;
        }
        if (match && importMode === "new") { results.skipped++; continue; }

        // Resolve linked businesses — supports single business_name and multi business_names (pipe-separated)
        const businessNames = [
          ...(row.business_name && row.business_name.trim() ? [row.business_name.trim()] : []),
          ...splitPipe(row.business_names),
        ];
        const businessIds = businessNames
          .map((n) => resolveListing(n, i))
          .filter((v): v is string => !!v);
        const businessId = businessIds[0] ?? null;
        const emails = parseEventContactCells(row.contact_email, row.email_label);
        const phones = parseEventContactCells(row.contact_phone, row.phone_label);
        const whatsapps = parseEventContactCells(row.contact_whatsapp, row.whatsapp_label);

        const payload: Record<string, any> = {
          title,
          title_override: titleOverrideValue(parseTitleOverrideCell(row.title_override) === true, title),
          description: row.description || null,
          date: row.date || (row.start_date && row.end_date && row.start_date !== row.end_date ? `${row.start_date} to ${row.end_date}` : (row.start_date || "")),
          start_date: row.start_date || null,
          end_date: row.end_date || null,
          location: row.location || null,
          tag: row.tag || null,
          sub_tag_1: row.sub_tag_1 || null,
          sub_tag_2: row.sub_tag_2 || null,
          start_time: normalizeTime(row.start_time) ?? (row.start_time || null),
          end_time: isLateEndTime(row.end_time) ? LATE_END_TIME : (normalizeTime(row.end_time) ?? (row.end_time || null)),
          recurrence: row.recurrence || null,
          google_maps_link: row.google_maps_link || null,
          social_media_link: row.social_media_link || null,
          social_media_label: row.social_media_label || null,
          contact_email: emails.primary,
          email_label: emails.label,
          contact_phone: phones.primary,
          phone_label: phones.label,
          contact_whatsapp: whatsapps.primary,
          whatsapp_label: whatsapps.label,
          additional_emails: emails.extras,
          additional_email_labels: emails.extraLabels,
          additional_phones: phones.extras,
          additional_phone_labels: phones.extraLabels,
          additional_whatsapps: whatsapps.extras,
          additional_whatsapp_labels: whatsapps.extraLabels,
          booking_link: row.booking_link || null,
          booking_link_type: row.booking_link_type || null,
          booking_link_label: row.booking_link_label || null,
          price: row.price || null,
          included: splitPipe(row.included),
          notes: splitPipe(row.notes),
          price_notes: splitPipe(row.price_notes),
          business_id: businessId,
          business_ids: businessIds,
          ...hostsToColumns(parseHostCells(row.hosted_by_name, row.hosted_by_subtitle, row.hosted_by_link, (t) => resolveListing(t, i))),
          performances: parsePerformances(row.performances),
          is_featured: parseBool(row.is_featured),
        };
        omitImageKeys(payload);


        // If performances provided, auto-derive start/end_date to match the editor's behaviour.
        if (Array.isArray(payload.performances) && payload.performances.length > 0) {
          const sorted = [...payload.performances].sort((a: any, b: any) =>
            a.date === b.date ? (a.time || "").localeCompare(b.time || "") : a.date.localeCompare(b.date),
          );
          payload.start_date = sorted[0].date;
          payload.end_date = sorted[sorted.length - 1].date;
        }

        const action = eventCsvAction(importMode, payload, match, now);
        if (action === "skip") {
          results.skipped++;
          results.errors.push(`Row ${i + 2}: Outside the selected scope or not an existing past event, left untouched`);
          continue;
        }
        if (action === "update" && match) {
          const { error } = await supabase.from("events").update(payload as any).eq("id", match.id);
          if (error) results.errors.push(`Row ${i + 2}: Update failed - ${error.message}`);
          else results.updated++;
        } else {
          const { data: inserted, error } = await supabase.from("events").insert(payload as any).select("id, title, date, start_date, end_date, recurrence, performances").single();
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

      // No mode deletes missing rows. Separate sheets cannot remove other events.

      return results;
    },
    onSuccess: (results) => {
      setImportResult(results);
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["events-page"] });
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

  const escapeCSV = (val: string) =>
    val.includes(",") || val.includes('"') || val.includes("\n") ? `"${val.replace(/"/g, '""')}"` : val;

  const downloadTemplate = () => {
    const sample: Record<string, string> = {
      title: "Market Day",
      title_override: "false",
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
      contact_email: "info@example.com|second@example.com|third@example.com",
      email_label: "Bookings|Accounts|",
      contact_phone: "+27 123 456 789|+27 987 654 321",
      phone_label: "Reception|After Hours",
      contact_whatsapp: "+27 123 456 789|+27 987 654 321",
      whatsapp_label: "Reception|After Hours",
      booking_link: "https://bookme.com/example",
      booking_link_type: "link",
      booking_link_label: "Book on Quicket",
      price: "R150",
      included: "Welcome drink|Live music|Parking",
      notes: "Doors open 30 minutes before the show|Bring your own chair",
      price_notes: "Per person|Includes welcome drink|Minimum 4 people",
      business_names: "Some Business Name|Another Linked Listing",
      hosted_by_name: "Kamogelo Tourism Centre|Michael Musgrave",
      hosted_by_subtitle: "Local Shopping Centre|Author",
      hosted_by_link: "Local Shopping Centre|https://sowc.alueducation.com/dr-michael-musgrave/",
      is_featured: "true",

    };
    const csv =
      EXPECTED_HEADERS.join(",") +
      "\n" +
      EXPECTED_HEADERS.map((h) => escapeCSV(sample[h] ?? "")).join(",") +
      "\n";
    downloadCSV(csv, "events_template.csv");
  };

  const downloadEvents = async (scope: EventCsvScope) => {
    const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    const now = new Date();
    const events = (data ?? []).filter((event) => eventCsvScope(event, now) === scope);
    if (!events.length) { toast.error(`No ${scope} events to export`); return; }

    // Resolve linked business titles for export
    const linkedIds = Array.from(new Set(
      events.flatMap((e: any) => [
        ...(e.business_id ? [e.business_id] : []),
        ...((e.business_ids ?? []) as string[]),
        e.hosted_by_listing_id,
        e.hosted_by_listing_id_2,
        e.hosted_by_listing_id_3,
        ...((e.extra_hosts ?? []) as any[]).map((h) => h?.listing_id),
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
      const emails = serializeEventContactCells(e.contact_email, e.email_label, e.additional_emails, e.additional_email_labels);
      const phones = serializeEventContactCells(e.contact_phone, e.phone_label, e.additional_phones, e.additional_phone_labels);
      const whatsapps = serializeEventContactCells(e.contact_whatsapp, e.whatsapp_label, e.additional_whatsapps, e.additional_whatsapp_labels);
      const record: Record<string, string> = {
        id: e.id,
        title: e.title ?? "",
        title_override: titleOverrideToCsv(e),
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
        contact_email: emails.contacts,
        email_label: emails.labels,
        contact_phone: phones.contacts,
        phone_label: phones.labels,
        contact_whatsapp: whatsapps.contacts,
        whatsapp_label: whatsapps.labels,
        booking_link: e.booking_link ?? "",
        booking_link_type: (e as any).booking_link_type ?? "",
        booking_link_label: e.booking_link_label ?? "",
        price: e.price ?? "",
        included: (e.included ?? []).join("|"),
        notes: (Array.isArray((e as any).notes) ? (e as any).notes : ((e as any).notes ? [(e as any).notes] : [])).join("|"),
        price_notes: (e.price_notes ?? []).join("|"),
        business_names: allNames.join("|"),
        ...serializeHostCells([
          ...["", "_2", "_3"].map((x) => ({ name: e[`hosted_by_name${x}`], subtitle: e[`hosted_by_subtitle${x}`], link: e[`hosted_by_link${x}`], listingTitle: idToTitle.get(e[`hosted_by_listing_id${x}`]) })),
          ...((e.extra_hosts ?? []) as any[]).map((h) => ({ name: h?.name, subtitle: h?.subtitle, link: h?.link, listingTitle: idToTitle.get(h?.listing_id) })),
        ]),
        is_featured: e.is_featured ? "true" : "false",
      };
      return EXPECTED_HEADERS.map((h) => escapeCSV(record[h] ?? "")).join(",");
    });
    downloadCSV(EXPECTED_HEADERS.join(",") + "\n" + rows.join("\n") + "\n", `events_${scope}.csv`);
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
          <Button variant="outline" size="sm" onClick={() => downloadEvents("past")} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Download Past
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadEvents("upcoming")} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Download Upcoming
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> <span className="hidden sm:inline">Download Template</span><span className="sm:hidden">Template</span>
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap gap-2" role="group" aria-label="CSV import scope">
          {(["past", "upcoming", "new"] as const).map((mode) => (
            <Button key={mode} variant={importMode === mode ? "default" : "outline"}
              aria-pressed={importMode === mode} disabled={importMutation.isPending}
              onClick={() => changeImportMode(mode)}>
              {mode === "new" ? "New Only" : mode === "past" ? "Past" : "Upcoming"}
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
            Events match by ID, or by title when ID is blank. Past updates existing past events only. Upcoming updates and adds current or future events. New Only adds new events without changing existing ones. No import deletes events. Today and ongoing events belong to Upcoming. Use <code>|</code> to separate contacts and their labels in matching order, included values and business_names. Contact actions use the first populated contact.
          </p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" disabled={importMutation.isPending} onChange={handleFile} />
        </div>

        {parsed && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{parsed.rows.length}</strong> rows found.{" "}
                {importMode === "past"
                  ? "Only matching past events will be updated. Upcoming events stay untouched."
                  : importMode === "upcoming"
                    ? "Only current or future events will be updated or added. Past events stay untouched."
                    : "Only new events will be added. Existing events stay exactly as they are."}
              </p>
              <Button onClick={() => importMutation.mutate()} disabled={importMutation.isPending} className="gap-2 shrink-0">
                {importMutation.isPending ? "Importing..." : importMode === "new" ? "Add New" : importMode === "past" ? "Import Past" : "Import Upcoming"}
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

export default AdminEventsImport;
