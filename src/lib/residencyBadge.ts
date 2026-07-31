// Turns the stored residency answer on a profile into the short badge label
// shown on profile cards: "HOEDSPRUIT LOCAL" or "HOEDSPRUIT VISITOR".
export const residencyBadge = (location?: string | null): string | null => {
  if (!location) return null;
  const l = location.toLowerCase();
  if (l.includes("visit")) return "HOEDSPRUIT VISITOR";
  if (l.includes("live")) return "HOEDSPRUIT LOCAL";
  return location.toUpperCase();
};
