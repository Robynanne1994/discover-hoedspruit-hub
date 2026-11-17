// Shared CSV handling for content visibility.
//
// Blank (or an older sheet without the column) means "not saying": an update
// leaves the stored state alone and a new row uses the database draft rule.
// An explicit TRUE or FALSE is a deliberate choice, so it clears the internal
// auto-activation marker. The database still turns TRUE without an image into
// a draft, but FALSE can never be switched back on by an image upload.

export function parseCsvActive(raw: string | undefined): boolean | undefined {
  const value = (raw ?? "").trim().toLowerCase();
  if (["true", "yes", "y", "1"].includes(value)) return true;
  if (["false", "no", "n", "0"].includes(value)) return false;
  return undefined;
}

export function activeCsvPatch(raw: string | undefined): {
  is_active?: boolean;
  auto_activate_on_image?: boolean;
} {
  const active = parseCsvActive(raw);
  return active === undefined
    ? {}
    : { is_active: active, auto_activate_on_image: false };
}
