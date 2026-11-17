import { describe, expect, it } from "vitest";
import { activeCsvPatch, parseCsvActive } from "./contentActive";
import { getUniversalCSVHeaders } from "./categoryFields";

describe("content Active CSV cells", () => {
  it("leaves blank and legacy cells unset so imports preserve the stored state", () => {
    expect(parseCsvActive(undefined)).toBeUndefined();
    expect(parseCsvActive("")).toBeUndefined();
    expect(activeCsvPatch("  ")).toEqual({});
  });

  it("accepts explicit TRUE and locks automatic activation", () => {
    expect(activeCsvPatch("TRUE")).toEqual({ is_active: true, auto_activate_on_image: false });
  });

  it("accepts explicit FALSE and locks automatic activation", () => {
    expect(activeCsvPatch("false")).toEqual({ is_active: false, auto_activate_on_image: false });
    expect(activeCsvPatch("0")).toEqual({ is_active: false, auto_activate_on_image: false });
  });

  it("places listing is_active immediately after google_place_id", () => {
    const headers = getUniversalCSVHeaders();
    expect(headers[headers.indexOf("google_place_id") + 1]).toBe("is_active");
  });
});
