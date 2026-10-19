import { describe, expect, it } from "vitest";
import { filtersWithEvents } from "./eventFilterVisibility";

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Today", value: "today" },
  { label: "This Weekend", value: "this-weekend" },
  { label: "Past", value: "past" },
];

const counts: Record<string, number> = { all: 12, today: 0, "this-weekend": 0, past: 52 };

const values = (list: { value: string }[]) => list.map((f) => f.value);

describe("filtersWithEvents", () => {
  it("drops filters whose count is 0", () => {
    expect(values(filtersWithEvents(FILTERS, (f) => counts[f.value] ?? 0))).toEqual(["all", "past"]);
  });

  it("keeps every filter when all have events", () => {
    const full: Record<string, number> = { all: 12, today: 3, "this-weekend": 2, past: 52 };
    expect(values(filtersWithEvents(FILTERS, (f) => full[f.value] ?? 0))).toEqual([
      "all",
      "today",
      "this-weekend",
      "past",
    ]);
  });

  it("returns nothing when no filter has events", () => {
    expect(filtersWithEvents(FILTERS, () => 0)).toEqual([]);
  });
});
