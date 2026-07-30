import { describe, expect, it, vi } from "vitest";

// The module reaches for the Supabase client at import time; the pure helpers
// under test never touch it.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const {
  VERIFICATION_CODE_LENGTH,
  friendlySendError,
  friendlyVerificationError,
  isCompleteCode,
  isEmailNotConfirmedError,
  isEmailVerified,
  isValidEmail,
  normaliseCode,
} = await import("./emailVerification");

describe("normaliseCode", () => {
  it("keeps only digits", () => {
    expect(normaliseCode("40-29 18")).toBe("402918");
  });

  it("survives a code pasted with its surrounding sentence", () => {
    expect(normaliseCode("Your code is 402918. It expires in 15 minutes.")).toBe("402918");
  });

  it("caps at the code length", () => {
    expect(normaliseCode("1234567890")).toHaveLength(VERIFICATION_CODE_LENGTH);
  });

  it("returns nothing for input with no digits", () => {
    expect(normaliseCode("abc")).toBe("");
  });
});

describe("isCompleteCode", () => {
  it("is true only for a full six digits", () => {
    expect(isCompleteCode("402918")).toBe(true);
    expect(isCompleteCode("40291")).toBe(false);
    expect(isCompleteCode("")).toBe(false);
  });

  it("ignores punctuation when counting", () => {
    expect(isCompleteCode("402 918")).toBe(true);
  });
});

describe("isValidEmail", () => {
  it("accepts an ordinary address, trimmed", () => {
    expect(isValidEmail("  robyn@example.com ")).toBe(true);
  });

  it("rejects the shapes a typo produces", () => {
    expect(isValidEmail("robyn@example")).toBe(false);
    expect(isValidEmail("robyn.example.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("isEmailNotConfirmedError", () => {
  it("recognises the message Supabase sends for an unconfirmed account", () => {
    expect(isEmailNotConfirmedError("Email not confirmed")).toBe(true);
    expect(isEmailNotConfirmedError("email_not_confirmed")).toBe(true);
  });

  it("leaves a wrong password alone", () => {
    expect(isEmailNotConfirmedError("Invalid login credentials")).toBe(false);
    expect(isEmailNotConfirmedError(null)).toBe(false);
  });
});

describe("friendlyVerificationError", () => {
  it("explains an expired code", () => {
    expect(friendlyVerificationError("Token has expired or is invalid")).toMatch(/expired/i);
  });

  it("explains a wrong code", () => {
    expect(friendlyVerificationError("Invalid token")).toMatch(/isn't right/i);
  });

  it("explains the one-a-minute limit", () => {
    expect(friendlyVerificationError("For security purposes, you can only request this after 41 seconds"))
      .toMatch(/one code a minute/i);
  });

  it("falls back to something useful when there is no message", () => {
    expect(friendlyVerificationError(null)).toMatch(/try again/i);
  });
});

describe("friendlySendError", () => {
  it("explains an address already spoken for", () => {
    expect(friendlySendError("A user with this email address has already been registered"))
      .toMatch(/already in use/i);
  });

  it("explains the one-a-minute limit", () => {
    expect(friendlySendError("email rate limit exceeded")).toMatch(/one code a minute/i);
  });
});

describe("isEmailVerified", () => {
  it("is true once Supabase has stamped a confirmation time", () => {
    expect(isEmailVerified({ email_confirmed_at: "2026-07-30T10:00:00Z" })).toBe(true);
  });

  it("is false for accounts made before verification existed", () => {
    expect(isEmailVerified({ email_confirmed_at: null })).toBe(false);
    expect(isEmailVerified({})).toBe(false);
    expect(isEmailVerified(null)).toBe(false);
  });
});
