import { describe, it, expect } from "vitest";
import {
  RESET_LINK_TTL_MS,
  formatCountdown,
  friendlyResetError,
  isResetLinkExpired,
  parseRecoveryUrl,
  resetLinkRemainingMs,
} from "@/lib/passwordReset";

const RESET_PATH = "/reset-password";

describe("parseRecoveryUrl", () => {
  it("recognises the implicit flow (tokens in the hash)", () => {
    const { link } = parseRecoveryUrl(
      "?issued=1700000000000",
      "#access_token=abc&refresh_token=def&type=recovery"
    );
    expect(link).toEqual({ kind: "implicit" });
  });

  it("recognises a recovery type with no access token yet", () => {
    const { link } = parseRecoveryUrl("", "#type=recovery");
    expect(link).toEqual({ kind: "implicit" });
  });

  it("recognises the PKCE flow by the stamp our own reset links carry", () => {
    const { link } = parseRecoveryUrl("?issued=1700000000000&code=xyz", "");
    expect(link).toEqual({ kind: "code", code: "xyz" });
  });

  it("recognises the PKCE flow by where it landed", () => {
    const { link } = parseRecoveryUrl("?code=xyz", "", RESET_PATH);
    expect(link).toEqual({ kind: "code", code: "xyz" });
  });

  it("recognises a token hash link", () => {
    const { link } = parseRecoveryUrl("?token_hash=t123&type=recovery", "");
    expect(link).toEqual({ kind: "tokenHash", tokenHash: "t123" });
  });

  // The bug this guards against: an email-change confirmation was claimed as a
  // password reset, so tapping the button in that email opened the reset screen
  // and the change it was meant to finish never happened.
  it("leaves another flow's credentials alone", () => {
    expect(
      parseRecoveryUrl("?token_hash=t123&type=email_change", "").link
    ).toEqual({ kind: "none" });
    expect(
      parseRecoveryUrl("", "#access_token=abc&refresh_token=def&type=email_change").link
    ).toEqual({ kind: "none" });
    expect(parseRecoveryUrl("?code=xyz&type=email_change", "").link).toEqual({ kind: "none" });
    expect(parseRecoveryUrl("?type=signup&token_hash=t1", "").link).toEqual({ kind: "none" });
  });

  it("does not claim a bare code that arrived somewhere else entirely", () => {
    expect(parseRecoveryUrl("?code=xyz", "", "/account-settings/info").link).toEqual({
      kind: "none",
    });
  });

  it("treats Supabase's error params as an expired link, in the hash or the query", () => {
    expect(
      parseRecoveryUrl("?issued=1700000000000", "#error=access_denied&error_code=otp_expired")
        .link
    ).toEqual({ kind: "expired" });
    expect(parseRecoveryUrl("?error_code=otp_expired", "", RESET_PATH).link).toEqual({
      kind: "expired",
    });
    expect(parseRecoveryUrl("?error_code=otp_expired&type=recovery", "").link).toEqual({
      kind: "expired",
    });
  });

  it("reports no link when the page was opened directly", () => {
    expect(parseRecoveryUrl("", "").link).toEqual({ kind: "none" });
    expect(parseRecoveryUrl("?q=coffee", "#section").link).toEqual({ kind: "none" });
    expect(parseRecoveryUrl("", "", RESET_PATH).link).toEqual({ kind: "none" });
  });

  it("ignores an unrelated error param elsewhere in the app", () => {
    expect(parseRecoveryUrl("?error=1", "").link).toEqual({ kind: "none" });
    // ...but honours one that came back with a reset link.
    expect(parseRecoveryUrl("?issued=1700000000000&error=access_denied", "").link).toEqual({
      kind: "expired",
    });
  });

  it("reads the issued timestamp, ignoring junk", () => {
    expect(parseRecoveryUrl("?issued=1700000000000&code=x", "").issuedAt).toBe(1700000000000);
    expect(parseRecoveryUrl("?issued=nonsense&code=x", "").issuedAt).toBeNull();
    expect(parseRecoveryUrl("?code=x", "").issuedAt).toBeNull();
  });
});

describe("the 15-minute window", () => {
  const issued = 1_700_000_000_000;

  it("is fifteen minutes long", () => {
    expect(RESET_LINK_TTL_MS).toBe(15 * 60 * 1000);
  });

  it("accepts a link inside the window and rejects one past it", () => {
    expect(isResetLinkExpired(issued, issued)).toBe(false);
    expect(isResetLinkExpired(issued, issued + 14 * 60 * 1000)).toBe(false);
    expect(isResetLinkExpired(issued, issued + RESET_LINK_TTL_MS)).toBe(false);
    expect(isResetLinkExpired(issued, issued + RESET_LINK_TTL_MS + 1)).toBe(true);
  });

  it("accepts links that carry no issue time (older emails)", () => {
    expect(isResetLinkExpired(null)).toBe(false);
    expect(resetLinkRemainingMs(null)).toBeNull();
  });

  it("counts down and clamps at both ends", () => {
    expect(resetLinkRemainingMs(issued, issued)).toBe(RESET_LINK_TTL_MS);
    expect(resetLinkRemainingMs(issued, issued + 60 * 1000)).toBe(14 * 60 * 1000);
    expect(resetLinkRemainingMs(issued, issued + 60 * 60 * 1000)).toBe(0);
    // A device clock running behind the server can't inflate the window.
    expect(resetLinkRemainingMs(issued, issued - 60 * 60 * 1000)).toBe(RESET_LINK_TTL_MS);
  });
});

describe("formatCountdown", () => {
  it("formats minutes and seconds", () => {
    expect(formatCountdown(RESET_LINK_TTL_MS)).toBe("15:00");
    expect(formatCountdown(9 * 60 * 1000 + 5000)).toBe("9:05");
    expect(formatCountdown(0)).toBe("0:00");
    expect(formatCountdown(-500)).toBe("0:00");
  });
});

describe("friendlyResetError", () => {
  it("explains the rate limit", () => {
    expect(friendlyResetError("For security purposes, you can only request this after 44 seconds."))
      .toMatch(/one reset email a minute/i);
  });

  it("passes other messages through, with a fallback", () => {
    expect(friendlyResetError("Something specific went wrong")).toBe("Something specific went wrong");
    expect(friendlyResetError(null)).toMatch(/could not send/i);
  });
});
