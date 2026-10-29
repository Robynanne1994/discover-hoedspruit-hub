import { format } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  countdownLabel,
  hasStarted,
  isEndingSoon,
  isOngoingSpecial,
  isSingleDaySpecial,
  savingLabel,
  specialDateLine,
  specialMeta,
  specialValue,
} from "@/lib/specialValue";
import { isUpcomingSpecial, specialToday } from "@/lib/specialVisibility";

// Deals are entered by hand, so the value bar has to cope with a price, a
// free-text offer, or nothing at all.
describe("specialValue", () => {
  it("uses the price when one is set", () => {
    expect(specialValue({ price: "R85", price_label: "per plate" })).toEqual({
      kind: "price",
      price: "R85",
      original: null,
      note: "per plate",
    });
  });

  it("keeps the original price for the strikethrough", () => {
    expect(specialValue({ price: "R70", original_price: "R95" })).toMatchObject({
      kind: "price",
      price: "R70",
      original: "R95",
    });
  });

  it("drops an original price identical to the price", () => {
    expect(specialValue({ price: "R70", original_price: "R70" })).toMatchObject({ original: null });
  });

  it("falls back to the savings wording when there is no price", () => {
    expect(specialValue({ savings: "Buy 1, get 1 free" })).toEqual({
      kind: "deal",
      text: "Buy 1, get 1 free",
    });
  });

  it("still shows a lone original price rather than nothing", () => {
    expect(specialValue({ original_price: "R120" })).toEqual({ kind: "deal", text: "R120" });
  });

  it("prefers a written offer over a stray original price", () => {
    expect(specialValue({ freebie_text: "Free breakfast", original_price: "R450" })).toEqual({
      kind: "deal",
      text: "Free breakfast",
    });
  });

  it("reports nothing to show when every money field is empty", () => {
    expect(specialValue({ price: "  ", savings: null })).toEqual({ kind: "none" });
  });
});

describe("savingLabel", () => {
  it("shows the business's own wording verbatim", () => {
    expect(savingLabel({ price: "R70", original_price: "R95", savings: "50% Off" })).toBe("50% Off");
  });

  it("derives the saving from the two prices", () => {
    expect(savingLabel({ price: "R70", original_price: "R95" })).toBe("Save R25");
  });

  it("keeps the derived saving currency-free when the source was", () => {
    expect(savingLabel({ price: "70", original_price: "95" })).toBe("Save 25");
  });

  it("stays quiet when the original is not actually higher", () => {
    expect(savingLabel({ price: "R95", original_price: "R70" })).toBeNull();
    expect(savingLabel({ price: "R95" })).toBeNull();
  });
});

describe("specialDateLine", () => {
  it("names the day a weekly special runs on", () => {
    expect(specialDateLine({ day_of_week: ["Tuesday"] })).toBe("Every Tuesday");
  });

  it("abbreviates once a special runs on more than one day", () => {
    expect(specialDateLine({ day_of_week: ["Wednesday", "Thursday"] })).toBe("Every Wed & Thu");
  });

  it("keeps the end date alongside the days", () => {
    expect(specialDateLine({ day_of_week: ["Wednesday", "Thursday"], valid_until: "2026-08-12" }))
      .toBe("Wed & Thu until 12 Aug");
    expect(specialDateLine({ day_of_week: ["Tuesday"], valid_until: "2026-08-12" }))
      .toBe("Tuesdays until 12 Aug");
  });

  it("drops the end date on a narrow card so the days stay whole", () => {
    expect(specialDateLine({ day_of_week: ["Wednesday", "Thursday"], valid_until: "2026-08-12" }, { compact: true }))
      .toBe("Every Wed & Thu");
  });

  it("still reads a row that holds a single day name", () => {
    expect(specialDateLine({ day_of_week: "Friday" })).toBe("Every Friday");
  });

  it("falls back to the dates when there is no weekly schedule", () => {
    expect(specialDateLine({ valid_from: "2026-08-01", valid_until: "2026-08-12" })).toBe("1-12 Aug");
    expect(specialDateLine({})).toBeNull();
  });

  it("keeps a space around the dash when the range crosses months", () => {
    expect(specialDateLine({ valid_from: "2026-11-01", valid_until: "2026-12-16" })).toBe("1 Nov - 16 Dec");
  });

  it("shortens the years when the range spans two calendar years", () => {
    expect(specialDateLine({ valid_from: "2025-12-16", valid_until: "2026-12-15" })).toBe(
      "16 Dec '25 - 15 Dec '26"
    );
  });
});

describe("specialMeta", () => {
  // Local date arithmetic needs a local serialisation. toISOString() converts
  // to UTC first, so east of Greenwich in the small hours it rendered the day
  // before and the countdown came out one short.
  const inDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    const pad = (v: number) => String(v).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  it("keeps the footer wording while flagging a final-week deal as urgent", () => {
    // The countdown itself lives on the picture's corner; the bar keeps the
    // business's own validity wording beside it.
    expect(specialMeta({ card_footer_text: "Every Sunday", valid_until: inDays(2) })).toEqual({
      text: "Every Sunday",
      urgent: true,
    });
  });

  it("keeps the validity dates in the bar when the countdown is on the image", () => {
    expect(specialMeta({ valid_until: inDays(3) })).toEqual({
      text: "Until " + format(new Date(inDays(3)), "d MMM"),
      urgent: true,
    });
  });

  it("uses the footer wording when the deal is not ending soon", () => {
    expect(specialMeta({ card_footer_text: "Every Sunday", valid_until: inDays(40) })).toEqual({
      text: "Every Sunday",
      urgent: false,
    });
  });

  it("says nothing when there is no footer wording and no dates", () => {
    expect(specialMeta({ valid_until: null })).toEqual({ text: "", urgent: false });
  });

  it("swaps footer wording too long for a narrow card for the short schedule", () => {
    const special = {
      card_footer_text: "Wednesday & Thursday Specials",
      day_of_week: ["Wednesday", "Thursday"],
      valid_until: inDays(40),
    };
    expect(specialMeta(special, { compact: true })).toEqual({ text: "Every Wed & Thu", urgent: false });
    // The featured card is wide enough to print it as the business wrote it.
    expect(specialMeta(special)).toEqual({ text: "Wednesday & Thursday Specials", urgent: false });
  });

  it("keeps short footer wording on a narrow card", () => {
    expect(specialMeta({ card_footer_text: "Ladies Night", day_of_week: ["Thursday"] }, { compact: true }))
      .toEqual({ text: "Ladies Night", urgent: false });
  });

  it("keeps long footer wording when there is no schedule to fall back on", () => {
    expect(specialMeta({ card_footer_text: "While stocks last, in store only" }, { compact: true }))
      .toEqual({ text: "While stocks last, in store only", urgent: false });
  });
});

// A special dated to start in the future is not running yet, so nothing on it
// may count down — not the picture tab, not the bar's urgent flag.
describe("countdown gating", () => {
  // Johannesburg today shifted by whole days, so the test holds any day of the year.
  const inDays = (n: number) => {
    const [y, m, d] = specialToday().split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
  };

  it("never counts down a special that has not started yet", () => {
    const upcoming = { valid_from: inDays(2), valid_until: inDays(5) };
    expect(hasStarted(upcoming)).toBe(false);
    expect(isEndingSoon(upcoming)).toBe(false);
  });

  it("counts down once the special is under way", () => {
    expect(isEndingSoon({ valid_from: inDays(-3), valid_until: inDays(5) })).toBe(true);
    expect(isEndingSoon({ valid_until: inDays(5) })).toBe(true);
  });

  it("keeps an upcoming deal out of the value bar's urgent flag", () => {
    expect(specialMeta({ valid_from: inDays(2), valid_until: inDays(5) }).urgent).toBe(false);
  });
});

// The drawer's Validity filter offers All / Upcoming / Ending Soon / Ongoing,
// so every special on the page has to land in exactly one of the three.
describe("validity states", () => {
  const inDays = (n: number) => {
    const [y, m, d] = specialToday().split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
  };

  it("puts every special in exactly one validity state", () => {
    const cases = [
      { valid_from: inDays(2), valid_until: inDays(5) }, // upcoming
      { valid_until: inDays(5) }, // ending soon
      { valid_until: inDays(30) }, // ongoing
      {}, // ongoing with no dates at all
    ];
    for (const s of cases) {
      const states = [isUpcomingSpecial(s), isEndingSoon(s), isOngoingSpecial(s)];
      expect(states.filter(Boolean)).toHaveLength(1);
    }
  });

  it("calls a deal ongoing once it is past its final week", () => {
    expect(isOngoingSpecial({ valid_from: inDays(-3), valid_until: inDays(8) })).toBe(true);
    expect(isOngoingSpecial({})).toBe(true);
    expect(isOngoingSpecial({ valid_from: inDays(2) })).toBe(false);
    expect(isOngoingSpecial({ valid_until: inDays(3) })).toBe(false);
  });
});

// A special dated for one day only never reaches a "last day" — the whole deal
// is that single day — so the card says how long it runs instead of counting
// down to its end.
describe("single-day specials", () => {
  const inDays = (n: number) => {
    const [y, m, d] = specialToday().split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
  };

  it("reads the one-day window", () => {
    expect(isSingleDaySpecial({ valid_from: inDays(0), valid_until: inDays(0) })).toBe(true);
    expect(isSingleDaySpecial({ valid_from: inDays(-2), valid_until: inDays(0) })).toBe(false);
    // No start date means the run length is unknown, so it is not one-day only.
    expect(isSingleDaySpecial({ valid_until: inDays(0) })).toBe(false);
  });

  it("says 1 Day Only on the day itself", () => {
    const oneDay = { valid_from: inDays(0), valid_until: inDays(0) };
    expect(countdownLabel(oneDay)).toBe("1 Day Only");
    // It still counts as ending soon, so the card keeps its red tab.
    expect(isEndingSoon(oneDay)).toBe(true);
  });

  it("keeps Last day for a deal that ran over several days", () => {
    expect(countdownLabel({ valid_from: inDays(-3), valid_until: inDays(0) })).toBe("Last day");
    expect(countdownLabel({ valid_until: inDays(0) })).toBe("Last day");
  });

  it("says nothing early for a one-day deal that has not started", () => {
    const tomorrow = { valid_from: inDays(1), valid_until: inDays(1) };
    expect(isEndingSoon(tomorrow)).toBe(false);
  });
});
