import type { CapacitorConfig } from "@capacitor/cli";

// NOTE: appId must match the bundle id / application id you register with
// Apple (iOS) and Google (Android) and in Firebase. Change it here BEFORE the
// first `npx cap add ios` / `npx cap add android`.

// Google OAuth client ids come from the environment so no secret is committed.
// Set them in .env (VITE_GOOGLE_WEB_CLIENT_ID / VITE_GOOGLE_IOS_CLIENT_ID) — the
// same values src/lib/nativeAuth.ts reads at runtime and passes to
// `SocialLogin.initialize()` there. Missing values just leave native Google
// sign-in unconfigured; the build is unaffected. Unlike the plugin this
// replaced, @capgo/capacitor-social-login configures itself at runtime, so
// there is no `plugins.GoogleAuth` block here to keep in sync.

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
    StatusBar: {
      // Draw the web view under the status bar from launch (Android), so the
      // cream background reaches the top with no white band or flash. iOS does
      // the same via ios.contentInset:"never" + viewport-fit=cover.
      overlaysWebView: true,
      // "LIGHT" == dark glyphs, for our light background.
      style: "LIGHT",
      backgroundColor: "#E6E0CC",
    },
  },
};

export default config;
