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
}

const HomeListingCarousel = ({ listings }: HomeListingCarouselProps) => {
  return (
    <div style={{ overflowX: "auto", paddingLeft: 4 }} className="scrollbar-hide">
      <div style={{ display: "flex", gap: 12 }}>
        {listings.map((listing, idx) => (
          <Link
            key={listing.id}
            to={`/listing/${listing.id}`}
            style={{
              flexShrink: 0,
              width: "calc(50vw - 30px)",
              aspectRatio: "3/4",
              borderRadius: 16,
              overflow: "hidden",
              position: "relative",
              background: "#f0f0f0",
              display: "block",
              textDecoration: "none",
              marginRight: idx === listings.length - 1 ? 4 : 0,
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
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)",
            }} />
            <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", lineHeight: 1.2, marginBottom: 4 }}>
                {listing.title}
              </div>
              {listing.google_rating && listing.google_rating > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Star size={12} fill="#E8A83E" color="#E8A83E" />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{listing.google_rating}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomeListingCarousel;
