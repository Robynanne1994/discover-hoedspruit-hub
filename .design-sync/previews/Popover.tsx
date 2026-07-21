import {
  Popover, PopoverTrigger, PopoverContent, Button, Label, Separator,
} from "vite_react_shadcn_ts";
import { SlidersHorizontal } from "lucide-react";

export const FilterPanel = () => (
  <div style={{ padding: "24px 24px 220px", display: "flex", justifyContent: "center" }}>
    <Popover open>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <SlidersHorizontal size={16} style={{ marginRight: 8 }} /> Filters
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Refine places</h4>
            <p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.65 }}>
              Around Hoedspruit
            </p>
          </div>
          <Separator />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
            <Label style={{ display: "flex", justifyContent: "space-between" }}>
              Safari lodges <input type="checkbox" defaultChecked />
            </Label>
            <Label style={{ display: "flex", justifyContent: "space-between" }}>
              Farmers markets <input type="checkbox" />
            </Label>
            <Label style={{ display: "flex", justifyContent: "space-between" }}>
              Open now <input type="checkbox" defaultChecked />
            </Label>
          </div>
          <Button size="sm">Apply filters</Button>
        </div>
      </PopoverContent>
    </Popover>
  </div>
);
