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
    <div style={{ overflowX: "auto", paddingLeft: 24 }} className="scrollbar-hide">
      <div style={{ display: "flex", gap: 4 }}>
        {listings.map((listing, idx) => (
          <Link
            key={listing.id}
            to={`/listing/${listing.id}`}
            className="active:scale-[0.98]"
            style={{
              flexShrink: 0,
              width: "65vw",
              aspectRatio: "4/3",
              borderRadius: 16,
              overflow: "hidden",
              position: "relative",
              background: "#EBEBEB",
              display: "block",
              textDecoration: "none",
              marginRight: idx === listings.length - 1 ? 24 : 0,
              transition: "transform 0.15s ease",
            }}
          >
            {listing.image_url ? (
              <img
                src={listing.image_url}
                alt={listing.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                loading="lazy"
              />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "#EBEBEB" }} />
            )}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.05) 100%)",
            }} />
            <div style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
              <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 16, fontWeight: 400, color: "#FFFFFF", lineHeight: 1.2, marginBottom: 4 }}>
                {listing.title}
              </div>
              {listing.google_rating && listing.google_rating > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Star size={14} fill="#E8A83E" color="#E8A83E" />
                  <span style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 14, color: "#FFFFFF" }}>{listing.google_rating}</span>
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
