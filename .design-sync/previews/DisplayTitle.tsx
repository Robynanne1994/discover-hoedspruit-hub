import { DisplayTitle } from "vite_react_shadcn_ts";

export const Headings = () => (
  <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
    <DisplayTitle item={{ title: "Blyde River Canyon Lodge" }} as="h2" />
    <DisplayTitle item={{ title: "moholoholo wildlife rehab", title_override: "Moholoholo Wildlife Rehab" }} as="h3" />
  </div>
);
