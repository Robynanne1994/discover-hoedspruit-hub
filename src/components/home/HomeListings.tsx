import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useHomepageSection, useHomepageSectionTitle } from "@/hooks/useHomepageSection";
import HomeSectionHead from "./HomeSectionHead";
import FavouriteButton from "@/components/FavouriteButton";

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
        <div style={{ display: "flex", gap: 14, paddingRight: 40 }}>
          {listings.slice(0, 6).map((l: any) => (
            <Link
              key={l.id}
              to={`/listing/${l.id}`}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              style={{
                width: 268,
                flexShrink: 0,
                background: "#EEE8DA",
                borderRadius: 24,
                overflow: "hidden",
                textDecoration: "none",
                transition: "transform 150ms ease-out",
                display: "block",
              }}
            >
              <div style={{ position: "relative", width: "100%", height: 230, background: "#F4EFE3" }}>
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
              <div style={{ padding: "18px 20px 22px" }}>
                <div
                  style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontSize: 18,
                    color: "#2A2A24",
                    lineHeight: 1.2,
                    letterSpacing: "-0.2px",
                    marginBottom: 8,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {cleanName(l.title)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 13 }}>
                  {l.google_rating != null && (
                    <>
                      <span style={{ color: "#2A2A24" }}>★ {Number(l.google_rating).toFixed(1)}</span>
                      {l.location && (
                        <span
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 999,
                            background: "rgba(107, 106, 94, 0.6)",
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </>
                  )}
                  {l.location && (
                    <span
                      style={{
                        color: "#6B6A5E",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        flex: 1,
                        minWidth: 0,
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
