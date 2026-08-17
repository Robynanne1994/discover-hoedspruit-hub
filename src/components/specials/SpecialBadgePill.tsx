import { SPECIAL_CARD_CHROME } from "@/lib/cardChrome";
import { specialCard, type SpecialCardLike } from "@/lib/specialCard";

const BADGE = SPECIAL_CARD_CHROME.badge;
const SANS = BADGE.fontFamily;

// Red is the discount voice ("30% Off", "Save R50", "Buy 1 Get 1"); olive is the
// quieter one (day, season, "Special Offer"). Two tones, one rule, every surface.
const TONE_BG = {
  discount: BADGE.dealBackground,
  neutral: BADGE.quietBackground,
} as const;

// `sm` for the narrow cards (2-col grid, homepage rail), `md` for the featured
// hero. Nothing else varies — same wording, same colours, same shape.
// `sm` is the one the admin crop guide draws, so it comes from `cardChrome.ts`.
const SIZE = {
  sm: { fontSize: BADGE.fontSize, padding: `${BADGE.paddingY}px ${BADGE.paddingX}px` },
  md: { fontSize: 10, padding: "6px 12px" },
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
        color: BADGE.color,
        borderRadius: 999,
        fontFamily: SANS,
        fontWeight: BADGE.fontWeight,
        letterSpacing: BADGE.letterSpacing,
        textTransform: "uppercase",
        lineHeight: BADGE.lineHeight,
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
