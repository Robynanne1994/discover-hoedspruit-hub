export type PriceFilter = "any" | "free" | "paid";

export const PRICE_OPTIONS: { value: PriceFilter; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

export interface EventPriceLike {
  price?: string | number | null;
}

// "Free", "Free entry", "0", "R0", "no charge" and friends all mean nothing to pay.
const FREE_PRICE_TEXT =
  /^(?:free(?:\s+\w+)*|0+(?:\.\d+)?|r\s*0+(?:\.\d+)?|zero|no\s+(?:charge|cost|fee)|complimentary)$/i;

/** An event with no price populated is free; so is anything worded as free. */
export function isFreeEvent(e: EventPriceLike): boolean {
  const raw = e.price == null ? "" : String(e.price).trim();
  if (!raw || raw === "-") return true;
  return FREE_PRICE_TEXT.test(raw);
}

export function eventMatchesPrice(e: EventPriceLike, filter: PriceFilter): boolean {
  if (filter === "any") return true;
  return filter === "free" ? isFreeEvent(e) : !isFreeEvent(e);
}

/** Free and Paid always add up to Any, so the drawer pills and the results agree. */
export function countEventPrices(events: EventPriceLike[]): Record<PriceFilter, number> {
  const counts: Record<PriceFilter, number> = { any: events.length, free: 0, paid: 0 };
  for (const event of events) counts[isFreeEvent(event) ? "free" : "paid"] += 1;
  return counts;
}
