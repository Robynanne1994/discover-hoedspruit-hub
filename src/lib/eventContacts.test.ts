import { describe, expect, it } from "vitest";
import { eventContactPairs, parseEventContactCells, serializeEventContactCells } from "./eventContacts";

describe("combined event contact CSV cells", () => {
  it("splits pipe-separated emails and corresponding labels into primary and extras", () => {
    expect(parseEventContactCells("email1@example.com| email2@example.com", "Bookings|Accounts")).toEqual({
      primary: "email1@example.com", label: "Bookings", extras: ["email2@example.com"], extraLabels: ["Accounts"],
    });
  });
  it("uses the first populated option for primary actions and keeps positional labels", () => {
    expect(parseEventContactCells(" | +27821234567 | +27827654321", "Unused|Reception|After Hours")).toEqual({
      primary: "+27821234567", label: "Reception", extras: ["+27827654321"], extraLabels: ["After Hours"],
    });
  });
  it("round trips all contacts and blank labels through the six-column format", () => {
    const cells = serializeEventContactCells("email1@example.com", "", ["email2@example.com", "email3@example.com"], ["Accounts", ""]);
    expect(cells).toEqual({ contacts: "email1@example.com|email2@example.com|email3@example.com", labels: "|Accounts|" });
    expect(parseEventContactCells(cells.contacts, cells.labels)).toEqual({
      primary: "email1@example.com", label: null, extras: ["email2@example.com", "email3@example.com"], extraLabels: ["Accounts", ""],
    });
  });
  it("falls back to the first extra contact when the primary is empty", () => {
    expect(eventContactPairs(null, null, ["", "+27821234567"], ["", "Reception"])[0]).toEqual({ value: "+27821234567", label: "Reception" });
  });
  it("clears primary and extras for an empty CSV contact cell", () => {
    expect(parseEventContactCells("", "")).toEqual({ primary: null, label: null, extras: [], extraLabels: [] });
  });
});