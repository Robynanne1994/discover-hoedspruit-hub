import type { CapacitorConfig } from "@capacitor/cli";

// NOTE: appId must match the bundle id / application id you register with
// Apple (iOS) and Google (Android) and in Firebase. Change it here BEFORE the
// first `npx cap add ios` / `npx cap add android`.
const config: CapacitorConfig = {
  appId: "za.co.hellohoedspruit.app",
  appName: "Hello Hoedspruit",
  webDir: "dist",
  // Warm cream behind the web view so no white ever flashes at the edges.
  backgroundColor: "#E6E0CC",
  ios: {
    // "never" stops WKWebView adding its own safe-area content inset on top of
    // ours. Combined with viewport-fit=cover in index.html the app renders
    // edge-to-edge and the layout handles the notch itself via the
    // --safe-top / --header-top CSS tokens in src/index.css.
    contentInset: "never",
    backgroundColor: "#E6E0CC",
  },
  android: {
    backgroundColor: "#E6E0CC",
  },
  plugins: {
    PushNotifications: {
      // Show the notification banner while the app is in the foreground too.
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
