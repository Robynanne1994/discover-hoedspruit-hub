import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { isAlwaysOpen, isOpenNow, opensAt, todayHours } from "@/lib/openHours";
import { MUTED as TOKEN_MUTED, type as t } from "@/lib/type";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const INK = "#1A1A1A";
const MUTED = TOKEN_MUTED;
const BROWN = "#715A3D";
const SAGE = "#2b7f3f";
const CLAY = "#C0392B";

const to12h = (raw?: string | null) => {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d{1,2})[:.]?(\d{2})?/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const mm = m[2] ?? "00";
  if (Number.isNaN(h)) return null;
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mm}${suffix}`;
};

const closesAt = (hours: Record<string, string> | null | undefined) => {
  const v = todayHours(hours);
  if (!v) return null;
  const m = v.match(/[-–]\s*(\d{1,2}[:.]?\d{0,2})/);
  return m ? to12h(m[1]) : null;
};

// The open/closed footer bar, mirroring the saved cards on the profile page.
export const listingStatus = (
  hours: Record<string, string> | null | undefined
): { text: string; tone: string } => {
  const hasHours = !!hours && Object.values(hours).some((v) => typeof v === "string" && v.trim() !== "");
  if (!hasHours) return { text: "Hours Unknown", tone: BROWN };
  if (isAlwaysOpen(todayHours(hours))) return { text: "Always Open", tone: SAGE };
  if (isOpenNow(hours)) {
    const until = closesAt(hours);
    return { text: until ? `Open · Closes ${until}` : "Open Now", tone: SAGE };
  }
  const opens = to12h(opensAt(hours));
  return { text: opens ? `Closed · Opens ${opens}` : "Closed Now", tone: CLAY };
};

interface Props {
  title: React.ReactNode;
  titleStyle: React.CSSProperties;
  titleProps?: Record<string, unknown>;
  eyebrow?: string | null;
  location?: string | null;
  hours: Record<string, string> | null | undefined;
}

/**
 * Text block plus status bar for a listing card. The location gets two lines
 * only when the title fits on one, so cards never grow past four text lines.
 */
const ListingCardMeta = ({ title, titleStyle, titleProps, eyebrow, location, hours }: Props) => {
  const titleRef = useRef<HTMLSpanElement>(null);
  const [titleLines, setTitleLines] = useState(1);
  const status = listingStatus(hours);

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
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {eyebrow}
          </p>
        ) : null}

        {location ? (
          <div style={{ ...t.meta, fontFamily: SANS, color: MUTED, display: "flex", alignItems: "center", gap: 4, minWidth: 0, lineHeight: 1.35 }}>
            <MapPin size={12} strokeWidth={1.6} color={MUTED} style={{ flexShrink: 0 }} />
            <span
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
          gap: 5,
          fontFamily: SANS,
          ...t.meta,
          fontWeight: 600,
          color: status.tone,
          lineHeight: 1.2,
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: 9999, background: status.tone, flexShrink: 0 }} />
        {status.text}
      </div>
    </>
  );
};

export default ListingCardMeta;
