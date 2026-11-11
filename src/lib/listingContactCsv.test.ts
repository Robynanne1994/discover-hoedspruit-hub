import { describe, it, expect } from "vitest";
import { LISTING_CONTACT_GROUPS, contactCellsForExport, contactPayloadFromCells } from "./listingContactCsv";
import { getUniversalCSVHeaders } from "./categoryFields";
const [phone, whatsapp, , website] = LISTING_CONTACT_GROUPS;

describe("listing contact CSV cells", () => {
  it("drops the additional columns and puts WhatsApp straight after phone label", () => {
    const h = getUniversalCSVHeaders();
    expect(h.some((c) => c.startsWith("additional_") && c !== "additional_hours")).toBe(false);
    expect(h.indexOf("whatsapp")).toBe(h.indexOf("phone_label") + 1);
    expect(h.indexOf("website_label")).toBe(h.indexOf("website") + 1);
  });
  it("exports extras into one cell with - holding an unlabelled slot", () => {
    expect(contactCellsForExport({ phone: "011", phone_label: "", additional_phones: ["022"], additional_phone_labels: ["Lodge"] }, phone))
      .toEqual({ contacts: "011|022", labels: "-|Lodge" });
  });
  it("labels websites Website when blank", () => {
    expect(contactCellsForExport({ website: "a.com", additional_websites: ["b.com"], additional_website_labels: ["Booking"] }, website))
      .toEqual({ contacts: "a.com|b.com", labels: "Website|Booking" });
  });
  it("imports a combined cell back into primary and extras", () => {
    expect(contactPayloadFromCells("082|083", "-|Lodge", whatsapp, true)).toEqual({
      whatsapp: "082", additional_whatsapps: ["083"], whatsapp_label: null, additional_whatsapp_labels: ["Lodge"],
    });
  });
  it("leaves stored contacts alone for a blank cell on update", () => {
    expect(contactPayloadFromCells("", "", phone, true)).toBeNull();
  });
});
