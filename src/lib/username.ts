// Shared username rules. Handles are stored WITHOUT the leading "@" — the "@"
// is presentation only, rendered as a prefix inside the input.

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

/** Strip anything that is not a lowercase letter, number, underscore or dot. */
export function sanitiseUsername(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, USERNAME_MAX);
}

/** Returns an error message, or null when the handle is valid. */
export function validateUsername(value: string): string | null {
  const v = sanitiseUsername(value);
  if (!v) return "Please choose a username.";
  if (v.length < USERNAME_MIN)
    return `Your username must be at least ${USERNAME_MIN} characters.`;
  if (!/^[a-z0-9]/.test(v))
    return "Your username must start with a letter or number.";
  if (/[._]$/.test(v)) return "Your username cannot end with a dot or underscore.";
  if (/[._]{2,}/.test(v))
    return "Your username cannot contain two dots or underscores in a row.";
  return null;
}

export const USERNAME_HINT =
  "Letters, numbers, dots and underscores only.";
