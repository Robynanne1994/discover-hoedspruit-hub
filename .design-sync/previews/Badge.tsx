import { Badge } from "vite_react_shadcn_ts";

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: 24, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
    {children}
  </div>
);

export const Variants = () => (
  <Wrap>
    <Badge>Featured</Badge>
    <Badge variant="secondary">New</Badge>
    <Badge variant="destructive">Closed</Badge>
    <Badge variant="outline">Open now</Badge>
  </Wrap>
);

export const ListingTags = () => (
  <Wrap>
    <Badge>Safari Lodge</Badge>
    <Badge variant="secondary">Farmers Market</Badge>
    <Badge variant="outline">Pet friendly</Badge>
    <Badge variant="secondary">Load-shedding backup</Badge>
    <Badge variant="destructive">Fully booked</Badge>
  </Wrap>
);
