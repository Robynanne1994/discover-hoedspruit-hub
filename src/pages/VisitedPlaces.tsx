import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Star, ArrowLeft, Search } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const VisitedPlaces = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

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

  const visitedCount = visited?.length || 0;

  const filtered = (visited || []).filter((item: any) =>
    item.details?.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (!loading && !user) {
    return (
      <div style={{ minHeight: "100vh", background: "#ebebeb", paddingBottom: 72 }}>
        <div style={{ paddingTop: 44, paddingLeft: 24, paddingRight: 24 }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <ArrowLeft size={18} strokeWidth={2} color="rgba(18,18,20,0.4)" />
            <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(18,18,20,0.4)", letterSpacing: 0.2 }}>Back</span>
          </button>
        </div>
        <div style={{ paddingTop: 80, textAlign: "center", paddingLeft: 24, paddingRight: 24 }}>
          <MapPin size={48} strokeWidth={1.5} color="rgba(18,18,20,0.15)" style={{ margin: "0 auto" }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2b2420", marginTop: 16, marginBottom: 8 }}>Sign in to see your visited places</h2>
          <p style={{ fontSize: 14, color: "rgba(18,18,20,0.4)", marginBottom: 24 }}>Mark places you've been to and keep track of your adventures.</p>
          <Link to="/auth" style={{ textDecoration: "none" }}>
            <button style={{ background: "#121214", color: "#fff", border: "none", borderRadius: 9999, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Sign In / Create Account
            </button>
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (loading || isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#ebebeb", paddingBottom: 72 }}>
        <div style={{ paddingTop: 44, paddingLeft: 24, paddingRight: 24 }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <ArrowLeft size={18} strokeWidth={2} color="rgba(18,18,20,0.4)" />
            <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(18,18,20,0.4)", letterSpacing: 0.2 }}>Back</span>
          </button>
        </div>
        <div style={{ marginTop: 28, paddingLeft: 24, paddingRight: 24 }}>
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-4 w-32 mb-6" />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} style={{ height: 200, borderRadius: 16, width: "100%" }} />
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#ebebeb", paddingBottom: 72 }}>
      {/* Back button */}
      <div style={{ paddingTop: 44, paddingLeft: 24, paddingRight: 24 }}>
        <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ArrowLeft size={18} strokeWidth={2} color="rgba(18,18,20,0.4)" />
          <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(18,18,20,0.4)", letterSpacing: 0.2 }}>Back</span>
        </button>
      </div>

      {/* Heading */}
      <div style={{ marginTop: 28, paddingLeft: 20, paddingRight: 20 }}>
        <h1 style={{ fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif", fontSize: 40, fontWeight: 400, lineHeight: 0.95, letterSpacing: "-0.01em", color: "#020202", textTransform: "capitalize", margin: 0, whiteSpace: "nowrap" }}>
          Visited Places
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ marginTop: 12, paddingLeft: 24, paddingRight: 24 }}>
        <p style={{ fontSize: 14, color: "rgba(18,18,20,0.4)", letterSpacing: 0.2, lineHeight: 1.4, fontStyle: "italic", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", margin: 0 }}>
          {visitedCount === 1 ? "1 place you've been to" : `${visitedCount} places you've been to`}
        </p>
      </div>

      {/* Search */}
      <div style={{ marginTop: 24, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          background: "rgba(18,18,20,0.04)",
          border: "1px solid rgba(18,18,20,0.08)",
          borderRadius: 16,
          padding: "14px 16px",
          gap: 10,
        }}>
          <Search size={18} strokeWidth={2} color="rgba(18,18,20,0.3)" />
          <input
            type="text"
            placeholder="Search visited places..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "#2b2420",
              letterSpacing: 0.2,
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ marginTop: 28, paddingLeft: 24, paddingRight: 24, marginBottom: 100 }}>
        {visitedCount === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <MapPin size={48} strokeWidth={1.5} color="rgba(18,18,20,0.15)" style={{ margin: "0 auto" }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#2b2420", marginTop: 16, marginBottom: 8 }}>No places visited yet</h3>
            <p style={{ fontSize: 14, color: "rgba(18,18,20,0.4)", textAlign: "center" }}>
              Tap 'Visited' on any listing to track where you've been
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <p style={{ fontSize: 14, color: "rgba(18,18,20,0.4)" }}>No results found</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map((item: any) => {
              const detail = item.details;
              if (!detail) return null;
              const rating = detail.google_rating ? Number(detail.google_rating) : null;
              const location = detail.location;

              return (
                <Link key={item.id} to={`/listing/${item.listing_id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", height: 200, background: "#f0f0f0" }}>
                    {detail.image_url ? (
                      <img
                        src={detail.image_url}
                        alt={detail.title}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <MapPin size={24} color="rgba(18,18,20,0.15)" />
                      </div>
                    )}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)",
                    }} />
                    <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", lineHeight: 1.2, marginBottom: 4 }}>
                        {detail.title}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {rating && (
                          <>
                            <Star size={12} fill="#E8A83E" color="#E8A83E" />
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{rating.toFixed(1)}</span>
                          </>
                        )}
                        {rating && location && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>·</span>}
                        {location && (
                          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default VisitedPlaces;
