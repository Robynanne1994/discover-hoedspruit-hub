import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { listingCardHours } from "@/lib/listingCardHours";
import { MUTED as TOKEN_MUTED, type as t } from "@/lib/type";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const INK = "#1A1A1A";
const MUTED = TOKEN_MUTED;
const BROWN = "#715A3D";
const SAGE = "#2b7f3f";
const CLAY = "#C0392B";

// The status dot rides above the row's centre. Centring it on the line box
// instead leaves it under the middle of the capital letters, because the line
// box keeps descender space below the baseline — measured 1.7px low on the
// category cards, so it is lifted by that much.
const STATUS_DOT_LIFT = "translateY(-1.7px)";

// Cards use the first populated schedule, without its editor title.
export type ListingHoursSource = {
  opening_hours?: unknown;
  opening_hours_label?: unknown;
  additional_hours?: unknown;
};

// The next opening skips closed days and uses three-letter weekdays.
export const listingStatus = (
  listing: ListingHoursSource | null | undefined
): { label: string; detail?: string; tone: string } => {
  const status = listingCardHours(listing);
  return { label: status.label, detail: status.detail, tone: status.state === "open" ? SAGE : status.state === "closed" ? CLAY : BROWN };
};

interface Props {
  title: React.ReactNode;
  titleStyle: React.CSSProperties;
  titleProps?: Record<string, unknown>;
  eyebrow?: string | null;
  location?: string | null;
  // The listing row itself: the status bar needs every set of hours on it, not
  // just the first.
  listing: ListingHoursSource | null | undefined;
}

/**
 * Text block plus status bar for a listing card. The location gets two lines
 * only when the title fits on one, so cards never grow past four text lines.
 */
const ListingCardMeta = ({ title, titleStyle, titleProps, eyebrow, location, listing }: Props) => {
  const titleRef = useRef<HTMLSpanElement>(null);
  const [titleLines, setTitleLines] = useState(1);
  const status = listingStatus(listing);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const measure = () => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 1;
      setTitleLines(Math.max(1, Math.round(el.scrollHeight / lh)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [title]);

  const clamp = titleLines > 1 ? 1 : 2;

  // Category text may take a second line only when title and location each
  // used one, so the card stays at four text lines.
  const locRef = useRef<HTMLSpanElement>(null);
  const [locLines, setLocLines] = useState(1);
  useEffect(() => {
    const el = locRef.current;
    if (!el) { setLocLines(0); return; }
    const measure = () => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 1;
      setLocLines(Math.max(1, Math.round(el.scrollHeight / lh)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [location, clamp]);
  const eyebrowTwoLines = titleLines <= 1 && locLines <= 1;

  return (
    <>
      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <h3 {...titleProps} style={titleStyle}>
          <span
            ref={titleRef}
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </span>
        </h3>

        {eyebrow ? (
          <p
            style={{
              fontFamily: SANS,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: BROWN,
              margin: 0,
              lineHeight: 1.35,
              ...(eyebrowTwoLines
                ? { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }
                : { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }),
            }}
          >
            {eyebrow}
          </p>
        ) : null}

        {location ? (
          <div style={{ ...t.meta, fontFamily: SANS, color: MUTED, display: "flex", alignItems: "flex-start", gap: 4, minWidth: 0, lineHeight: 1.35 }}>
            <span style={{ height: "1.35em", display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
              <MapPin size={12} strokeWidth={1.6} color={MUTED} style={{ display: "block", transform: "translateY(-0.75px)" }} />
            </span>
            <span
              ref={locRef}
              style={{
                display: "-webkit-box",
                WebkitLineClamp: clamp,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                overflowWrap: clamp === 1 ? "normal" : "break-word",
                wordBreak: clamp === 1 ? "normal" : undefined,
              }}
            >
              {location}
            </span>
          </div>
        ) : null}
      </div>

      <div
        style={{
          marginTop: "auto",
          background: "#F5F0E8",
          borderTop: "1px solid rgba(26,26,26,0.06)",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          flexWrap: "nowrap",
          whiteSpace: "nowrap",
          overflow: "hidden",
          minWidth: 0,
          gap: 5,
          fontFamily: SANS,
          ...t.meta,
          fontWeight: 600,
          color: status.tone,
          lineHeight: 1.2,
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: 9999, background: status.tone, flexShrink: 0, transform: STATUS_DOT_LIFT }} />
        <span style={{ whiteSpace: "nowrap", flexShrink: 0 }}>{status.label}</span>
        {status.detail ? (
          <span title={status.detail} style={{ fontWeight: 400, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>· {status.detail.replace(/^(Opens|Closes) /, "")}</span>
        ) : null}
      </div>
    </>
  );
};

export default ListingCardMeta;
