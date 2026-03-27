import { Star } from "lucide-react";
import { Link } from "react-router-dom";

interface VenueCardProps {
  image: string;
  name: string;
  rating: number;
  href?: string;
}

const VenueCard = ({ image, name, rating, href }: VenueCardProps) => {
  const content = (
    <div className="group cursor-pointer">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h4 className="font-bold text-sm text-white leading-tight line-clamp-2 drop-shadow-sm">
            {name}
          </h4>
          {rating > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center gap-px">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-2.5 w-2.5 ${
                      i < Math.round(rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-white/30 text-white/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-white/90 font-medium">{rating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
};

export default VenueCard;
