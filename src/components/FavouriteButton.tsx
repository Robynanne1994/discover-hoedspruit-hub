import { Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useGuestAuth";

interface FavouriteButtonProps {
  itemId: string;
  itemType: "listing" | "event" | "special" | "resource";
}

const FavouriteButton = ({ itemId, itemType }: FavouriteButtonProps) => {
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const queryClient = useQueryClient();

  const { data: isFavourited } = useQuery({
    queryKey: ["favourite", itemType, itemId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("favourites" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .eq("item_type", itemType)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (isFavourited) {
        await supabase
          .from("favourites" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("item_id", itemId)
          .eq("item_type", itemType);
      } else {
        await supabase
          .from("favourites" as any)
          .insert({ user_id: user.id, item_id: itemId, item_type: itemType });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favourite", itemType, itemId] });
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
    },
  });

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!requireAuth("save favourites")) return;
        toggle.mutate();
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
