export type HomeChip = "All" | "Eat" | "Stay" | "Do" | "Shop" | "Events" | "Specials";

const CHIPS: HomeChip[] = ["All", "Eat", "Stay", "Do", "Shop", "Events"];

interface Props {
  active: HomeChip;
  onChange: (chip: HomeChip) => void;
}

const HomeCategoryChips = ({ active, onChange }: Props) => {
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
              onClick={() => onChange(chip)}
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
