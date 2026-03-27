import { Star } from "lucide-react";

interface VenueCardProps {
  image: string;
  name: string;
  rating: number;
  location: string;
}

const VenueCard = ({ image, name, rating, location }: VenueCardProps) => {
  return (
    <div className="flex-shrink-0 w-[46%] group cursor-pointer">
      <div className="rounded-xl overflow-hidden aspect-[4/3] mb-2">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          width={512}
          height={512}
        />
      </div>
      <h4 className="font-bold text-sm text-foreground leading-tight mb-0.5">{name}</h4>
      <div className="flex items-center gap-1">
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
        <span className="text-xs text-muted-foreground">· {location}</span>
      </div>
    </div>
  );
};

export default VenueCard;
