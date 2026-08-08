import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowUpRight, Heart, Share2 } from "lucide-react";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import { MUTED, HN, type } from "@/lib/type";
import type { ChannelImageSlot } from "@/lib/channelImageSlots";

/**
 * The four screens a Local Channel picture lands on, rebuilt at the size the
 * phone paints them.
 *
 * These are deliberately copies of the real cards rather than shared
 * components: the app screens are page-level and pull their own data from
 * Supabase, and hollowing them out into reusable shells to serve an admin
 * preview would put a preview-shaped seam through four production screens.
 * What has to stay in step is the *image box* — 90×128 on the listing card,
 * 90×90 on the homepage row, 4:3 on the hero — and that lives in
 * `channelImageSlots.ts`, which both sides read.
 *
 * The picture itself is supplied by the caller through `renderImage`, so the
 * same chrome frames a saved URL and a live, still-being-dragged crop.
 */

export type ChannelPreviewData = {
  title?: string | null;
  title_override?: string | null;
  platform?: string | null;
  meta?: string | null;
  meta_2?: string | null;
  tag_1?: string | null;
  tag_2?: string | null;
};

interface ChannelImagePreviewProps {
  slot: ChannelImageSlot;
  channel: ChannelPreviewData;
  /** Paints the picture at exactly the box the app gives it. */
  renderImage: (width: number, height: number) => ReactNode;
}

const PLATFORM_LABEL: Record<string, string> = {
  Facebook: "Facebook Group",
  WhatsApp: "WhatsApp Channel",
  Instagram: "Instagram",
};

const platformLabel = (p?: string | null) => (p ? PLATFORM_LABEL[p] || p : "");

const CARD_SHADOW = "0 1px 4px -1px rgba(0,0,0,0.04)";
const IMAGE_BG = "#F4EFE3";
const CARD_MAX = 340;

const floatBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 999,
  background: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
};

const displayTitleOf = (c: ChannelPreviewData) =>
  (c.title_override || "").trim() || (c.title || "").trim() || "Channel title";

/**
 * The image box, painted at the size it actually comes out at.
 *
 * Only the listing card has a height in the source: 128px, fixed. The homepage
 * row's tile is `alignSelf: stretch` over a `minHeight: 90`, so a title that
 * wraps to two lines makes the row — and the tile — taller than the square the
 * picture was cropped to, and `cover` trims the sides to compensate. The hero
 * and the Saved tile hold a ratio but take their width from the column.
 *
 * Handing `renderImage` a nominal size would hide all of that, which is the
 * one thing this preview exists to show. So the box measures itself and the
 * picture is drawn at whatever came out, with `overflow: hidden` keeping the
 * measurement from feeding back into the layout.
 */
const ImageBox = ({
  style,
  fallback,
  renderImage,
}: {
  style: CSSProperties;
  fallback: { width: number; height: number };
  renderImage: (width: number, height: number) => ReactNode;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(fallback);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setSize((prev) =>
          Math.abs(prev.width - r.width) < 0.5 && Math.abs(prev.height - r.height) < 0.5
            ? prev
            : { width: r.width, height: r.height },
        );
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ overflow: "hidden", ...style }}>
      {renderImage(size.width, size.height)}
    </div>
  );
};

/** BushTelegraph.tsx — ChannelCard. */
const ListingCard = ({ slot, channel, renderImage }: ChannelImagePreviewProps) => {
  const tags = [channel.tag_1, channel.tag_2].filter((t): t is string => !!t && !!t.trim());
  const memberCount = (channel.meta_2 || "").trim();

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: CARD_MAX,
        height: slot.box.height,
        background: "#FFFFFF",
        borderRadius: 16,
        boxShadow: CARD_SHADOW,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        fontFamily: HN,
      }}
    >
      <ImageBox
        style={{
          width: slot.box.width,
          height: slot.box.height,
          flexShrink: 0,
          alignSelf: "stretch",
          background: IMAGE_BG,
        }}
        fallback={slot.box}
        renderImage={renderImage}
      />
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 12, paddingRight: 10 }}>
        <div style={{ fontFamily: HN, fontSize: 12, fontWeight: 500, color: "#6B6A5E" }}>
          {platformLabel(channel.platform)}
        </div>
        <div
          style={{
            fontFamily: HN,
            fontSize: 15,
            fontWeight: 500,
            color: "#1A1A1A",
            lineHeight: 1.25,
            marginTop: 4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {displayTitleOf(channel)}
        </div>
        {memberCount && (
          <div style={{ fontFamily: HN, fontSize: 12, fontWeight: 500, color: "#6B6A5E", marginTop: 4 }}>
            {memberCount}
          </div>
        )}
        {tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {tags.map((t, i) => (
              <span
                key={i}
                style={{
                  fontFamily: HN,
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#715A3D",
                  background: "#EEE8DA",
                  borderRadius: 999,
                  padding: "5px 9px",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <ArrowUpRight
        size={16}
        strokeWidth={1.8}
        color="#715A3D"
        style={{ position: "absolute", top: 14, right: 14 }}
      />
    </div>
  );
};

/** HomeLocalChannels.tsx — the home screen row. */
const HomepageRow = ({ slot, channel, renderImage }: ChannelImagePreviewProps) => {
  const eyebrow = (channel.meta || "").trim() || channel.platform || "";
  const meta = (channel.meta_2 || "").trim();

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 16,
        display: "flex",
        alignItems: "stretch",
        gap: 12,
        paddingRight: 10,
        boxShadow: CARD_SHADOW,
        width: "100%",
        maxWidth: CARD_MAX,
        overflow: "hidden",
      }}
    >
      <ImageBox
        style={{
          width: slot.box.width,
          minHeight: slot.box.height,
          alignSelf: "stretch",
          background: IMAGE_BG,
          flexShrink: 0,
        }}
        fallback={slot.box}
        renderImage={renderImage}
      />
      <div style={{ flex: 1, minWidth: 0, alignSelf: "center", padding: "10px 0" }}>
        {eyebrow && (
          <div style={{ ...type.meta, marginBottom: 4, textTransform: "capitalize" }}>{eyebrow}</div>
        )}
        <div style={{ ...type.cardTitleL, marginBottom: 6, textTransform: "capitalize" }}>
          {displayTitleOf(channel)}
        </div>
        {meta && <div style={{ ...type.meta, textTransform: "capitalize" }}>{meta}</div>}
      </div>
    </div>
  );
};

/** LocalChannelDetail.tsx — the hero and the sheet that laps over it. */
const DetailHero = ({ slot, channel, renderImage }: ChannelImagePreviewProps) => {
  const tags = [channel.tag_1, channel.tag_2].filter((t): t is string => !!t && !!t.trim());
  const channelLine = platformLabel(channel.platform);
  const metaParts = [channel.meta, channel.meta_2].filter((m): m is string => !!m && !!m.trim());

  return (
    <div
      style={{
        width: "100%",
        maxWidth: slot.box.width,
        background: "#E6E0CC",
        fontFamily: HN,
        overflow: "hidden",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 3",
          background: "#DDD6C0",
          overflow: "hidden",
        }}
      >
        <ImageBox
          style={{ position: "absolute", inset: 0 }}
          fallback={slot.box}
          renderImage={renderImage}
        />
        <div style={{ ...floatBtn, position: "absolute", top: 14, left: 14 }}>
          <BackArrowIcon size={16} color="#1A1A1A" />
        </div>
        <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 6 }}>
          <div style={floatBtn}>
            <Share2 size={16} strokeWidth={1.6} color="#1A1A1A" />
          </div>
          <div style={floatBtn}>
            <Heart size={16} strokeWidth={2} color="#715a3d" />
          </div>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 3,
          background: "#ffffff",
          borderRadius: "28px 28px 0 0",
          marginTop: -28,
          padding: "22px 20px 18px",
        }}
      >
        {tags.length > 0 && (
          <div style={{ ...type.label, lineHeight: 1.4, color: "#715A3D", marginBottom: 8 }}>
            {tags.map((t, i) => (
              <span key={i}>
                {i > 0 && <span style={{ color: "#B8916A", margin: "0 6px" }}>·</span>}
                {t}
              </span>
            ))}
          </div>
        )}
        <div style={{ ...type.pageTitle, fontSize: 24 }}>{displayTitleOf(channel)}</div>
        {channelLine && <div style={{ ...type.meta, marginTop: 10 }}>{channelLine}</div>}
        {metaParts.length > 0 && (
          <div style={{ ...type.meta, marginTop: 6 }}>{metaParts.join(" · ")}</div>
        )}
      </div>
    </div>
  );
};

/** SavedCard.tsx — the tile on a member's Saved screen. */
const SavedTile = ({ slot, channel, renderImage }: ChannelImagePreviewProps) => (
  <div
    style={{
      width: "100%",
      maxWidth: slot.box.width,
      background: "#FFFFFF",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: CARD_SHADOW,
      fontFamily: HN,
    }}
  >
    <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: IMAGE_BG }}>
      <ImageBox
        style={{ position: "absolute", inset: 0 }}
        fallback={slot.box}
        renderImage={renderImage}
      />
    </div>
    <div style={{ padding: "10px 12px 14px" }}>
      <div style={{ ...type.cardTitleM }}>{displayTitleOf(channel)}</div>
      {(channel.meta_2 || channel.platform) && (
        <div style={{ ...type.meta, color: MUTED, marginTop: 4 }}>
          {(channel.meta_2 || "").trim() || platformLabel(channel.platform)}
        </div>
      )}
    </div>
  </div>
);

const ChannelImagePreview = (props: ChannelImagePreviewProps) => {
  switch (props.slot.key) {
    case "listing":
      return <ListingCard {...props} />;
    case "homepage":
      return <HomepageRow {...props} />;
    case "detail":
      return <DetailHero {...props} />;
    case "saved":
      return <SavedTile {...props} />;
    default:
      return null;
  }
};

export default ChannelImagePreview;
