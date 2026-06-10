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
      className="absolute top-2 right-2 z-10 bg-white/95 backdrop-blur-sm rounded-full h-8 w-8 flex items-center justify-center hover:bg-white transition-colors shadow-[0_1px_4px_rgba(0,5,5,0.14)]"
      aria-label={isFavourited ? "Remove from favourites" : "Add to favourites"}
    >
      <Heart
        strokeWidth={2}
        className={`h-4 w-4 transition-colors ${
          isFavourited ? "fill-[#5b4632] text-[#5b4632]" : "text-[rgba(18,18,20,0.55)]"
        }`}
      />
    </button>
  );
};

export default FavouriteButton;
