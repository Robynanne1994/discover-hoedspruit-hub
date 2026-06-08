import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useGuestAuth";
import { useIsFavourited, useToggleFavourite } from "@/hooks/useFavourites";
import { Heart, MapPinCheck, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ListingActionsProps {
  listingId: string;
  onWhatToKnow?: () => void;
}

const ListingActions = ({ listingId, onWhatToKnow }: ListingActionsProps) => {
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
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


  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = { title: "Check this out!", url: shareUrl };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) {
        if ((err as Error).name !== "AbortError") {
          try { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); } catch { toast.error("Could not copy link"); }
        }
      }
    } else {
      try { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); } catch { toast.error("Could not copy link"); }
    }
  };

  const btnBase = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors active:scale-95";
  const btnInactive = "bg-card text-foreground border-border/60 hover:bg-muted/50";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggleFavourite}
        className={`${btnBase} ${
          isFavourited
            ? "bg-[#5b4632]/10 text-[#5b4632] border-[#5b4632]/20"
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
