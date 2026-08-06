import { Link } from "react-router-dom";
import { Heart, MapPin } from "lucide-react";
import SpecialValueBar from "@/components/specials/SpecialValueBar";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const INK = "#1A1A1A";
const MUTED = "#6B6A5E";

const titleCase = (s?: string | null) => {
  if (!s) return "";
  // Use Unicode letter class so accented chars (é, à, ñ...) are treated as
  // part of the word and the character right after them isn't re-uppercased.
  return s.toLowerCase().replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, (_m, sep, ch) => sep + ch.toUpperCase());
};

// Saved-item card used on the profile saved tabs. Mirrors the listing cards on
// the category pages exactly, minus the open/closed status and the primary
// subcategory eyebrow.
const SavedCard = ({
  it,
  type,
  href,
  subtitle,
  onUnsave,
}: {
  it: any;
  type: "listing" | "event" | "special" | "resource";
  href: string;
  subtitle?: React.ReactNode;
  onUnsave?: (e: React.MouseEvent) => void;
}) => (
  <Link
    to={href}
    style={{
      background: "#FFFFFF",
      borderRadius: 16,
      overflow: "hidden",
      textDecoration: "none",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "#F4EFE3" }}>
      {(it.saved_image_url || it.image_url) && (
        <img
          src={it.saved_image_url || it.image_url}
          alt=""
          loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}

      {type === "listing" && it.google_rating ? (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 9999,
            padding: "3px 8px",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontFamily: SANS,
            fontSize: 11,
            fontWeight: 600,
            color: INK,
            lineHeight: 1,
          }}
        >
          <span style={{ color: INK }}>★</span>
          {Number(it.google_rating).toFixed(1).replace(/\.0$/, "")}
          {it.google_reviews_count ? (
            <span style={{ fontWeight: 400, color: MUTED }}>({it.google_reviews_count})</span>
          ) : null}
        </div>
      ) : null}

      {onUnsave && (
        <button
          type="button"
          onClick={onUnsave}
          aria-label="Remove from saved"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 26,
            height: 26,
            borderRadius: 9999,
            background: "rgba(255, 255, 255, 0.95)",
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0, 5, 5, 0.14)",
            backdropFilter: "blur(4px)",
            padding: 0,
          }}
        >
          <Heart size={16} strokeWidth={2} color="#5b4632" fill="#5b4632" />
        </button>
      )}
    </div>

    <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
      <h3
        style={{
          fontFamily: SANS,
          fontSize: 15,
          fontWeight: 700,
          color: INK,
          lineHeight: 1.2,
          margin: 0,
          wordBreak: "break-word",
          minHeight: "36px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {titleCase(it.title)}
      </h3>

      {type === "listing"
        ? it.location && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: SANS, fontSize: 12, color: MUTED, lineHeight: 1.3, minWidth: 0 }}>
              <MapPin size={12} strokeWidth={1.6} color={MUTED} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.location}</span>
            </div>
          )
        : subtitle && (
            <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED, lineHeight: 1.3 }}>
              {subtitle}
            </div>
          )}
    </div>

    {/* Saved deals carry the same value bar as the specials grid */}
    {type === "special" && <SpecialValueBar special={it} />}
  </Link>
);

export default SavedCard;
