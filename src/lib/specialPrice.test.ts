import { describe, expect, it } from "vitest";
import { formatSpecialPriceCell } from "./specialPrice";

describe("formatSpecialPriceCell", () => {
  it("formats a plain number as a rand amount with thousands separators", () => {
    expect(formatSpecialPriceCell("4999")).toBe("R4,999");
  });

  it("formats a number that already has commas", () => {
    expect(formatSpecialPriceCell("1,250")).toBe("R1,250");
  });

  it("keeps an R prefix and adds grouping", () => {
    expect(formatSpecialPriceCell("R4999")).toBe("R4,999");
  });

  it("strips trailing .00 decimals", () => {
    expect(formatSpecialPriceCell("450.00")).toBe("R450");
  });

  it("keeps real decimals", () => {
    expect(formatSpecialPriceCell("4999.50")).toBe("R4,999.50");
  });

  it("leaves free-text prices untouched", () => {
    expect(formatSpecialPriceCell("R450pp")).toBe("R450pp");
    expect(formatSpecialPriceCell("Free")).toBe("Free");
    expect(formatSpecialPriceCell("From R200")).toBe("From R200");
  });

  it("returns null for blank cells", () => {
    expect(formatSpecialPriceCell("")).toBeNull();
    expect(formatSpecialPriceCell(null)).toBeNull();
    expect(formatSpecialPriceCell(undefined)).toBeNull();
  });

  it("trims surrounding spaces", () => {
    expect(formatSpecialPriceCell(" 4999 ")).toBe("R4,999");
  });
});
