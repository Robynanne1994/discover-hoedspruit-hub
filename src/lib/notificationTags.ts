// A tag cell like "Kids & Family|Community|Food & Drink" holds three separate tags.
export const splitNotificationTags = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values
        .flatMap((v) => (v ?? "").split("|"))
        .map((t) => t.trim())
        .filter((t) => t && t !== "-"),
    ),
  ).sort((a, b) => a.localeCompare(b));

// Event notifications use broader interests rather than every activity tag.
// The event tags themselves remain untouched for event filters and CSV files.
const EVENT_NOTIFICATION_EXCLUSIONS = new Set(
  [
    "Yoga",
    "Running",
    "Cycling",
    "Golf",
    "Hiking",
    "Trail Running",
    "Wine",
    "Live Music",
    "Fashion",
    "Competition",
    "Books",
    "Outdoor",
    "Safety",
    "Theatre",
  ].map((tag) => tag.toLowerCase()),
);

const mergedEventNotificationTag = (tag: string): string => {
  if (/\b(dance|music)\b/i.test(tag)) return "Dance & Music";
  if (/\b(health|wellness)\b/i.test(tag)) return "Health & Wellness";
  if (/\b(business|networking)\b/i.test(tag)) return "Business & Networking";
  if (/\b(party|parties|festival|festivals)\b/i.test(tag)) return "Parties & Festivals";
  if (/\b(conservation|tourism)\b/i.test(tag)) return "Conservation & Tourism";
  if (/\b(wildlife|nature)\b/i.test(tag)) return "Wildlife & Nature";
  return tag;
};

export const splitEventNotificationTags = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      splitNotificationTags(values)
        .map(mergedEventNotificationTag)
        .filter((tag) => !EVENT_NOTIFICATION_EXCLUSIONS.has(tag.toLowerCase())),
    ),
  ).sort((a, b) => a.localeCompare(b));
