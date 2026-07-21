import { Label, Input, Checkbox } from "vite_react_shadcn_ts";

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 460 }}>
    {children}
  </div>
);

export const WithInput = () => (
  <Wrap>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Label htmlFor="l-lodge">Lodge name</Label>
      <Input id="l-lodge" placeholder="e.g. Blyde River Canyon Lodge" />
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Label htmlFor="l-email">Contact email</Label>
      <Input id="l-email" type="email" defaultValue="bookings@blydelodge.co.za" />
    </div>
  </Wrap>
);

export const WithCheckbox = () => (
  <Wrap>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Checkbox id="l-terms" defaultChecked />
      <Label htmlFor="l-terms">I accept the booking terms</Label>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Checkbox id="l-whatsapp" />
      <Label htmlFor="l-whatsapp">Contact me on WhatsApp</Label>
    </div>
  </Wrap>
);
