import { describe, expect, it } from "vitest";
import { formatCardClock, listingCardHours } from "./listingCardHours";

const weekdays = { monday: "07:30 - 17:00", tuesday: "07:30 - 17:00", wednesday: "07:30 - 17:00", thursday: "07:30 - 17:00", friday: "07:30 - 17:00", saturday: "Closed", sunday: "Closed" };
describe("category card hours", () => {
  it("uses the first populated schedule even when only the second is open", () => {
    const result = listingCardHours({ opening_hours_label: "General", opening_hours: weekdays, additional_hours: [{ label: "Bar", hours: { saturday: "Always Open" } }] }, new Date("2026-11-07T10:00:00"));
    expect(result).toEqual({ state: "closed", label: "Closed", detail: "Opens 7:30AM Mon" });
  });
  it("uses the first populated additional set if the primary is empty", () => {
    expect(listingCardHours({ opening_hours: {}, additional_hours: [{ label: "Empty", hours: {} }, { label: "Kitchen", hours: weekdays }] }, new Date("2026-11-09T10:00:00"))).toEqual({ state: "open", label: "Open", detail: "Closes 5PM" });
  });
  it("skips Saturday and Sunday and abbreviates Monday", () => {
    expect(listingCardHours({ opening_hours: weekdays }, new Date("2026-11-07T10:00:00")).detail).toBe("Opens 7:30AM Mon");
  });
  it("includes today's opening without a weekday when not yet open", () => {
    expect(listingCardHours({ opening_hours: weekdays }, new Date("2026-11-09T06:00:00"))).toEqual({ state: "closed", label: "Closed", detail: "Opens 7:30AM" });
  });
  it("advances to the next day after closing rather than quoting today's past opening", () => {
    expect(listingCardHours({ opening_hours: weekdays }, new Date("2026-11-09T18:00:00")).detail).toBe("Opens 7:30AM");
  });
  it("omits tomorrow's weekday but keeps Monday when Sunday is closed", () => {
    const hours = { monday: "08:00 - 17:00", saturday: "Closed", sunday: "Closed" };
    expect(listingCardHours({ opening_hours: hours }, new Date("2026-11-08T10:00:00")).detail).toBe("Opens 8AM");
    expect(listingCardHours({ opening_hours: hours }, new Date("2026-11-07T10:00:00")).detail).toBe("Opens 8AM Mon");
  });
  it("identifies always-open cards", () => {
    expect(listingCardHours({ opening_hours: { monday: "Always Open" } }, new Date("2026-11-09T10:00:00"))).toEqual({ state: "open", label: "Open", detail: "Always Open" });
  });
  it("reads the previous day's overnight closing time", () => {
    expect(listingCardHours({ opening_hours: { monday: "18:00 - 02:00", tuesday: "Closed" } }, new Date("2026-11-10T01:00:00"))).toEqual({ state: "open", label: "Open", detail: "Closes 2AM" });
  });
  it("omits zero minutes but preserves populated minutes", () => {
    expect(formatCardClock("09:00")).toBe("9AM");
    expect(formatCardClock("09:30")).toBe("9:30AM");
    expect(formatCardClock("21:00")).toBe("9PM");
    expect(formatCardClock("00:00")).toBe("12AM");
    expect(formatCardClock("12:00")).toBe("12PM");
  });
  it("shortens a closed card's next whole-hour opening", () => {
    expect(listingCardHours({ opening_hours: { monday: "09:00 - 17:00", saturday: "Closed", sunday: "Closed" } }, new Date("2026-11-07T10:00:00")).detail).toBe("Opens 9AM Mon");
  });
});