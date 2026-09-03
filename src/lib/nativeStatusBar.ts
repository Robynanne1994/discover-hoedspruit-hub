// Edge-to-edge status bar for the native app.
//
// The version-1 screenshot showed a white band across the top: the web view
// started below the status bar instead of painting behind it, so the app read
// as a website in a wrapper. Three things fix it together:
//
//   * index.html — `viewport-fit=cover`, which turns on the
//     `env(safe-area-inset-*)` values the layout already uses (src/index.css:
//     `--safe-top`, `--header-top`, …).
//   * capacitor.config.ts — `ios.contentInset: "never"` stops WKWebView adding
//     its own inset, and `overlaysWebView` on the StatusBar plugin does the
//     same job on Android at launch (before this code runs, so no flash).
//   * this module — sets the status-bar text to dark (the background behind it
//     is the light cream `#E6E0CC`) and, on Android, re-asserts the overlay in
//     case the config was missed.
//
// No-op on the web.
import { isNativeApp, nativePlatform } from "@/lib/nativeBridge";

/** App background — the colour that must run to the very top of the screen. */
const CREAM = "#E6E0CC";

let done = false;

export async function initNativeStatusBar(): Promise<void> {
  if (done || !isNativeApp()) return;
  done = true;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");

    // Style.Light == dark glyphs, for a light background. (The names read
    // backwards: "Light" describes the content style, not the bar.)
    await StatusBar.setStyle({ style: Style.Light });

    if (nativePlatform() === "android") {
      // Draw the web view under the status bar so the cream reaches the top.
      await StatusBar.setOverlaysWebView({ overlay: true });
      // Only used on the frames where the bar isn't overlaying; keep it on-brand.
      await StatusBar.setBackgroundColor({ color: CREAM });
    }
  } catch (err) {
    console.warn("[statusBar] init failed", err);
    done = false;
  }
}
