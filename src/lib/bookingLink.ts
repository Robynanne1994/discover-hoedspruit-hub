// Booking links can be a website, an email address, a WhatsApp number or a
// phone number. Admins pick the kind in the editor; older rows have no kind
// stored, so we fall back to detecting it from the value itself.

export type BookingLinkType = "link" | "email" | "whatsapp" | "phone";

export const BOOKING_LINK_TYPES: { value: BookingLinkType; label: string }[] = [
  { value: "link", label: "Website Link" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Phone" },
];

export function detectBookingLinkType(raw: string): BookingLinkType {
  const v = (raw || "").trim();
  if (!v) return "link";
  if (/^mailto:/i.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "email";
  if (/wa\.me|api\.whatsapp\.com|whatsapp/i.test(v)) return "whatsapp";
  if (/^tel:/i.test(v)) return "phone";
  if (/^https?:\/\//i.test(v) || /^www\./i.test(v) || /\.[a-z]{2,}(\/|$)/i.test(v)) return "link";
  // Bare digits (with the usual spacing, dashes and country code) = phone.
  if (/^\+?[0-9][0-9\s()\-]{5,}$/.test(v)) return "phone";
  return "link";
}

export function resolveBookingLinkType(
  raw: string | null | undefined,
  stored?: string | null,
): BookingLinkType {
  const s = (stored || "").trim().toLowerCase();
  if (s === "link" || s === "website" || s === "url") return "link";
  if (s === "email" || s === "mail") return "email";
  if (s === "whatsapp" || s === "wa") return "whatsapp";
  if (s === "phone" || s === "tel" || s === "call") return "phone";
  return detectBookingLinkType(raw || "");
}

/** Turns the stored booking value into an href the browser can open. */
export function buildBookingHref(
  raw: string | null | undefined,
  stored?: string | null,
): { href: string; type: BookingLinkType; external: boolean } | null {
  const value = (raw || "").trim();
  if (!value) return null;
  const type = resolveBookingLinkType(value, stored);

  if (type === "email") {
    const email = value.replace(/^mailto:/i, "").trim();
    return { href: `mailto:${email}`, type, external: false };
  }
  if (type === "phone") {
    const digits = value.replace(/^tel:/i, "").replace(/[^0-9+]/g, "");
    return { href: `tel:${digits}`, type, external: false };
  }
  if (type === "whatsapp") {
    if (/^https?:\/\//i.test(value)) return { href: value, type, external: true };
    const digits = value.replace(/[^0-9]/g, "");
    const intl = digits.startsWith("0") ? `27${digits.slice(1)}` : digits;
    return { href: `https://wa.me/${intl}`, type, external: true };
  }
  const href = /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, "")}`;
  return { href, type, external: true };
}

export function bookingActionLabel(type: BookingLinkType): string {
  switch (type) {
    case "email": return "Email";
    case "phone": return "Call";
    case "whatsapp": return "WhatsApp";
    default: return "Book";
  }
}

export function bookingRowLabel(type: BookingLinkType): string {
  switch (type) {
    case "email": return "Booking email";
    case "phone": return "Booking phone";
    case "whatsapp": return "Book on WhatsApp";
    default: return "Booking link";
  }
}
