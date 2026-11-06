import { describe, expect, it } from "vitest";
import { specialCsvAction, specialCsvScope } from "./specialCsvScope";

const now = new Date("2026-11-06T08:08:00Z");
const active = { is_active: true, valid_from: "2026-11-01", valid_until: "2026-11-30" };
const passed = { is_active: true, valid_from: "2026-10-01", valid_until: "2026-11-05" };

describe("specials CSV scope protection", () => {
  it("New Only adds new specials and never changes existing ones", () => {
    expect(specialCsvAction("new", active, undefined, now)).toBe("insert");
    expect(specialCsvAction("new", passed, undefined, now)).toBe("insert");
    expect(specialCsvAction("new", active, active, now)).toBe("skip");
    expect(specialCsvAction("new", passed, passed, now)).toBe("skip");
  });
  it("Passed updates only existing passed specials", () => {
    expect(specialCsvAction("passed", passed, passed, now)).toBe("update");
    expect(specialCsvAction("passed", passed, active, now)).toBe("skip");
    expect(specialCsvAction("passed", active, passed, now)).toBe("skip");
    expect(specialCsvAction("passed", passed, undefined, now)).toBe("skip");
  });
  it("Active adds or updates active specials but leaves passed ones alone", () => {
    expect(specialCsvAction("active", active, active, now)).toBe("update");
    expect(specialCsvAction("active", active, undefined, now)).toBe("insert");
    expect(specialCsvAction("active", active, passed, now)).toBe("skip");
    expect(specialCsvAction("active", passed, active, now)).toBe("skip");
    expect(specialCsvAction("active", passed, undefined, now)).toBe("skip");
  });
  it("includes current, ongoing and upcoming deals under Active", () => {
    expect(specialCsvScope({ is_active: true, valid_until: "2026-11-06" }, now)).toBe("active");
    expect(specialCsvScope({ is_active: true }, now)).toBe("active");
    expect(specialCsvScope({ is_active: false, valid_from: "2026-11-10" }, now)).toBe("active");
  });
  it("includes expired and inactive deals under Passed", () => {
    expect(specialCsvScope(passed, now)).toBe("passed");
    expect(specialCsvScope({ is_active: false }, now)).toBe("passed");
    expect(specialCsvScope({ is_active: false, valid_until: "2026-11-30" }, now)).toBe("passed");
  });
  it("uses Johannesburg midnight to determine expiry", () => {
    expect(specialCsvScope({ is_active: true, valid_until: "2026-11-05" }, new Date("2026-11-05T21:59:00Z"))).toBe("active");
    expect(specialCsvScope({ is_active: true, valid_until: "2026-11-05" }, new Date("2026-11-05T22:01:00Z"))).toBe("passed");
  });
});