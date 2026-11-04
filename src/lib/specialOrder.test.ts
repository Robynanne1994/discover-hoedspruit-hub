import { describe, it, expect } from "vitest";
import { sortSpecialsDefault } from "./specialOrder";

describe("sortSpecialsDefault", () => {
  it("puts admin positions first, lowest first", () => {
    const out = sortSpecialsDefault([
      { id: "a", sort_position: 2, created_at: "2026-01-01" },
      { id: "b", sort_position: 1, created_at: "2025-01-01" },
    ] as any[]);
    expect(out.map((s: any) => s.id)).toEqual(["b", "a"]);
  });
  it("places unpositioned specials after positioned ones, newest first", () => {
    const out = sortSpecialsDefault([
      { id: "old", sort_position: null, created_at: "2025-01-01" },
      { id: "new", sort_position: null, created_at: "2026-06-01" },
      { id: "pos", sort_position: 5, created_at: "2024-01-01" },
    ] as any[]);
    expect(out.map((s: any) => s.id)).toEqual(["pos", "new", "old"]);
  });
});
