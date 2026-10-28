import { describe, expect, it } from "vitest";
import { pillToggle } from "./filterPill.ts";

describe("pillToggle", () => {
  it("selects a pill that is not chosen yet", () => {
    expect(pillToggle("any", "free", "any")).toBe("free");
  });

  it("clears a chosen pill back to the default when tapped again", () => {
    expect(pillToggle("free", "free", "any")).toBe("any");
  });

  it("leaves the default pill selected when tapped", () => {
    expect(pillToggle("any", "any", "any")).toBe("any");
  });

  it("clears a category back to no selection", () => {
    expect(pillToggle("Walking", "Walking", null)).toBe(null);
  });

  it("switches between two chosen pills", () => {
    expect(pillToggle("Morning", "Night", "any")).toBe("Night");
  });
});
