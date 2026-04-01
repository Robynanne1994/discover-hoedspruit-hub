import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Heart, MapPinCheck, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ListingActionsProps {
  listingId: string;
  onWhatToKnow?: () => void;
}

const ListingActions = ({ listingId, onWhatToKnow }: ListingActionsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: isFavourited } = useQuery({
    queryKey: ["favourite", "listing", listingId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("favourites")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", listingId)
        .eq("item_type", "listing")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

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

  const toggleFavourite = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (isFavourited) {
        await supabase
          .from("favourites")
          .delete()
          .eq("user_id", user.id)
          .eq("item_id", listingId)
          .eq("item_type", "listing");
      } else {
        await supabase
          .from("favourites")
          .insert({ user_id: user.id, item_id: listingId, item_type: "listing" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favourite", "listing", listingId] });
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      queryClient.invalidateQueries({ queryKey: ["saved-listings-page"] });
      toast.success(isFavourited ? "Removed from saved" : "Saved!");
    },
  });

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

  const requireAuth = () => {
    if (!user) {
      toast.info("Sign in to use this feature");
      navigate("/auth");
      return true;
    }
    return false;
  };

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
        onClick={() => { if (!requireAuth()) toggleFavourite.mutate(); }}
        className={`${btnBase} ${
          isFavourited
            ? "bg-primary/8 text-primary border-primary/20"
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
        onClick={() => { if (!requireAuth()) toggleVisited.mutate(); }}
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
