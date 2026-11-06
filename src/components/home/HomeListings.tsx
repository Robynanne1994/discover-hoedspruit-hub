import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useHomepageSection, useHomepageSectionTitle } from "@/hooks/useHomepageSection";
import HomeSectionHead from "./HomeSectionHead";

import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";
import { listingImage } from "@/lib/imageFallback";
import { type } from "@/lib/type";

/** Brand brown — the same value ArrowCta and PrimaryButton paint their CTAs. */
const DARK = "#423324";
/** The rail's tile width, shared by every listing card and the closing card. */
const TILE_WIDTH = 138;


interface Props {
  sectionKey: string;
  categorySearch: string | string[];
  defaultTitle: string;
  seeAllHref: string;
  primary?: string;
  serif?: string;
}

const cleanName = (s: string) => s.replace(/\s*&\s*/g, " and ");

/** The rail's press feedback: nudge the tile in, let it back out on release. */
const pressScale = {
  onPointerDown: (e: React.PointerEvent) =>
    ((e.currentTarget as HTMLElement).style.transform = "scale(0.98)"),
  onPointerUp: (e: React.PointerEvent) =>
    ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  onPointerLeave: (e: React.PointerEvent) =>
    ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
};

/**
 * The closing tile: same box as a listing card, but it carries the rail's
 * "View All" instead of a photo so the last thing you scroll to is the way out
 * to the whole category.
 */
const ViewAllCard = ({ href }: { href: string }) => (
  <Link
    to={href}
    aria-label="View All"
    {...pressScale}
    style={{
      width: TILE_WIDTH,
      flexShrink: 0,
      textDecoration: "none",
      transition: "transform 150ms ease-out",
      display: "block",
    }}
  >
    <div
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        borderRadius: 16,
        overflow: "hidden",
        background: DARK,
        marginBottom: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <span style={{ ...type.cardTitleM, color: "#FFFFFF" }}>View All</span>
      <ArrowUpRight size={20} strokeWidth={2} color="#FFFFFF" />
    </div>
  </Link>
);

const HomeListings = ({ sectionKey, categorySearch, defaultTitle, seeAllHref }: Props) => {
  const { data: listings } = useHomepageSection(sectionKey, categorySearch);
  const { data: title } = useHomepageSectionTitle(sectionKey, defaultTitle);

  if (!listings || listings.length === 0) return null;

  return (
    <section>
      <HomeSectionHead primary={title || defaultTitle} actionHref={seeAllHref} />
      <div className="scrollbar-hide" style={{ overflowX: "auto", paddingLeft: 20 }}>
        <div style={{ display: "flex", gap: 4, paddingRight: 20 }}>
          {listings.slice(0, 8).map((l: any) => {
            // The square tile has its own crop; anything without one borrows
            // another of the listing's pictures, which `cover` centre-trims.
            const image = listingImage(l, "homepage");
            return (
            <Link
              key={l.id}
              to={`/listing/${l.id}`}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              style={{
                width: 138,
                flexShrink: 0,
                textDecoration: "none",
                transition: "transform 150ms ease-out",
                display: "block",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "1 / 1",
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "#F4EFE3",
                  marginBottom: 8,
                }}
              >
                {image && (
                  <img
                    src={image}
                    alt={l.title}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                )}
                
              </div>
              <div
                {...noTitleCaseProps(l)}
                style={{
                  ...type.cardTitleS,
                  marginBottom: 2,
                  wordBreak: "break-word",
                }}
              >
                {(l as any).title_override?.trim() ? getDisplayTitle(l) : cleanName(l.title)}
              </div>
              {(l.subtitle || l.category_label) && (
                <div style={{ ...type.meta, marginBottom: 3 }}>
                  {l.subtitle || l.category_label}
                </div>
              )}
            </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HomeListings;
