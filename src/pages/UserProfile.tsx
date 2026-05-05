import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsFollowing, useFollowMutation, useFollowCounts } from "@/hooks/useFollows";
import { ArrowLeft, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav from "@/components/BottomNav";
import heroBg from "@/assets/hero-homepage.jpg";

const TEXT_PRIMARY = "#020202";
const TEXT_BODY = "#2B2420";
const MUTED = "rgba(18,18,20,0.55)";
const PAGE_BG = "#EBEBEB";
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const getInitials = (name?: string | null) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
};

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: counts } = useFollowCounts(id);
  const { data: isFollowing } = useIsFollowing(id);
  const { follow, unfollow } = useFollowMutation(id!);

  const { data: visited } = useQuery({
    queryKey: ["user-visited", id],
    queryFn: async () => {
      const { data: bh } = await supabase
        .from("been_here")
        .select("listing_id, created_at")
        .eq("user_id", id!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!bh?.length) return [];
      const ids = bh.map((b) => b.listing_id);
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, image_url")
        .in("id", ids);
      const map = Object.fromEntries((listings || []).map((l: any) => [l.id, l]));
      return bh.map((b) => map[b.listing_id]).filter(Boolean);
    },
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ["user-reviews", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, listing_id, listings(title)")
        .eq("user_id", id!)
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!id,
  });

  const isOwnProfile = user?.id === id;
  const isPending = follow.isPending || unfollow.isPending;
  const following = !!isFollowing;

  const handleFollow = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (following) unfollow.mutate();
    else follow.mutate();
  };

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, paddingBottom: 84, fontFamily: FONT }}>
      {/* Banner */}
      <div style={{ position: "relative", width: "100%", height: 200, overflow: "hidden" }}>
        <img src={heroBg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)",
          }}
        />
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <ArrowLeft size={20} strokeWidth={1.8} color="#FFFFFF" />
        </button>
      </div>

      {/* Avatar overlap */}
      <div style={{ display: "flex", justifyContent: "flex-start", paddingLeft: 24, marginTop: -56 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: "3px solid #FFFFFF",
            background: "#EBEBEB",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 24, fontWeight: 500, color: "rgba(18,18,20,0.4)" }}>
              {getInitials(profile?.display_name)}
            </span>
          )}
        </div>
      </div>

      {/* Profile card */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginTop: 16 }}>
        <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 24 }}>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-5 w-48 mt-2" />
            </div>
          ) : (
            <>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  color: TEXT_PRIMARY,
                  letterSpacing: "0.01em",
                  textAlign: "center",
                  margin: 0,
                }}
              >
                {profile?.display_name || "User"}
              </h1>

              {profile?.bio && (
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 400,
                    color: MUTED,
                    lineHeight: 1.4,
                    textAlign: "center",
                    margin: "8px 0 0",
                  }}
                >
                  {profile.bio}
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
                <Link
                  to={`/profile/${id}/followers`}
                  style={{ display: "flex", alignItems: "baseline", gap: 6, textDecoration: "none" }}
                >
                  <span style={{ fontSize: 16, fontWeight: 500, color: TEXT_PRIMARY }}>{counts?.followers ?? 0}</span>
                  <span style={{ fontSize: 13, fontWeight: 400, color: MUTED }}>Followers</span>
                </Link>
                <Link
                  to={`/profile/${id}/following`}
                  style={{ display: "flex", alignItems: "baseline", gap: 6, textDecoration: "none" }}
                >
                  <span style={{ fontSize: 16, fontWeight: 500, color: TEXT_PRIMARY }}>{counts?.following ?? 0}</span>
                  <span style={{ fontSize: 13, fontWeight: 400, color: MUTED }}>Following</span>
                </Link>
              </div>

              {!isOwnProfile && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                  <button
                    onClick={handleFollow}
                    disabled={isPending}
                    onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                    onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                    onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    style={{
                      height: 48,
                      padding: "12px 20px",
                      borderRadius: 16,
                      fontSize: 15,
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      textTransform: "capitalize",
                      cursor: "pointer",
                      transition: "transform 0.15s ease",
                      ...(following
                        ? {
                            background: "transparent",
                            border: "1.5px solid rgba(18,18,20,0.15)",
                            color: TEXT_BODY,
                            fontWeight: 500,
                          }
                        : {
                            background: "#241F1A",
                            border: "none",
                            color: "#FFFFFF",
                            fontWeight: 600,
                          }),
                    }}
                  >
                    {following ? "Following" : "Follow"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Visited Places */}
      {visited && visited.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: TEXT_PRIMARY,
              letterSpacing: "0.01em",
              margin: 0,
              paddingLeft: 24,
              paddingRight: 24,
            }}
          >
            Visited Places
          </h2>
          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 8,
              paddingLeft: 24,
              paddingRight: 24,
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
            className="no-scrollbar"
          >
            {visited.map((place: any) => (
              <Link
                key={place.id}
                to={`/listing/${place.id}`}
                style={{
                  flex: "0 0 auto",
                  width: 140,
                  aspectRatio: "4 / 5",
                  borderRadius: 16,
                  overflow: "hidden",
                  position: "relative",
                  textDecoration: "none",
                  background: "#d6d6d6",
                  transition: "transform 0.15s ease",
                }}
                onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
                onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                {place.image_url && (
                  <img
                    src={place.image_url}
                    alt=""
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.05) 100%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    padding: 12,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#FFFFFF",
                    lineHeight: 1.2,
                  }}
                >
                  {place.title}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Reviews */}
      {reviews && reviews.length > 0 && (
        <section style={{ marginTop: 24, paddingLeft: 24, paddingRight: 24 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: TEXT_PRIMARY,
              letterSpacing: "0.01em",
              margin: 0,
            }}
          >
            Recent Reviews
          </h2>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {reviews.map((r: any) => (
              <Link
                key={r.id}
                to={`/listing/${r.listing_id}`}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 16,
                  padding: 16,
                  textDecoration: "none",
                  display: "block",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY }}>
                  {r.listings?.title || "Listing"}
                </div>
                <div style={{ display: "flex", gap: 2, marginTop: 6 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      fill={i < r.rating ? "#D4654A" : "transparent"}
                      color="#D4654A"
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                {r.comment && (
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 400,
                      color: MUTED,
                      lineHeight: 1.4,
                      margin: "8px 0 0",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {r.comment}
                  </p>
                )}
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: MUTED,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginTop: 8,
                  }}
                >
                  {formatDate(r.created_at)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <BottomNav />
    </div>
  );
};

export default UserProfile;
