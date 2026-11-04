import { describe, expect, it } from "vitest";
import { formatDetailLabel } from "./detailLabel";

describe("formatDetailLabel", () => {
  it("capitalises every part of a hyphenated detail label", () => {
    expect(formatDetailLabel("mid-range")).toBe("Mid-Range");
    expect(formatDetailLabel("Mid-range")).toBe("Mid-Range");
    expect(formatDetailLabel("Dine-in")).toBe("Dine-In");
    expect(formatDetailLabel("drive-through")).toBe("Drive-Through");
  });

  it("keeps the labels that already read correctly", () => {
    expect(formatDetailLabel("Mid-Range")).toBe("Mid-Range");
    expect(formatDetailLabel("Dine-In")).toBe("Dine-In");
    expect(formatDetailLabel("Drive-Through")).toBe("Drive-Through");
    expect(formatDetailLabel("Takeaway")).toBe("Takeaway");
    expect(formatDetailLabel("Delivery")).toBe("Delivery");
  });

  it("still spells WiFi and its free variant the brand way", () => {
    expect(formatDetailLabel("wifi")).toBe("WiFi");
    expect(formatDetailLabel("WiFi (Free)")).toBe("WiFi (Free)");
    expect(formatDetailLabel("Wi-Fi")).toBe("Wi-Fi");
  });

  it("leaves small connectives lower-case unless they lead", () => {
    expect(formatDetailLabel("good for kids")).toBe("Good for Kids");
    expect(formatDetailLabel("nappy changing station")).toBe("Nappy Changing Station");
  });

  it("passes empty input through untouched", () => {
    expect(formatDetailLabel("")).toBe("");
  });
});
