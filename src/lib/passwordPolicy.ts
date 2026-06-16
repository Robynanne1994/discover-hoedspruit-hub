// Shared password policy used wherever a user creates or edits a password.
// Requirements: minimum 8 characters and a mix of at least one letter
// (upper or lowercase), one number and one symbol.

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_REQUIREMENTS_TEXT =
  "Use at least 8 characters with a mix of letters, a number and a symbol.";

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }
  if (!/[a-zA-Z]/.test(password)) {
    return "Password must include at least one letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number.";
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return "Password must include at least one symbol.";
  }
  return null;
}

export function isPasswordValid(password: string): boolean {
  return validatePassword(password) === null;
}
