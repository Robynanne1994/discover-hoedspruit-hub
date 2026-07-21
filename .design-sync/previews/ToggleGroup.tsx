import { ToggleGroup, ToggleGroupItem } from "vite_react_shadcn_ts";
import { List, Map, LayoutGrid, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: 24, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
    {children}
  </div>
);

export const ViewSwitcher = () => (
  <Wrap>
    <ToggleGroup type="single" defaultValue="list" variant="outline">
      <ToggleGroupItem value="list" aria-label="List"><List /> List</ToggleGroupItem>
      <ToggleGroupItem value="map" aria-label="Map"><Map /> Map</ToggleGroupItem>
      <ToggleGroupItem value="grid" aria-label="Grid"><LayoutGrid /> Grid</ToggleGroupItem>
    </ToggleGroup>
  </Wrap>
);

export const TextAlign = () => (
  <Wrap>
    <ToggleGroup type="multiple" defaultValue={["center"]} variant="outline">
      <ToggleGroupItem value="left" aria-label="Align left"><AlignLeft /></ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center"><AlignCenter /></ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right"><AlignRight /></ToggleGroupItem>
    </ToggleGroup>
  </Wrap>
);
