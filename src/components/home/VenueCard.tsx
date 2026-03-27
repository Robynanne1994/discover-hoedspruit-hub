import { Star } from "lucide-react";
import { Link } from "react-router-dom";

interface VenueCardProps {
  image: string;
  name: string;
  rating: number;
  location?: string;
  href?: string;
}

const VenueCard = ({ image, name, rating, location, href }: VenueCardProps) => {
  const content = (
    <div className="flex-shrink-0 w-[44%] group cursor-pointer">
      <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-muted shadow-sm">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-muted-foreground text-xs">No image</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
        {/* Title on image */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <h4 className="font-bold text-[13px] text-white leading-tight line-clamp-2 drop-shadow-sm">
            {name}
          </h4>
        </div>
      </div>
      {/* Rating + location below card */}
      <div className="pt-1.5 px-0.5">
        {rating > 0 && (
          <div className="flex items-center gap-1 mb-0.5">
            <div className="flex items-center gap-px">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-2.5 w-2.5 ${
                    i < Math.floor(rating)
                      ? "fill-accent text-accent"
                      : "fill-border text-border"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">{rating}</span>
          </div>
        )}
        {location && (
          <p className="text-[11px] text-muted-foreground leading-tight line-clamp-1">{location}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
};

export default VenueCard;
