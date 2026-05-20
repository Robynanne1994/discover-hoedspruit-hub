export function collectContacts(
  primary: string | null | undefined,
  extras: string[] | null | undefined,
): string[] {
  const all: string[] = [];
  if (primary && primary.trim()) all.push(primary.trim());
  if (Array.isArray(extras)) {
    for (const e of extras) {
      if (e && e.trim()) all.push(e.trim());
    }
  }
  // dedupe (case-insensitive for emails, exact for numbers)
  const seen = new Set<string>();
  return all.filter((v) => {
    const k = v.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function sanitizeContactArray(arr: string[] | null | undefined): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((v) => (v || "").trim()).filter(Boolean);
}
