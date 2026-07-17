import { Link } from "react-router-dom";
import {
  Siren,
  UtensilsCrossed,
  BedDouble,
  ShoppingBag,
  PartyPopper,
  Leaf,
  Compass,
} from "lucide-react";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const TILES = [
  { label: "Emergencies", icon: Siren, href: "/category/8d2d6a71-d5ee-4119-9fb4-dd24ff66a6d6" },
  { label: "Dine", icon: UtensilsCrossed, href: "/category/c867119f-8ca9-45a7-870e-6671f028748c" },
  { label: "Stay", icon: BedDouble, href: "/category/cef1c5ad-b199-41c9-bc8a-5834703a953a" },
  { label: "Shop", icon: ShoppingBag, href: "/category/7b335bd5-3ce9-4ecd-92bd-3735804402b8" },
  { label: "Party", icon: PartyPopper, href: "/category/2e2fe36b-a259-4487-837c-25b1ae84fef1" },
  { label: "Relax", icon: Leaf, href: "/category/7d504654-a8d8-49c1-8cb7-75d2939bc7b1" },
  { label: "Explore", icon: Compass, href: "/explore-listings" },
];

const HomeCategoryChips = () => {
  return (
    <div className="scrollbar-hide" style={{ overflowX: "auto", paddingLeft: 20 }}>
      <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>
      <div style={{ display: "flex", gap: 16, paddingRight: 20 }}>
        {TILES.map(({ label, icon: Icon, href }) => (
          <Link
            key={label}
            to={href}
            onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            style={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
              transition: "transform 150ms ease-out",
              width: 68,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={24} color="#1A1A1A" strokeWidth={1.4} />
            </div>
            <span
              style={{
                fontFamily: HN,
                fontSize: 12,
                color: "#2b2420",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomeCategoryChips;
