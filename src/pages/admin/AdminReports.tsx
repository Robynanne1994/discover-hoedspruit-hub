import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv } from "@/lib/reports/csv";
import { checkImagesConcurrent } from "@/lib/reports/checkImage";
import { Download, Loader2 } from "lucide-react";
import { getHoursSchedules, withHoursColumns } from "@/lib/openHours";

const SUPABASE_HOST = (() => {
  try {
    return new URL(import.meta.env.VITE_SUPABASE_URL as string).host;
  } catch {
    return "";
  }
})();

const isExternalImage = (url: string | null | undefined) =>
  !!url && url.trim() !== "" && !url.includes(SUPABASE_HOST);

const isMissing = (v: unknown) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "");

type ReportFn = (setProgress: (p: { done: number; total: number; label?: string } | null) => void) => Promise<{
  rows: Record<string, unknown>[];
  columns: string[];
  filename: string;
}>;

type ReportDef = {
  id: string;
  group: string;
  title: string;
  description: string;
  run: ReportFn;
};

// ---------- Helpers ----------

async function fetchAll<T = any>(table: string, columns: string): Promise<T[]> {
  const pageSize = 1000;
  let from = 0;
  const out: T[] = [];
  while (true) {
    const { data, error } = await supabase
      .from(table as any)
      .select(columns)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...(data as any));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

const editUrl = (kind: "listing" | "event" | "special", id: string) => {
  if (kind === "listing") return `${window.location.origin}/admin/listings?edit=${id}`;
  if (kind === "event") return `${window.location.origin}/admin/events?edit=${id}`;
  return `${window.location.origin}/admin/specials?edit=${id}`;
};

// ---------- Report definitions ----------

const REPORTS: ReportDef[] = [
  {
    id: "listings-broken-images",
    group: "Listings",
    title: "No images",
    description: "Listings with no image at all (cover, detail, card or saved all empty or unreachable).",
    run: async (setProgress) => {
      const rows = await fetchAll<any>(
        "listings",
        "id, title, image_url, detail_image_url, card_image_url, saved_image_url",
      );
      const FIELDS = ["image_url", "detail_image_url", "card_image_url", "saved_image_url"] as const;
      const candidates: { row: any; urls: string[] }[] = [];
      const out: Record<string, unknown>[] = [];
      for (const r of rows) {
        const urls = FIELDS.map((f) => r[f]).filter((u: unknown) => !isMissing(u)) as string[];
        if (urls.length === 0) {
          out.push({ title: r.title, admin_edit_url: editUrl("listing", r.id) });
        } else {
          candidates.push({ row: r, urls });
        }
      }
      const toCheck = candidates.flatMap((c) => c.urls.map((url) => ({ c, url })));
      setProgress({ done: 0, total: toCheck.length, label: "Checking image URLs" });
      const statuses = await checkImagesConcurrent(toCheck, (x) => x.url, (done, total) => setProgress({ done, total, label: "Checking image URLs" }));
      for (const c of candidates) {
        const anyOk = toCheck.some((x) => x.c === c && statuses.get(x) === "ok");
        if (!anyOk) out.push({ title: c.row.title, admin_edit_url: editUrl("listing", c.row.id) });
      }
      return { rows: out, columns: ["title", "admin_edit_url"], filename: "listings-no-images.csv" };
    },
  },

  {
    id: "events-broken-images",
    group: "Events",
    title: "Broken or missing images",
    description: "Events where any image (card, detail, homepage) is empty or unreachable.",
    run: async (setProgress) => {
      const rows = await fetchAll<any>("events", "id, title, image_url, detail_image_url, homepage_image_url");
      const toCheck: { row: any; field: string; url: string }[] = [];
      const out: Record<string, unknown>[] = [];
      for (const r of rows) {
        for (const field of ["image_url", "detail_image_url", "homepage_image_url"]) {
          const url = r[field];
          if (isMissing(url)) {
            out.push({ id: r.id, title: r.title, field, status: "missing", url: "", admin_edit_url: editUrl("event", r.id) });
          } else {
            toCheck.push({ row: r, field, url });
          }
        }
      }
      setProgress({ done: 0, total: toCheck.length, label: "Checking image URLs" });
      const statuses = await checkImagesConcurrent(toCheck, (x) => x.url, (done, total) => setProgress({ done, total, label: "Checking image URLs" }));
      for (const item of toCheck) {
        if (statuses.get(item) === "broken") {
          out.push({ id: item.row.id, title: item.row.title, field: item.field, status: "broken", url: item.url, admin_edit_url: editUrl("event", item.row.id) });
        }
      }
      return { rows: out, columns: ["id", "title", "field", "status", "url", "admin_edit_url"], filename: "events-broken-images.csv" };
    },
  },
  {
    id: "specials-broken-images",
    group: "Specials",
    title: "Broken or missing images",
    description: "Specials where the card or detail image is empty or unreachable.",
    run: async (setProgress) => {
      const rows = await fetchAll<any>("specials", "id, title, image_url, detail_image_url");
      const toCheck: { row: any; field: string; url: string }[] = [];
      const out: Record<string, unknown>[] = [];
      for (const r of rows) {
        for (const field of ["image_url", "detail_image_url"]) {
          const url = r[field];
          if (isMissing(url)) {
            out.push({ id: r.id, title: r.title, field, status: "missing", url: "", admin_edit_url: editUrl("special", r.id) });
          } else {
            toCheck.push({ row: r, field, url });
          }
        }
      }
      setProgress({ done: 0, total: toCheck.length, label: "Checking image URLs" });
      const statuses = await checkImagesConcurrent(toCheck, (x) => x.url, (done, total) => setProgress({ done, total, label: "Checking image URLs" }));
      for (const item of toCheck) {
        if (statuses.get(item) === "broken") {
          out.push({ id: item.row.id, title: item.row.title, field: item.field, status: "broken", url: item.url, admin_edit_url: editUrl("special", item.row.id) });
        }
      }
      return { rows: out, columns: ["id", "title", "field", "status", "url", "admin_edit_url"], filename: "specials-broken-images.csv" };
    },
  },
  {
    id: "listings-missing-descriptions",
    group: "Listings",
    title: "Missing descriptions",
    description: "Listings missing the long description.",
    run: async () => {
      const rows = await fetchAll<any>("listings", "id, title, long_description");
      const out = rows
        .filter((r) => isMissing(r.long_description))
        .map((r) => ({
          id: r.id,
          title: r.title,
          admin_edit_url: editUrl("listing", r.id),
        }));
      return { rows: out, columns: ["id", "title", "admin_edit_url"], filename: "listings-missing-descriptions.csv" };
    },
  },
  {
    id: "events-missing-descriptions",
    group: "Events",
    title: "Missing descriptions",
    description: "Events with no description / notes content.",
    run: async () => {
      const rows = await fetchAll<any>("events", "id, title, description, notes");
      const out = rows
        .filter((r) => isMissing(r.description) || isMissing(r.notes))
        .map((r) => ({
          id: r.id,
          title: r.title,
          missing_description: isMissing(r.description),
          missing_notes: isMissing(r.notes),
          admin_edit_url: editUrl("event", r.id),
        }));
      return { rows: out, columns: ["id", "title", "missing_description", "missing_notes", "admin_edit_url"], filename: "events-missing-descriptions.csv" };
    },
  },
  {
    id: "specials-missing-descriptions",
    group: "Specials",
    title: "Missing descriptions",
    description: "Specials with no description text.",
    run: async () => {
      const rows = await fetchAll<any>("specials", "id, title, description");
      const out = rows
        .filter((r) => isMissing(r.description))
        .map((r) => ({ id: r.id, title: r.title, admin_edit_url: editUrl("special", r.id) }));
      return { rows: out, columns: ["id", "title", "admin_edit_url"], filename: "specials-missing-descriptions.csv" };
    },
  },
  {
    id: "listings-missing-hours",
    group: "Listings",
    title: "Missing opening hours",
    description: "Listings with no opening hours set, in any of their schedules.",
    run: async () => {
      const rows = await withHoursColumns((hoursCols) => fetchAll<any>("listings", `id, title, ${hoursCols}`));
      // A listing whose hours live only in an extra schedule (a bar with no
      // kitchen hours captured) has hours, so it doesn't belong on this list.
      const out = rows
        .filter((r) => getHoursSchedules(r).length === 0)
        .map((r) => ({ id: r.id, title: r.title, admin_edit_url: editUrl("listing", r.id) }));
      return { rows: out, columns: ["id", "title", "admin_edit_url"], filename: "listings-missing-hours.csv" };
    },
  },
  {
    id: "listings-missing-contact",
    group: "Listings",
    title: "Missing all contact details",
    description: "Listings with no phone, WhatsApp, email, or website (including additional fields).",
    run: async () => {
      const rows = await fetchAll<any>(
        "listings",
        "id, title, phone, whatsapp, email, website, additional_phones, additional_whatsapps, additional_emails",
      );
      const hasAny = (r: any) =>
        !isMissing(r.phone) ||
        !isMissing(r.whatsapp) ||
        !isMissing(r.email) ||
        !isMissing(r.website) ||
        (Array.isArray(r.additional_phones) && r.additional_phones.some((v: string) => !isMissing(v))) ||
        (Array.isArray(r.additional_whatsapps) && r.additional_whatsapps.some((v: string) => !isMissing(v))) ||
        (Array.isArray(r.additional_emails) && r.additional_emails.some((v: string) => !isMissing(v)));
      const out = rows
        .filter((r) => !hasAny(r))
        .map((r) => ({ id: r.id, title: r.title, admin_edit_url: editUrl("listing", r.id) }));
      return { rows: out, columns: ["id", "title", "admin_edit_url"], filename: "listings-missing-contact.csv" };
    },
  },
  {
    id: "external-images",
    group: "External",
    title: "Images (not uploaded to cloud)",
    description: "Listings, events and specials whose image URLs point to an external host instead of the project storage.",
    run: async () => {
      const out: Record<string, unknown>[] = [];
      const listings = await fetchAll<any>("listings", "id, title, image_url, detail_image_url");
      for (const r of listings) {
        const hasExternal = ["image_url", "detail_image_url"].some((f) => isExternalImage(r[f]));
        if (hasExternal) out.push({ title: r.title, admin_edit_url: editUrl("listing", r.id) });
      }
      const events = await fetchAll<any>("events", "id, title, image_url, detail_image_url, homepage_image_url");
      for (const r of events) {
        const hasExternal = ["image_url", "detail_image_url", "homepage_image_url"].some((f) => isExternalImage(r[f]));
        if (hasExternal) out.push({ title: r.title, admin_edit_url: editUrl("event", r.id) });
      }
      const specials = await fetchAll<any>("specials", "id, title, image_url, detail_image_url");
      for (const r of specials) {
        const hasExternal = ["image_url", "detail_image_url"].some((f) => isExternalImage(r[f]));
        if (hasExternal) out.push({ title: r.title, admin_edit_url: editUrl("special", r.id) });
      }
      return { rows: out, columns: ["title", "admin_edit_url"], filename: "external-images.csv" };
    },
  },
];

// ---------- Page ----------

type ReportState = {
  running: boolean;
  progress: { done: number; total: number; label?: string } | null;
  lastCount: number | null;
  error: string | null;
};

const IDLE: ReportState = { running: false, progress: null, lastCount: null, error: null };

const AdminReports = () => {
  const [states, setStates] = useState<Record<string, ReportState>>({});

  const patch = (id: string, next: Partial<ReportState>) =>
    setStates((prev) => ({ ...prev, [id]: { ...IDLE, ...prev[id], ...next } }));

  const handleRun = async (report: ReportDef) => {
    patch(report.id, { running: true, progress: null, lastCount: null, error: null });
    try {
      const result = await report.run((p) => patch(report.id, { progress: p }));
      patch(report.id, { lastCount: result.rows.length });
      downloadCsv(result.filename, result.rows, result.columns);
    } catch (e: any) {
      patch(report.id, { error: e?.message ?? "Failed to generate report" });
    } finally {
      patch(report.id, { running: false, progress: null });
    }
  };

  return (
    <div>
      <h1 className="font-heading text-2xl lg:text-3xl font-[550] text-slate-950 mb-2">Reports</h1>
      <p className="text-sm text-muted-foreground mb-6 text-slate-950">{"\n"}</p>
      <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full table-fixed text-sm min-w-[820px]">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 text-[15px] font-bold text-foreground w-[10%]">Type</th>
              <th className="text-left p-3 text-[15px] font-bold text-foreground w-[24%]">Report</th>
              <th className="text-left p-3 text-[15px] font-bold text-foreground w-[32%]">Description</th>
              <th className="text-left p-3 text-[15px] font-bold text-foreground w-[14%]">Status</th>
              <th className="p-3 w-[20%]"></th>
            </tr>
          </thead>
          <tbody>
            {REPORTS.map((r) => {
              const s = { ...IDLE, ...states[r.id] };
              return (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 text-sm font-bold text-foreground">{r.group}</td>
                  <td className="p-3 font-normal text-foreground max-w-0">
                    <span className="block truncate" title={r.title}>{r.title}</span>
                  </td>
                  <td className="p-3 text-muted-foreground">{r.description}</td>
                  <td className="p-3 text-muted-foreground">
                    {s.error ? (
                      <span className="block text-xs text-destructive">{s.error}</span>
                    ) : s.progress ? (
                      <span className="block text-xs">
                        {s.progress.label ?? "Working"}… {s.progress.done}/{s.progress.total}
                        <span className="block h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                          <span
                            className="block h-full bg-primary transition-all"
                            style={{ width: `${s.progress.total ? (s.progress.done / s.progress.total) * 100 : 0}%` }}
                          />
                        </span>
                      </span>
                    ) : s.lastCount !== null ? (
                      <span className="block text-xs">
                        {s.lastCount} {s.lastCount === 1 ? "row" : "rows"} exported.
                      </span>
                    ) : (
                      <span className="block text-xs">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleRun(r)}
                        disabled={s.running}
                        className="inline-flex items-center gap-2 px-4 h-9 rounded-full bg-primary text-primary-foreground text-sm font-medium whitespace-nowrap disabled:opacity-60"
                      >
                        {s.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {s.running ? "Generating…" : "Download CSV"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReports;
