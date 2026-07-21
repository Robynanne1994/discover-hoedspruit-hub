import { Slider, Label } from "vite_react_shadcn_ts";

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, maxWidth: 460 }}>
    {children}
  </div>
);

export const MaxPrice = () => (
  <Wrap>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <Label>Max price per night</Label>
      <span style={{ fontSize: 14, fontWeight: 600 }}>R2 400</span>
    </div>
    <Slider defaultValue={[2400]} min={500} max={6000} step={100} />
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.6 }}>
      <span>R500</span>
      <span>R6 000</span>
    </div>
  </Wrap>
);

export const PriceRange = () => (
  <Wrap>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <Label>Price range</Label>
      <span style={{ fontSize: 14, fontWeight: 600 }}>R1 200 – R3 800</span>
    </div>
    <Slider defaultValue={[1200, 3800]} min={500} max={6000} step={100} />
  </Wrap>
);

export const DistanceFromTown = () => (
  <Wrap>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <Label>Distance from town centre</Label>
      <span style={{ fontSize: 14, fontWeight: 600 }}>15 km</span>
    </div>
    <Slider defaultValue={[15]} min={0} max={50} step={1} />
  </Wrap>
);
