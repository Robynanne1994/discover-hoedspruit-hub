import { describe, it, expect } from "vitest";
import { friendlyEmailChangeLinkError, parseEmailChangeUrl } from "@/lib/emailChangeLink";

describe("parseEmailChangeUrl", () => {
  it("recognises the implicit flow (tokens in the hash)", () => {
    expect(
      parseEmailChangeUrl("", "#access_token=abc&refresh_token=def&type=email_change")
    ).toEqual({ kind: "implicit" });
  });

  it("recognises the PKCE flow", () => {
    expect(parseEmailChangeUrl("?code=xyz&type=email_change", "")).toEqual({
      kind: "code",
      code: "xyz",
    });
  });

  it("recognises a PKCE code that says nothing, by where it landed", () => {
    // Supabase's PKCE redirect carries no `type`, so a bare `?code=` is
    // indistinguishable from a password reset's — except that only an
    // email-change link is ever sent to Account Info.
    expect(parseEmailChangeUrl("?code=xyz", "", "/account-settings/info")).toEqual({
      kind: "code",
      code: "xyz",
    });
    // ...and an ordinary visit to the same screen is still just a visit.
    expect(parseEmailChangeUrl("", "", "/account-settings/info")).toEqual({ kind: "none" });
  });

  it("recognises a token hash link", () => {
    expect(parseEmailChangeUrl("?token_hash=t123&type=email_change", "")).toEqual({
      kind: "tokenHash",
      tokenHash: "t123",
    });
  });

  it("accepts the double-confirmation variants of the type", () => {
    expect(parseEmailChangeUrl("?token_hash=t1&type=email_change_new", "")).toEqual({
      kind: "tokenHash",
      tokenHash: "t1",
    });
    expect(parseEmailChangeUrl("?token_hash=t2&type=email_change_current", "")).toEqual({
      kind: "tokenHash",
      tokenHash: "t2",
    });
  });

  it("treats Supabase's error params as an expired link, in the hash or the query", () => {
    expect(
      parseEmailChangeUrl("", "#error=access_denied&error_code=otp_expired&type=email_change")
    ).toEqual({ kind: "expired" });
    expect(parseEmailChangeUrl("?error_code=otp_expired&type=email_change", "")).toEqual({
      kind: "expired",
    });
  });

  it("ignores an ordinary page load", () => {
    expect(parseEmailChangeUrl("", "")).toEqual({ kind: "none" });
    expect(parseEmailChangeUrl("?tab=profile", "#section=email")).toEqual({ kind: "none" });
  });

  it("never claims a password recovery link", () => {
    expect(parseEmailChangeUrl("?token_hash=t123&type=recovery", "")).toEqual({ kind: "none" });
    expect(
      parseEmailChangeUrl("", "#access_token=abc&type=recovery")
    ).toEqual({ kind: "none" });
    expect(parseEmailChangeUrl("?code=xyz", "")).toEqual({ kind: "none" });
  });

  it("never claims a signup confirmation link", () => {
    expect(parseEmailChangeUrl("?token_hash=t123&type=signup", "")).toEqual({ kind: "none" });
  });
});

describe("friendlyEmailChangeLinkError", () => {
  it("points an expired link at the code instead", () => {
    const message = friendlyEmailChangeLinkError("Email link is invalid or has expired");
    expect(message).toMatch(/expired/i);
    expect(message).toMatch(/code/i);
  });

  it("points a spent link at the code instead", () => {
    expect(friendlyEmailChangeLinkError("Token has already been used")).toMatch(/code/i);
  });

  it("still says something useful for an unrecognised failure", () => {
    expect(friendlyEmailChangeLinkError(undefined)).toMatch(/code/i);
    expect(friendlyEmailChangeLinkError("")).toMatch(/code/i);
  });
});
