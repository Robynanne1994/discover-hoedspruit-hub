import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Heart, MapPinCheck, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ListingActionsProps {
  listingId: string;
}

const ListingActions = ({ listingId }: ListingActionsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check if favourited
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

  const { data: beenHere } = useQuery({
    queryKey: ["been-here-check", listingId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("been_here")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", listingId)
        .maybeSingle();
      return data;
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

  const toggleBeenHere = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (beenHere) {
        await supabase.from("been_here").delete().eq("id", beenHere.id);
      } else {
        await supabase.from("been_here").insert({ user_id: user.id, listing_id: listingId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["been-here-check", listingId] });
      queryClient.invalidateQueries({ queryKey: ["been-here"] });
      queryClient.invalidateQueries({ queryKey: ["been-here-count", listingId] });
      toast.success(beenHere ? "Removed from visited" : "Marked as visited!");
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

  return (
    <div className="flex items-center gap-1">
      {/* Save / Unsave */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 h-7 px-2 text-[11px] bg-secondary text-secondary-foreground hover:bg-secondary/80"
        onClick={() => { if (!requireAuth()) toggleFavourite.mutate(); }}
      >
        <Heart className={`h-3 w-3 ${isFavourited ? "fill-current" : ""}`} />
        {isFavourited ? "Saved" : "Save"}
      </Button>

      {/* Share */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 h-7 px-2 text-[11px] bg-secondary text-secondary-foreground hover:bg-secondary/80"
        onClick={handleShare}
      >
        <Share2 className="h-3 w-3" />
        Share
      </Button>

      {/* Been here */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 h-7 px-2 text-[11px] bg-secondary text-secondary-foreground hover:bg-secondary/80"
        onClick={() => { if (!requireAuth()) toggleBeenHere.mutate(); }}
      >
        <MapPinCheck className={`h-3 w-3 ${beenHere ? "fill-current" : ""}`} />
        {beenHere ? "Been Here" : "Been Here?"}
      </Button>
    </div>
  );
};

export default ListingActions;
