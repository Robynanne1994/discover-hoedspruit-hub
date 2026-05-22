// Minimal CSV helpers for admin reports.

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s: string;
  if (Array.isArray(value)) s = value.join("; ");
  else if (typeof value === "object") s = JSON.stringify(value);
  else s = String(value);
  if (/[",\n\r]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) {
    return (columns ?? []).join(",") + "\n";
  }
  const cols = columns ?? Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  );
  const header = cols.join(",");
  const body = rows.map((row) => cols.map((c) => escapeCell(row[c])).join(",")).join("\n");
  return `${header}\n${body}\n`;
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[], columns?: string[]) {
  const csv = toCsv(rows, columns);
  // BOM so Excel/Numbers open UTF-8 properly
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
