import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPinCheck, Star, MapPin } from "lucide-react";
import BackButton from "@/components/BackButton";

const VisitedPlaces = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: visited, isLoading } = useQuery({
    queryKey: ["visited-places-page", user?.id],
    queryFn: async () => {
      const { data: beenHere } = await supabase
        .from("been_here")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (!beenHere || beenHere.length === 0) return [];

      const listingIds = beenHere.map((b) => b.listing_id);

      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, image_url, location, google_rating")
        .in("id", listingIds);

      const listingsMap = Object.fromEntries(
        (listings || []).map((l: any) => [l.id, l])
      );

      return beenHere
        .map((b) => ({ ...b, details: listingsMap[b.listing_id] }))
        .filter((b) => b.details);
    },
    enabled: !!user,
  });

  const removeVisited = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("been_here").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visited-places-page"] });
      queryClient.invalidateQueries({ queryKey: ["been-here"] });
    },
  });

  if (!loading && !user) {
    return (
      <div className="min-h-screen pb-16 bg-background">
        <div className="px-5 pt-5"><BackButton /></div>
        <div className="px-5 pt-16 text-center">
          <MapPinCheck className="h-10 w-10 mx-auto text-primary/20 mb-5" />
          <h2
            className="text-[22px] font-semibold text-foreground mb-2 tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Sign in to see your visited places
          </h2>
          <p className="text-muted-foreground text-[13px] leading-relaxed mb-8 max-w-xs mx-auto">
            Mark places you've been to and keep track of your adventures.
          </p>
          <Link to="/auth">
            <Button className="rounded-full px-8 text-[13px] font-medium">Sign In / Create Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen pb-16 bg-background">
        <div className="px-5 pt-5"><BackButton /></div>
        <div className="px-5 pt-4 space-y-4">
          <Skeleton className="h-4 w-40" />
          <div className="grid grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const visitedCount = visited?.length || 0;

  return (
    <div className="min-h-screen pb-16 bg-background">
      <div className="px-5 pt-5"><BackButton /></div>

      <div className="px-5 pt-4">
        <p className="text-muted-foreground text-[13px] mb-4">
          {visitedCount} visited place{visitedCount !== 1 ? "s" : ""}
        </p>

        {visitedCount === 0 && (
          <div className="text-center py-20">
            <MapPinCheck className="h-10 w-10 mx-auto text-primary/15 mb-5" />
            <h3
              className="text-[20px] font-semibold text-foreground mb-2 tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              No visited places yet
            </h3>
            <p className="text-muted-foreground text-[13px] mb-8 max-w-xs mx-auto leading-relaxed">
              Places you've marked as visited will appear here
            </p>
            <Link to="/categories">
              <Button className="rounded-full px-8 text-[13px] font-medium" variant="outline">
                Explore Hoedspruit
              </Button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3.5">
          {(visited || []).map((item: any) => {
            const detail = item.details;
            if (!detail) return null;
            const rating = detail.google_rating ? Number(detail.google_rating) : null;
            const location = detail.location;

            return (
              <Link key={item.id} to={`/listing/${item.listing_id}`} className="block group">
                <div className="relative rounded-xl overflow-hidden aspect-[3/4]">
                  {detail.image_url ? (
                    <img
                      src={detail.image_url}
                      alt={detail.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeVisited.mutate(item.id);
                    }}
                    className="absolute top-2.5 right-2.5 bg-card/90 backdrop-blur-sm rounded-full p-1.5 hover:bg-card transition-colors active:scale-95"
                    aria-label="Remove from visited"
                  >
                    <MapPinCheck className="h-3.5 w-3.5 fill-accent text-accent" />
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 p-3.5">
                    <h3
                      className="text-[13px] font-medium text-white leading-snug line-clamp-2 drop-shadow-sm mb-1"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {detail.title}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                          <span className="text-[11px] text-white/85 font-medium">{rating.toFixed(1)}</span>
                        </div>
                      )}
                      {rating && location && <span className="text-white/40 text-[10px]">·</span>}
                      {location && (
                        <span className="text-[11px] text-white/70 truncate">{location}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VisitedPlaces;
