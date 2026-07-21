import { Input, Label } from "vite_react_shadcn_ts";

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 460 }}>
    {children}
  </div>
);

export const States = () => (
  <Wrap>
    <Input placeholder="Search lodges, restaurants, events…" type="search" />
    <Input defaultValue="Blyde River Canyon Lodge" />
    <Input placeholder="Sold out — bookings closed" disabled />
  </Wrap>
);

export const EmailSignup = () => (
  <Wrap>
    <Label htmlFor="signup-email">Get the Hoedspruit weekly</Label>
    <Input id="signup-email" type="email" placeholder="you@example.co.za" />
    <p style={{ margin: 0, fontSize: 13, opacity: 0.65 }}>
      Events, new listings and load-shedding updates, every Friday.
    </p>
  </Wrap>
);

export const BookingField = () => (
  <Wrap>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Label htmlFor="b-name">Full name</Label>
      <Input id="b-name" placeholder="Thandi Mokoena" />
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Label htmlFor="b-phone">Mobile number</Label>
      <Input id="b-phone" type="tel" defaultValue="082 471 3390" />
    </div>
  </Wrap>
);
