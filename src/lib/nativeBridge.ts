// Runtime access to the Capacitor native bridge.
//
// The Capacitor runtime injects `window.Capacitor` inside the native webview.
// Reading it off the window like this means any module that only needs to know
// "am I running inside the app?" can ask without importing @capacitor/core, so
// the web bundle never pulls the native runtime into its critical path.

interface CapacitorBridge {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

function getCapacitor(): CapacitorBridge | null {
  const cap =
    typeof window !== "undefined"
      ? (window as unknown as { Capacitor?: CapacitorBridge }).Capacitor
      : undefined;
  return cap && typeof cap.isNativePlatform === "function" ? cap : null;
}

/** True only inside the iOS/Android app shell — false in every browser. */
export function isNativeApp(): boolean {
  return getCapacitor()?.isNativePlatform?.() === true;
}

/** "ios" | "android" | "web" natively; "unknown" when there is no bridge. */
export function nativePlatform(): string {
  return getCapacitor()?.getPlatform?.() ?? "unknown";
}
