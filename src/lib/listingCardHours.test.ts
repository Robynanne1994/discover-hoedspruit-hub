import { describe, expect, it } from "vitest";
import { listingCardHours } from "./listingCardHours";

const weekdays = { monday: "07:30 - 17:00", tuesday: "07:30 - 17:00", wednesday: "07:30 - 17:00", thursday: "07:30 - 17:00", friday: "07:30 - 17:00", saturday: "Closed", sunday: "Closed" };
describe("category card hours", () => {
  it("uses the first populated schedule even when only the second is open", () => {
    const result = listingCardHours({ opening_hours_label: "General", opening_hours: weekdays, additional_hours: [{ label: "Bar", hours: { saturday: "Always Open" } }] }, new Date("2026-11-07T10:00:00"));
    expect(result).toEqual({ state: "closed", label: "Closed", detail: "Opens 7:30AM Mon" });
  });
  it("uses the first populated additional set if the primary is empty", () => {
    expect(listingCardHours({ opening_hours: {}, additional_hours: [{ label: "Empty", hours: {} }, { label: "Kitchen", hours: weekdays }] }, new Date("2026-11-09T10:00:00"))).toEqual({ state: "open", label: "Open", detail: "Closes 5:00PM" });
  });
  it("skips Saturday and Sunday and abbreviates Monday", () => {
    expect(listingCardHours({ opening_hours: weekdays }, new Date("2026-11-07T10:00:00")).detail).toBe("Opens 7:30AM Mon");
  });
  it("includes today's opening without a weekday when not yet open", () => {
    expect(listingCardHours({ opening_hours: weekdays }, new Date("2026-11-09T06:00:00"))).toEqual({ state: "closed", label: "Closed", detail: "Opens 7:30AM" });
  });
  it("advances to the next day after closing rather than quoting today's past opening", () => {
    expect(listingCardHours({ opening_hours: weekdays }, new Date("2026-11-09T18:00:00")).detail).toBe("Opens 7:30AM Tue");
  });
  it("identifies always-open cards", () => {
    expect(listingCardHours({ opening_hours: { monday: "Always Open" } }, new Date("2026-11-09T10:00:00"))).toEqual({ state: "open", label: "Open", detail: "Always Open" });
  });
  it("reads the previous day's overnight closing time", () => {
    expect(listingCardHours({ opening_hours: { monday: "18:00 - 02:00", tuesday: "Closed" } }, new Date("2026-11-10T01:00:00"))).toEqual({ state: "open", label: "Open", detail: "Closes 2:00AM" });
  });
});