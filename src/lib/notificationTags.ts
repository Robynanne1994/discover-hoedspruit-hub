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
  ].map((tag) => tag.toLowerCase()),
);

export const splitEventNotificationTags = (values: Array<string | null | undefined>): string[] =>
  splitNotificationTags(values).filter((tag) => !EVENT_NOTIFICATION_EXCLUSIONS.has(tag.toLowerCase()));
