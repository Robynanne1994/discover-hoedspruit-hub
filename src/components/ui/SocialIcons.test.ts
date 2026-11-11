import { describe, it, expect } from "vitest";
import { Globe, Linkedin, Youtube } from "lucide-react";
import { socialIconFor, TikTokIcon, ThreadsIcon } from "./SocialIcons";
import { UNIVERSAL_FIELDS } from "@/lib/categoryFields";

describe("other socials", () => {
  it("columns sit directly after instagram", () => {
    const f = [...UNIVERSAL_FIELDS];
    const i = f.indexOf("instagram");
    expect(f.slice(i + 1, i + 3)).toEqual(["other_socials", "other_socials_labels"]);
  });
  it("picks icons by label", () => {
    expect(socialIconFor("YouTube")).toBe(Youtube);
    expect(socialIconFor("TikTok")).toBe(TikTokIcon);
    expect(socialIconFor("LinkedIn")).toBe(Linkedin);
    expect(socialIconFor("Threads")).toBe(ThreadsIcon);
    expect(socialIconFor("Pinterest")).toBe(Globe);
  });
});
