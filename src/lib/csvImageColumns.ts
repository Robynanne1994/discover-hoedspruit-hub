// Images are managed exclusively in the backend editors, never through CSV.
//
// Every CSV import / export tool routes its columns and payloads through these
// helpers, so an import can never overwrite an image that was set in the app,
// and an export never ships image URLs for someone to accidentally edit.

/** True for any column that carries an image / gallery / QR URL. */
export const isImageCsvColumn = (name: string): boolean =>
  /image/i.test(name);

/** Drop every image column from a CSV header list. */
export const stripImageCsvColumns = (headers: readonly string[]): string[] =>
  headers.filter((h) => !isImageCsvColumn(h));

/** Remove every image key from an import payload so stored images are preserved. */
export function omitImageKeys<T extends Record<string, unknown>>(payload: T): T {
  for (const key of Object.keys(payload)) {
    if (isImageCsvColumn(key)) delete payload[key];
  }
  return payload;
}
