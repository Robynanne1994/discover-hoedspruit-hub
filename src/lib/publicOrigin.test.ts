import { afterEach, describe, expect, it } from "vitest";
import { PUBLIC_ORIGIN, authOrigin, authUrl, shareOrigin } from "@/lib/publicOrigin";

// jsdom fixes window.location, so the origin is swapped per-test instead.
const setOrigin = (origin: string) => {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { origin, pathname: "/", search: "", href: `${origin}/` },
  });
};

const originalLocation = window.location;

afterEach(() => {
  Object.defineProperty(window, "location", { writable: true, value: originalLocation });
});

describe("authOrigin", () => {
  it("keeps a real web origin", () => {
    setOrigin("https://hellohoedspruit.com");
    expect(authOrigin()).toBe("https://hellohoedspruit.com");
  });

  // The bug this module exists for. Inside the app shell the origin is a
  // private scheme belonging to that one webview: Supabase drops it (not on the
  // redirect allow list) and no mail client could open it, so the confirmation
  // link in the email silently fell back to the project's Site URL.
  it.each(["capacitor://localhost", "ionic://localhost", "file://"])(
    "rewrites the native origin %s to the public site",
    (origin) => {
      setOrigin(origin);
      expect(authOrigin()).toBe(PUBLIC_ORIGIN);
    },
  );

  // Deliberately different from shareOrigin(): a developer testing a reset on
  // their own machine needs the emailed link to come back to their dev server.
  it("leaves a localhost dev server alone, so local testing round-trips", () => {
    setOrigin("http://localhost:8080");
    expect(authOrigin()).toBe("http://localhost:8080");
  });

  it("falls back to the public site when there is no origin at all", () => {
    setOrigin("");
    expect(authOrigin()).toBe(PUBLIC_ORIGIN);
  });
});

describe("authUrl", () => {
  it("joins a path onto the auth origin", () => {
    setOrigin("https://hellohoedspruit.com");
    expect(authUrl("/reset-password")).toBe("https://hellohoedspruit.com/reset-password");
  });

  it("tolerates a path with no leading slash", () => {
    setOrigin("https://hellohoedspruit.com");
    expect(authUrl("account-settings/info")).toBe(
      "https://hellohoedspruit.com/account-settings/info",
    );
  });

  it("produces an emailable link from inside the app shell", () => {
    setOrigin("capacitor://localhost");
    expect(authUrl("/reset-password")).toBe(`${PUBLIC_ORIGIN}/reset-password`);
  });
});

describe("shareOrigin", () => {
  it("keeps a real web origin", () => {
    setOrigin("https://hellohoedspruit.com");
    expect(shareOrigin()).toBe("https://hellohoedspruit.com");
  });

  // Stricter than authOrigin(): a recipient on another phone can reach a dev
  // server no more easily than they can reach capacitor://localhost.
  it("rewrites a localhost dev origin, unlike authOrigin", () => {
    setOrigin("http://localhost:8080");
    expect(shareOrigin()).toBe(PUBLIC_ORIGIN);
    expect(authOrigin()).toBe("http://localhost:8080");
  });

  it("rewrites the native webview origin", () => {
    setOrigin("capacitor://localhost");
    expect(shareOrigin()).toBe(PUBLIC_ORIGIN);
  });
});

describe("PUBLIC_ORIGIN", () => {
  it("carries no trailing slash, so paths join cleanly", () => {
    expect(PUBLIC_ORIGIN).not.toMatch(/\/$/);
  });

  it("is an absolute https origin a mail client can open", () => {
    expect(PUBLIC_ORIGIN).toMatch(/^https:\/\//);
  });
});
