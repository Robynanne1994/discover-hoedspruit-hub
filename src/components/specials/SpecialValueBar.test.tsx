import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import SpecialValueBar from "./SpecialValueBar";
import { specialDateLine } from "@/lib/specialValue";

const DAY = 24 * 60 * 60 * 1000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);

// Price, "was" price and a validity date: one item too many for a 170px card.
const FULL_HOUSE = {
  price: "R750",
  original_price: "R950",
  valid_from: iso(0),
  valid_until: iso(20),
};

describe("SpecialValueBar — the crossed-out was price", () => {
  it("drops the was price on a narrow card when a validity date is showing", () => {
    const { container } = render(<SpecialValueBar special={FULL_HOUSE} />);
    const dateLine = specialDateLine(FULL_HOUSE, { compact: true });

    expect(dateLine).toBeTruthy();
    expect(container.textContent).toContain("R750");
    expect(container.textContent).toContain(dateLine);
    expect(container.textContent).not.toContain("R950");
  });

  it("keeps the was price on a narrow card when there is no date line", () => {
    const { container } = render(
      <SpecialValueBar special={{ price: "R750", original_price: "R950" }} />
    );

    expect(container.textContent).toContain("R750");
    expect(container.textContent).toContain("R950");
  });

  it("keeps the whole ledger on the wide featured card, date line and all", () => {
    const { container } = render(
      <SpecialValueBar special={FULL_HOUSE} detail="full" padding="12px 16px" />
    );

    expect(container.textContent).toContain("R750");
    expect(container.textContent).toContain("R950");
  });
});
