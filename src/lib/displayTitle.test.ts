import { describe, expect, it } from "vitest";
import { getDisplayTitle, noTitleCaseProps, parseTitleOverrideCell, titleOverrideToCsv, titleOverrideValue } from "./displayTitle";

describe("CSV title override toggle shared with local channels", () => {
  const title = "Hoedspruit! Die Mooiste Dorpie!";

  it("TRUE copies the typed title and preserves its casing", () => {
    const title_override = titleOverrideValue(parseTitleOverrideCell("TRUE") === true, title);
    expect(title_override).toBe("Hoedspruit! Die Mooiste Dorpie!");
    expect(getDisplayTitle({ title, title_override })).toBe(title);
    expect(noTitleCaseProps({ title_override })).toEqual({ "data-no-title-case": "true" });
  });

  it("FALSE disables the override instead of displaying FALSE", () => {
    const title_override = titleOverrideValue(parseTitleOverrideCell("FALSE") === true, title);
    expect(title_override).toBeNull();
    expect(getDisplayTitle({ title, title_override })).toBe(title);
    expect(noTitleCaseProps({ title_override })).toEqual({});
  });

  it("exports boolean cells, never replacement title text", () => {
    expect(titleOverrideToCsv({ title, title_override: title })).toBe("true");
    expect(titleOverrideToCsv({ title, title_override: null })).toBe("false");
  });

  it("keeps the other CSVs' case-insensitive and blank-cell behaviour", () => {
    expect(parseTitleOverrideCell(" true ")).toBe(true);
    expect(parseTitleOverrideCell("false")).toBe(false);
    expect(titleOverrideValue(parseTitleOverrideCell("") === true, title)).toBeNull();
  });
});