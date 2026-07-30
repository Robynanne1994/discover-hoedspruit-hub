import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SHARE_ORIGIN,
  copyToClipboard,
  openSystemShareSheet,
  shareBlurb,
  shareMessage,
  shareTargets,
  toShareUrl,
} from "@/lib/share";

// The native plugin only exists on a device, so the bridge and the plugin are
// both stubbed to exercise the app path the Android webview actually takes.
const nativeShare = vi.hoisted(() => vi.fn());
vi.mock("@capacitor/share", () => ({ Share: { share: nativeShare } }));

const asNativeApp = () => {
  (window as unknown as { Capacitor?: unknown }).Capacitor = {
    isNativePlatform: () => true,
    getPlatform: () => "android",
  };
};

// jsdom fixes window.location, so the origin is swapped per-test instead.
const setOrigin = (origin: string, pathname = "/", search = "") => {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { origin, pathname, search, href: `${origin}${pathname}${search}` },
  });
};

const originalLocation = window.location;

afterEach(() => {
  Object.defineProperty(window, "location", { writable: true, value: originalLocation });
  delete (window as unknown as { Capacitor?: unknown }).Capacitor;
  nativeShare.mockReset();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("toShareUrl", () => {
  it("keeps an absolute url as-is", () => {
    setOrigin("https://hello-hoedspruit-hub.lovable.app");
    expect(toShareUrl("https://example.com/thing")).toBe("https://example.com/thing");
  });

  it("resolves a path against the current web origin", () => {
    setOrigin("https://hellohoedspruit.co.za");
    expect(toShareUrl("/listing/abc")).toBe("https://hellohoedspruit.co.za/listing/abc");
  });

  it("tolerates a path with no leading slash", () => {
    setOrigin("https://hellohoedspruit.co.za");
    expect(toShareUrl("listing/abc")).toBe("https://hellohoedspruit.co.za/listing/abc");
  });

  it("rewrites the native webview origin to the public site", () => {
    // Inside the app, window.location.origin is capacitor://localhost — a link
    // that only resolves on the sharer's own phone.
    setOrigin("capacitor://localhost");
    expect(toShareUrl("/events/1")).toBe(`${SHARE_ORIGIN}/events/1`);
  });

  it("rewrites a localhost dev origin to the public site", () => {
    setOrigin("http://localhost:8080");
    expect(toShareUrl("/specials/9")).toBe(`${SHARE_ORIGIN}/specials/9`);
  });

  it("falls back to the current page, query string included", () => {
    setOrigin("https://hellohoedspruit.co.za", "/category/food", "?sort=rating");
    expect(toShareUrl()).toBe("https://hellohoedspruit.co.za/category/food?sort=rating");
  });

  it("uses the public site for the current page inside the app", () => {
    setOrigin("capacitor://localhost", "/listing/xyz");
    expect(toShareUrl()).toBe(`${SHARE_ORIGIN}/listing/xyz`);
  });
});

describe("shareMessage", () => {
  beforeEach(() => setOrigin("https://hellohoedspruit.co.za"));

  it("joins the title, blurb and link", () => {
    expect(shareMessage({ title: "Mad Dogz", text: "Burgers in town", url: "/listing/1" })).toBe(
      "Mad Dogz\n\nBurgers in town\n\nhttps://hellohoedspruit.co.za/listing/1",
    );
  });

  it("does not repeat the title when it is also the blurb", () => {
    expect(shareMessage({ title: "Mad Dogz", text: "Mad Dogz", url: "/listing/1" })).toBe(
      "Mad Dogz\n\nhttps://hellohoedspruit.co.za/listing/1",
    );
  });

  it("strips markup out of a rich-text description", () => {
    expect(
      shareMessage({
        title: "Mad Dogz",
        text: "<p>Wood-fired  <strong>pizza</strong></p>\n<p>on the Klaserie road.</p>",
        url: "/listing/1",
      }),
    ).toBe("Mad Dogz\n\nWood-fired pizza on the Klaserie road.\n\nhttps://hellohoedspruit.co.za/listing/1");
  });
});

describe("shareBlurb", () => {
  it("returns nothing for an empty or markup-only description", () => {
    expect(shareBlurb(undefined)).toBeUndefined();
    expect(shareBlurb("   ")).toBeUndefined();
    expect(shareBlurb("<p></p>")).toBeUndefined();
  });

  it("truncates a long description so messaging apps stay readable", () => {
    const blurb = shareBlurb("word ".repeat(80));
    expect(blurb).toHaveLength(160);
    expect(blurb?.endsWith("…")).toBe(true);
  });

  it("leaves a short description alone", () => {
    expect(shareBlurb("Burgers in town")).toBe("Burgers in town");
  });
});

describe("shareTargets", () => {
  beforeEach(() => setOrigin("https://hellohoedspruit.co.za"));

  const content = { title: "Mad Dogz & Co", text: "Burgers", url: "/listing/1" };

  it("builds the messaging apps used by the fallback sheet", () => {
    const keys = shareTargets(content, { sms: true }).map((t) => t.key);
    expect(keys).toEqual(["whatsapp", "facebook", "x", "email", "sms"]);
  });

  it("drops sms on pointer devices", () => {
    expect(shareTargets(content, { sms: false }).map((t) => t.key)).not.toContain("sms");
  });

  it("percent-encodes the link and the message", () => {
    const byKey = Object.fromEntries(shareTargets(content, { sms: true }).map((t) => [t.key, t.href]));
    expect(byKey.whatsapp).toBe(
      "https://wa.me/?text=Mad%20Dogz%20%26%20Co%0A%0ABurgers%0A%0Ahttps%3A%2F%2Fhellohoedspruit.co.za%2Flisting%2F1",
    );
    expect(byKey.facebook).toBe(
      "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fhellohoedspruit.co.za%2Flisting%2F1",
    );
    expect(byKey.email).toContain("mailto:?subject=Mad%20Dogz%20%26%20Co&body=");
  });

  it("keeps mailto and sms in the current context, web targets in a new tab", () => {
    const targets = shareTargets(content, { sms: true });
    expect(targets.filter((t) => t.external).map((t) => t.key)).toEqual([
      "whatsapp",
      "facebook",
      "x",
    ]);
    expect(targets.filter((t) => !t.external).map((t) => t.key)).toEqual(["email", "sms"]);
  });
});

describe("openSystemShareSheet", () => {
  beforeEach(() => setOrigin("https://hellohoedspruit.co.za"));

  it("reports 'unsupported' when the browser has no share sheet", async () => {
    vi.stubGlobal("navigator", {});
    await expect(openSystemShareSheet({ title: "Mad Dogz", url: "/listing/1" })).resolves.toBe(
      "unsupported",
    );
  });

  it("hands an absolute link and a blurb to the Web Share API", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });

    await expect(openSystemShareSheet({ title: "Mad Dogz", text: "Burgers", url: "/listing/1" })).resolves.toBe(
      "shared",
    );
    expect(share).toHaveBeenCalledWith({
      title: "Mad Dogz",
      text: "Burgers",
      url: "https://hellohoedspruit.co.za/listing/1",
    });
  });

  it("falls back to the title when there is no blurb", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });

    await openSystemShareSheet({ title: "Mad Dogz", url: "/listing/1" });
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ text: "Mad Dogz" }));
  });

  it("treats a cancelled sheet as 'dismissed', not a failure", async () => {
    const err = new Error("Share canceled");
    err.name = "AbortError";
    vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(err) });

    await expect(openSystemShareSheet({ title: "Mad Dogz" })).resolves.toBe("dismissed");
  });

  it("treats an iOS/Android cancellation message as 'dismissed'", async () => {
    vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(new Error("Share canceled")) });
    await expect(openSystemShareSheet({ title: "Mad Dogz" })).resolves.toBe("dismissed");
  });

  it("reports 'failed' on a real error so the caller can fall back", async () => {
    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(new Error("Permission denied")),
    });
    await expect(openSystemShareSheet({ title: "Mad Dogz" })).resolves.toBe("failed");
  });

  it("respects a browser that refuses the payload", async () => {
    const share = vi.fn();
    vi.stubGlobal("navigator", { share, canShare: () => false });

    await expect(openSystemShareSheet({ title: "Mad Dogz" })).resolves.toBe("unsupported");
    expect(share).not.toHaveBeenCalled();
  });
});

describe("openSystemShareSheet inside the native app", () => {
  beforeEach(() => {
    setOrigin("capacitor://localhost", "/listing/1");
    asNativeApp();
  });

  it("goes through the Capacitor plugin, not the (missing) Web Share API", async () => {
    // The Android webview has no navigator.share at all — this is the case that
    // used to silently degrade to a clipboard copy.
    vi.stubGlobal("navigator", {});
    nativeShare.mockResolvedValue({ activityType: "com.whatsapp" });

    await expect(openSystemShareSheet({ title: "Mad Dogz", text: "Burgers" })).resolves.toBe("shared");
    expect(nativeShare).toHaveBeenCalledWith({
      title: "Mad Dogz",
      text: "Burgers",
      // Rewritten off capacitor://localhost so the recipient can open it.
      url: `${SHARE_ORIGIN}/listing/1`,
      dialogTitle: "Mad Dogz",
    });
  });

  it("prefers the plugin even when the webview does expose navigator.share", async () => {
    const webShare = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share: webShare });
    nativeShare.mockResolvedValue({});

    await openSystemShareSheet({ title: "Mad Dogz", url: "/events/2" });
    expect(nativeShare).toHaveBeenCalled();
    expect(webShare).not.toHaveBeenCalled();
  });

  it("treats the OS cancellation as 'dismissed'", async () => {
    vi.stubGlobal("navigator", {});
    nativeShare.mockRejectedValue(new Error("Share canceled"));

    await expect(openSystemShareSheet({ title: "Mad Dogz" })).resolves.toBe("dismissed");
  });

  it("reports 'failed' when the plugin errors so the in-app sheet takes over", async () => {
    vi.stubGlobal("navigator", {});
    nativeShare.mockRejectedValue(new Error("No Activity found to handle Intent"));

    await expect(openSystemShareSheet({ title: "Mad Dogz" })).resolves.toBe("failed");
  });
});

describe("copyToClipboard", () => {
  it("uses the Clipboard API when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyToClipboard("https://example.com")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("https://example.com");
  });

  it("falls back to the legacy selection copy in webviews", async () => {
    vi.stubGlobal("navigator", {});
    const exec = vi.fn().mockReturnValue(true);
    (document as unknown as { execCommand: unknown }).execCommand = exec;

    await expect(copyToClipboard("https://example.com")).resolves.toBe(true);
    expect(exec).toHaveBeenCalledWith("copy");
    // The scratch textarea must not be left behind in the DOM.
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("falls back when the Clipboard API rejects", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    (document as unknown as { execCommand: unknown }).execCommand = vi.fn().mockReturnValue(true);

    await expect(copyToClipboard("https://example.com")).resolves.toBe(true);
  });

  it("reports failure when nothing can copy", async () => {
    vi.stubGlobal("navigator", {});
    (document as unknown as { execCommand: unknown }).execCommand = vi.fn().mockReturnValue(false);

    await expect(copyToClipboard("https://example.com")).resolves.toBe(false);
  });
});
