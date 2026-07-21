import {
  ResizablePanelGroup, ResizablePanel, ResizableHandle, Badge,
} from "vite_react_shadcn_ts";
import { MapPin, Star, Clock } from "lucide-react";

export const MapAndDetails = () => (
  <div style={{ height: 360, width: "100%", padding: 16 }}>
    <ResizablePanelGroup
      direction="horizontal"
      style={{ height: "100%", width: "100%", borderRadius: 12, border: "1px solid hsl(var(--border))" }}
    >
      <ResizablePanel defaultSize={45}>
        <div style={{ height: "100%", background: "linear-gradient(135deg, hsl(90 18% 60%), hsl(28 35% 70%))", position: "relative" }}>
          <div style={{ position: "absolute", top: 12, left: 12, padding: "4px 10px", borderRadius: 999, background: "hsl(var(--background))", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
            <MapPin style={{ width: 14, height: 14 }} /> 24 places nearby
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={55}>
        <div style={{ height: "100%", padding: 20, display: "flex", flexDirection: "column", gap: 12, overflow: "auto" }}>
          <Badge variant="secondary" style={{ alignSelf: "flex-start" }}>Safari lodge</Badge>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Blyde River Canyon Lodge</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, opacity: 0.8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Star style={{ width: 14, height: 14, fill: "currentColor" }} /> 4.9 (312)
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Clock style={{ width: 14, height: 14 }} /> Open until 22:00
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, opacity: 0.85 }}>
            Riverside suites on the edge of the canyon, with guided sunrise game
            drives and a farm-to-table kitchen sourcing from local Hoedspruit growers.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, opacity: 0.7, marginTop: "auto" }}>
            <MapPin style={{ width: 14, height: 14 }} /> R14, Kampersrus, Limpopo
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
);
