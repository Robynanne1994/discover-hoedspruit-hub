// A fixed, opaque bar that always sits over the status-bar area.
//
// The app renders edge-to-edge (viewport-fit=cover + ios.contentInset:
// "never"), which means every screen is individually responsible for padding
// its content below --safe-top. When a screen gets that wrong — or content
// simply scrolls past its own top padding — it shows up behind the status
// bar's clock/icons, which reads as broken rather than native.
//
// Rather than chase that screen by screen, this paints over the status-bar
// strip unconditionally, on every route, above everything else. Nothing can
// ever be seen through it. It's the same cream the status bar's own
// background is set to (nativeStatusBar.ts / capacitor.config.ts), so on a
// screen that already pads correctly this is invisible — just a second layer
// of the same colour.
//
// Except on the handful of screens that *want* something behind the status
// bar on purpose — the listing/event/special detail pages' hero photo, which
// is supposed to run edge-to-edge the same way it does on the web. Painting
// cream over the top of that photo just chops it off, which is its own bug
// (and the exact opposite of what this component exists to prevent). Those
// screens call useSuppressStatusBarCover() while their hero is showing, and
// this renders nothing for as long as any screen is doing that.
//
// Renders nothing on the web: --safe-top resolves to 0px there, so an empty
// fixed strip would be harmless anyway, but there's no reason to mount it.
import { useSyncExternalStore } from "react";
import { isNativeApp } from "@/lib/nativeBridge";
import { isStatusBarCoverSuppressed, subscribeStatusBarCoverSuppressed } from "@/lib/statusBarCoverVisibility";

export default function StatusBarCover() {
  const suppressed = useSyncExternalStore(subscribeStatusBarCoverSuppressed, isStatusBarCoverSuppressed);

  if (!isNativeApp() || suppressed) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[100] pointer-events-none"
      style={{ height: "var(--safe-top)", backgroundColor: "#E6E0CC" }}
    />
  );
}
