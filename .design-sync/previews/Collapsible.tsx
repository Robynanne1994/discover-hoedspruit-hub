import {
  Collapsible, CollapsibleTrigger, CollapsibleContent, Button,
} from "vite_react_shadcn_ts";
import { ChevronsUpDown } from "lucide-react";

export const LoadSheddingSchedule = () => (
  <div style={{ padding: 24, maxWidth: 420 }}>
    <Collapsible defaultOpen>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
          Hoedspruit — Stage 4 today
        </h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" style={{ width: 36, padding: 0 }}>
            <ChevronsUpDown size={16} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 14, opacity: 0.75 }}>
        Next slot: 16:00 – 18:30
      </p>
      <CollapsibleContent>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>06:00 – 08:30</span><span style={{ opacity: 0.6 }}>Power off</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>14:00 – 16:30</span><span style={{ opacity: 0.6 }}>Power off</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>22:00 – 00:30</span><span style={{ opacity: 0.6 }}>Power off</span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  </div>
);
