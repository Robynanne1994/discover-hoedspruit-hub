// Which way did this account get in — a password, or Google/Apple?
//
// The answer changes three things the app would otherwise get wrong:
//
//   * A Google or Apple account has no password. "Change Password" cannot ask
//     for a current one, because there has never been one; it has to offer to
//     set the first one instead.
//   * A Google or Apple signup arrives with a verified address and nothing
//     else — no username, no residency, no name we can rely on. The app has to
//     ask for those before the account is really usable, otherwise all we have
//     is an email address and a profile nobody can be found by.
//   * The address on a provider account is already proved by the provider, so
//     it never needs a code.
import type { User } from "@supabase/supabase-js";

/** Providers that sign someone in without a password of ours. */
const SOCIAL_PROVIDERS = ["google", "apple", "microsoft", "facebook", "azure", "lovable"];

type IdentityLike = { provider?: string | null };

function identities(user: User | null): IdentityLike[] {
  return (user?.identities as IdentityLike[] | undefined) ?? [];
}

/**
 * Does this account have a password?
 *
 * Read off the identities Supabase attaches to the user: an email/password
 * account has an `email` identity, a Google one does not. An account can have
 * both — signing in with Google to an address that already had a password links
 * the two — and that account does have a password.
 *
 * Defaults to true when the identity list is missing, which is the safe way
 * round: showing the ordinary "enter your current password" form to someone who
 * has one is correct, and showing it to someone who doesn't merely means one
 * failed attempt and the "Forgot Password" link right underneath it.
 */
export function hasPasswordIdentity(user: User | null): boolean {
  const list = identities(user);
  if (list.length === 0) return true;
  return list.some((identity) => identity.provider === "email");
}

/** The social providers on this account, in the order Supabase lists them. */
export function socialProviders(user: User | null): string[] {
  return identities(user)
    .map((identity) => (identity.provider ?? "").toLowerCase())
    .filter((provider) => SOCIAL_PROVIDERS.includes(provider));
}

/** Did this account get in through Google, Apple or similar? */
export function isSocialAccount(user: User | null): boolean {
  return socialProviders(user).length > 0;
}

/** "Google", "Apple" — for a sentence. Falls back to a generic word. */
export function providerLabel(provider: string): string {
  const labels: Record<string, string> = {
    google: "Google",
    apple: "Apple",
    microsoft: "Microsoft",
    facebook: "Facebook",
    azure: "Microsoft",
    lovable: "Lovable",
  };
  return labels[provider.toLowerCase()] ?? "your provider";
}

/** How the account signs in, for copy: "Google", "Google or Apple", "a password". */
export function signInMethodLabel(user: User | null): string {
  const social = socialProviders(user).map(providerLabel);
  if (social.length === 0) return "a password";
  if (hasPasswordIdentity(user)) return `${social.join(" or ")} or a password`;
  return social.join(" or ");
}

/**
 * What still has to be filled in before a profile is usable.
 *
 * Signing up with an email asks for all of this up front, so this only ever has
 * anything to say about a Google or Apple signup — or an account old enough to
 * predate one of the fields.
 */
export interface ProfileGaps {
  name: boolean;
  username: boolean;
  residency: boolean;
}

export function profileGaps(
  profile: {
    first_name?: string | null;
    surname?: string | null;
    display_name?: string | null;
    username?: string | null;
    location?: string | null;
  } | null,
): ProfileGaps {
  const filled = (value?: string | null) => !!value && value.trim() !== "";
  return {
    // A display name from a provider is enough to have a name, but a profile
    // with neither that nor a first name has nothing to show.
    name: !filled(profile?.first_name) && !filled(profile?.display_name),
    username: !filled(profile?.username),
    residency: !filled(profile?.location),
  };
}

/** Is anything still missing? */
export function needsProfileSetup(
  profile: Parameters<typeof profileGaps>[0],
): boolean {
  const gaps = profileGaps(profile);
  return gaps.name || gaps.username || gaps.residency;
}

/**
 * Turn a provider sign-in failure into copy.
 *
 * The one worth naming is an address that already belongs to a password
 * account: on a project that doesn't automatically link identities, Supabase
 * refuses, and the raw message ("Identity is already linked to another user")
 * tells the person nothing about what to do next.
 */
export function friendlyOAuthError(message?: string | null, provider?: string): string {
  const text = message ?? "";
  const name = provider ? providerLabel(provider) : "that provider";

  if (/already (linked|registered|exists|in use)|identity.*linked|user.*already/i.test(text)) {
    return "That email already has a Hello Hoedspruit account. Log in with your email and password instead, or use a different email address.";
  }
  if (/cancell?ed|closed|denied|abort/i.test(text)) {
    return `${name} sign in was cancelled.`;
  }
  if (/network|fetch|offline|timeout/i.test(text)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  return text || `Could not sign in with ${name}. Please try again.`;
}
