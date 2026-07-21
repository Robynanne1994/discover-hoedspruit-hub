import { Button } from "vite_react_shadcn_ts";
import { MapPin, Heart, Share2 } from "lucide-react";

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", padding: 24 }}>
    {children}
  </div>
);

export const Variants = () => (
  <Row>
    <Button>Book a stay</Button>
    <Button variant="secondary">View details</Button>
    <Button variant="outline">Filter</Button>
    <Button variant="ghost">Skip</Button>
    <Button variant="link">Read more</Button>
    <Button variant="destructive">Remove</Button>
  </Row>
);

export const Sizes = () => (
  <Row>
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
    <Button size="icon" aria-label="Save"><Heart /></Button>
  </Row>
);

export const WithIcon = () => (
  <Row>
    <Button><MapPin /> Get directions</Button>
    <Button variant="secondary"><Share2 /> Share</Button>
  </Row>
);

export const Disabled = () => (
  <Row>
    <Button disabled>Sold out</Button>
    <Button variant="secondary" disabled>Unavailable</Button>
  </Row>
);
