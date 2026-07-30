import { describe, it, expect } from "vitest";
import {
  BLOCK_COOLDOWN_DAYS,
  blockCooldownBlockedMessage,
  formatCooldownDate,
  formatCooldownRemaining,
  isBlockCooldownError,
} from "@/lib/blockCooldown";

describe("blockCooldown", () => {
  it("recognises the cooldown error raised by the database trigger", () => {
    expect(
      isBlockCooldownError({
        message:
          "BLOCK_COOLDOWN_ACTIVE: this user was unblocked less than 7 days ago and can be blocked again from 2026-08-06 10:00:00+00",
      }),
    ).toBe(true);
  });

  it("does not mistake an unrelated failure for a cooldown", () => {
    expect(isBlockCooldownError({ message: "duplicate key value" })).toBe(false);
    expect(isBlockCooldownError(null)).toBe(false);
  });

  it("rounds the remaining wait up so it never reads as already over", () => {
    const now = new Date("2026-07-30T10:00:00Z");
    expect(formatCooldownRemaining("2026-08-06T10:00:00Z", now)).toBe("in 7 days");
    // 6 days and change still has to read as 7 — the block is refused until then.
    expect(formatCooldownRemaining("2026-08-05T22:00:00Z", now)).toBe("in 7 days");
    expect(formatCooldownRemaining("2026-07-30T15:00:00Z", now)).toBe("in 5 hours");
    expect(formatCooldownRemaining("2026-07-30T10:20:00Z", now)).toBe("in under an hour");
  });

  it("treats a wait that has already passed as imminent rather than negative", () => {
    const now = new Date("2026-07-30T10:00:00Z");
    expect(formatCooldownRemaining("2026-07-29T10:00:00Z", now)).toBe("shortly");
  });

  it("formats dates the way the rest of the app reads", () => {
    expect(formatCooldownDate("2026-08-06T10:00:00Z")).toBe("6 August 2026");
    expect(formatCooldownDate("not a date")).toBe("");
  });

  it("names both dates and the rule when a block is refused", () => {
    const message = blockCooldownBlockedMessage("Robyn", {
      unblockedAt: "2026-07-30T10:00:00Z",
      availableAt: "2026-08-06T10:00:00Z",
      isActive: true,
    });
    expect(message).toContain("Robyn");
    expect(message).toContain("30 July 2026");
    expect(message).toContain("6 August 2026");
    expect(message).toContain(`${BLOCK_COOLDOWN_DAYS}-day`);
  });
});
