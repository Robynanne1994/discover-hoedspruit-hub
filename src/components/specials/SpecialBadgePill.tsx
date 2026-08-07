import { specialCard, type SpecialCardLike } from "@/lib/specialCard";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// Red is the discount voice ("30% Off", "Save R50", "Buy 1 Get 1"); olive is the
// quieter one (day, season, "Special Offer"). Two tones, one rule, every surface.
const TONE_BG = {
  discount: "#C0392B",
  neutral: "#4F4A38",
} as const;

// `sm` for the narrow cards (2-col grid, homepage rail), `md` for the featured
// hero. Nothing else varies — same wording, same colours, same shape.
const SIZE = {
  sm: { fontSize: 9.5, padding: "4px 9px" },
  md: { fontSize: 10.5, padding: "6px 12px" },
} as const;

const SpecialBadgePill = ({
  special,
  size = "sm",
  style,
}: {
  special: SpecialCardLike;
  size?: "sm" | "md";
  style?: React.CSSProperties;
}) => {
  const { badge } = specialCard(special);
  if (!badge.text) return null;

  return (
    <span
      style={{
        display: "inline-block",
        maxWidth: "100%",
        background: TONE_BG[badge.tone],
        color: "#FFFFFF",
        borderRadius: 999,
        fontFamily: SANS,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        lineHeight: 1.1,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        ...SIZE[size],
        ...style,
      }}
    >
      {badge.text}
    </span>
  );
};

export default SpecialBadgePill;
