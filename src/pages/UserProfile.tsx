import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  useIsFollowing,
  useFollowMutation,
  useFollowCounts,
} from "@/hooks/useFollows";
import { ArrowLeft, MoreVertical, Heart, MapPin } from "lucide-react";
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
import PageHeader from "@/components/PageHeader";
import ReportUserDialog from "@/components/ReportUserDialog";
import { useRequireAuth } from "@/hooks/useGuestAuth";

const PAGE_BG = "#E6E0CC";
const CREAM = "#f5f0e8";
const SOFT_CREAM = "#ffffff";
const INK = "#020202";
const BODY = "#2b2420";
const MUTED = "#6b5d4a";
const LINE = "rgba(0,0,0,0.08)";
const RUST = "#715a3d";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const timeAgo = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) {
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "JUST NOW";
    return `${hours} ${hours === 1 ? "HOUR" : "HOURS"} AGO`;
  }
  if (days < 30) return `${days} ${days === 1 ? "DAY" : "DAYS"} AGO`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
};

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

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [unfollowOpen, setUnfollowOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const queryClient = useQueryClient();

  // Is the signed-in user currently blocking this profile?
  const { data: isBlocked } = useQuery({
    queryKey: ["user-blocked", user?.id, id],
    enabled: !!user?.id && !!id && user!.id !== id,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_blocks" as any)
        .select("id")
        .eq("blocker_id", user!.id)
        .eq("blocked_id", id!)
        .maybeSingle();
      return !!data;
    },
  });

  const handleBlock = async () => {
    if (!user || !id) return;
    const { error } = await supabase
      .from("user_blocks" as any)
      .insert({ blocker_id: user.id, blocked_id: id } as any);
    if (error) {
      toast.error("Could not block user. Please try again.");
      return;
    }
    queryClient.setQueryData(["user-blocked", user.id, id], true);
    toast.success("User blocked");
  };

  const handleUnblock = async () => {
    if (!user || !id) return;
    const { error } = await supabase
      .from("user_blocks" as any)
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", id);
    if (error) {
      toast.error("Could not unblock user. Please try again.");
      return;
    }
    queryClient.setQueryData(["user-blocked", user.id, id], false);
    toast.success("User unblocked");
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", id],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_profiles", { _ids: [id!] });
      return (data && data[0]) || null;
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
      const { data } = await supabase.rpc("get_user_saved_count", { _user_id: id! });
      return (data as number) ?? 0;
    },
    enabled: !!id,
  });

  // Saved events
  const { data: savedEvents } = useQuery({
    queryKey: ["user-saved-events", id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("item_id, created_at")
        .eq("user_id", id!)
        .eq("item_type", "event")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!favs?.length) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: events } = await supabase
        .from("events")
        .select("id, title, image_url, location, date, start_date, end_date")
        .in("id", ids);
      const map = Object.fromEntries((events || []).map((e: any) => [e.id, e]));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return favs
        .map((f) => map[f.item_id])
        .filter(Boolean)
        .filter((e) => {
          if (e.end_date) return new Date(e.end_date) >= today;
          if (e.start_date) return new Date(e.start_date) >= today;
          return true; // legacy events with no structured date
        });
    },
    enabled: !!id,
  });

  // Saved specials
  const { data: savedSpecials } = useQuery({
    queryKey: ["user-saved-specials", id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("item_id, created_at")
        .eq("user_id", id!)
        .eq("item_type", "special")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!favs?.length) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: specials } = await supabase
        .from("specials")
        .select("id, title, image_url, business_name, deal_label, valid_until, is_active")
        .in("id", ids);
      const map = Object.fromEntries((specials || []).map((s: any) => [s.id, s]));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return favs
        .map((f) => map[f.item_id])
        .filter(Boolean)
        .filter((s) => {
          if (s.is_active === false) return false;
          if (s.valid_until) return new Date(s.valid_until) >= today;
          return true;
        });
    },
    enabled: !!id,
  });

  // Been to (visited places)
  const { data: beenTo } = useQuery({
    queryKey: ["user-been-to", id],
    queryFn: async () => {
      const { data: rows } = await supabase.rpc("get_user_been_here", { _user_id: id! });
      const limited = (rows || []).slice(0, 20);
      if (!limited.length) return [];
      const ids = limited.map((r: any) => r.listing_id);
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, image_url, location, google_rating")
        .in("id", ids);
      const map = Object.fromEntries((listings || []).map((l: any) => [l.id, l]));
      return limited.map((r: any) => map[r.listing_id]).filter(Boolean);
    },
    enabled: !!id,
  });

  // Activity timeline (only when not private)
  const activityEnabled = !!id && profile?.activity_private === false;
  const { data: activity } = useQuery({
    queryKey: ["user-activity", id],
    queryFn: async () => {
      const [{ data: favs }, { data: visits }] = await Promise.all([
        supabase
          .from("favourites")
          .select("item_id, item_type, created_at")
          .eq("user_id", id!)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.rpc("get_user_been_here", { _user_id: id! }),
      ]);
      const listingIds = new Set<string>();
      const eventIds = new Set<string>();
      const specialIds = new Set<string>();
      (favs || []).forEach((f) => {
        if (f.item_type === "listing") listingIds.add(f.item_id);
        if (f.item_type === "event") eventIds.add(f.item_id);
        if (f.item_type === "special") specialIds.add(f.item_id);
      });
      (visits || []).forEach((v) => listingIds.add(v.listing_id));
      const [lr, er, sr] = await Promise.all([
        listingIds.size ? supabase.from("listings").select("id, title").in("id", Array.from(listingIds)) : Promise.resolve({ data: [] as any[] }),
        eventIds.size ? supabase.from("events").select("id, title").in("id", Array.from(eventIds)) : Promise.resolve({ data: [] as any[] }),
        specialIds.size ? supabase.from("specials").select("id, title").in("id", Array.from(specialIds)) : Promise.resolve({ data: [] as any[] }),
      ]);
      const lMap = Object.fromEntries((lr.data || []).map((x: any) => [x.id, x]));
      const eMap = Object.fromEntries((er.data || []).map((x: any) => [x.id, x]));
      const sMap = Object.fromEntries((sr.data || []).map((x: any) => [x.id, x]));
      type Row = { kind: "save" | "visit"; verb: string; name: string; href: string; created_at: string };
      const rows: Row[] = [];
      (favs || []).forEach((f) => {
        if (f.item_type === "listing" && lMap[f.item_id]) {
          rows.push({ kind: "save", verb: "saved", name: titleCase(lMap[f.item_id].title), href: `/listing/${f.item_id}`, created_at: f.created_at });
        } else if (f.item_type === "event" && eMap[f.item_id]) {
          rows.push({ kind: "save", verb: "is going to", name: titleCase(eMap[f.item_id].title), href: `/event/${f.item_id}`, created_at: f.created_at });
        } else if (f.item_type === "special" && sMap[f.item_id]) {
          rows.push({ kind: "save", verb: "saved", name: titleCase(sMap[f.item_id].title), href: `/special/${f.item_id}`, created_at: f.created_at });
        }
      });
      (visits || []).forEach((v) => {
        if (lMap[v.listing_id]) {
          rows.push({ kind: "visit", verb: "has been to", name: titleCase(lMap[v.listing_id].title), href: `/listing/${v.listing_id}`, created_at: v.created_at });
        }
      });
      rows.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      return rows;
    },
    enabled: activityEnabled,
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
        color: BODY,
      }}
    >
      <PageHeader
        title="Profile"
        right={
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="More"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#FFFFFF",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <MoreVertical size={16} strokeWidth={1.6} color={"#1A1A1A"} />
          </button>
        }
      />

      {/* Blocked banner */}
      {isBlocked && (
        <div style={{ padding: "12px 20px 0" }}>
          <div
            style={{
              background: "#FFFFFF",
              border: `1px solid ${LINE}`,
              borderRadius: 14,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <span
              style={{
                fontFamily: SANS,
                fontSize: 13.5,
                color: INK,
                lineHeight: 1.4,
              }}
            >
              You have blocked{" "}
              <strong style={{ fontWeight: 600 }}>
                {titleCase(profile?.display_name) ||
                  (profile?.username ? `@${profile.username}` : "this user")}
              </strong>
              .
            </span>
            <button
              onClick={handleUnblock}
              style={{
                flexShrink: 0,
                height: 32,
                padding: "0 14px",
                borderRadius: 999,
                background: INK,
                color: "#fff",
                border: "none",
                fontFamily: SANS,
                fontSize: 12.5,
                fontWeight: 600,
                letterSpacing: "0.04em",
                cursor: "pointer",
              }}
            >
              Unblock
            </button>
          </div>
        </div>
      )}

      {/* Profile card — matches MyProfile */}
      <div style={{ padding: "16px 20px 0" }}>
        <section style={{ background: "#FFFFFF", borderRadius: 18, padding: "16px 16px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                overflow: "hidden",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #E8B999 0%, #C18866 50%, #8B5C3E 100%)",
              }}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 26, color: "#fff" }}>
                  {getInitials(profile?.display_name || profile?.username)}
                </span>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {isLoading ? (
                <Skeleton className="h-7 w-40" />
              ) : (
                <>
                  <h1
                    style={{
                      fontFamily: '"Bricolage Grotesque", ' + SANS,
                      fontWeight: 700,
                      fontSize: 22,
                      lineHeight: 1.15,
                      letterSpacing: "-0.4px",
                      color: "#1A1A1A",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {titleCase(profile?.display_name) || "User"}
                  </h1>
                  {(() => {
                    const handle = profile?.username
                      ? profile.username.toLowerCase()
                      : (profile?.display_name || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
                    if (!handle) return null;
                    return (
                      <div
                        style={{
                          fontFamily: SANS,
                          fontWeight: 400,
                          fontSize: 13,
                          color: "rgba(26,26,26,0.55)",
                          marginTop: 2,
                        }}
                      >
                        @{handle}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {!isOwnProfile && (
              <button
                onClick={handleFollowClick}
                disabled={isPending}
                aria-label={following ? "Unfollow" : "Follow"}
                style={{
                  flexShrink: 0,
                  height: 32,
                  padding: "0 14px",
                  borderRadius: 999,
                  background: following ? "#F2EFE5" : "#1A1A1A",
                  color: following ? "#1A1A1A" : "#FFFFFF",
                  border: `1px solid ${"#1A1A1A"}`,
                  fontFamily: SANS,
                  fontWeight: 600,
                  fontSize: 13,
                  letterSpacing: "0.02em",
                  cursor: "pointer",
                }}
              >
                {following ? "Following" : "Follow"}
              </button>
            )}
          </div>

          {profile?.bio && (
            <p
              style={{
                fontFamily: SANS,
                fontWeight: 400,
                fontSize: 14,
                lineHeight: 1.5,
                letterSpacing: "0.01em",
                color: "#1A1A1A",
                margin: "12px 2px 0",
              }}
            >
              {profile.bio}
            </p>
          )}

          {/* Stats inner card */}
          <div
            style={{
              marginTop: 14,
              background: "#F2EFE5",
              borderRadius: 14,
              padding: "12px 6px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
            }}
          >
            {[
              { label: (counts?.followers ?? 0) === 1 ? "FOLLOWER" : "FOLLOWERS", value: counts?.followers ?? 0, to: `/profile/${id}/followers`, clickable: true },
              { label: "FOLLOWING", value: counts?.following ?? 0, to: `/profile/${id}/following`, clickable: true },
              { label: "SAVED", value: savedCount ?? 0, to: `/profile/${id}/saved`, clickable: true },
            ].map((s, i) => {
              const inner = (
                <>
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 20, color: "#1A1A1A", lineHeight: 1 }}>
                    {fmtCount(s.value)}
                  </span>
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      color: "rgba(26,26,26,0.75)",
                      marginTop: 6,
                    }}
                  >
                    {s.label}
                  </span>
                </>
              );
              const sharedStyle: React.CSSProperties = {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textDecoration: "none",
                borderLeft: i === 0 ? "none" : `1px solid #1A1A1A`,
              };
              return s.clickable ? (
                <Link key={s.label} to={s.to} style={sharedStyle}>{inner}</Link>
              ) : (
                <div key={s.label} style={sharedStyle}>{inner}</div>
              );
            })}
          </div>
        </section>
      </div>

      <div style={{ height: 24 }} />


      {(() => {
        const sections: Array<{
          title: string;
          items: any[];
          hrefFor: (it: any) => string;
          subtitleFor: (it: any) => React.ReactNode;
        }> = [
          {
            title: "saved listings",
            items: saved || [],
            hrefFor: (l) => `/listing/${l.id}`,
            subtitleFor: (l) => (
              <>
                {l.google_rating && <span>★ {Number(l.google_rating).toFixed(1).replace(/\.0$/, "")}</span>}
                {l.google_rating && l.location && (
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: MUTED, opacity: 0.6, display: "inline-block" }} />
                )}
                {l.location && <span>{l.location}</span>}
              </>
            ),
          },
          {
            title: "saved events",
            items: savedEvents || [],
            hrefFor: (e) => `/event/${e.id}`,
            subtitleFor: (e) => {
              const d = e.start_date || e.date;
              const dateStr = d
                ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                : null;
              return (
                <>
                  {dateStr && <span>{dateStr}</span>}
                  {dateStr && e.location && (
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: MUTED, opacity: 0.6, display: "inline-block" }} />
                  )}
                  {e.location && <span>{e.location}</span>}
                </>
              );
            },
          },
          {
            title: "saved specials",
            items: savedSpecials || [],
            hrefFor: (s) => `/special/${s.id}`,
            subtitleFor: (s) => (
              <>
                {s.deal_label && <span>{s.deal_label}</span>}
                {s.deal_label && s.business_name && (
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: MUTED, opacity: 0.6, display: "inline-block" }} />
                )}
                {s.business_name && <span>{titleCase(s.business_name)}</span>}
              </>
            ),
          },
          {
            title: "been to",
            items: beenTo || [],
            hrefFor: (l) => `/listing/${l.id}`,
            subtitleFor: (l) => (
              <>
                {l.google_rating && <span>★ {Number(l.google_rating).toFixed(1).replace(/\.0$/, "")}</span>}
                {l.google_rating && l.location && (
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: MUTED, opacity: 0.6, display: "inline-block" }} />
                )}
                {l.location && <span>{l.location}</span>}
              </>
            ),
          },
        ];

        return sections
          .filter((s) => s.items.length > 0)
          .map((s) => (
            <section key={s.title} style={{ marginBottom: 32 }}>
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
                    fontFamily: SANS,
                    fontWeight: 400,
                    fontSize: 16,
                    lineHeight: 1.2,
                    letterSpacing: "0.01em",
                    textTransform: "uppercase",
                    color: INK,
                    margin: 0,
                  }}
                >
                  {s.title}
                </h2>
                <span
                  style={{
                    fontFamily: SANS,
                    fontWeight: 400,
                    fontSize: 12,
                    letterSpacing: "0.01em",
                    color: MUTED,
                  }}
                >
                  {s.items.length}
                </span>
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
                {s.items.map((it: any) => (
                  <Link
                    key={it.id}
                    to={s.hrefFor(it)}
                    style={{
                      flex: "0 0 auto",
                      width: 240,
                      background: CREAM,
                      borderRadius: 20,
                      overflow: "hidden",
                      textDecoration: "none",
                    }}
                  >
                    <div style={{ width: "100%", height: 180, background: "#d6d6d6" }}>
                      {it.image_url && (
                        <img
                          src={it.image_url}
                          alt=""
                          loading="lazy"
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
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
                        {titleCase(it.title)}
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
                        {s.subtitleFor(it)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ));
      })()}

      {/* Activity (only when public) */}
      {profile?.activity_private === false && activity && activity.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div style={{ padding: "0 24px", marginBottom: 14 }}>
            <h2
              style={{
                fontFamily: SANS,
                fontWeight: 400,
                fontSize: 16,
                lineHeight: 1.2,
                letterSpacing: "0.01em",
                textTransform: "uppercase",
                color: INK,
                margin: 0,
              }}
            >
              Activity
            </h2>
          </div>
          <div style={{ padding: "0 24px" }}>
            <div style={{ background: CREAM, borderRadius: 20, padding: "4px 22px" }}>
              {activity.map((row, i) => {
                const isSave = row.kind === "save";
                return (
                  <Link
                    key={i}
                    to={row.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 0",
                      borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
                      textDecoration: "none",
                      color: "inherit",
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
                      {isSave ? (
                        <Heart size={14} strokeWidth={1.6} color={CREAM} fill={CREAM} />
                      ) : (
                        <MapPin size={14} strokeWidth={1.6} color={MUTED} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 13, lineHeight: 1.4, letterSpacing: "0.01em", color: BODY }}>
                        {row.verb}{" "}
                        <span style={{ fontFamily: SANS, fontWeight: 400, color: INK }}>
                          {row.name}
                        </span>
                      </div>
                      <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, marginTop: 3 }}>
                        {timeAgo(row.created_at)}
                      </div>
                    </div>
                    <span style={{ fontSize: 13, color: MUTED, fontFamily: SANS }}>↗</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
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
                fontFamily: SANS,
                fontWeight: 400,
                fontSize: 16,
                letterSpacing: "0.01em",
                textTransform: "uppercase",
                color: INK,
              }}
            >
              Options
            </SheetTitle>
          </SheetHeader>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 12 }}>
            {[
              { label: "Share This Profile", onClick: handleShare },
              {
                label: "Report User",
                onClick: () => {
                  setMenuOpen(false);
                  if (!requireAuth("report users")) return;
                  setReportOpen(true);
                },
              },
              {
                label: "Block User",
                onClick: () => {
                  setMenuOpen(false);
                  if (!requireAuth("block users")) return;
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
                fontFamily: SANS,
                fontWeight: 400,
                fontSize: 16,
                letterSpacing: "0.01em",
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

      {id && (
        <ReportUserDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          reportedUserId={id}
          reportedUserName={titleCase(profile?.display_name)}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default UserProfile;
