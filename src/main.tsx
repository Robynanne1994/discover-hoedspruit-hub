import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initNativeStatusBar } from "./lib/nativeStatusBar";

// Push the status bar edge-to-edge as early as possible on the native app so the
// cream background reaches the top of the screen. No-op in a browser.
void initNativeStatusBar();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
