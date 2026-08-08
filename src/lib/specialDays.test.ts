import { describe, expect, it } from "vitest";
import { compactDays, formatDays, daysToCsv, parseDays, recurringDays } from "@/lib/specialDays";

// Day names reach the app from three places — the column, an admin form and a
// CSV — and only one of them is tidy.
describe("parseDays", () => {
  it("reads the stored list, in week order and without repeats", () => {
    expect(parseDays(["Thursday", "Wednesday", "Thursday"])).toEqual(["Wednesday", "Thursday"]);
  });

  it("still reads a row written before a special could run on two days", () => {
    expect(parseDays("Tuesday")).toEqual(["Tuesday"]);
  });

  it("takes a CSV cell however it was delimited", () => {
    expect(parseDays("Wednesday|Thursday")).toEqual(["Wednesday", "Thursday"]);
    expect(parseDays("Wed, Thu")).toEqual(["Wednesday", "Thursday"]);
    expect(parseDays("saturday / sunday")).toEqual(["Saturday", "Sunday"]);
  });

  it("forgives the shorthand a person actually types", () => {
    expect(parseDays("Mondays")).toEqual(["Monday"]);
    expect(parseDays("weds")).toEqual(["Wednesday"]);
    expect(parseDays("THURS")).toEqual(["Thursday"]);
  });

  it("drops anything that is not a day rather than showing it on a card", () => {
    expect(parseDays("Wendesday")).toEqual([]);
    expect(parseDays("")).toEqual([]);
    expect(parseDays(null)).toEqual([]);
    expect(parseDays(["Wednesday", "", "Funday"])).toEqual(["Wednesday"]);
  });
});

describe("formatDays", () => {
  it("spells out one or two days", () => {
    expect(formatDays(parseDays("Wednesday"))).toBe("Wednesday");
    expect(formatDays(parseDays("Wednesday|Thursday"))).toBe("Wednesday & Thursday");
  });

  it("abbreviates for the narrow surfaces", () => {
    expect(formatDays(parseDays("Wednesday|Thursday"), "short")).toBe("Wed & Thu");
  });

  it("reads a consecutive stretch as a range", () => {
    expect(formatDays(parseDays("Mon|Tue|Wed|Thu|Fri"), "short")).toBe("Mon–Fri");
    expect(formatDays(parseDays("Mon|Tue|Wed"))).toBe("Monday to Wednesday");
  });

  it("lists days that are not consecutive", () => {
    expect(formatDays(parseDays("Mon|Wed|Fri"), "short")).toBe("Mon, Wed & Fri");
  });

  it("calls the whole week what it is", () => {
    expect(formatDays(parseDays("Mon|Tue|Wed|Thu|Fri|Sat|Sun"))).toBe("Every day");
  });

  it("has nothing to say about a special with no weekly schedule", () => {
    expect(formatDays([])).toBeNull();
  });
});

describe("compactDays", () => {
  // A single day is short enough to keep its name; two are not.
  it("keeps the full name for one day and shortens the rest", () => {
    expect(compactDays(parseDays("Tuesday"))).toBe("Tuesday");
    expect(compactDays(parseDays("Wednesday|Thursday"))).toBe("Wed & Thu");
  });
});

describe("recurringDays", () => {
  it("pluralises a single day and leaves a list alone", () => {
    expect(recurringDays(parseDays("Tuesday"))).toBe("Tuesdays");
    expect(recurringDays(parseDays("Wednesday|Thursday"))).toBe("Wed & Thu");
  });
});

describe("daysToCsv", () => {
  it("round-trips through the pipe-separated CSV column", () => {
    expect(daysToCsv(["Thursday", "Wednesday"])).toBe("Wednesday|Thursday");
    expect(parseDays(daysToCsv("Wed, Thu"))).toEqual(["Wednesday", "Thursday"]);
    expect(daysToCsv(null)).toBe("");
  });
});
