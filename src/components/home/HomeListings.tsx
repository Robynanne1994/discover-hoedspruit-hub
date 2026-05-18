import { Link } from "react-router-dom";
import { useHomepageSection, useHomepageSectionTitle } from "@/hooks/useHomepageSection";
import HomeSectionHead from "./HomeSectionHead";
import FavouriteButton from "@/components/FavouriteButton";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";

interface Props {
  sectionKey: string;
  categorySearch: string | string[];
  defaultTitle: string;
  seeAllHref: string;
  primary?: string;
  serif?: string;
}

const cleanName = (s: string) => s.replace(/\s*&\s*/g, " and ");

const HomeListings = ({ sectionKey, categorySearch, defaultTitle, seeAllHref }: Props) => {
  const { data: listings } = useHomepageSection(sectionKey, categorySearch);
  const { data: title } = useHomepageSectionTitle(sectionKey, defaultTitle);

  if (!listings || listings.length === 0) return null;

  return (
    <section>
      <HomeSectionHead primary={title || defaultTitle} actionHref={seeAllHref} />
      <div className="scrollbar-hide" style={{ overflowX: "auto", paddingLeft: 20 }}>
        <div style={{ display: "flex", gap: 4, paddingRight: 20 }}>
          {listings.slice(0, 8).map((l: any) => (
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
                {l.image_url && (
                  <img
                    src={l.image_url}
                    alt={l.title}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                )}
                <FavouriteButton itemId={l.id} itemType="listing" />
              </div>
              <div
                style={{
                  fontFamily: HN,
                  fontSize: 13,
                  color: "#020202",
                  lineHeight: 1.2,
                  marginBottom: 2,
                  wordBreak: "break-word",
                }}
              >
                {cleanName(l.title)}
              </div>
              {(l.subtitle || l.category_label) && (
                <div style={{ fontFamily: HN, fontSize: 11, color: "#6B6A5E", marginBottom: 3 }}>
                  {l.subtitle || l.category_label}
                </div>
              )}
              {l.google_rating != null && (
                <div style={{ fontFamily: HN, fontSize: 11, color: "#6B6A5E" }}>
                  ★ {Number(l.google_rating).toFixed(1)}
                  {l.google_rating_count ? ` (${l.google_rating_count})` : ""}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeListings;
