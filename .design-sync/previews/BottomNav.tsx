import { BottomNav } from "vite_react_shadcn_ts";

// BottomNav is position:fixed. The transform creates a containing block so it
// anchors to the bottom of this framed area instead of the page viewport.
export const AppNav = () => (
  <div style={{ position: "relative", transform: "translateZ(0)", height: 300, width: "100%", maxWidth: 480, margin: "0 auto", background: "#EDE6D6" }}>
    <div style={{ padding: 20, color: "#6B6A5E", fontSize: 13 }}>App screen content…</div>
    <BottomNav />
  </div>
);
