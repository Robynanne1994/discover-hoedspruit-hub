import { FavouriteButton } from "vite_react_shadcn_ts";

export const OnCard = () => (
  <div style={{ padding: 24 }}>
    <div style={{ position: "relative", width: 220, height: 150, borderRadius: 16, overflow: "hidden",
      background: "linear-gradient(135deg,#8a7a4f,#3a3020)" }}>
      <FavouriteButton itemId="listing-1" itemType="listing" />
    </div>
  </div>
);
