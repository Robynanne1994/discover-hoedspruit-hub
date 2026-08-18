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
    title: "Listings — no images",
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
    title: "Events — broken or missing images",
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
    title: "Specials — broken or missing images",
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
    title: "Listings — missing descriptions",
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
    title: "Events — missing descriptions",
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
    title: "Specials — missing descriptions",
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
    title: "Listings — missing opening hours",
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
    title: "Listings — missing all contact details",
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
    title: "External images (not uploaded to cloud)",
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

const ReportCard = ({ report }: { report: ReportDef }) => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; label?: string } | null>(null);
  const [lastCount, setLastCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setProgress(null);
    setLastCount(null);
    try {
      const result = await report.run(setProgress);
      setLastCount(result.rows.length);
      downloadCsv(result.filename, result.rows, result.columns);
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate report");
    } finally {
      setRunning(false);
      setProgress(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
      <div>
        <h3 className="font-heading text-base font-semibold text-slate-950">{report.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
      </div>
      {progress && (
        <div className="text-xs text-muted-foreground">
          {progress.label ?? "Working"}… {progress.done}/{progress.total}
          <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}
      {lastCount !== null && !running && (
        <p className="text-xs text-muted-foreground">
          {lastCount} {lastCount === 1 ? "row" : "rows"} exported.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex">
        <button
          onClick={handleRun}
          disabled={running}
          className="inline-flex items-center gap-2 px-4 h-9 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {running ? "Generating…" : "Download CSV"}
        </button>
      </div>
    </div>
  );
};

const AdminReports = () => {
  return (
    <div>
      <h1 className="font-heading text-2xl lg:text-3xl font-[550] text-slate-950 mb-2">Reports</h1>
      <p className="text-sm text-muted-foreground mb-6 text-slate-950">
        Generate CSV reports on demand. Files download immediately and open in Google Sheets, Numbers or Excel.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        {REPORTS.map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
      </div>
    </div>
  );
};

export default AdminReports;
