// Listing contact columns on the universal sheet: each contact type is one
// pipe-separated cell plus one positional label cell ("-" holds an unlabelled
// slot, e.g. "-|Lodge"). Storage keeps the editor's primary + extras split.
import { parseEventContactCells, splitContactLabels } from "./eventContacts";

export const LISTING_CONTACT_GROUPS = [
  { value: "phone", label: "phone_label", extras: "additional_phones", extraLabels: "additional_phone_labels" },
  { value: "whatsapp", label: "whatsapp_label", extras: "additional_whatsapps", extraLabels: "additional_whatsapp_labels" },
  { value: "email", label: "email_label", extras: "additional_emails", extraLabels: "additional_email_labels" },
  { value: "website", label: "website_label", extras: "additional_websites", extraLabels: "additional_website_labels" },
] as const;

export type ContactGroup = (typeof LISTING_CONTACT_GROUPS)[number];

export const contactGroupForValue = (field: string) => LISTING_CONTACT_GROUPS.find((g) => g.value === field);
export const isContactLabelColumn = (field: string) => LISTING_CONTACT_GROUPS.some((g) => g.label === field);

const isPlaceholder = (v: string) => /^[-–—]+$/.test(v) || /^(n\/a|na|none|null)$/i.test(v);

/** Combined export cells; labels padded with "-" only when some contact in the cell is labelled. */
export function contactCellsForExport(row: Record<string, unknown>, g: ContactGroup) {
  const values = [String(row[g.value] ?? ""), ...(((row[g.extras] as string[] | null) ?? []).map(String))];
  const labels = [String(row[g.label] ?? ""), ...(((row[g.extraLabels] as string[] | null) ?? []).map(String))];
  const pairs = values
    .map((v, i) => ({ value: v.trim(), label: (labels[i] ?? "").trim() }))
    .filter(({ value }) => value && !isPlaceholder(value));
  const fallback = g.value === "website" ? "Website" : "";
  const withLabels = pairs.map((p) => ({ ...p, label: p.label || fallback }));
  const anyLabel = withLabels.some((p) => p.label);
  return {
    contacts: withLabels.map((p) => p.value).join("|"),
    labels: anyLabel ? withLabels.map((p) => p.label || "-").join("|") : "",
  };
}

/** Import: null = leave stored values alone (blank cell on update). */
export function contactPayloadFromCells(
  contactsCell: string | undefined, labelsCell: string | undefined, g: ContactGroup, isUpdate: boolean,
): Record<string, unknown> | null {
  const contacts = (contactsCell ?? "").trim();
  const labels = (labelsCell ?? "").trim();
  if (contacts === "" && isUpdate) return null;
  if (contacts === "" || isPlaceholder(contacts)) {
    return { [g.value]: null, [g.label]: null, [g.extras]: [], [g.extraLabels]: [] };
  }
  const parsed = parseEventContactCells(contacts, labels);
  const out: Record<string, unknown> = { [g.value]: parsed.primary, [g.extras]: parsed.extras };
  // A blank label cell on update keeps the stored labels.
  if (labels !== "" || !isUpdate) {
    out[g.label] = parsed.label || null;
    out[g.extraLabels] = parsed.extraLabels;
  }
  return out;
}

export { splitContactLabels };
