import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Facebook, Globe, Heart, Instagram, MapPin, MessageCircle, Store } from "lucide-react";
import { isAlwaysOpen, isOpenNow, opensAt, todayHours } from "@/lib/openHours";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const INK = "#1A1A1A";
const META = "#2b2420";
const MUTED = "#6B6A5E";
const BROWN = "#715A3D";
const HEART = "#5b4632";
const SAGE = "#6B7C5C";
const CLAY = "#C0392B";
const IMAGE_BG = "#F4EFE3";
const MONO = "#A79E88";

const CHIP_BG = "rgba(255,255,255,0.94)";
const CHIP_SHADOW = "0 1px 4px rgba(0,5,5,0.14)";
// Inset from the image edge for the floating pills. The top-left type capsule
// and the bottom-left rating/deal pills all share this same inset so the
// padding above and below the image stays visually equal.
const PILL_INSET = 8;

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
const shortDate = (iso?: string | null) => fmt(iso, { day: "numeric", month: "short" });
const weekdayDate = (iso?: string | null) => fmt(iso, { weekday: "short", day: "numeric", month: "short" });
const weekday = (iso?: string | null) => fmt(iso, { weekday: "long" });

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
  let badge: { text: string; tone: "deal" | "ended" } | null = null;
  let ratingChip: string | null = null;

  if (type === "listing") {
    const rating = it.google_rating ? Number(it.google_rating).toFixed(1).replace(/\.0$/, "") : null;
    const reviews = it.google_reviews_count ? ` (${it.google_reviews_count})` : "";
    const category = it.categories?.title ? titleCase(it.categories.title) : null;
    if (rating) ratingChip = `★ ${rating}${reviews}`;
    lines.push(category ? { text: category } : null);
    lines.push(it.location ? { icon: MapPin, text: it.location, clamp: 1 } : null);


    const hours = it.opening_hours as Record<string, string> | null | undefined;
    if (hours) {
      if (isAlwaysOpen(todayHours(hours))) {
        status = { items: [{ text: "Open Now", tone: SAGE }, { text: "Always Open", tone: MUTED }] };
      } else if (isOpenNow(hours)) {
        const until = closesAt(hours);
        status = { items: [{ text: until ? `Open Until ${until}` : "Open Now", tone: SAGE }] };
      } else {
        const opens = to12h(opensAt(hours));
        status = { items: [{ text: opens ? `Closed · Opens ${opens}` : "Closed", tone: CLAY }] };
      }
    }
  }

  if (type === "event") {
    const dateLabel = weekdayDate(it.start_date) || weekdayDate(it.date) || it.date || null;
    const time = to12h(it.start_time);
    const first = [dateLabel, time].filter(Boolean).join(" · ");
    lines.push(first ? { icon: Calendar, text: first } : null);
    lines.push(it.location ? { icon: MapPin, text: it.location } : null);

    const ref = it.end_date || it.start_date || it.date;
    const over = ref ? new Date(ref).getTime() < Date.now() : false;
    if (over) badge = { text: "Ended", tone: "ended" };
    else {
      const d = daysAway(it.start_date || it.date);
      if (d != null) {
        if (d <= 0) status = { text: "Today", tone: SAGE };
        else if (d === 1) status = { text: "Tomorrow", tone: SAGE };
        else if (d < 7) status = { text: `This ${weekday(it.start_date || it.date)}`, tone: SAGE };
        else status = { text: `In ${d} Days`, tone: SAGE };
      }
    }
  }

  if (type === "special") {
    lines.push(it.business_name ? { icon: Store, text: titleCase(it.business_name) } : null);
    lines.push(it.card_footer_text ? { icon: Clock, text: it.card_footer_text } : null);

    const ends = it.valid_until ? new Date(it.valid_until).getTime() : null;
    const expired = ends != null && ends < Date.now();
    if (expired) badge = { text: "Ended", tone: "ended" };
    else if (it.deal_label) badge = { text: it.deal_label, tone: "deal" };

    if (!expired && it.valid_until) {
      const d = daysAway(it.valid_until);
      if (d != null) {
        if (d <= 0) status = { text: "Ends today", tone: CLAY };
        else if (d === 1) status = { text: "Ends tomorrow", tone: CLAY };
        else if (d <= 8) status = { text: `Ends in ${d} days`, tone: CLAY };
        else status = { text: `Ends ${shortDate(it.valid_until)}`, tone: CLAY };
      }
    }
  }

  if (type === "resource") {
    const platformKey = (it.platform || "").toString().toLowerCase();
    const icon = PLATFORM_ICON[platformKey] ?? Globe;
    const first = it.meta || it.platform;
    lines.push(first ? { icon, text: first } : null);
    lines.push(it.meta_2 ? { text: it.meta_2 } : null);
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
  const src = it.saved_image_url || it.image_url;
  const { lines, status, badge, ratingChip } = buildContent(it, type);
  const override = (it.title_override ?? "").toString().trim();
  const title = override || titleCase(it.title);

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
        <div style={{ position: "absolute", top: PILL_INSET, left: PILL_INSET }}>
          <Chip>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: BROWN,
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
              <span style={{ fontSize: 9.5, fontWeight: 600, color: META, whiteSpace: "nowrap" }}>
                {ratingChip}
              </span>
            </Chip>
          </div>
        )}

        {/* Deal / ended badge */}

        {badge && (
          <div style={{ position: "absolute", bottom: PILL_INSET, left: PILL_INSET }}>
            <Chip
              style={
                badge.tone === "deal"
                  ? { background: CLAY, backdropFilter: "none", WebkitBackdropFilter: "none" }
                  : undefined
              }
            >
              <span
                style={{
                  fontSize: badge.tone === "deal" ? 10 : 9.5,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: badge.tone === "deal" ? "0.06em" : "0.1em",
                  color: badge.tone === "deal" ? "#FFFFFF" : MUTED,
                  whiteSpace: "nowrap",
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
          style={{
            fontFamily: SANS,
            fontSize: 15,
            fontWeight: 700,
            color: INK,
            lineHeight: 1.22,
            margin: 0,
            minHeight: 37,
            overflowWrap: "break-word",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </h3>

        {lines.map((line, i) =>
          line ? (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 5,
                fontFamily: SANS,
                fontSize: i === 0 ? 12.5 : 11.5,
                fontWeight: i === 0 ? 500 : 400,
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
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: line.clamp ?? 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  overflowWrap: line.clamp === 1 ? "normal" : "break-word",
                  wordBreak: line.clamp === 1 ? "normal" : undefined,
                }}
              >
                {line.lead ? `${line.lead} ` : ""}
                {line.text}
              </span>
            </div>
          ) : null,
        )}

        {status && (
          <div
            style={{
              marginTop: "auto",
              paddingTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontFamily: SANS,
              fontSize: 11,
              fontWeight: 600,
              color: status.tone,
              lineHeight: 1.2,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 9999,
                background: status.tone,
                flexShrink: 0,
              }}
            />
            {status.text}
          </div>
        )}
      </div>
    </Link>
  );
};

export default SavedCard;
