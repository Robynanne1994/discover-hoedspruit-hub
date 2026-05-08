import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  useIsFollowing,
  useFollowMutation,
  useFollowCounts,
} from "@/hooks/useFollows";
import {
  ArrowLeft,
  MoreVertical,
  Heart,
  ThumbsUp,
  Calendar as CalendarIcon,
  MapPin,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const PAGE_BG = "#5C6446";
const CREAM = "#EEE8DA";
const SOFT_CREAM = "#F4EFE3";
const INK = "#2A2A24";
const MUTED = "#6B6A5E";
const LINE = "#D9D2C0";
const RUST = "#9B5A3C";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const titleCase = (s?: string | null) =>
  (s || "")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const getInitials = (name?: string | null) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
};

const fmtCount = (n: number) => n.toLocaleString("en-US");

const relTime = (iso: string) => {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - then) / 86400000);
  if (diffDays < 1) return "TODAY";
  if (diffDays === 1) return "1 DAY AGO";
  if (diffDays < 7) return `${diffDays} DAYS AGO`;
  if (diffDays < 14) return "1 WEEK AGO";
  if (diffDays < 30)
    return `${Math.floor(diffDays / 7)} WEEKS AGO`;
  const d = new Date(iso);
  return d
    .toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    .toUpperCase();
};

type Activity = {
  id: string;
  type: "saved" | "recommended" | "been";
  verb: string;
  name: string;
  href: string;
  created_at: string;
};

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [unfollowOpen, setUnfollowOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id!)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const { data: counts } = useFollowCounts(id);
  const { data: isFollowing } = useIsFollowing(id);
  const { follow, unfollow } = useFollowMutation(id!);

  // Saved listings (favourites of type "listing")
  const { data: saved } = useQuery({
    queryKey: ["user-saved-listings", id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("item_id, created_at")
        .eq("user_id", id!)
        .eq("item_type", "listing")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!favs?.length) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, image_url, location, google_rating")
        .in("id", ids);
      const map = Object.fromEntries(
        (listings || []).map((l: any) => [l.id, l]),
      );
      return favs
        .map((f) => ({ ...map[f.item_id], created_at: f.created_at }))
        .filter((l) => l.id);
    },
    enabled: !!id,
  });

  // Saved count (used for the stat)
  const { data: savedCount } = useQuery({
    queryKey: ["user-saved-count", id],
    queryFn: async () => {
      const { count } = await supabase
        .from("favourites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", id!);
      return count ?? 0;
    },
    enabled: !!id,
  });

  // Activity (last 30 days): saves, reviews (recommendations), been_here
  const { data: activity } = useQuery<Activity[]>({
    queryKey: ["user-activity", id],
    queryFn: async () => {
      const since = new Date(
        Date.now() - 30 * 86400000,
      ).toISOString();

      const [favsRes, reviewsRes, beenRes] = await Promise.all([
        supabase
          .from("favourites")
          .select("id, item_id, item_type, created_at")
          .eq("user_id", id!)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("reviews")
          .select("id, listing_id, created_at, listings(title)")
          .eq("user_id", id!)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("been_here")
          .select("id, listing_id, created_at, listings(title)")
          .eq("user_id", id!)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(15),
      ]);

      const favListingIds = (favsRes.data || [])
        .filter((f: any) => f.item_type === "listing")
        .map((f: any) => f.item_id);
      const favEventIds = (favsRes.data || [])
        .filter((f: any) => f.item_type === "event")
        .map((f: any) => f.item_id);

      let favTitleMap: Record<string, { title: string; type: string }> = {};
      if (favListingIds.length) {
        const { data } = await supabase
          .from("listings")
          .select("id, title")
          .in("id", favListingIds);
        (data || []).forEach((l: any) => {
          favTitleMap[l.id] = { title: l.title, type: "listing" };
        });
      }
      if (favEventIds.length) {
        const { data } = await supabase
          .from("events")
          .select("id, title")
          .in("id", favEventIds);
        (data || []).forEach((e: any) => {
          favTitleMap[e.id] = { title: e.title, type: "event" };
        });
      }

      const items: Activity[] = [];

      (favsRes.data || []).forEach((f: any) => {
        const meta = favTitleMap[f.item_id];
        if (!meta) return;
        items.push({
          id: `fav-${f.id}`,
          type: "saved",
          verb: "saved",
          name: meta.title,
          href:
            meta.type === "event"
              ? `/event/${f.item_id}`
              : `/listing/${f.item_id}`,
          created_at: f.created_at,
        });
      });

      (reviewsRes.data || []).forEach((r: any) => {
        if (!r.listings?.title) return;
        items.push({
          id: `rev-${r.id}`,
          type: "recommended",
          verb: "recommended",
          name: r.listings.title,
          href: `/listing/${r.listing_id}`,
          created_at: r.created_at,
        });
      });

      (beenRes.data || []).forEach((b: any) => {
        if (!b.listings?.title) return;
        items.push({
          id: `been-${b.id}`,
          type: "been",
          verb: "been to",
          name: b.listings.title,
          href: `/listing/${b.listing_id}`,
          created_at: b.created_at,
        });
      });

      items.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime(),
      );
      return items.slice(0, 8);
    },
    enabled: !!id,
  });

  const isOwnProfile = user?.id === id;
  const following = !!isFollowing;
  const isPending = follow.isPending || unfollow.isPending;

  const handleFollowClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (following) {
      setUnfollowOpen(true);
    } else {
      follow.mutate();
    }
  };

  const handleShare = async () => {
    setMenuOpen(false);
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: profile?.display_name || "Profile",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast("Link copied");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: PAGE_BG,
        paddingBottom: 100,
        fontFamily: SANS,
        color: CREAM,
      }}
    >
      {/* Cover */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 240,
          overflow: "hidden",
          background:
            "linear-gradient(180deg, #C18866 0%, #8B5C3E 50%, #5C6446 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 30% 60%, rgba(0,0,0,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.08) 0%, transparent 60%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 20,
            right: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 3,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: CREAM,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <ArrowLeft size={16} strokeWidth={1.6} color={INK} />
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="More"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: CREAM,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <MoreVertical size={16} strokeWidth={1.6} color={INK} />
          </button>
        </div>
      </div>

      {/* Masthead */}
      <div
        style={{
          padding: "0 24px",
          position: "relative",
          zIndex: 2,
          marginTop: -56,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            width: 112,
            height: 112,
            borderRadius: "50%",
            background: PAGE_BG,
            padding: 6,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, #E8B999 0%, #C18866 50%, #8B5C3E 100%)",
            }}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 42,
                  color: CREAM,
                }}
              >
                {getInitials(profile?.display_name || profile?.username)}
              </span>
            )}
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Skeleton className="h-10 w-48 bg-white/10" />
              <Skeleton className="h-4 w-24 bg-white/10" />
            </div>
          ) : (
            <>
              <h1
                style={{
                  fontFamily: SERIF,
                  fontWeight: 400,
                  fontSize: 42,
                  lineHeight: 1.0,
                  letterSpacing: "-1px",
                  color: CREAM,
                  margin: 0,
                  marginBottom: 6,
                }}
              >
                {titleCase(profile?.display_name) || "User"}
              </h1>

              {profile?.username && (
                <div
                  style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: 14,
                    color: CREAM,
                    opacity: 0.65,
                    marginBottom: 14,
                  }}
                >
                  @{profile.username.toLowerCase()}
                </div>
              )}

              {profile?.bio && (
                <p
                  style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: 16,
                    lineHeight: 1.5,
                    color: CREAM,
                    opacity: 0.85,
                    maxWidth: 280,
                    margin: "0 auto 24px",
                  }}
                >
                  {profile.bio}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats + actions card */}
      <div style={{ padding: "0 24px", marginBottom: 32 }}>
        <div
          style={{
            background: CREAM,
            borderRadius: 20,
            padding: "20px 22px",
          }}
        >
          {/* Stats row */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 36,
              paddingBottom: 16,
              borderBottom: `1px solid ${LINE}`,
              marginBottom: 16,
            }}
          >
            {[
              {
                n: counts?.followers ?? 0,
                label: (counts?.followers ?? 0) === 1 ? "Follower" : "Followers",
                href: `/profile/${id}/followers`,
              },
              {
                n: counts?.following ?? 0,
                label: "Following",
                href: `/profile/${id}/following`,
              },
              {
                n: savedCount ?? 0,
                label: "Saved",
                href: null as string | null,
              },
            ].map((s, i) => {
              const inner = (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 400,
                      fontSize: 24,
                      lineHeight: 1,
                      letterSpacing: "-0.4px",
                      color: INK,
                    }}
                  >
                    {fmtCount(s.n)}
                  </span>
                  <span
                    style={{
                      fontFamily: SANS,
                      fontWeight: 400,
                      fontSize: 10.5,
                      letterSpacing: "1.8px",
                      textTransform: "uppercase",
                      color: MUTED,
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              );
              return s.href ? (
                <Link key={i} to={s.href} style={{ textDecoration: "none" }}>
                  {inner}
                </Link>
              ) : (
                <div key={i}>{inner}</div>
              );
            })}
          </div>

          {/* Action row */}
          {!isOwnProfile && (
            <div style={{ display: "flex", gap: 10 }}>
              {!following && (
                <button
                  onClick={handleFollowClick}
                  disabled={isPending}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 999,
                    background: INK,
                    color: CREAM,
                    border: "none",
                    fontFamily: SANS,
                    fontWeight: 400,
                    fontSize: 14,
                    letterSpacing: "0.1px",
                    cursor: "pointer",
                  }}
                >
                  Follow
                </button>
              )}

              {following && (
                <button
                  onClick={handleFollowClick}
                  disabled={isPending}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 999,
                    background: "transparent",
                    color: INK,
                    border: `1px solid ${LINE}`,
                    fontFamily: SANS,
                    fontWeight: 400,
                    fontSize: 14,
                    letterSpacing: "0.1px",
                    cursor: "pointer",
                  }}
                >
                  Following
                </button>
              )}

              {mutual && (
                <button
                  onClick={handleMessage}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 999,
                    background: INK,
                    color: CREAM,
                    border: "none",
                    fontFamily: SANS,
                    fontWeight: 400,
                    fontSize: 14,
                    letterSpacing: "0.1px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <MessageCircle size={14} strokeWidth={1.8} color={CREAM} fill="none" />
                  Message
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Finds */}
      {saved && saved.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div
            style={{
              padding: "0 24px",
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <h2
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 28,
                lineHeight: 1,
                letterSpacing: "-0.5px",
                color: CREAM,
                margin: 0,
                textTransform: "lowercase",
              }}
            >
              {possessivePronoun} finds
            </h2>
            <Link
              to={`/profile/${id}/saved`}
              style={{
                fontFamily: SANS,
                fontWeight: 400,
                fontSize: 11,
                letterSpacing: "1.8px",
                textTransform: "uppercase",
                color: CREAM,
                opacity: 0.75,
                textDecoration: "none",
              }}
            >
              See All
            </Link>
          </div>

          <div
            style={{
              display: "flex",
              gap: 14,
              overflowX: "auto",
              paddingLeft: 24,
              paddingRight: 24,
              scrollbarWidth: "none",
            }}
            className="no-scrollbar"
          >
            {saved.map((l: any) => (
              <Link
                key={l.id}
                to={`/listing/${l.id}`}
                style={{
                  flex: "0 0 auto",
                  width: 240,
                  background: CREAM,
                  borderRadius: 20,
                  overflow: "hidden",
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: 180,
                    background: "#d6d6d6",
                  }}
                >
                  {l.image_url && (
                    <img
                      src={l.image_url}
                      alt=""
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  )}
                </div>
                <div style={{ padding: "16px 18px 18px" }}>
                  <div
                    style={{
                      fontFamily: SANS,
                      fontWeight: 400,
                      fontSize: 17,
                      lineHeight: 1.2,
                      letterSpacing: "-0.2px",
                      color: INK,
                      marginBottom: 6,
                    }}
                  >
                    {titleCase(l.title)}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: SANS,
                      fontSize: 12.5,
                      color: MUTED,
                    }}
                  >
                    {l.google_rating && (
                      <span>★ {Number(l.google_rating).toFixed(1)}</span>
                    )}
                    {l.google_rating && l.location && (
                      <span
                        style={{
                          width: 3,
                          height: 3,
                          borderRadius: "50%",
                          background: MUTED,
                          opacity: 0.6,
                          display: "inline-block",
                        }}
                      />
                    )}
                    {l.location && <span>{l.location}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent activity */}
      {activity && activity.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div
            style={{
              padding: "0 24px",
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <h2
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 28,
                lineHeight: 1,
                letterSpacing: "-0.5px",
                color: CREAM,
                margin: 0,
                textTransform: "lowercase",
              }}
            >
              recent
            </h2>
            <span
              style={{
                fontFamily: SANS,
                fontWeight: 400,
                fontSize: 11,
                letterSpacing: "1.8px",
                textTransform: "uppercase",
                color: CREAM,
                opacity: 0.75,
              }}
            >
              Last 30 Days
            </span>
          </div>

          <div style={{ padding: "0 24px" }}>
            <div
              style={{
                background: CREAM,
                borderRadius: 20,
                padding: "6px 20px",
                overflow: "hidden",
              }}
            >
              {activity.map((a, i) => {
                const isSave = a.type === "saved";
                const Icon =
                  a.type === "saved"
                    ? Heart
                    : a.type === "recommended"
                    ? ThumbsUp
                    : a.type === "been"
                    ? MapPin
                    : CalendarIcon;
                return (
                  <Link
                    key={a.id}
                    to={a.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 0",
                      borderTop:
                        i === 0 ? "none" : `1px solid ${LINE}`,
                      textDecoration: "none",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: isSave ? RUST : SOFT_CREAM,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon
                        size={14}
                        strokeWidth={1.6}
                        color={isSave ? CREAM : MUTED}
                        fill={isSave ? CREAM : "none"}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: SERIF,
                          fontStyle: "italic",
                          fontWeight: 400,
                          fontSize: 13,
                          color: MUTED,
                          lineHeight: 1.3,
                        }}
                      >
                        {a.verb}{" "}
                        <span
                          style={{
                            fontFamily: SANS,
                            fontStyle: "normal",
                            color: INK,
                          }}
                        >
                          {titleCase(a.name)}
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: SANS,
                          fontWeight: 400,
                          fontSize: 11.5,
                          letterSpacing: "1.6px",
                          textTransform: "uppercase",
                          color: MUTED,
                          opacity: 0.85,
                          marginTop: 2,
                        }}
                      >
                        {relTime(a.created_at)}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        color: MUTED,
                        flexShrink: 0,
                      }}
                    >
                      ↗
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Cross-link footer */}
      {!isOwnProfile && profile && (
        <div
          style={{
            margin: "0 24px",
            paddingTop: 16,
            borderTop: "1px solid rgba(238, 232, 218, 0.15)",
            textAlign: "center",
          }}
        >
          <Link
            to={`/profile/${id}/saved`}
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 15,
              color: CREAM,
              opacity: 0.55,
              textDecoration: "none",
              textTransform: "lowercase",
            }}
          >
            more from {firstName}
            <span style={{ fontSize: 12, marginLeft: 6 }}>↗</span>
          </Link>
        </div>
      )}

      {/* Three-dots action sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="bottom"
          style={{
            background: CREAM,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            border: "none",
          }}
        >
          <SheetHeader>
            <SheetTitle
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                color: INK,
                textTransform: "lowercase",
              }}
            >
              options
            </SheetTitle>
          </SheetHeader>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 12 }}>
            {[
              { label: "Share This Profile", onClick: handleShare },
              {
                label: "Report User",
                onClick: () => {
                  setMenuOpen(false);
                  toast("Report submitted. Thank you.");
                },
              },
              {
                label: "Block User",
                onClick: () => {
                  setMenuOpen(false);
                  toast("User blocked");
                },
              },
            ].map((o) => (
              <button
                key={o.label}
                onClick={o.onClick}
                style={{
                  textAlign: "left",
                  padding: "16px 0",
                  borderTop: `1px solid ${LINE}`,
                  background: "transparent",
                  border: "none",
                  borderBottom: 0,
                  borderLeft: 0,
                  borderRight: 0,
                  fontFamily: SANS,
                  fontSize: 15,
                  color: INK,
                  cursor: "pointer",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Unfollow confirmation */}
      <Dialog open={unfollowOpen} onOpenChange={setUnfollowOpen}>
        <DialogContent style={{ background: CREAM, border: "none", borderRadius: 20 }}>
          <DialogHeader>
            <DialogTitle
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                color: INK,
              }}
            >
              Unfollow {titleCase(profile?.display_name) || "this user"}?
            </DialogTitle>
          </DialogHeader>
          <DialogFooter style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button
              onClick={() => setUnfollowOpen(false)}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 999,
                background: "transparent",
                border: `1px solid ${LINE}`,
                color: INK,
                fontFamily: SANS,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                unfollow.mutate();
                setUnfollowOpen(false);
              }}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 999,
                background: INK,
                border: "none",
                color: CREAM,
                fontFamily: SANS,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Unfollow
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default UserProfile;
