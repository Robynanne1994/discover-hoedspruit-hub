import { SPECIAL_CARD_CHROME } from "@/lib/cardChrome";
import { type SpecialCardLike } from "@/lib/specialCard";
import { countdownLabel, isEndingSoon } from "@/lib/specialValue";

const C = SPECIAL_CARD_CHROME.countdown;

/**
 * The urgency tab, cut into the bottom-right corner of a specials card's
 * picture.
 *
 * It used to sit at the right end of the value bar, which meant a card with
 * nothing else on that line pushed the countdown to the left of the strip while
 * every other card kept it right. On the picture it has one corner of its own,
 * so "7 days left" always reads from the same place whatever else the card
 * holds.
 *
 * Only the countdown lives here. Prices, written offers and the business's own
 * schedule wording stay in the value bar exactly where they were.
 *
 * The tag is `position: absolute`, so it belongs inside the card's picture
 * wrapper — the element that carries `position: relative` and ends where the
 * photo ends.
 */
const SpecialCountdownTag = ({ special }: { special: SpecialCardLike }) => {
  if (!isEndingSoon(special)) return null;

  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        bottom: 0,
        background: C.background,
        borderTopLeftRadius: C.radius,
        padding: `${C.paddingY}px ${C.paddingX}px`,
        fontFamily: C.fontFamily,
        fontSize: C.fontSize,
        fontWeight: C.fontWeight,
        lineHeight: C.lineHeight,
        letterSpacing: C.letterSpacing,
        color: C.color,
        whiteSpace: "nowrap",
      }}
    >
      {countdownLabel(special)}
    </div>
  );
};

/**
 * How much room the tab takes along the bottom edge of the picture, or 0 when
 * this special isn't counting down.
 *
 * The wording is always short ("Last day", "7 days left"), so an estimate from
 * the character count is enough — it only has to keep the featured hero's
 * headline from running underneath the tab.
 */
export const countdownTagWidth = (special: SpecialCardLike): number => {
  if (!isEndingSoon(special)) return 0;
  return Math.round(countdownLabel(special).length * C.charWidth) + C.paddingX * 2;
};

export default SpecialCountdownTag;
