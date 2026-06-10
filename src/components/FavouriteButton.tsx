import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useGuestAuth";
import { useIsFavourited, useToggleFavourite } from "@/hooks/useFavourites";

interface FavouriteButtonProps {
  itemId: string;
  itemType: "listing" | "event" | "special" | "resource";
}

const FavouriteButton = ({ itemId, itemType }: FavouriteButtonProps) => {
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const isFavourited = useIsFavourited(itemId, itemType);
  const toggle = useToggleFavourite();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!requireAuth("save favourites")) return;
        if (!user) return;
        toggle.mutate({ itemId, itemType, currentlyFavourited: isFavourited });
      }}
      className="absolute top-2.5 right-2.5 z-10 bg-white/80 backdrop-blur-md rounded-full h-10 w-10 flex items-center justify-center hover:bg-white transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
      aria-label={isFavourited ? "Remove from favourites" : "Add to favourites"}
    >
      <Heart
        strokeWidth={1.75}
        className={`h-[20px] w-[20px] transition-colors ${
          isFavourited ? "fill-[#5b4632] text-[#5b4632]" : "text-[#1a1a1a]"
        }`}
      />
    </button>
  );
};

export default FavouriteButton;
