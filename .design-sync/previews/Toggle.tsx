import { Toggle } from "vite_react_shadcn_ts";
import { Heart, Bold, Bell } from "lucide-react";

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: 24, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
    {children}
  </div>
);

export const States = () => (
  <Wrap>
    <Toggle aria-label="Off">Off</Toggle>
    <Toggle defaultPressed aria-label="Pressed">Saved</Toggle>
    <Toggle disabled aria-label="Disabled">Disabled</Toggle>
  </Wrap>
);

export const WithIcons = () => (
  <Wrap>
    <Toggle aria-label="Favourite"><Heart /></Toggle>
    <Toggle defaultPressed aria-label="Bold"><Bold /></Toggle>
    <Toggle variant="outline" aria-label="Notify"><Bell /> Notify</Toggle>
  </Wrap>
);

export const Outline = () => (
  <Wrap>
    <Toggle variant="outline">List view</Toggle>
    <Toggle variant="outline" defaultPressed>Map view</Toggle>
  </Wrap>
);
