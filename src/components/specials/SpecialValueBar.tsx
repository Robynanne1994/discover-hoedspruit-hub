import { specialCard, type SpecialCardLike } from "@/lib/specialCard";
import { MUTED } from "@/lib/type";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const BAR = {
  bg: "#F7F2E6",
  border: "#EEE7D4",
  ink: "#1A1A1A",
  muted: MUTED,
  strike: "#9C9387",
  accent: "#B4522E",
};

// The offer gets its own full-bleed strip at the foot of the card. Money left,
// time right — so scrolling a grid means reading one column of value lines.
//
// `detail`: "compact" for the narrow cards — the 2-col grid and the homepage
// rail — where there is no room for the savings accent next to a strikethrough
// (the strike already says it); "full" for the featured hero, which is wide
// enough for the whole ledger.
const SpecialValueBar = ({
  special,
  detail = "compact",
  padding = "9px 11px",
}: {
  special: SpecialCardLike;
  detail?: "compact" | "full";
  padding?: string;
}) => {
  const full = detail === "full";
  const { value, meta, saving: savingAccent } = specialCard(special, { compact: !full });
  const saving = full ? savingAccent : null;
  const priceSize = full ? 15 : 13.5;
  const metaSize = full ? 12 : 11;
  // A fixed line box (inherited as a length by every span in the bar) means the
  // strip is the same height whatever mix of price / deal / schedule text a
  // given special happens to have — so cards line up beside each other.
  const lineBox = full ? 20 : 17;

  // A 170px card can't hold an offer sentence and a schedule at once, so the
  // narrow bar ranks them: the offer, then the schedule. The countdown takes no
  // part in this ranking — it has its own corner on the picture, so the
  // validity dates still show here beside it whenever there is room.
  const showMeta = !!meta.text && (full || value.kind === "price");

  // Price, "was" price and a validity date is one item too many on a narrow
  // card. When the validity line is coming through on the right, the
  // crossed-out "was" price stands down and the card says just "now" and
  // "until when". The wide featured card carries the whole ledger, so it keeps
  // the strike whatever the date line says.
  const showOriginal =
    value.kind === "price" && !!value.original && (full || !showMeta);

  return (
    <div
      style={{
        display: "flex",
        // Centre, not baseline, at this level: both sides are fixed-height line
        // boxes, so centring keeps the strip exactly one line tall no matter
        // which font sizes it happens to contain. The money group below still
        // aligns its own parts on the baseline.
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        padding,
        background: BAR.bg,
        borderTop: `1px solid ${BAR.border}`,
        lineHeight: `${lineBox}px`,
        flexShrink: 0,
      }}
    >
      {/* Left — the money. An empty left slot keeps the same card height as
          its neighbours via the fixed line box; the validity line now lives on
          the right. A basis of `auto` matters: with a basis of 0 the money
          gets no width of its own and a long schedule on the right prints
          straight over it. */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 5,
          minWidth: 0,
          flexGrow: 1,
          flexBasis: "auto",
          // A price is short and must stay whole; a written offer is the one
          // that gives way when the two sides can't both fit.
          flexShrink: value.kind === "price" ? 0 : 1,
          height: lineBox,
        }}
      >
        {value.kind === "price" && (
          <>
            <span
              style={{
                fontFamily: SANS,
                fontSize: priceSize,
                fontWeight: 700,
                color: BAR.ink,
                letterSpacing: "-0.2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
              }}
            >
              {value.price}
            </span>
            {showOriginal && (
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: metaSize,
                  color: BAR.strike,
                  textDecoration: "line-through",
                  whiteSpace: "nowrap",
                }}
              >
                {value.original}
              </span>
            )}
            {/* The note is the first thing to go — it competes with both the
                strikethrough and the schedule on a narrow card. */}
            {value.note && !value.original && full && (
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: metaSize,
                  color: BAR.muted,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  minWidth: 0,
                }}
              >
                {value.note}
              </span>
            )}
            {saving && (
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: metaSize,
                  fontWeight: 700,
                  color: BAR.accent,
                  whiteSpace: "nowrap",
                }}
              >
                {saving}
              </span>
            )}
          </>
        )}

        {value.kind === "deal" && (
          <span
            style={{
              fontFamily: SANS,
              fontSize: full ? 14 : 12,
              fontWeight: 700,
              color: BAR.accent,
              letterSpacing: "-0.1px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {value.text}
          </span>
        )}
      {/* The left-slot fallback: calm date text ("Ends 12 Aug") on a money-less
          special still reads from the left as before. The urgent countdown never
          appears in the bar — it is the tab on the picture, see
          SpecialCountdownTag. */}
      {value.kind === "none" && !!meta.text && (
          <span
            style={{
              fontFamily: SANS,
              fontSize: full ? 13 : 12,
              fontWeight: 400,
              color: BAR.muted,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {meta.text}
          </span>
        )}
      </div>

      {/* Right — the schedule. Schedules are free text ("Wednesday & Thursday
          Specials"), so this side truncates rather than pushing itself over the
          money. Red is gone from this slot: the countdown has its own tab on
          the picture, so what reads from here is only ever the business's calm
          wording. */}
      {value.kind !== "none" && showMeta && (
        <span
          style={{
            fontFamily: SANS,
            fontSize: metaSize,
            fontWeight: 400,
            color: BAR.muted,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
            flexShrink: 1,
            textAlign: "right",
            height: lineBox,
          }}
        >
          {meta.text}
        </span>
      )}
    </div>
  );
};

export default SpecialValueBar;
