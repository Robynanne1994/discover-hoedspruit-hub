import { describe, expect, it } from "vitest";
import { channelButtonLabelFromCsv, channelButtonLabelToCsv } from "./channelButtonLabel";

describe("channel CSV Button Label", () => {
  it("uses the CSV text as the editor's button label", () => {
    expect(channelButtonLabelFromCsv({ button_label: "Join WildHire" })).toEqual({ cta_label: "Join WildHire" });
    expect(channelButtonLabelFromCsv({ buttonlabel: "Join WildHire" })).toEqual({ cta_label: "Join WildHire" });
  });
  it("exports the saved button label unchanged", () => {
    expect(channelButtonLabelToCsv({ cta_label: "Join WildHire" })).toBe("Join WildHire");
  });
  it("clears a blank label but leaves older CSVs without the column unchanged", () => {
    expect(channelButtonLabelFromCsv({ button_label: "" })).toEqual({ cta_label: null });
    expect(channelButtonLabelFromCsv({})).toEqual({});
    expect(channelButtonLabelToCsv({ cta_label: null })).toBe("");
  });
});