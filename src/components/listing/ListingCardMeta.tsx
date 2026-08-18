import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { getHoursSchedules, headlineSchedule, isAlwaysOpen, isOpenNow, opensAt, todayHours, type HoursMap } from "@/lib/openHours";
import { MUTED as TOKEN_MUTED, type as t } from "@/lib/type";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const INK = "#1A1A1A";
const MUTED = TOKEN_MUTED;
const BROWN = "#715A3D";
const SAGE = "#2b7f3f";
const CLAY = "#C0392B";

const to24h = (raw?: string | null) => {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d{1,2})[:.]?(\d{2})?/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const mm = m[2] ?? "00";
  if (Number.isNaN(h)) return null;
  return `${String(h).padStart(2, "0")}:${mm}`;
};

const closesAt = (hours: HoursMap | null | undefined) => {
  const v = todayHours(hours);
  if (!v) return null;
  const m = v.match(/[-–]\s*(\d{1,2}[:.]?\d{0,2})/);
  return m ? to24h(m[1]) : null;
};

// The listing columns the status bar reads. A listing that keeps two sets of
// hours — a kitchen and a bar that outlasts it — carries the extra ones in
// `additional_hours`, and the bar being open still counts as open.
export type ListingHoursSource = {
  opening_hours?: unknown;
  opening_hours_label?: unknown;
  additional_hours?: unknown;
};

// The open/closed footer bar, mirroring the saved cards on the profile page.
// Returns a bold prefix ("Open"/"Closed") plus a lighter detail ("Opens X"/"Closes X").
// When a listing keeps more than one schedule the prefix names the one being
// reported ("Bar Open"), so "Open" never quietly means a different counter.
export const listingStatus = (
  listing: ListingHoursSource | null | undefined
): { label: string; detail?: string; tone: string } => {
  const schedules = getHoursSchedules(listing);
  const schedule = headlineSchedule(schedules);
  if (!schedule) return { label: "Hours Unknown", tone: BROWN };
  const prefix = schedules.length > 1 ? `${schedule.label} ` : "";
  const hours = schedule.hours;
  if (isAlwaysOpen(todayHours(hours))) return { label: `${prefix}Always Open`, tone: SAGE };
  if (isOpenNow(hours)) {
    const until = closesAt(hours);
    return until
      ? { label: `${prefix}Open`, detail: `Closes ${until}`, tone: SAGE }
      : { label: `${prefix}Open Now`, tone: SAGE };
  }
  const opens = to24h(opensAt(hours));
  return opens
    ? { label: `${prefix}Closed`, detail: `Opens ${opens}`, tone: CLAY }
    : { label: `${prefix}Closed Now`, tone: CLAY };
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
        <span>{status.label}</span>
        {status.detail ? (
          <span style={{ fontWeight: 400 }}>· {status.detail}</span>
        ) : null}
      </div>
    </>
  );
};

export default ListingCardMeta;
