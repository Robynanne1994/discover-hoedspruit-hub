import { useNavigate } from "react-router-dom";

export type HomeChip = "All" | "Eat" | "Stay" | "Do" | "Shop" | "Events" | "Specials";

const CHIPS: HomeChip[] = ["All", "Eat", "Stay", "Do", "Shop", "Events"];

const CHIP_HREFS: Record<HomeChip, string | null> = {
  All: null,
  Eat: "/category/c867119f-8ca9-45a7-870e-6671f028748c",
  Stay: "/category/cef1c5ad-b199-41c9-bc8a-5834703a953a",
  Do: "/category/4dc26115-569e-4af7-868a-9f783f8a38eb",
  Shop: "/category/7b335bd5-3ce9-4ecd-92bd-3735804402b8",
  Events: "/events",
  Specials: "/specials",
};

interface Props {
  active: HomeChip;
  onChange: (chip: HomeChip) => void;
}

const HomeCategoryChips = ({ active, onChange }: Props) => {
  const navigate = useNavigate();
  return (
    <div
      className="scrollbar-hide"
      style={{ overflowX: "auto", paddingLeft: 24 }}
    >
      <div style={{ display: "flex", gap: 8, paddingRight: 24 }}>
        {CHIPS.map((chip) => {
          const isActive = active === chip;
          return (
            <button
              key={chip}
              onClick={() => {
                const href = CHIP_HREFS[chip];
                if (href) {
                  navigate(href);
                } else {
                  onChange(chip);
                }
              }}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              style={{
                height: 40,
                padding: "0 22px",
                borderRadius: 999,
                background: isActive ? "#2A2A24" : "#EEE8DA",
                color: isActive ? "#EEE8DA" : "#2A2A24",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontWeight: 400,
                fontSize: 14,
                lineHeight: 1,
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "transform 150ms ease-out",
              }}
            >
              {chip}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HomeCategoryChips;
