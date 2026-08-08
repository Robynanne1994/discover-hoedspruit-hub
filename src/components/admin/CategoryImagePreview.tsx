import { type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { type } from "@/lib/type";
import { CATEGORY_IMAGE_SLOT } from "@/lib/categoryImageSlot";
import ImageBox from "./PreviewImageBox";

/**
 * The two Explore cards a category cover lands on, rebuilt at the size the
 * phone paints them.
 *
 * Like ChannelImagePreview these are deliberately copies of the real cards
 * rather than shared components — Categories.tsx is a page that pulls its own
 * data from Supabase, and hollowing it out to serve an admin preview would put
 * a preview-shaped seam through a production screen. What has to stay in step
 * is the *image box*, and that lives in `categoryImageSlot.ts`, which both
 * sides read.
 *
 * The picture is supplied by the caller through `renderImage`, so the same
 * chrome frames a saved URL and a live, still-being-dragged crop.
 */

interface CategoryImagePreviewProps {
  title?: string | null;
  listingCount?: number;
  /** Paints the picture at exactly the box the app gives it. */
  renderImage: (width: number, height: number) => ReactNode;
}

const PAGE_BG = "#E6E0CC";
const CARD_BG = "#FFFFFF";
const IMAGE_BG = "#e6e0d2";
const INK = "#1A1A1A";

const countLabel = (n: number) => `${n} ${n === 1 ? "Listing" : "Listings"}`;

const Caption = ({ children }: { children: ReactNode }) => (
  <p style={{ ...type.label, margin: "0 0 6px" }}>{children}</p>
);

/** Categories.tsx — grid view. */
const GridCard = ({ title, listingCount = 0, renderImage }: CategoryImagePreviewProps) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      width: CATEGORY_IMAGE_SLOT.grid.width,
      background: CARD_BG,
      borderRadius: 16,
      overflow: "hidden",
    }}
  >
    <ImageBox
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        background: IMAGE_BG,
      }}
      fallback={CATEGORY_IMAGE_SLOT.grid}
      renderImage={renderImage}
    />
    <div style={{ padding: "12px 14px 14px" }}>
      <p
        style={{
          ...type.cardTitleM,
          color: INK,
          margin: 0,
          lineHeight: 1.25,
          minHeight: "2.5em",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {title}
      </p>
      <p style={{ ...type.meta, margin: "3px 0 0" }}>{countLabel(listingCount)}</p>
    </div>
  </div>
);

/** Categories.tsx — list view. */
const ListRow = ({ title, listingCount = 0, renderImage }: CategoryImagePreviewProps) => (
  <div
    style={{
      display: "flex",
      alignItems: "stretch",
      width: "100%",
      maxWidth: 350,
      height: 96,
      background: CARD_BG,
      borderRadius: 16,
      overflow: "hidden",
    }}
  >
    <ImageBox
      style={{
        width: CATEGORY_IMAGE_SLOT.list.width,
        height: CATEGORY_IMAGE_SLOT.list.height,
        background: IMAGE_BG,
        flexShrink: 0,
      }}
      fallback={CATEGORY_IMAGE_SLOT.list}
      renderImage={renderImage}
    />
    <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 14, padding: 14 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            ...type.cardTitleM,
            color: INK,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </p>
        <p
          style={{
            ...type.meta,
            margin: "3px 0 0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {countLabel(listingCount)}
        </p>
      </div>
      <ArrowUpRight size={20} color="#715A3D" strokeWidth={1.8} style={{ flexShrink: 0 }} />
    </div>
  </div>
);

/**
 * Both Explore views at once. They share one square image box, so a crop that
 * suits one suits the other — seeing them together is what makes that obvious.
 */
const CategoryImagePreview = ({ title, listingCount, renderImage }: CategoryImagePreviewProps) => {
  const shown = (title || "").trim() || "Category name";
  return (
    <div
      style={{
        background: PAGE_BG,
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 16,
        width: "100%",
      }}
    >
      <div>
        <Caption>Grid view</Caption>
        <GridCard title={shown} listingCount={listingCount} renderImage={renderImage} />
      </div>
      <div style={{ flex: "1 1 220px", minWidth: 220, maxWidth: 350 }}>
        <Caption>List view</Caption>
        <ListRow title={shown} listingCount={listingCount} renderImage={renderImage} />
      </div>
    </div>
  );
};

export default CategoryImagePreview;
