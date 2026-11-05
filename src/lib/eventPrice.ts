export type PriceFilter = "any" | "free" | "paid";

export const PRICE_OPTIONS: { value: PriceFilter; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

export interface EventPriceLike {
  price?: string | number | null;
}

export type PriceKind = "free" | "paid" | "unknown";

// "Free", "Free entry", "0", "R0", "no charge" and friends all mean nothing to pay.
const FREE_PRICE_TEXT =
  /^(?:free(?:\s+\w+)*|0+(?:\.\d+)?|r\s*0+(?:\.\d+)?|zero|no\s+(?:charge|cost|fee)|complimentary)$/i;

/** An event with no price populated is neither free nor paid; it only shows under Any. */
export function eventPriceKind(e: EventPriceLike): PriceKind {
  const raw = e.price == null ? "" : String(e.price).trim();
  if (!raw || raw === "-") return "unknown";
  return FREE_PRICE_TEXT.test(raw) ? "free" : "paid";
}

export function isFreeEvent(e: EventPriceLike): boolean {
  return eventPriceKind(e) === "free";
}

export function eventMatchesPrice(e: EventPriceLike, filter: PriceFilter): boolean {
  if (filter === "any") return true;
  return eventPriceKind(e) === filter;
}

/** Any counts every event; Free and Paid skip events with no price populated. */
export function countEventPrices(events: EventPriceLike[]): Record<PriceFilter, number> {
  const counts: Record<PriceFilter, number> = { any: events.length, free: 0, paid: 0 };
  for (const event of events) {
    const kind = eventPriceKind(event);
    if (kind !== "unknown") counts[kind] += 1;
  }
  return counts;
}
