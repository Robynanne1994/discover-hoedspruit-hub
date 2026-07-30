import { describe, it, expect } from "vitest";
import { interpretSignInError, isAmbiguousCredentialsError } from "@/lib/signIn";

describe("isAmbiguousCredentialsError", () => {
  it("recognises the error Supabase reuses for both failure modes", () => {
    expect(isAmbiguousCredentialsError("Invalid login credentials")).toBe(true);
    expect(isAmbiguousCredentialsError("Invalid email or password")).toBe(true);
  });

  it("leaves other errors alone, so no needless lookup happens", () => {
    expect(isAmbiguousCredentialsError("Email not confirmed")).toBe(false);
    expect(isAmbiguousCredentialsError("Failed to fetch")).toBe(false);
    expect(isAmbiguousCredentialsError(null)).toBe(false);
  });
});

describe("interpretSignInError", () => {
  it("names the address when it has no account", () => {
    const failure = interpretSignInError(
      "Invalid login credentials",
      false,
      " Someone@Example.com "
    );
    expect(failure.kind).toBe("noAccount");
    expect(failure.message).toContain("Someone@Example.com");
    expect(failure.message).not.toContain("password");
  });

  it("blames the password when the account does exist", () => {
    const failure = interpretSignInError("Invalid login credentials", true, "someone@example.com");
    expect(failure.kind).toBe("badCredentials");
    expect(failure.message).toBe("Incorrect email or password. Please try again.");
  });

  it("stays vague when the lookup could not answer", () => {
    // Never tell someone their account is missing on a guess — an RPC failure
    // or an offline device must fall back to the combined wording.
    const failure = interpretSignInError("Invalid login credentials", null, "someone@example.com");
    expect(failure.kind).toBe("badCredentials");
  });

  it("copes with an empty email in the no-account case", () => {
    const failure = interpretSignInError("Invalid login credentials", false, "  ");
    expect(failure.kind).toBe("noAccount");
    expect(failure.message).toBe("There's no Hello Hoedspruit account for that email yet.");
  });

  it("handles the unconfirmed, throttled and offline cases before anything else", () => {
    expect(interpretSignInError("Email not confirmed", null).kind).toBe("unconfirmed");
    expect(interpretSignInError("For security purposes, rate limit", null).kind).toBe("rateLimited");
    expect(interpretSignInError("Failed to fetch", null).kind).toBe("offline");
  });

  it("passes anything else through, with a fallback for an empty message", () => {
    expect(interpretSignInError("Something odd happened", null)).toEqual({
      kind: "other",
      message: "Something odd happened",
    });
    expect(interpretSignInError("", null).message).toBe("Could not log in. Please try again.");
  });
});
