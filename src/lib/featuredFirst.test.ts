import { describe, expect, it } from "vitest";
import { mergeFeaturedFirst, pinFeatured } from "@/lib/featuredFirst";

const row = (id: string, is_featured = false) => ({ id, is_featured });
const ids = (rows: { id: string }[]) => rows.map((r) => r.id);

describe("pinFeatured", () => {
  it("moves featured rows to the front", () => {
    expect(ids(pinFeatured([row("a"), row("b", true), row("c")]))).toEqual(["b", "a", "c"]);
  });

  it("keeps the chosen order within each group", () => {
    const rows = [row("a"), row("b", true), row("c"), row("d", true)];
    expect(ids(pinFeatured(rows))).toEqual(["b", "d", "a", "c"]);
  });

  it("treats a missing flag as not featured", () => {
    expect(ids(pinFeatured([{ id: "a" }, row("b", true)]))).toEqual(["b", "a"]);
  });
});

describe("mergeFeaturedFirst", () => {
  it("puts featured ahead of the curated order", () => {
    const featured = [row("f1", true), row("f2", true)];
    const curated = [row("c1"), row("c2")];
    expect(ids(mergeFeaturedFirst([featured, curated]))).toEqual(["f1", "f2", "c1", "c2"]);
  });

  it("pushes curated picks off the end when featured fills the row", () => {
    const featured = [row("f1", true), row("f2", true), row("f3", true)];
    const curated = [row("c1"), row("c2"), row("c3")];
    expect(ids(mergeFeaturedFirst([featured, curated], 3))).toEqual(["f1", "f2", "f3"]);
  });

  it("fills the leftover slots with curated picks in the admin's order", () => {
    const featured = [row("f1", true)];
    const curated = [row("c1"), row("c2"), row("c3")];
    expect(ids(mergeFeaturedFirst([featured, curated], 3))).toEqual(["f1", "c1", "c2"]);
  });

  it("falls back to automatic picks only once featured and curated run out", () => {
    const featured: { id: string; is_featured: boolean }[] = [];
    const curated = [row("c1")];
    const auto = [row("a1"), row("a2")];
    expect(ids(mergeFeaturedFirst([featured, curated, auto], 3))).toEqual(["c1", "a1", "a2"]);
  });

  it("de-duplicates across lists, keeping the highest-priority slot", () => {
    const featured = [row("x", true)];
    const curated = [row("c1"), row("x", true)];
    expect(ids(mergeFeaturedFirst([featured, curated]))).toEqual(["x", "c1"]);
  });

  it("floats a curated pick that is itself featured to the top", () => {
    const curated = [row("c1"), row("c2", true), row("c3")];
    expect(ids(mergeFeaturedFirst([[], curated]))).toEqual(["c2", "c1", "c3"]);
  });

  it("floats a featured auto-pick above the curated picks", () => {
    const curated = [row("c1"), row("c2")];
    const auto = [row("a1", true), row("a2")];
    expect(ids(mergeFeaturedFirst([[], curated, auto], 4))).toEqual(["a1", "c1", "c2", "a2"]);
  });

  it("ignores empty and missing lists", () => {
    expect(ids(mergeFeaturedFirst([null, undefined, [row("a")], [null]]))).toEqual(["a"]);
  });
});
