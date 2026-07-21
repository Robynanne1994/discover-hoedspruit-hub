import {
  HoverCard, HoverCardTrigger, HoverCardContent, Button,
} from "vite_react_shadcn_ts";
import { Clock, MapPin } from "lucide-react";

export const BusinessProfile = () => (
  <div style={{ padding: "90px 24px 24px", display: "flex", justifyContent: "center" }}>
    <HoverCard open>
      <HoverCardTrigger asChild>
        <Button variant="link" style={{ padding: 0, fontSize: 15 }}>
          Kudu &amp; Co. Coffee Roastery
        </Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
              Kudu &amp; Co. Coffee Roastery
            </h4>
            <p style={{ margin: "2px 0 0", fontSize: 13, opacity: 0.65 }}>
              Café &amp; Roastery
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <MapPin size={14} /> Main Street, Hoedspruit
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <Clock size={14} /> Open today · 06:30 – 16:00
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  </div>
);
