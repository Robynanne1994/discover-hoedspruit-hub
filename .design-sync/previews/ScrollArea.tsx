import { ScrollArea } from "vite_react_shadcn_ts";

const categories = [
  "Safari Lodges",
  "Guesthouses & B&Bs",
  "Self-catering Cottages",
  "Restaurants & Cafés",
  "Farm Stalls & Markets",
  "Wildlife & Conservation",
  "Game Drives & Safaris",
  "Blyde River Canyon Tours",
  "Hiking & Trails",
  "Hot-air Balloon Flights",
  "Spas & Wellness",
  "Shops & Boutiques",
  "Art & Craft Studios",
  "Schools & Education",
  "Medical & Emergency",
  "Load-shedding Info",
];

export const CategoryList = () => (
  <div style={{ padding: 24, maxWidth: 340 }}>
    <ScrollArea
      style={{ height: 200 }}
      className="rounded-xl border border-[#E7DFCD] bg-[#FBF7EE]"
    >
      <div style={{ padding: "8px 4px" }}>
        <p
          style={{
            margin: "4px 12px 8px",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            color: "#8A8271",
          }}
        >
          Browse categories
        </p>
        {categories.map((c) => (
          <div
            key={c}
            style={{
              padding: "10px 12px",
              fontSize: 14,
              color: "#3a332c",
              borderRadius: 8,
            }}
          >
            {c}
          </div>
        ))}
      </div>
    </ScrollArea>
  </div>
);

const businesses = [
  ["Blyde River Canyon Lodge", "Lodges"],
  ["Mad Dogz Café", "Restaurants"],
  ["Hoedspruit Farmers Market", "Markets"],
  ["Moholoholo Rehab Centre", "Wildlife"],
  ["Kamogelo Tourism Centre", "Shopping"],
  ["The Hat & Creek", "Restaurants"],
  ["Zandspruit Bush & Aero", "Lodges"],
  ["Hoedspruit Reptile Centre", "Attractions"],
  ["Wild Olive Deli", "Cafés"],
  ["Otters' Den Bush Camp", "Lodges"],
];

export const BusinessList = () => (
  <div style={{ padding: 24, maxWidth: 360 }}>
    <ScrollArea
      style={{ height: 200 }}
      className="rounded-xl border border-[#E7DFCD] bg-white"
    >
      <div style={{ padding: 4 }}>
        {businesses.map(([name, cat]) => (
          <div
            key={name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 14px",
              borderBottom: "1px solid #F0EADC",
              fontSize: 14,
            }}
          >
            <span style={{ color: "#2b2420", fontWeight: 500 }}>{name}</span>
            <span style={{ color: "#8A8271", fontSize: 12 }}>{cat}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  </div>
);
