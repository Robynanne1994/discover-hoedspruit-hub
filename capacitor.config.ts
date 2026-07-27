import type { CapacitorConfig } from "@capacitor/cli";

// NOTE: appId must match the bundle id / application id you register with
// Apple (iOS) and Google (Android) and in Firebase. Change it here BEFORE the
// first `npx cap add ios` / `npx cap add android`.
const config: CapacitorConfig = {
  appId: "za.co.hellohoedspruit.app",
  appName: "Hello Hoedspruit",
  webDir: "dist",
  ios: {
    contentInset: "always",
  },
  plugins: {
    PushNotifications: {
      // Show the notification banner while the app is in the foreground too.
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
