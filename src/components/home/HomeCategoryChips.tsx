const SANS = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";

export type HomeChip = "All" | "Eat" | "Stay" | "Do" | "Shop" | "Events" | "Specials";

const CHIPS: HomeChip[] = ["All", "Eat", "Stay", "Do", "Shop", "Events", "Specials"];

interface Props {
  active: HomeChip;
  onChange: (chip: HomeChip) => void;
}

const HomeCategoryChips = ({ active, onChange }: Props) => {
  return (
    <div
      className="scrollbar-hide"
      style={{ overflowX: "auto", paddingLeft: 24, marginRight: 0 }}
    >
      <div style={{ display: "flex", gap: 8, paddingRight: 24 }}>
        {CHIPS.map((chip) => {
          const isActive = active === chip;
          return (
            <button
              key={chip}
              onClick={() => onChange(chip)}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                background: isActive ? "#2E241C" : "#EEE8DA",
                color: isActive ? "#EEE8DA" : "#2A2A24",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
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
