import { Star } from "lucide-react";
import { Link } from "react-router-dom";

interface Listing {
  id: string;
  title: string;
  image_url: string | null;
  google_rating: number | null;
}

interface HomeListingCarouselProps {
  listings: Listing[];
  variant?: "overlay" | "text-below";
}

const HomeListingCarousel = ({ listings, variant = "overlay" }: HomeListingCarouselProps) => {
  return (
    <div style={{ overflowX: "auto", paddingLeft: 24 }} className="scrollbar-hide">
      <div style={{ display: "flex", gap: 12 }}>
        {listings.map((listing, idx) =>
          variant === "text-below" ? (
            <Link
              key={listing.id}
              to={`/listing/${listing.id}`}
              style={{
                flexShrink: 0,
                width: "calc(50vw - 30px)",
                textDecoration: "none",
                marginRight: idx === listings.length - 1 ? 24 : 0,
              }}
            >
              <div style={{ borderRadius: 20, overflow: "hidden", background: "#ffffff" }}>
                <div style={{ width: "100%", aspectRatio: "4/3", background: "#f0f0f0" }}>
                  {listing.image_url ? (
                    <img
                      src={listing.image_url}
                      alt={listing.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "#f0f0f0" }} />
                  )}
                </div>
                <div style={{ padding: "12px 14px 14px" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#2b2420",
                      lineHeight: 1.25,
                      marginBottom: 6,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical" as any,
                      overflow: "hidden",
                    }}
                  >
                    {listing.title}
                  </div>
                  {listing.google_rating && listing.google_rating > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Star size={12} fill="#E8A83E" color="#E8A83E" />
                      <span style={{ fontSize: 12, color: "#827b75", fontWeight: 500 }}>
                        {listing.google_rating}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ) : (
            <Link
              key={listing.id}
              to={`/listing/${listing.id}`}
              style={{
                flexShrink: 0,
                width: "calc(50vw - 30px)",
                aspectRatio: "3/4",
                borderRadius: 20,
                overflow: "hidden",
                position: "relative",
                background: "#f0f0f0",
                display: "block",
                textDecoration: "none",
                marginRight: idx === listings.length - 1 ? 24 : 0,
              }}
            >
              {listing.image_url ? (
                <img
                  src={listing.image_url}
                  alt={listing.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "#f0f0f0" }} />
              )}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)",
                }}
              />
              <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", lineHeight: 1.2, marginBottom: 4 }}
                >
                  {listing.title}
                </div>
                {listing.google_rating && listing.google_rating > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Star size={12} fill="#E8A83E" color="#E8A83E" />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                      {listing.google_rating}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          )
        )}
      </div>
    </div>
  );
};

export default HomeListingCarousel;
