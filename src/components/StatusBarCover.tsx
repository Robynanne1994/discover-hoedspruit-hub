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
// Renders nothing on the web: --safe-top resolves to 0px there, so an empty
// fixed strip would be harmless anyway, but there's no reason to mount it.
import { isNativeApp } from "@/lib/nativeBridge";

export default function StatusBarCover() {
  if (!isNativeApp()) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[100] pointer-events-none"
      style={{ height: "var(--safe-top)", backgroundColor: "#E6E0CC" }}
    />
  );
}
