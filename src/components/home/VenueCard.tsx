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
      <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-muted">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-muted-foreground text-xs">No image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3.5">
          <h4
            className="font-medium text-[13px] text-white leading-snug line-clamp-2 drop-shadow-sm"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {name}
          </h4>
          {rating > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              <span className="text-[11px] text-white/85 font-medium">{rating}</span>
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
