import { Link } from "react-router-dom";
import { UtensilsCrossed, ShoppingBag, BedDouble, Mountain, Siren, PartyPopper, GraduationCap, Leaf, Sparkles, Stethoscope } from "lucide-react";

export type HomeChip = "All" | "Eat" | "Stay" | "Do" | "Shop" | "Events" | "Specials";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const TILES = [
  { label: "Emergencies", icon: Siren, href: "/category/8d2d6a71-d5ee-4119-9fb4-dd24ff66a6d6" },
  { label: "Eat", icon: UtensilsCrossed, href: "/category/c867119f-8ca9-45a7-870e-6671f028748c" },
  { label: "Shop", icon: ShoppingBag, href: "/category/7b335bd5-3ce9-4ecd-92bd-3735804402b8" },
  { label: "Stay", icon: BedDouble, href: "/category/cef1c5ad-b199-41c9-bc8a-5834703a953a" },
  { label: "Do", icon: Mountain, href: "/category/4dc26115-569e-4af7-868a-9f783f8a38eb" },
  { label: "Party", icon: PartyPopper, href: "/category/2e2fe36b-a259-4487-837c-25b1ae84fef1" },
  { label: "Learn", icon: GraduationCap, href: "/category/1383f76a-9f87-45e0-9a04-341da135bd72" },
  { label: "Unwind", icon: Leaf, href: "/category/7d504654-a8d8-49c1-8cb7-75d2939bc7b1" },
  { label: "Pamper", icon: Sparkles, href: "/category/7d504654-a8d8-49c1-8cb7-75d2939bc7b1" },
  { label: "Medical", icon: Stethoscope, href: "/category/21a5617a-1ef6-4697-8853-774d00f17e96" },
];

interface Props {
  active?: HomeChip;
  onChange?: (chip: HomeChip) => void;
}

const HomeCategoryChips = (_props: Props) => {
  // Width so that exactly 4 tiles fit between the 20px page padding with 4px gaps,
  // matching the previous grid layout. Remaining tiles overflow horizontally.
  const tileWidth = `calc((100vw - 40px - 12px) / 4)`;

  return (
    <div className="scrollbar-hide" style={{ overflowX: "auto", paddingLeft: 20 }}>
      <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>
      <div style={{ display: "flex", gap: 4, paddingRight: 20 }}>
        {TILES.map(({ label, icon: Icon, href }) => (
          <Link
            key={label}
            to={href}
            onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            style={{
              flexShrink: 0,
              width: tileWidth,
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
