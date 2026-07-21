import { PrimaryButton } from "vite_react_shadcn_ts";
import { MapPin, CalendarCheck, Navigation, ArrowRight } from "lucide-react";

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", padding: 24 }}>
    {children}
  </div>
);

export const Default = () => (
  <Row>
    <PrimaryButton>Book a stay</PrimaryButton>
    <PrimaryButton>Get directions</PrimaryButton>
    <PrimaryButton disabled>Sold out</PrimaryButton>
  </Row>
);

export const WithIcons = () => (
  <Row>
    <PrimaryButton leftIcon={<CalendarCheck size={18} strokeWidth={1.8} />}>
      Book a stay
    </PrimaryButton>
    <PrimaryButton leftIcon={<Navigation size={18} strokeWidth={1.8} />}>
      Get directions
    </PrimaryButton>
    <PrimaryButton rightIcon={<ArrowRight size={18} strokeWidth={1.8} />}>
      Explore lodges
    </PrimaryButton>
  </Row>
);

export const FullWidth = () => (
  <div style={{ padding: 24, maxWidth: 360 }}>
    <PrimaryButton fullWidth leftIcon={<MapPin size={18} strokeWidth={1.8} />}>
      View on the map
    </PrimaryButton>
  </div>
);

export const AsLink = () => (
  <Row>
    <PrimaryButton as="a" href="#" rightIcon={<ArrowRight size={18} strokeWidth={1.8} />}>
      Plan your visit
    </PrimaryButton>
  </Row>
);
