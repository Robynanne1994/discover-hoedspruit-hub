import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ReviewSectionProps {
  listingId: string;
}

const ReviewSection = ({ listingId }: ReviewSectionProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: reviews } = useQuery({
    queryKey: ["reviews", listingId],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*, profiles(display_name)")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: beenHereCount } = useQuery({
    queryKey: ["been-here-count", listingId],
    queryFn: async () => {
      const { count } = await supabase
        .from("been_here")
        .select("id", { count: "exact", head: true })
        .eq("listing_id", listingId);
      return count || 0;
    },
  });

  const existingReview = reviews?.find((r: any) => r.user_id === user?.id);

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        listing_id: listingId,
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", listingId] });
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
      setRating(0);
      setComment("");
      toast.success("Review submitted!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", listingId] });
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
      toast.success("Review deleted");
    },
  });

  const avgRating = reviews?.length
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="mb-10">
      {/* Summary */}
      <div className="flex items-center gap-4 mb-6">
        {avgRating && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-5 w-5 ${s <= Math.round(Number(avgRating)) ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
              ))}
            </div>
            <span className="font-semibold text-foreground">{avgRating}</span>
            <span className="text-sm text-muted-foreground">({reviews?.length} review{reviews?.length !== 1 ? "s" : ""})</span>
          </div>
        )}
        {beenHereCount ? (
          <span className="text-sm text-muted-foreground">
            {beenHereCount} {beenHereCount === 1 ? "person has" : "people have"} been here
          </span>
        ) : null}
      </div>

      <h2 className="font-sans text-2xl font-bold text-foreground mb-4">Reviews</h2>

      {/* Write review form */}
      {user && !existingReview ? (
        <form
          onSubmit={(e) => { e.preventDefault(); if (rating === 0) { toast.error("Please select a rating"); return; } submitReview.mutate(); }}
          className="bg-card border border-border rounded-xl p-5 mb-6 space-y-4"
        >
          <p className="font-medium text-foreground text-sm">Leave a review</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5"
              >
                <Star className={`h-6 w-6 transition-colors ${s <= (hoverRating || rating) ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Share your experience (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <Button type="submit" size="sm" disabled={submitReview.isPending}>
            Submit Review
          </Button>
        </form>
      ) : !user ? (
        <div className="bg-card border border-border rounded-xl p-5 mb-6 text-center">
          <p className="text-muted-foreground text-sm mb-3">Sign in to leave a review</p>
          <Button size="sm" variant="outline" onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      ) : null}

      {/* Reviews list */}
      {reviews?.length ? (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">
                    {review.profiles?.display_name || "Anonymous"}
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                  {review.user_id === user?.id && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteReview.mutate(review.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
      )}
    </div>
  );
};

export default ReviewSection;
