import { Separator } from "vite_react_shadcn_ts";

export const Horizontal = () => (
  <div style={{ padding: 24, width: 320 }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 15, fontWeight: 600 }}>Blyde River Canyon</div>
      <div style={{ fontSize: 13, opacity: 0.7 }}>Panorama Route, Limpopo</div>
    </div>
    <Separator style={{ margin: "16px 0" }} />
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 15, fontWeight: 600 }}>Opening hours</div>
      <div style={{ fontSize: 13, opacity: 0.7 }}>Daily, 06:00 - 18:00</div>
    </div>
    <Separator style={{ margin: "16px 0" }} />
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 15, fontWeight: 600 }}>Entrance</div>
      <div style={{ fontSize: 13, opacity: 0.7 }}>R80 adults, R40 children</div>
    </div>
  </div>
);

export const Vertical = () => (
  <div style={{ padding: 24 }}>
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems: "center",
        height: 28,
        fontSize: 14,
        padding: "0 16px",
        background: "#fbf8f1",
        border: "1px solid #dcd4c0",
        borderRadius: 9999,
        width: "fit-content",
      }}
    >
      <span>Safari</span>
      <Separator orientation="vertical" style={{ background: "#b8ab92" }} />
      <span>Dining</span>
      <Separator orientation="vertical" style={{ background: "#b8ab92" }} />
      <span>Markets</span>
      <Separator orientation="vertical" style={{ background: "#b8ab92" }} />
      <span>Events</span>
    </div>
  </div>
);
