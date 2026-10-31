import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderListingRichText } from "./listingRichText";

const links = (text: string) => {
  const { container } = render(<div>{renderListingRichText(text)}</div>);
  return [...container.querySelectorAll("a")].map((a) => ({
    label: a.textContent?.trim(),
    href: a.getAttribute("href"),
    display: (a as HTMLElement).style.display,
  }));
};

describe("listing rich text links", () => {
  const apple = "https://apps.apple.com/za/app/ampath/id1370756724";
  const android = "https://play.google.com/store/apps/details?id=com.ampath.dev.patientresults";

  it("stacks two links written on separate lines, one under the other", () => {
    const out = links(
      `[Download on Apple](${apple})\n[Download on Android](${android})`,
    );
    expect(out).toHaveLength(2);
    expect(out.map((l) => l.label)).toEqual(["Download on Apple", "Download on Android"]);
    expect(out.map((l) => l.href)).toEqual([apple, android]);
    // Block display = each link owns a full line instead of sitting side by side.
    expect(out.map((l) => l.display)).toEqual(["flex", "flex"]);
  });

  it("stacks links written side by side on one line too", () => {
    const out = links(`[Download on Apple](${apple}) [Download on Android](${android})`);
    expect(out.map((l) => l.label)).toEqual(["Download on Apple", "Download on Android"]);
    expect(out.map((l) => l.display)).toEqual(["flex", "flex"]);
  });

  it("stacks more than two links in the order written", () => {
    const out = links(`[A](${apple})\n[B](${android})\n[C](${apple})`);
    expect(out.map((l) => l.label)).toEqual(["A", "B", "C"]);
    expect(out.every((l) => l.display === "flex")).toBe(true);
  });

  it("keeps a link inside a sentence inline", () => {
    const { container } = render(
      <div>{renderListingRichText("Book online at [our site](https://example.com) today.")}</div>,
    );
    const a = container.querySelector("a") as HTMLElement;
    expect(a.textContent?.trim()).toBe("our site");
    expect(a.style.display).toBe("inline-flex");
    expect(container.textContent).toContain("Book online at");
    expect(container.textContent).toContain("today.");
  });

  it("still renders plain paragraphs and subtitles untouched", () => {
    const { container } = render(
      <div>{renderListingRichText("## Good to know\nPart of the national network.")}</div>,
    );
    expect(container.querySelector("h3")?.textContent).toBe("Good to know");
    expect(container.querySelector("p")?.textContent).toBe("Part of the national network.");
    expect(container.querySelectorAll("a")).toHaveLength(0);
  });
});
