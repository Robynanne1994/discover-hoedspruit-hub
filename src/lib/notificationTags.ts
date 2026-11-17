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
