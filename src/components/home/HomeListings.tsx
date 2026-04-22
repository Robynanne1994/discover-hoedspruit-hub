import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { useHomepageSection, useHomepageSectionTitle } from "@/hooks/useHomepageSection";
import HomeSectionHead from "./HomeSectionHead";
import FavouriteButton from "@/components/FavouriteButton";

const SANS = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
const SERIF = "'Playfair Display', 'Helvetica Neue', serif";

interface Props {
  sectionKey: string;
  categorySearch: string | string[];
  defaultTitle: string;
  seeAllHref: string;
  primary?: string;
  serif?: string;
}

const cleanName = (s: string) => s.replace(/\s*&\s*/g, " and ");

const HomeListings = ({ sectionKey, categorySearch, defaultTitle, seeAllHref, primary: primaryProp, serif: serifProp }: Props) => {
  const { data: listings } = useHomepageSection(sectionKey, categorySearch);
  const { data: title } = useHomepageSectionTitle(sectionKey, defaultTitle);

  if (!listings || listings.length === 0) return null;

  let primary = primaryProp;
  let serifWord = serifProp;
  if (!primary) {
    const parts = (title || defaultTitle).split(" ");
    serifWord = parts.length > 2 ? parts[parts.length - 1] : undefined;
    primary = serifWord ? parts.slice(0, -1).join(" ") : title || defaultTitle;
  }

  return (
    <section>
      <HomeSectionHead
        primary={primary}
        serif={serifWord}
        actionLabel="See all"
        actionHref={seeAllHref}
      />
      <div className="scrollbar-hide" style={{ overflowX: "auto", paddingLeft: 24 }}>
        <div style={{ display: "flex", gap: 12, paddingRight: 24 }}>
          {listings.slice(0, 6).map((l: any) => (
            <Link
              key={l.id}
              to={`/listing/${l.id}`}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              style={{
                width: 240,
                flexShrink: 0,
                background: "#FFFFFF",
                borderRadius: 20,
                overflow: "hidden",
                textDecoration: "none",
                transition: "transform 150ms ease-out",
                display: "block",
              }}
            >
              <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 5", background: "#F2EFEC" }}>
                {l.image_url && (
                  <img
                    src={l.image_url}
                    alt={l.title}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
                <FavouriteButton itemId={l.id} itemType="listing" />
              </div>
              <div style={{ padding: "12px 14px 14px" }}>
                <div
                  style={{
                    fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif",
                    fontSize: 14,
                    color: "#0A0A0A",
                    lineHeight: 1.2,
                    marginBottom: 6,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {cleanName(l.title)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {l.google_rating != null && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Star size={12} color="#F26A48" fill="#F26A48" strokeWidth={0} />
                        <span style={{ fontFamily: SANS, fontSize: 13, color: "#0A0A0A" }}>
                          {Number(l.google_rating).toFixed(1)}
                        </span>
                      </div>
                      {l.location && (
                        <span
                          style={{
                            width: 3,
                            height: 3,
                            borderRadius: 999,
                            background: "#8A8480",
                            display: "inline-block",
                          }}
                        />
                      )}
                    </>
                  )}
                  {l.location && (
                    <span
                      style={{
                        fontFamily: SERIF,
                        fontStyle: "italic",
                        fontWeight: 300,
                        fontSize: 13,
                        color: "#8A8480",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {l.location}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeListings;
