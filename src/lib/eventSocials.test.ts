import { describe, it, expect } from "vitest";
import { parseSocials, serializeSocials } from "./eventSocials";
describe("eventSocials", () => {
  it("splits pipe-separated links with aligned labels", () => {
    expect(parseSocials("https://fb.com/a|https://ig.com/b", "-|Insta")).toEqual([
      { link: "https://fb.com/a", label: "" }, { link: "https://ig.com/b", label: "Insta" }]);
  });
  it("joins with - for missing labels and drops empty links", () => {
    expect(serializeSocials([{ link: "a", label: "" }, { link: "", label: "x" }, { link: "b", label: "B" }])).toEqual({ link: "a|b", label: "-|B" });
  });
});
