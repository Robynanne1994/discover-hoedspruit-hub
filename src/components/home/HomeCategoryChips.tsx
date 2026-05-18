import { Link } from "react-router-dom";
import { UtensilsCrossed, ShoppingBag, BedDouble, Mountain } from "lucide-react";

export type HomeChip = "All" | "Eat" | "Stay" | "Do" | "Shop" | "Events" | "Specials";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const TILES = [
  { label: "Eat", icon: UtensilsCrossed, href: "/category/c867119f-8ca9-45a7-870e-6671f028748c" },
  { label: "Shop", icon: ShoppingBag, href: "/category/7b335bd5-3ce9-4ecd-92bd-3735804402b8" },
  { label: "Stay", icon: BedDouble, href: "/category/cef1c5ad-b199-41c9-bc8a-5834703a953a" },
  { label: "Do", icon: Mountain, href: "/category/4dc26115-569e-4af7-868a-9f783f8a38eb" },
];

interface Props {
  active?: HomeChip;
  onChange?: (chip: HomeChip) => void;
}

const HomeCategoryChips = (_props: Props) => {
  return (
    <div style={{ padding: "0 20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
        {TILES.map(({ label, icon: Icon, href }) => (
          <Link
            key={label}
            to={href}
            onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: "16px 8px 12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              textDecoration: "none",
              transition: "transform 150ms ease-out",
            }}
          >
            <Icon size={26} color="#020202" strokeWidth={1.4} />
            <span style={{ fontFamily: HN, fontSize: 12, color: "#2b2420", letterSpacing: "0.01em" }}>
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomeCategoryChips;
