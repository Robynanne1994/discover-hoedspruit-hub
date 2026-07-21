import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
  Label, Checkbox, Slider, Button, Separator,
} from "vite_react_shadcn_ts";
import { SlidersHorizontal } from "lucide-react";

export const FiltersPanel = () => (
  <Sheet open modal={false}>
    <SheetContent side="right">
      <SheetHeader>
        <SheetTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SlidersHorizontal style={{ width: 18, height: 18 }} />
          Filter listings
        </SheetTitle>
        <SheetDescription>
          Narrow down places to stay, eat and explore around Hoedspruit.
        </SheetDescription>
      </SheetHeader>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Label>Category</Label>
          {["Safari lodges", "Farmers markets", "Restaurants", "Wildlife tours"].map((c, i) => (
            <div key={c} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Checkbox defaultChecked={i < 2} id={`cat-${i}`} />
              <Label htmlFor={`cat-${i}`} style={{ fontWeight: 400 }}>{c}</Label>
            </div>
          ))}
        </div>

        <Separator />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Label>Max distance from town (km)</Label>
          <Slider defaultValue={[45]} max={120} step={5} />
        </div>
      </div>

      <SheetFooter style={{ marginTop: 28 }}>
        <Button variant="outline">Reset</Button>
        <Button>Show 24 places</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
);
