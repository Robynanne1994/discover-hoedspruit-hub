export function formatSAPhone(input?: string | null): string {
  if (!input) return "";
  let digits = input.replace(/[^0-9]/g, "");
  if (digits.startsWith("27") && digits.length === 11) {
    digits = "0" + digits.slice(2);
  } else if (digits.startsWith("0027")) {
    digits = "0" + digits.slice(4);
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return input;
}
