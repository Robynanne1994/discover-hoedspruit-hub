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
    <div className="flex-shrink-0 w-[46%] group cursor-pointer">
      <div className="rounded-xl overflow-hidden aspect-[4/3] mb-2 bg-muted">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            width={512}
            height={512}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
      </div>
      <h4 className="font-bold text-sm text-foreground leading-tight mb-0.5 line-clamp-1">{name}</h4>
      <div className="flex items-center gap-1">
        {rating > 0 && (
          <>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(rating)
                      ? "fill-accent text-accent"
                      : "fill-border text-border"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{rating}</span>
          </>
        )}
        {location && (
          <span className="text-xs text-muted-foreground">
            {rating > 0 ? "· " : ""}{location}
          </span>
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
