import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useGuestAuth";
import { useShare } from "@/hooks/useShare";
import { useIsFavourited, useToggleFavourite } from "@/hooks/useFavourites";
import { Heart, MapPinCheck, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ListingActionsProps {
  listingId: string;
  /** Used as the headline of the share sheet. */
  title?: string;
  onWhatToKnow?: () => void;
}

const ListingActions = ({ listingId, title, onWhatToKnow }: ListingActionsProps) => {
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const share = useShare();
  const queryClient = useQueryClient();

  const isFavourited = useIsFavourited(listingId, "listing");
  const toggleFavourite = useToggleFavourite();

  const { data: isVisited } = useQuery({
    queryKey: ["been-here", listingId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("been_here")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", listingId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const handleToggleFavourite = () => {
    if (!requireAuth("save listings")) return;
    toggleFavourite.mutate({ itemId: listingId, itemType: "listing", currentlyFavourited: isFavourited });
    toast.success(isFavourited ? "Removed from saved" : "Saved!");
  };

  const toggleVisited = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (isVisited) {
        await supabase
          .from("been_here")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);
      } else {
        await supabase
          .from("been_here")
          .insert({ user_id: user.id, listing_id: listingId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["been-here", listingId] });
      queryClient.invalidateQueries({ queryKey: ["been-here"] });
      toast.success(isVisited ? "Removed from visited" : "Marked as visited!");
    },
  });


  // Opens the phone's own share sheet (copy link + the user's apps); falls back
  // to the in-app sheet on desktop browsers that have none.
  const handleShare = () => {
    share({ title: title || "Hello Hoedspruit", url: `/listing/${listingId}` });
  };

  const btnBase = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors active:scale-95";
  const btnInactive = "bg-card text-foreground border-border/60 hover:bg-muted/50";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggleFavourite}
        className={`${btnBase} ${
          isFavourited
            ? "bg-[#423324]/10 text-[#423324] border-[#423324]/20"
            : btnInactive
        }`}
      >
        <Heart className={`h-3 w-3 ${isFavourited ? "fill-current" : ""}`} />
        {isFavourited ? "Saved" : "Save"}
      </button>

      <button
        onClick={handleShare}
        className={`${btnBase} ${btnInactive}`}
      >
        <Share2 className="h-3 w-3" />
        Share
      </button>

      <button
        onClick={() => { if (requireAuth("track places you've been")) toggleVisited.mutate(); }}
        className={`${btnBase} ${
          isVisited
            ? "bg-accent/10 text-accent border-accent/20"
            : btnInactive
        }`}
      >
        <MapPinCheck className={`h-3 w-3 ${isVisited ? "fill-current" : ""}`} />
        {isVisited ? "Visited" : "Visited"}
      </button>
    </div>
  );
};

export default ListingActions;
