import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Facebook, Globe, Heart, Instagram, MapPin, MessageCircle, Store } from "lucide-react";
import { isAlwaysOpen, isOpenNow, opensAt, todayHours } from "@/lib/openHours";
import { specialCard } from "@/lib/specialCard";
import { countdownLabel, isEndingSoon } from "@/lib/specialValue";
import { getNextOccurrence } from "@/lib/eventSchedule";
import { MUTED as TOKEN_MUTED, type as t } from "@/lib/type";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const INK = "#1A1A1A";
const META = "#2b2420";
const MUTED = TOKEN_MUTED;
const BROWN = "#715A3D";
const HEART = "#5b4632";
const SAGE = "#6B7C5C";
const CLAY = "#C0392B";
const OLIVE = "#4F4A38";
const IMAGE_BG = "#F4EFE3";
const MONO = "#A79E88";

const CHIP_BG = "rgba(255,255,255,0.94)";
const CHIP_SHADOW = "0 1px 4px rgba(0,5,5,0.14)";
// Inset from the image edge for the floating pills. The top-left type capsule
// and the bottom-left rating/deal pills all share this same inset so the
// padding above and below the image stays visually equal.
const PILL_INSET = 8;
// The heart button's 30px circle starts 4px from the image top, so the type
// capsule sits at the same 4px to line the two tops up.
const PILL_TOP = 4;
const STAR = "#E9B417";

const titleCase = (s?: string | null) => {
  if (!s) return "";
  return s.toLowerCase().replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, (_m, sep, ch) => sep + ch.toUpperCase());
};

const TYPE_LABEL: Record<string, string> = {
  listing: "Listing",
  event: "Event",
  special: "Special",
  resource: "Local Channel",
};

const PLATFORM_ICON: Record<string, typeof Globe> = {
  facebook: Facebook,
  instagram: Instagram,
  whatsapp: MessageCircle,
  websites: Globe,
  website: Globe,
};

// 24h "18:00" or "6:00" -> "6:00 PM"
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

const DAY = 24 * 60 * 60 * 1000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const daysAway = (iso?: string | null) => {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  const t = startOfDay(parsed);
  return Math.round((t - startOfDay(new Date())) / DAY);
};
const fmt = (iso: string | null | undefined, opts: Intl.DateTimeFormatOptions) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", opts);
};
const weekdayDate = (iso?: string | null) => fmt(iso, { weekday: "short", day: "numeric", month: "short" });
const weekday = (iso?: string | null) => fmt(iso, { weekday: "long" });
const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;


type CardType = "listing" | "event" | "special" | "resource";

type Meta = {
  icon?: typeof MapPin;
  /** Rendered before the text without an icon — used for the rating star. */
  lead?: string;
  text: string;
  /** Max lines before truncating with an ellipsis. Defaults to 2. */
  clamp?: number;
};

const buildContent = (it: any, type: CardType) => {
  const lines: (Meta | null)[] = [];
  let status: { items: { text: string; tone: string }[] } | null = null;
  // "deal" is the loud discount voice, "quiet" the olive one (day/season
  // labels), "ended" the greyed-out chip. Tones match SpecialBadgePill.
  let badge: { text: string; tone: "deal" | "quiet" | "ended" } | null = null;
  let ratingChip: string | null = null;

  if (type === "listing") {
    const rating = it.google_rating ? Number(it.google_rating).toFixed(1).replace(/\.0$/, "") : null;
    const reviews = it.google_reviews_count ? ` (${it.google_reviews_count})` : "";
    const category = it.categories?.title ? titleCase(it.categories.title) : null;
    if (rating) ratingChip = `${rating}${reviews}`;
    lines.push(category ? { text: category } : null);
    // Location clamp is decided at render time from the measured title height:
    // one-line titles leave room for two lines of location, two-line titles do not.
    lines.push(it.location ? { icon: MapPin, text: it.location } : null);


    const hours = it.opening_hours as Record<string, string> | null | undefined;
    const hasHours = !!hours && Object.values(hours).some((v) => typeof v === "string" && v.trim() !== "");
    if (hasHours) {
      if (isAlwaysOpen(todayHours(hours!))) {
        status = { items: [{ text: "Always Open", tone: SAGE }] };
      } else if (isOpenNow(hours!)) {
        const until = closesAt(hours!);
        status = { items: [{ text: until ? `Open Until ${until}` : "Open Now", tone: SAGE }] };
      } else {
        const opens = to12h(opensAt(hours!));
        status = { items: [{ text: opens ? `Closed · Opens ${opens}` : "Closed Now", tone: CLAY }] };
      }
    }

  }

  if (type === "event") {
    // Recurring and multi-performance events resolve to their next real
    // occurrence, so "First Saturday of every month" still counts down in days.
    const next = getNextOccurrence(it);
    const nextIso = next ? isoOf(next.date) : null;
    const dateLabel = weekdayDate(nextIso) || weekdayDate(it.start_date) || weekdayDate(it.date) || it.date || null;
    const time = to12h(next?.startTime || it.start_time);
    const first = [dateLabel, time].filter(Boolean).join(" · ");
    lines.push(first ? { icon: Calendar, text: first } : null);
    lines.push(it.location ? { icon: MapPin, text: it.location } : null);

    if (!next) {
      const ref = it.end_date || it.start_date || it.date;
      const over = ref ? new Date(ref).getTime() < Date.now() : false;
      if (over) badge = { text: "Ended", tone: "ended" };
    } else {
      const d = daysAway(nextIso);
      if (d != null) {
        if (d <= 0) status = { items: [{ text: "Today", tone: SAGE }] };
        else if (d === 1) status = { items: [{ text: "Tomorrow", tone: SAGE }] };
        else if (d < 7) status = { items: [{ text: `This ${weekday(nextIso)}`, tone: SAGE }] };
        else status = { items: [{ text: `In ${d} Days`, tone: SAGE }] };
      }
    }
  }


  if (type === "special") {
    lines.push(it.business_name ? { icon: Store, text: titleCase(it.business_name) } : null);
    lines.push(it.card_footer_text ? { icon: Clock, text: it.card_footer_text } : null);

    const ends = it.valid_until ? new Date(it.valid_until).getTime() : null;
    const expired = ends != null && ends < Date.now();
    const card = specialCard(it);
    if (expired) badge = { text: "Ended", tone: "ended" };
    else badge = { text: card.badge.text, tone: card.badge.tone === "discount" ? "deal" : "quiet" };

    // Same countdown wording and the same 7-day urgency threshold as the
    // specials list and the homepage rail, so a deal never reads as "ending
    // soon" on one screen and calm on another.
    if (!expired && it.valid_until) {
      const urgent = isEndingSoon(it);
      status = { items: [{ text: countdownLabel(it), tone: urgent ? CLAY : SAGE }] };
    }
  }

  if (type === "resource") {
    const platformKey = (it.platform || "").toString().toLowerCase();
    const icon = PLATFORM_ICON[platformKey] ?? Globe;
    const candidates = [it.meta, it.meta_2].map((v) => (v == null ? "" : String(v).trim()));
    const memberIdx = candidates.findIndex((v) => /member|follower|subscriber/i.test(v));
    const memberText = memberIdx >= 0 ? candidates[memberIdx] : null;
    const rest = candidates.filter((_, i) => i !== memberIdx).filter(Boolean);
    const first = rest[0] || it.platform;
    lines.push(first ? { icon, text: first } : null);
    lines.push(rest[1] ? { text: rest[1] } : null);
    if (memberText) status = { items: [{ text: memberText, tone: OLIVE }] };
  }

  return { lines, status, badge, ratingChip };
};

const Chip = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div
    style={{
      height: 20,
      padding: "0 8px",
      borderRadius: 9999,
      display: "inline-flex",
      alignItems: "center",
      background: CHIP_BG,
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
      boxShadow: CHIP_SHADOW,
      fontFamily: SANS,
      lineHeight: 1,
      ...style,
    }}
  >
    {children}
  </div>
);

// Saved-item card used on the saved grids. Self-contained: it derives its own
// meta lines, badge and status line from the row it is given, so every saved
// screen renders an identical card.
const SavedCard = ({
  it,
  type,
  href,
  onUnsave,
}: {
  it: any;
  type: CardType;
  href: string;
  /** Legacy prop, no longer rendered: meta lines are derived from `it`. */
  subtitle?: React.ReactNode;
  onUnsave?: (e: React.MouseEvent) => void;
}) => {
  const [pressed, setPressed] = useState(false);
  const [isLogo, setIsLogo] = useState(false);
  const titleRef = useRef<HTMLSpanElement | null>(null);
  const locRef = useRef<HTMLSpanElement | null>(null);
  const [titleLines, setTitleLines] = useState(1);
  const [locLines, setLocLines] = useState(1);
  const src = it.saved_image_url || it.image_url;
  const { lines, status, badge, ratingChip } = buildContent(it, type);
  const override = (it.title_override ?? "").toString().trim();
  const title = override || titleCase(it.title);

  // Measure how many lines the title and the location actually render on. The
  // title only gives up its reserved second line when the location needs two.
  useEffect(() => {
    const els: Array<[HTMLElement | null, (n: number) => void]> = [
      [titleRef.current, setTitleLines],
      [locRef.current, setLocLines],
    ];
    const measure = () => {
      els.forEach(([el, set]) => {
        if (!el) return;
        const lh = parseFloat(getComputedStyle(el).lineHeight) || 1;
        set(Math.max(1, Math.round(el.scrollHeight / lh)));
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    els.forEach(([el]) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [title, lines]);

  const shiftUp = type === "listing" && titleLines === 1 && locLines > 1;


  return (
    <Link
      to={href}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxShadow: "0 1px 4px -1px rgba(0,0,0,0.04)",
        transform: pressed ? "scale(0.98)" : "none",
        transition: "transform 150ms ease-out",
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: IMAGE_BG }}>
        {src ? (
          <img
            src={src}
            alt=""
            loading="lazy"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (!img.naturalWidth || !img.naturalHeight) return;
              const ratio = img.naturalWidth / img.naturalHeight;
              // No logo flag on the data, so near-square art is treated as a
              // logo and contained rather than cropped through the middle.
              setIsLogo(ratio > 0.85 && ratio < 1.18);
            }}
            style={{
              position: "absolute",
              inset: isLogo ? 20 : 0,
              width: isLogo ? "auto" : "100%",
              height: isLogo ? "auto" : "100%",
              maxWidth: isLogo ? "calc(100% - 40px)" : undefined,
              maxHeight: isLogo ? "calc(100% - 40px)" : undefined,
              margin: isLogo ? "auto" : undefined,
              objectFit: isLogo ? "contain" : "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: HEAD,
              fontSize: 38,
              fontWeight: 550,
              letterSpacing: "-0.02em",
              color: MONO,
            }}
          >
            {(it.title || "").trim().charAt(0).toUpperCase()}
          </div>
        )}

        {/* Type capsule */}
        <div style={{ position: "absolute", top: PILL_TOP, left: PILL_INSET }}>
          <Chip>
            <span
              style={{
                ...t.label,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#1a1a1a",
              }}
            >
              {TYPE_LABEL[type]}
            </span>
          </Chip>
        </div>

        {/* Rating pill (listings) */}
        {ratingChip && !badge && (
          <div style={{ position: "absolute", bottom: PILL_INSET, left: PILL_INSET }}>
            <Chip style={{ height: 18, padding: "0 6px" }}>
              <span style={{ ...t.label, color: META, whiteSpace: "nowrap" }}>
                <span style={{ color: STAR }}>★</span> {ratingChip}
              </span>
            </Chip>
          </div>
        )}

        {/* Deal / ended badge */}

        {badge && (
          <div style={{ position: "absolute", bottom: PILL_INSET, left: PILL_INSET, maxWidth: "calc(100% - 16px)" }}>
            <Chip
              style={
                badge.tone === "ended"
                  ? undefined
                  : {
                      background: badge.tone === "deal" ? CLAY : OLIVE,
                      backdropFilter: "none",
                      WebkitBackdropFilter: "none",
                      maxWidth: "100%",
                    }
              }
            >
              <span
                style={{
                  ...t.label,
                  textTransform: "uppercase",
                  letterSpacing: badge.tone === "ended" ? "0.1em" : "0.06em",
                  color: badge.tone === "ended" ? MUTED : "#FFFFFF",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {badge.text}
              </span>
            </Chip>
          </div>
        )}

        {onUnsave && (
          <button
            type="button"
            onClick={onUnsave}
            aria-label="Remove from saved"
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 44,
              height: 44,
              background: "transparent",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 9999,
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                boxShadow: CHIP_SHADOW,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Heart size={16} strokeWidth={2} color={HEART} fill={HEART} />
            </span>
          </button>
        )}
      </div>

      <div
        style={{
          padding: "10px 12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 5,
          flex: 1,
        }}
      >
        <h3
          {...(override ? { "data-no-title-case": "true" } : {})}
          style={{
            fontFamily: SANS,
            ...t.cardTitleM,
            color: INK,
            lineHeight: 1.22,
            margin: 0,
            minHeight: shiftUp ? undefined : 37,
            overflowWrap: "break-word",
            display: "-webkit-box",
            WebkitLineClamp: type === "resource" ? 3 : 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          <span ref={titleRef}>{title}</span>
        </h3>


        {lines.map((line, i) => {
          if (!line) return null;
          // Listing location: two lines when the title fits on one, otherwise one.
          const clamp =
            line.icon === MapPin && type === "listing" ? (titleLines > 1 ? 1 : 2) : line.clamp ?? 2;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 5,
                fontFamily: SANS,
                ...t.meta,
                color: i === 0 ? META : MUTED,
                lineHeight: i === 0 ? 1.3 : 1.35,
                minWidth: 0,
              }}
            >
              {line.icon && (
                <line.icon
                  size={i === 0 ? 12 : 11}
                  strokeWidth={1.8}
                  color={MUTED}
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
              )}
              <span
                ref={line.icon === MapPin && type === "listing" ? locRef : undefined}
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: clamp,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  overflowWrap: clamp === 1 ? "normal" : "break-word",
                  wordBreak: clamp === 1 ? "normal" : undefined,
                }}
              >
                {line.lead ? `${line.lead} ` : ""}
                {line.text}
              </span>
            </div>
          );
        })}

      </div>

      {status && (
        <div
          style={{
            marginTop: "auto",
            background: "#F5F0E8",
            borderTop: "1px solid rgba(26,26,26,0.06)",
            padding: "8px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {status.items.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontFamily: SANS,
                ...t.meta,
                color: s.tone,
                lineHeight: 1.2,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 9999,
                  background: s.tone,
                  flexShrink: 0,
                }}
              />
              {s.text}
            </div>
          ))}
        </div>
      )}
    </Link>
  );
};

export default SavedCard;
