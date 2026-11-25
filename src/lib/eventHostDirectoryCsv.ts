export type DirectoryHost = { id: string; name: string; subtitle: string | null; image_url: string | null; link: string | null };
export const HOST_CSV_HEADERS = ["id", "name", "subtitle", "link", "image_url"] as const;
type HostPatch = { name: string; subtitle?: string | null; link?: string | null; image_url?: string | null };
export type HostImport = { id?: string; row: number; payload: HostPatch };
const nameKey = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();
const escapeCell = (value: string) => /[,"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

export function exportHostCsv(hosts: DirectoryHost[]): string {
  return "\uFEFF" + [HOST_CSV_HEADERS.join(","), ...hosts.map(host => HOST_CSV_HEADERS.map(key => escapeCell(host[key] ?? "")).join(","))].join("\r\n") + "\r\n";
}

function readCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') { cell += '"'; i++; }
      else if (quoted) quoted = false;
      else if (!cell.length) quoted = true;
      else throw new Error("Invalid quote in CSV cell.");
    } else if (c === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && source[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some(value => value.trim())) rows.push(row);
      row = []; cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("An unfinished quoted cell was found in the CSV.");
  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

export function planHostImport(text: string, existing: DirectoryHost[]): HostImport[] {
  const [header, ...rows] = readCsv(text);
  if (!header) throw new Error("CSV is empty.");
  const headers = header.map(value => value.trim().toLowerCase());
  if (!headers.includes("name")) throw new Error("CSV must have a name column.");
  if (new Set(headers).size !== headers.length) throw new Error("CSV has duplicate column headings.");
  const unknown = headers.filter(key => !HOST_CSV_HEADERS.some(allowed => allowed === key));
  if (unknown.length) throw new Error(`Unknown columns: ${unknown.join(", ")}. Use the Event Hosts CSV template.`);
  if (!rows.length) throw new Error("CSV has no hosts to upload.");
  const seenNames = new Set<string>(), seenIds = new Set<string>();
  return rows.map((values, index) => {
    const row = index + 2;
    if (values.length !== headers.length) throw new Error(`Row ${row}: column count does not match the headings.`);
    const cells = Object.fromEntries(headers.map((key, i) => [key, values[i].trim()]));
    const name = (cells.name ?? "").replace(/\s+/g, " ");
    if (!name) throw new Error(`Row ${row}: host name is required.`);
    const key = nameKey(name);
    if (seenNames.has(key)) throw new Error(`Row ${row}: duplicate host name "${name}".`);
    seenNames.add(key);
    const id = cells.id;
    const matches = id ? existing.filter(host => host.id === id) : existing.filter(host => nameKey(host.name) === key);
    if (id && !matches.length) throw new Error(`Row ${row}: host ID was not found. Leave ID blank for a new host.`);
    if (matches.length > 1) throw new Error(`Row ${row}: more than one host has this name. Use its exported ID.`);
    const matched = matches[0];
    if (matched && seenIds.has(matched.id)) throw new Error(`Row ${row}: the same host appears more than once.`);
    if (matched) seenIds.add(matched.id);
    if (existing.some(host => host.id !== matched?.id && nameKey(host.name) === key)) throw new Error(`Row ${row}: another host already has this name.`);
    const payload: HostPatch = { name };
    for (const field of ["subtitle", "link", "image_url"] as const) {
      if (headers.includes(field)) payload[field] = cells[field] || null;
    }
    return { id: matched?.id, row, payload };
  });
}

export function downloadHostCsv(hosts: DirectoryHost[], filename: string) {
  const url = URL.createObjectURL(new Blob([exportHostCsv(hosts)], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}