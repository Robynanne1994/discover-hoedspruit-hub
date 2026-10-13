// One source of truth for how a specials price cell is normalised between the
// CSV and the stored value, shared by the import page and the tests.

/**
 * Formats a plain number ("4999", "4,999", "450.00", "R4999") as the stored
 * price format, e.g. "R4,999". Free-text prices ("R450pp", "Free", "From R200")
 * pass through unchanged so businesses can still label prices their own way.
 * Blank returns null (the stored "not set").
 */
export const formatSpecialPriceCell = (val: string | null | undefined): string | null => {
  const raw = (val ?? "").trim();
  if (!raw) return null;
  // Optional R prefix, then digits with optional thousands commas and decimals.
  // Anything with other letters ("R450pp", "Free") is left exactly as written.
  const m = raw.match(/^R?\s*([\d,]+(?:\.\d+)?)$/i);
  if (!m) return raw;
  const num = m[1].replace(/,/g, "");
  const [intPart, decPart] = num.split(".");
  const trimmedDec = decPart?.replace(/0+$/, "");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `R${grouped}${trimmedDec ? `.${trimmedDec}` : ""}`;
};
