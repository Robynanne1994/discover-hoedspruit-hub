import { Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface FavouriteButtonProps {
  itemId: string;
  itemType: "listing" | "event" | "special";
}

const FavouriteButton = ({ itemId, itemType }: FavouriteButtonProps) => {
  const { user } = useAuth();
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
      if (!user) {
        toast.error("Please sign in to save favourites");
        return;
      }
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
        toggle.mutate();
      }}
      className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-1.5 hover:bg-white transition-colors"
      aria-label={isFavourited ? "Remove from favourites" : "Add to favourites"}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          isFavourited ? "fill-pink-500 text-pink-500" : "text-muted-foreground"
        }`}
      />
    </button>
  );
};

export default FavouriteButton;
