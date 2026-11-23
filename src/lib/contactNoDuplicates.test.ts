import { describe, it, expect } from "vitest";
import { contactPayloadFromCells, LISTING_CONTACT_GROUPS } from "./listingContactCsv";
import { parseEventContactCells } from "./eventContacts";

describe("contact cells store each contact once", () => {
  it("listing phone cell with two numbers gives one extra", () => {
    const out = contactPayloadFromCells("082 463 2818|063 241 0296", "Office|Tracey", LISTING_CONTACT_GROUPS[0], true)!;
    expect(out.phone).toBe("082 463 2818");
    expect(out.additional_phones).toEqual(["063 241 0296"]);
    expect(out.additional_phone_labels).toEqual(["Tracey"]);
  });
  it("a repeated contact in one cell is kept once", () => {
    const p = parseEventContactCells("a@x.co|b@x.co|B@x.co|a@x.co", "-|Sales|Sales|-");
    expect(p.primary).toBe("a@x.co");
    expect(p.extras).toEqual(["b@x.co"]);
    expect(p.extraLabels).toEqual(["Sales"]);
  });
});
