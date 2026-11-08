import { describe, it, expect } from "vitest";
import { SPECIAL_AUDIENCE_OPTIONS, specialAudience, specialAudienceCsvPatch, specialAudienceToCsv } from "./specialAudience";

describe("special audiences", () => {
  it("offers Newlyweds and normalises legacy stored and CSV selections", () => {
    expect(SPECIAL_AUDIENCE_OPTIONS).toContain("Newlyweds");
    expect(specialAudience(["Newly Weds", "Newlyweds"])).toEqual(["Newlyweds"]);
    expect(specialAudienceToCsv(["Newly Weds"])).toBe("Newlyweds");
    expect(specialAudienceCsvPatch({ whos_it_for: "Newly Weds" })).toEqual({ whos_it_for: ["Newlyweds"] });
  });
  it("offers South African Residents Only and normalises the choice", () => {
    expect(SPECIAL_AUDIENCE_OPTIONS).toContain("South African Residents Only");
    expect(specialAudience("south african residents only")).toEqual(["South African Residents Only"]);
  });
  it("accepts the requested audiences and multiple choices", () => {
    expect(specialAudience("Kids|Families|Seniors|Couples")).toEqual(["Kids", "Families", "Seniors", "Couples"]);
  });
  it("normalises repeated choices while keeping other audiences", () => {
    expect(specialAudience("kids | Kids | Adults")).toEqual(["Kids", "Adults"]);
  });
  it("exports and reads multiple choices without loss", () => {
    expect(specialAudienceToCsv(["Kids", "Families"])).toBe("Kids|Families");
    expect(specialAudience(specialAudienceToCsv(["Kids", "Families"]))).toEqual(["Kids", "Families"]);
  });
  it("omits empty audience details", () => {
    expect(specialAudience(null)).toEqual([]);
    expect(specialAudience("  ")).toEqual([]);
  });
  it("preserves stored choices when an older CSV has no audience column", () => {
    expect(specialAudienceCsvPatch({ title: "Deal" })).toEqual({});
  });
  it("clears an explicitly blank CSV audience", () => {
    expect(specialAudienceCsvPatch({ whos_it_for: "" })).toEqual({ whos_it_for: null });
  });
});