import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import {
  friendlyOAuthError,
  hasPasswordIdentity,
  isEmailDerivedName,
  isSocialAccount,
  nameFromProvider,
  needsProfileSetup,
  profileGaps,
  signInMethodLabel,
} from "@/lib/authProviders";

/** Just enough of a Supabase user for the identity helpers. */
const userWith = (providers: string[] | undefined) =>
  ({ identities: providers?.map((provider) => ({ provider })) } as unknown as User);

describe("hasPasswordIdentity", () => {
  it("is true for an account created with an email and password", () => {
    expect(hasPasswordIdentity(userWith(["email"]))).toBe(true);
  });

  it("is false for a Google or Apple account", () => {
    expect(hasPasswordIdentity(userWith(["google"]))).toBe(false);
    expect(hasPasswordIdentity(userWith(["apple"]))).toBe(false);
  });

  it("is true once a password has been added to a provider account", () => {
    expect(hasPasswordIdentity(userWith(["google", "email"]))).toBe(true);
  });

  it("assumes a password when the identities aren't there to read", () => {
    // The safe way round: the ordinary form is right for anyone who has a
    // password, and merely one wasted attempt for anyone who doesn't.
    expect(hasPasswordIdentity(userWith([]))).toBe(true);
    expect(hasPasswordIdentity(userWith(undefined))).toBe(true);
    expect(hasPasswordIdentity(null)).toBe(true);
  });
});

describe("isSocialAccount", () => {
  it("knows which accounts came in through a provider", () => {
    expect(isSocialAccount(userWith(["google"]))).toBe(true);
    expect(isSocialAccount(userWith(["apple", "email"]))).toBe(true);
    expect(isSocialAccount(userWith(["email"]))).toBe(false);
    expect(isSocialAccount(null)).toBe(false);
  });
});

describe("signInMethodLabel", () => {
  it("names the provider, and says so when there's a password too", () => {
    expect(signInMethodLabel(userWith(["google"]))).toBe("Google");
    expect(signInMethodLabel(userWith(["apple"]))).toBe("Apple");
    expect(signInMethodLabel(userWith(["google", "email"]))).toBe("Google or a password");
    expect(signInMethodLabel(userWith(["email"]))).toBe("a password");
  });
});

describe("profileGaps", () => {
  const complete = {
    first_name: "Robyn",
    surname: "M",
    display_name: "Robyn M",
    username: "robyn",
    location: "I live in Hoedspruit",
  };

  it("finds nothing missing on a finished profile", () => {
    expect(profileGaps(complete)).toEqual({ name: false, username: false, residency: false });
    expect(needsProfileSetup(complete)).toBe(false);
  });

  it("counts a provider display name as a name", () => {
    expect(profileGaps({ ...complete, first_name: null }).name).toBe(false);
  });

  it("catches the empty profile a provider signup starts with", () => {
    expect(profileGaps({})).toEqual({ name: true, username: true, residency: true });
    expect(needsProfileSetup({})).toBe(true);
    expect(needsProfileSetup(null)).toBe(true);
  });

  it("treats whitespace as missing", () => {
    expect(needsProfileSetup({ ...complete, username: "   " })).toBe(true);
    expect(needsProfileSetup({ ...complete, location: "" })).toBe(true);
  });
});

describe("nameFromProvider", () => {
  const userWithMeta = (user_metadata: Record<string, unknown>) =>
    ({ user_metadata } as unknown as User);

  it("reads the keys Google and Apple actually use", () => {
    expect(nameFromProvider(userWithMeta({ full_name: "Robyn McDonald" }))).toBe("Robyn McDonald");
    expect(nameFromProvider(userWithMeta({ name: "Robyn McDonald" }))).toBe("Robyn McDonald");
    expect(
      nameFromProvider(userWithMeta({ given_name: "Robyn", family_name: "McDonald" })),
    ).toBe("Robyn McDonald");
  });

  it("says nothing when the provider gave no name", () => {
    expect(nameFromProvider(userWithMeta({ email: "robynmcd16@example.com" }))).toBe("");
    expect(nameFromProvider(null)).toBe("");
  });
});

describe("isEmailDerivedName", () => {
  it("recognises the local part of the address posing as a name", () => {
    expect(isEmailDerivedName("robynmcd16", "robynmcd16@example.com")).toBe(true);
    expect(isEmailDerivedName("Robynmcd16", "robynmcd16@example.com")).toBe(true);
    // Separators come back through as spaces or capitals; still not a name.
    expect(isEmailDerivedName("Robyn Mcd16", "robyn.mcd16@example.com")).toBe(true);
    expect(isEmailDerivedName("robyn_mcd", "robyn.mcd@example.com")).toBe(true);
  });

  it("leaves a real name alone", () => {
    expect(isEmailDerivedName("Robyn McDonald", "robynmcd16@example.com")).toBe(false);
    expect(isEmailDerivedName("Robyn", "robynmcd16@example.com")).toBe(false);
  });

  it("has nothing to say without both halves", () => {
    expect(isEmailDerivedName("", "robynmcd16@example.com")).toBe(false);
    expect(isEmailDerivedName("Robyn McDonald", null)).toBe(false);
    expect(isEmailDerivedName("Robyn McDonald", undefined)).toBe(false);
  });
});

describe("friendlyOAuthError", () => {
  it("explains an address that already has a password account", () => {
    const message = friendlyOAuthError("Identity is already linked to another user", "google");
    expect(message).toMatch(/already has a Hello Hoedspruit account/i);
    expect(message).toMatch(/different email/i);
  });

  it("names the provider when the sign in was abandoned", () => {
    expect(friendlyOAuthError("The user cancelled the request", "apple")).toMatch(
      /Apple sign in was cancelled/i,
    );
  });

  it("falls back to something actionable", () => {
    expect(friendlyOAuthError(null, "google")).toMatch(/Could not sign in with Google/i);
  });
});
