import { describe, it, expect } from "vitest";
import { hoursCellsForExport, hoursPayloadFromCells } from "./listingHoursCsv";
import { UNIVERSAL_FIELDS } from "./categoryFields";

const H = { friday: "10:30 - 21:00", monday: "10:30 - 21:00" };
const J = JSON.stringify(H);

describe("listing hours sheet cells", () => {
  it("has no opening_hours_label column", () => {
    expect((UNIVERSAL_FIELDS as readonly string[]).includes("opening_hours_label")).toBe(false);
  });
  it("single schedule exports plain JSON with no label", () => {
    expect(hoursCellsForExport({ opening_hours: H, opening_hours_label: "Restaurant" })).toEqual({ opening_hours: J, additional_hours: "" });
  });
  it("two or more schedules put labels before JSON with one space, extras pipe-separated", () => {
    const out = hoursCellsForExport({ opening_hours: H, opening_hours_label: "Restaurant", additional_hours: [{ label: "Bar", hours: H }, { label: "Lodge", hours: H }] });
    expect(out.opening_hours).toBe(`Restaurant ${J}`);
    expect(out.additional_hours).toBe(`Bar ${J}|Lodge ${J}`);
  });
  it("imports the labelled cells back into label and sets", () => {
    const { payload, errors } = hoursPayloadFromCells(`Restaurant ${J}`, `Bar ${J}|Lodge ${J}`, true);
    expect(errors).toEqual([]);
    expect(payload).toEqual({ opening_hours: H, opening_hours_label: "Restaurant", additional_hours: [{ label: "Bar", hours: H }, { label: "Lodge", hours: H }] });
  });
  it("blank cells on update leave hours alone; dash clears extras", () => {
    expect(hoursPayloadFromCells("", "", true).payload).toEqual({});
    expect(hoursPayloadFromCells("", "-", true).payload).toEqual({ additional_hours: null });
  });
  it("unreadable cell reports an error and changes nothing", () => {
    const r = hoursPayloadFromCells("Restaurant {bad", "", true);
    expect(r.payload).toEqual({});
    expect(r.errors.length).toBe(1);
  });
});
