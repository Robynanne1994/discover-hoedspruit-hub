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
import { MoreVertical, Star } from "lucide-react";
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
const INK = "#020202";
const BODY = "#2b2420";
const MUTED = "#6b5d4a";
const LINE = "rgba(0,0,0,0.08)";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

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

// Saved-items tab styling — mirrors MyProfile for an identical look
const TAB_INK = "#1A1A1A";
const TAB_MUTED = "#8A8275";
const TAB_SUBTLE = "rgba(26,26,26,0.55)";
const TAB_LINE = "rgba(26,26,26,0.10)";
const TAB_CARD = "#FFFFFF";

type Tab = "listings" | "deals" | "events" | "resources";

function SubTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            style={{
              background: active ? "#423324" : "transparent",
              color: active ? "#fff" : TAB_INK,
              border: `1px solid ${active ? "#423324" : TAB_LINE}`,
              borderRadius: 999,
              padding: "6px 14px",
              cursor: "pointer",
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              letterSpacing: "0.02em",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [unfollowOpen, setUnfollowOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("listings");
  const [eventsSub, setEventsSub] = useState<"upcoming" | "past">("upcoming");
  const [dealsSub, setDealsSub] = useState<"active" | "expired">("active");
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

  // Has this profile blocked the signed-in viewer? If so we hide the
  // viewed user from search/suggestions AND prevent the viewer from
  // seeing their profile content here.
  const { data: blockedByThem } = useQuery({
    queryKey: ["blocked-by", user?.id, id],
    enabled: !!user?.id && !!id && user!.id !== id,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_blocks" as any)
        .select("id")
        .eq("blocker_id", id!)
        .eq("blocked_id", user!.id)
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
    // Blocking implies unfollowing in both directions
    await Promise.all([
      supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", id),
      supabase.from("follows").delete().eq("follower_id", id).eq("following_id", user.id),
    ]);
    queryClient.setQueryData(["user-blocked", user.id, id], true);
    queryClient.setQueryData(["is-following", user.id, id], false);
    queryClient.invalidateQueries({ queryKey: ["follow-counts"] });
    queryClient.invalidateQueries({ queryKey: ["followers"] });
    queryClient.invalidateQueries({ queryKey: ["following"] });
    queryClient.invalidateQueries({ queryKey: ["my-following-ids", user.id] });
    queryClient.invalidateQueries({ queryKey: ["is-following", id, user.id] });
    queryClient.invalidateQueries({ queryKey: ["blocked-users", user.id] });
    queryClient.invalidateQueries({ queryKey: ["search-users"] });
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
    queryClient.invalidateQueries({ queryKey: ["blocked-users", user.id] });
    queryClient.invalidateQueries({ queryKey: ["search-users"] });
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
      const { data: favs } = await supabase.rpc("get_user_favourites", {
        _user_id: id!,
        _item_type: "listing",
      });
      if (!favs?.length) return [];
      const ids = favs.map((f: any) => f.item_id);
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, image_url, location, google_rating")
        .in("id", ids);
      const map = Object.fromEntries(
        (listings || []).map((l: any) => [l.id, l]),
      );
      return favs
        .map((f: any) => ({ ...map[f.item_id], created_at: f.created_at }))
        .filter((l: any) => l.id);
    },
    enabled: !!id,
  });

  // Saved events
  const { data: savedEvents } = useQuery({
    queryKey: ["user-saved-events", id],
    queryFn: async () => {
      const { data: favs } = await supabase.rpc("get_user_favourites", {
        _user_id: id!,
        _item_type: "event",
      });
      if (!favs?.length) return [];
      const ids = favs.map((f: any) => f.item_id);
      const { data: events } = await supabase
        .from("events")
        .select("id, title, image_url, location, start_date, end_date")
        .in("id", ids);
      const map = Object.fromEntries((events || []).map((e: any) => [e.id, e]));
      return favs.map((f: any) => ({ ...map[f.item_id], created_at: f.created_at })).filter((e: any) => e.id);
    },
    enabled: !!id,
  });

  // Saved specials
  const { data: savedSpecials } = useQuery({
    queryKey: ["user-saved-specials", id],
    queryFn: async () => {
      const { data: favs } = await supabase.rpc("get_user_favourites", {
        _user_id: id!,
        _item_type: "special",
      });
      if (!favs?.length) return [];
      const ids = favs.map((f: any) => f.item_id);
      const { data: specials } = await supabase
        .from("specials")
        .select("id, title, image_url, business_name, valid_until")
        .in("id", ids);
      const map = Object.fromEntries((specials || []).map((s: any) => [s.id, s]));
      return favs.map((f: any) => ({ ...map[f.item_id], created_at: f.created_at })).filter((s: any) => s.id);
    },
    enabled: !!id,
  });

  // Saved resources
  const { data: savedResources } = useQuery({
    queryKey: ["user-saved-resources", id],
    queryFn: async () => {
      const { data: favs } = await supabase.rpc("get_user_favourites", {
        _user_id: id!,
        _item_type: "resource",
      });
      if (!favs?.length) return [];
      const ids = favs.map((f: any) => f.item_id);
      const { data: resources } = await supabase
        .from("bush_telegraph_resources")
        .select("id, title, title_override, image_url, platform, meta, meta_2, slug")
        .in("id", ids);
      const map = Object.fromEntries((resources || []).map((r: any) => [r.id, r]));
      return favs.map((f: any) => ({ ...map[f.item_id], created_at: f.created_at })).filter((r: any) => r.id);
    },
    enabled: !!id,
  });

  // SAVED stat — derived from the same data that renders the cards so the
  // number always matches the total cards shown across the tabs. Counting the
  // raw favourites rows drifted out of sync (it included deleted items, types
  // with no tab, and items hidden by privacy).
  const savedCount =
    (saved?.length ?? 0) +
    (savedEvents?.length ?? 0) +
    (savedSpecials?.length ?? 0) +
    (savedResources?.length ?? 0);

  const isOwnProfile = user?.id === id;
  const followStatus = isFollowing ?? null; // 'accepted' | 'pending' | null
  const following = followStatus === "accepted";
  const requested = followStatus === "pending";
  const isPending = follow.isPending || unfollow.isPending;
  const isPrivateLocked =
    !isOwnProfile && !!(profile as any)?.is_private && !following;

  const handleFollowClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (following) {
      setUnfollowOpen(true);
    } else if (requested) {
      // Cancel pending request — no confirmation needed
      unfollow.mutate();
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

  const renderCard = (
    it: any,
    type: "listing" | "event" | "special" | "resource",
    href: string,
    subtitle: React.ReactNode,
  ) => (
    <Link
      key={it.id}
      to={href}
      style={{
        background: TAB_CARD,
        borderRadius: 16,
        overflow: "hidden",
        textDecoration: "none",
        display: "block",
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "#d6d6d6" }}>
        {it.image_url && (
          <img
            src={it.image_url}
            alt=""
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        {type === "listing" && it.google_rating && (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              background: "rgba(255,255,255,0.92)",
              borderRadius: 999,
              padding: "3px 9px 3px 7px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 600,
              color: TAB_INK,
            }}
          >
            <Star size={11} strokeWidth={1.8} color={TAB_INK} />
            {Number(it.google_rating).toFixed(1).replace(/\.0$/, "")}
          </div>
        )}
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 15,
            lineHeight: 1.25,
            color: TAB_INK,
            marginBottom: 4,
            letterSpacing: "-0.1px",
          }}
        >
          {titleCase(it.title)}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12.5, color: TAB_MUTED, letterSpacing: "0.01em" }}>
          {subtitle}
        </div>
      </div>
    </Link>
  );

  const EmptyTab = ({ text }: { text: string }) => (
    <div
      style={{
        padding: "60px 24px",
        textAlign: "center",
        fontFamily: SANS,
        fontSize: 14,
        color: TAB_SUBTLE,
        letterSpacing: "0.01em",
      }}
    >
      {text}
    </div>
  );

  if (blockedByThem) {
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
        <PageHeader title="Profile" />
        <div style={{ padding: "40px 20px" }}>
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 18,
              padding: "32px 20px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontFamily: SANS,
                fontWeight: 400,
                fontSize: 16,
                letterSpacing: "0.01em",
                textTransform: "uppercase",
                color: INK,
                margin: "0 0 8px",
              }}
            >
              Account unavailable
            </h2>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 13.5,
                lineHeight: 1.5,
                color: MUTED,
                margin: 0,
              }}
            >
              This profile is not available to view.
            </p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

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

      {!isBlocked && (<>
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
                aria-label={following ? "Unfollow" : requested ? "Cancel follow request" : "Follow"}
                style={{
                  flexShrink: 0,
                  height: 32,
                  padding: "0 14px",
                  borderRadius: 999,
                  background: following || requested ? "#F2EFE5" : "#1A1A1A",
                  color: following || requested ? "#1A1A1A" : "#FFFFFF",
                  border: `1px solid ${"#1A1A1A"}`,
                  fontFamily: SANS,
                  fontWeight: 600,
                  fontSize: 13,
                  letterSpacing: "0.02em",
                  cursor: "pointer",
                }}
              >
                {following ? "Following" : requested ? "Requested" : "Follow"}
              </button>
            )}
          </div>


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
              { label: (counts?.followers ?? 0) === 1 ? "FOLLOWER" : "FOLLOWERS", value: counts?.followers ?? 0, to: `/profile/${id}/followers`, clickable: !isPrivateLocked, scrollTo: null as string | null },
              { label: "FOLLOWING", value: counts?.following ?? 0, to: `/profile/${id}/following`, clickable: !isPrivateLocked, scrollTo: null },
              { label: "SAVED", value: savedCount ?? 0, to: "", clickable: true, scrollTo: "user-saved-section" },
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
                background: "transparent",
                border: "none",
                borderLeft: i === 0 ? "none" : `1px solid #1A1A1A`,
                padding: 0,
                cursor: "pointer",
                font: "inherit",
                color: "inherit",
              };
              if (s.scrollTo) {
                return (
                  <button
                    key={s.label}
                    type="button"
                    style={sharedStyle}
                    onClick={() => {
                      const el = document.getElementById(s.scrollTo!);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    {inner}
                  </button>
                );
              }
              return s.clickable ? (
                <Link key={s.label} to={s.to} style={sharedStyle}>{inner}</Link>
              ) : (
                <div key={s.label} style={sharedStyle}>{inner}</div>
              );
            })}

          </div>
        </section>
      </div>

      {isPrivateLocked ? (
        <div style={{ padding: "20px 20px 0" }}>
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 18,
              padding: "28px 20px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 15,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: INK,
                margin: "0 0 8px",
              }}
            >
              This account is private
            </h2>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 13.5,
                lineHeight: 1.5,
                color: MUTED,
                margin: 0,
              }}
            >
              {requested
                ? "Your follow request is awaiting approval."
                : "Follow this account to see their saved places."}
            </p>
          </div>
        </div>
      ) : (<>
      {/* Saved items — tabbed, identical to MyProfile */}
      <div id="user-saved-section" style={{ scrollMarginTop: 16 }}>
        {/* Top tabs */}
        <div
          style={{
            marginTop: 22,
            display: "flex",
            padding: "0 20px",
            gap: 0,
            borderBottom: `1px solid ${TAB_LINE}`,
          }}
        >
          {(["listings", "deals", "events", "resources"] as Tab[]).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  padding: "14px 0 12px",
                  cursor: "pointer",
                  fontFamily: SANS,
                  fontSize: 16,
                  fontWeight: active ? 700 : 400,
                  color: active ? TAB_INK : TAB_SUBTLE,
                  letterSpacing: "0.02em",
                  position: "relative",
                  textTransform: "capitalize",
                }}
              >
                {t}
                <span
                  style={{
                    position: "absolute",
                    left: "20%",
                    right: "20%",
                    bottom: -1,
                    height: 2,
                    background: active ? TAB_INK : "transparent",
                    borderRadius: 2,
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ padding: "20px 20px 0" }}>
          {tab === "listings" && (
            saved?.length ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {saved.map((it: any) => renderCard(it, "listing", `/listing/${it.id}`, null))}
              </div>
            ) : (
              <EmptyTab text="No saved listings yet." />
            )
          )}

          {tab === "deals" && (() => {
            const now = Date.now();
            const filtered = (savedSpecials ?? []).filter((it: any) => {
              const expired = it.valid_until && new Date(it.valid_until).getTime() < now;
              return dealsSub === "active" ? !expired : expired;
            });
            return (
              <>
                <SubTabs<"active" | "expired">
                  value={dealsSub}
                  onChange={setDealsSub}
                  options={[
                    { id: "active", label: "Active" },
                    { id: "expired", label: "Expired" },
                  ]}
                />
                {filtered.length ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {filtered.map((it: any) =>
                      renderCard(
                        it,
                        "special",
                        `/special/${it.id}`,
                        it.business_name ? titleCase(it.business_name) : null,
                      ),
                    )}
                  </div>
                ) : (
                  <EmptyTab text={dealsSub === "active" ? "No active deals saved." : "No expired deals."} />
                )}
              </>
            );
          })()}

          {tab === "events" && (() => {
            const now = Date.now();
            const filtered = (savedEvents ?? []).filter((it: any) => {
              const ref = it.end_date || it.start_date;
              if (!ref) return eventsSub === "upcoming";
              const past = new Date(ref).getTime() < now;
              return eventsSub === "upcoming" ? !past : past;
            });
            return (
              <>
                <SubTabs<"upcoming" | "past">
                  value={eventsSub}
                  onChange={setEventsSub}
                  options={[
                    { id: "upcoming", label: "Upcoming" },
                    { id: "past", label: "Past" },
                  ]}
                />
                {filtered.length ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {filtered.map((it: any) =>
                      renderCard(
                        it,
                        "event",
                        `/event/${it.id}`,
                        <>
                          {it.start_date && (
                            <span>
                              {new Date(it.start_date).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          )}
                          {it.start_date && it.location && <span> · </span>}
                          {it.location && <span>{it.location}</span>}
                        </>,
                      ),
                    )}
                  </div>
                ) : (
                  <EmptyTab text={eventsSub === "upcoming" ? "No upcoming saved events." : "No past saved events."} />
                )}
              </>
            );
          })()}

          {tab === "resources" && (
            savedResources?.length ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {savedResources.map((it: any) => {
                  const displayTitle = (it.title_override?.trim()) || it.title;
                  const metaParts = [it.meta, it.meta_2].filter((m: string | null) => m && m.trim());
                  const href = it.slug ? `/local-channels/${it.slug}` : `/local-channels`;
                  return renderCard(
                    { ...it, title: displayTitle },
                    "resource",
                    href,
                    <>
                      {metaParts.length > 1 && <span>{metaParts.join(" · ")}</span>}
                      {metaParts.length === 1 && <span>{metaParts[0]}</span>}
                    </>,
                  );
                })}
              </div>
            ) : (
              <EmptyTab text="No saved resources yet." />
            )
          )}
        </div>
      </div>
      </>)}

      </>)}

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
                label: isBlocked ? "Unblock User" : "Block User",
                onClick: () => {
                  setMenuOpen(false);
                  if (!requireAuth(isBlocked ? "unblock users" : "block users")) return;
                  if (isBlocked) {
                    handleUnblock();
                  } else {
                    setBlockOpen(true);
                  }
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

      {/* Block confirmation */}
      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
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
              Are you sure you want to block {titleCase(profile?.display_name) || (profile?.username ? `@${profile.username}` : "this user")}?
            </DialogTitle>
          </DialogHeader>
          <DialogFooter style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button
              onClick={() => setBlockOpen(false)}
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
                handleBlock();
                setBlockOpen(false);
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
              Block
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
          reportedUserHandle={profile?.username ?? null}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default UserProfile;
