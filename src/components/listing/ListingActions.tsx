import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Heart, Info, Share2 } from "lucide-react";
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
    <div className="flex items-center gap-2">
      <button
        onClick={() => { if (!requireAuth()) toggleFavourite.mutate(); }}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors active:scale-95 ${
          isFavourited
            ? "bg-primary/8 text-primary border-primary/20"
            : "bg-card text-foreground border-border/60 hover:bg-muted/50"
        }`}
      >
        <Heart className={`h-3 w-3 ${isFavourited ? "fill-current" : ""}`} />
        {isFavourited ? "Saved" : "Save"}
      </button>

      <button
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-card text-foreground border border-border/60 hover:bg-muted/50 transition-colors active:scale-95"
      >
        <Share2 className="h-3 w-3" />
        Share
      </button>

      <button
        onClick={onWhatToKnow}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-card text-foreground border border-border/60 hover:bg-muted/50 transition-colors active:scale-95"
      >
        <Info className="h-3 w-3" />
        What to Know
      </button>
    </div>
  );
};

export default ListingActions;
