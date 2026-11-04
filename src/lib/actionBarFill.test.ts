import { describe, it, expect } from "vitest";
import { fillActionBar } from "./actionBarFill";

type Tile = { key: string; href: string };

const whatsapp: Tile = { key: "whatsapp", href: "https://wa.me/27821234567" };
const call: Tile = { key: "call", href: "tel:+27821234567" };
const email: Tile = { key: "email", href: "mailto:hello@farmwatch.co.za" };
const facebook: Tile = { key: "facebook", href: "https://facebook.com/farmwatch" };
const instagram: Tile = { key: "instagram", href: "https://instagram.com/farmwatch" };
const website: Tile = { key: "website", href: "https://farmwatch.co.za" };

describe("fillActionBar", () => {
  it("tops a two-tile bar up to three with the next populated contact", () => {
    expect(fillActionBar([whatsapp, call], [email, facebook, instagram, website]).map((a) => a.key)).toEqual([
      "whatsapp",
      "call",
      "email",
    ]);
  });

  it("uses email first, and only when it is populated", () => {
    expect(fillActionBar([whatsapp, call], [null, facebook]).map((a) => a.key)).toEqual([
      "whatsapp",
      "call",
      "facebook",
    ]);
  });

  it("leaves a bar that already has three tiles alone", () => {
    expect(fillActionBar([whatsapp, call, website], [email, facebook]).map((a) => a.key)).toEqual([
      "whatsapp",
      "call",
      "website",
    ]);
  });

  it("never adds a tile the bar already shows, by key or by the same link", () => {
    // The website slot already holds this Facebook page under its own key.
    const bar = [whatsapp, call, { key: "website", href: "https://facebook.com/farmwatch" }];
    expect(fillActionBar(bar, [facebook, instagram, email]).map((a) => a.key)).toEqual([
      "whatsapp",
      "call",
      "website",
      "email",
    ]);
  });

  it("adds nothing when no further contact is populated", () => {
    expect(fillActionBar([whatsapp, call], [null, null, null]).map((a) => a.key)).toEqual([
      "whatsapp",
      "call",
    ]);
  });
});
