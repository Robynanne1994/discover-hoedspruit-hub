import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CHANNEL_IMAGE_COLUMNS,
  EVENT_IMAGE_COLUMNS,
  LISTING_IMAGE_COLUMNS,
  SPECIAL_IMAGE_COLUMNS,
} from "@/lib/imageFallback";
import { useAuth } from "@/hooks/useAuth";
import {
  useIsFollowing,
  useFollowMutation,
  useFollowCounts,
} from "@/hooks/useFollows";
import { MoreVertical, X, Share2, Flag, Ban, ChevronRight, Lock } from "lucide-react";
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
import SavedCard from "@/components/profile/SavedCard";
import { useRequireAuth } from "@/hooks/useGuestAuth";
import { useShare } from "@/hooks/useShare";
import { invalidateBlockQueries, useBlockedUsers } from "@/hooks/useBlockedUsers";
import { useBlockCooldown, fetchBlockCooldown } from "@/hooks/useBlockCooldown";
import BlockActionSheet from "@/components/BlockActionSheet";
import { residencyBadge } from "@/lib/residencyBadge";
import { MUTED as TOKEN_MUTED } from "@/lib/type";
import { isMissingHoursColumn, withHoursColumns } from "@/lib/openHours";
import {
  blockCooldownBlockedMessage,
  blockCooldownNotice,
  isBlockCooldownError,
  unblockCooldownWarning,
  unblockedCooldownToast,
} from "@/lib/blockCooldown";

const PAGE_BG = "#E6E0CC";
const CREAM = "#f5f0e8";
const INK = "#1A1A1A";
const BODY = "#2b2420";
const MUTED = "#6b5d4a";
const LINE = "rgba(0,0,0,0.08)";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";
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
const TAB_SUBTLE = TOKEN_MUTED;
const TAB_LINE = "rgba(26,26,26,0.10)";

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
  const [unblockOpen, setUnblockOpen] = useState(false);
  const [cooldownOpen, setCooldownOpen] = useState(false);
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

  // Has this profile blocked the signed-in viewer? Reading user_blocks
  // directly cannot answer that — its RLS policy only exposes the blocks you
  // created yourself, so the old query here always came back false and the
  // viewer saw the full profile of someone who had blocked them. get_block_state()
  // is the supported way to ask.
  const { data: blocks } = useBlockedUsers();
  const blockedByThem = !!id && !!blocks?.blockedMe.has(id);

  // Blocking again is barred for a while after an unblock — see
  // src/lib/blockCooldown.ts. Read it up front so the menu can explain the wait
  // instead of letting the insert fail. While they are still blocked there is
  // nothing to check, so skip the lookup.
  const { data: blockCooldown } = useBlockCooldown(id, !isBlocked);

  const handleBlock = async () => {
    if (!user || !id) return;
    const { error } = await supabase
      .from("user_blocks" as any)
      .insert({ blocker_id: user.id, blocked_id: id } as any);
    if (error) {
      if (isBlockCooldownError(error)) {
        // Refused by the cooldown trigger: fetch the exact dates and explain,
        // rather than telling them to try again on something that cannot work.
        await fetchBlockCooldown(queryClient, user.id, id);
        setCooldownOpen(true);
        return;
      }
      toast.error("Could not block user. Please try again.");
      return;
    }
    // Blocking implies unfollowing in both directions, and clears the
    // notifications the two of them have about each other. A database trigger
    // now does both the moment the block row lands (so it also holds for
    // admin tooling and any other caller); these deletes are kept as a
    // no-op belt for a client running against an older database.
    await Promise.all([
      supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", id),
      supabase.from("follows").delete().eq("follower_id", id).eq("following_id", user.id),
    ]);
    queryClient.setQueryData(["user-blocked", user.id, id], true);
    // null, not false: this cache holds a FollowStatus ('accepted' | 'pending'
    // | null), and the block just tore the follow down in both directions.
    queryClient.setQueryData(["is-following", user.id, id], null);
    await invalidateBlockQueries(queryClient);
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
    // Unblocking only lifts the hiding: they show up in search, suggestions and
    // follow lists again. It deliberately does not restore any follow that the
    // block tore down — that is the other person's / this user's choice to make.
    queryClient.setQueryData(["user-blocked", user.id, id], false);
    await invalidateBlockQueries(queryClient);
    toast.success(`User unblocked. ${unblockedCooldownToast()}`);
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", id],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_profiles", { _ids: [id!] });
      return (data && data[0]) || null;
    },
    enabled: !!id,
  });

  // How this person is referred to in the block / unblock copy.
  const personName =
    titleCase(profile?.display_name) ||
    (profile?.username ? `@${profile.username}` : "this user");

  const share = useShare();

  const { data: counts } = useFollowCounts(id);
  const { data: isFollowing } = useIsFollowing(id);
  const { follow, unfollow } = useFollowMutation(id!);

  // Whether this profile is locked to us decides what the rest of the screen
  // is even allowed to ask for, so it is derived here, before the queries.
  // `isOwnProfile` has to be part of it: your own private profile is not
  // locked to you.
  const isOwnProfile = user?.id === id;
  const followStatus = isFollowing ?? null; // 'accepted' | 'pending' | null
  const following = followStatus === "accepted";
  const requested = followStatus === "pending";
  const isPending = follow.isPending || unfollow.isPending;
  const isPrivateLocked =
    !isOwnProfile && !!(profile as any)?.is_private && !following;
  // Don't fetch what we are not going to show. The RPCs refuse a locked
  // profile anyway (see the 20260804160000 migration); this just avoids four
  // pointless round trips on every private profile that gets opened.
  const canSeeActivity = !!id && !isPrivateLocked;

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
      const listings = await withHoursColumns(async (hoursCols) => {
        const { data, error } = await supabase
          .from("listings")
          .select(`id, title, title_override, location, google_rating, google_reviews_count, ${hoursCols}, categories(title), ${LISTING_IMAGE_COLUMNS}`)
          .in("id", ids);
        // Only a missing hours column is worth retrying for.
        if (error && isMissingHoursColumn(error)) throw error;
        return data;
      });
      const map = Object.fromEntries(
        (listings || []).map((l: any) => [l.id, l]),
      );
      return favs
        .map((f: any) => ({ ...map[f.item_id], created_at: f.created_at }))
        .filter((l: any) => l.id);
    },
    enabled: canSeeActivity,
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
        .select(`id, title, title_override, location, start_date, end_date, start_time, date, ${EVENT_IMAGE_COLUMNS}`)
        .in("id", ids);
      const map = Object.fromEntries((events || []).map((e: any) => [e.id, e]));
      return favs.map((f: any) => ({ ...map[f.item_id], created_at: f.created_at })).filter((e: any) => e.id);
    },
    enabled: canSeeActivity,
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
        .select(`id, title, title_override, business_name, valid_until, badge_override, day_of_week, discount_type, discount_value, freebie_text, card_deal_text, redemption_note, card_footer_text, price, price_label, original_price, savings, ${SPECIAL_IMAGE_COLUMNS}`)
        .in("id", ids);
      const map = Object.fromEntries((specials || []).map((s: any) => [s.id, s]));
      return favs.map((f: any) => ({ ...map[f.item_id], created_at: f.created_at })).filter((s: any) => s.id);
    },
    enabled: canSeeActivity,
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
        .select(`id, title, title_override, platform, meta, meta_2, slug, ${CHANNEL_IMAGE_COLUMNS}`)
        .in("id", ids);
      const map = Object.fromEntries((resources || []).map((r: any) => [r.id, r]));
      return favs.map((f: any) => ({ ...map[f.item_id], created_at: f.created_at })).filter((r: any) => r.id);
    },
    enabled: canSeeActivity,
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

  const handleFollowClick = () => {
    // Guests get a dismissable bottom sheet, not a full-screen redirect.
    if (!requireAuth("follow people")) return;
    if (following) {
      // Only a private account needs a warning: re-following means requesting
      // approval again. Public accounts unfollow straight away.
      if ((profile as any)?.is_private) setUnfollowOpen(true);
      else unfollow.mutate();
    } else if (requested) {
      // Cancel pending request — no confirmation needed
      unfollow.mutate();
    } else {
      follow.mutate();
    }
  };

  // Opens the phone's own share sheet (copy link + the user's apps); falls back
  // to the in-app sheet on desktop browsers that have none.
  const handleShare = () => {
    setMenuOpen(false);
    const named = personName !== "this user";
    share({
      title: named ? personName : "A profile on Hello Hoedspruit",
      text: named
        ? `${personName} on Hello Hoedspruit — see their saved finds.`
        : "See their saved finds on Hello Hoedspruit.",
      url: `/profile/${id}`,
    });
  };

  const renderCard = (
    it: any,
    type: "listing" | "event" | "special" | "resource",
    href: string,
    subtitle: React.ReactNode,
  ) => (
    <SavedCard key={it.id} it={it} type={type} href={href} subtitle={subtitle} />
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

  // Somebody who has been blocked must not be able to tell that they were:
  // this is the same dead end an account that no longer exists gives, worded
  // so it could be either. get_public_profiles() also refuses to return the
  // blocker to them, so `profile` is empty here too — nothing to leak even if
  // this screen were reached some other way.
  const profileUnavailable = blockedByThem || (!isLoading && !profile);

  if (profileUnavailable) {
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
                fontFamily: HEAD,
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
              This account is no longer available.
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
              onClick={() => setUnblockOpen(true)}
              style={{
                flexShrink: 0,
                height: 32,
                padding: "0 14px",
                borderRadius: 999,
                background: "#423324",
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
                      fontFamily: HEAD,
                      fontWeight: 550,
                      fontSize: 15,
                      lineHeight: 1.2,
                      letterSpacing: "-0.3px",
                      color: "#1A1A1A",
                      margin: 0,
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
                          color: TOKEN_MUTED,
                          marginTop: 2,
                        }}
                      >
                        @{handle}
                      </div>
                    );
                  })()}
                  {/* Residency badge: visible on public profiles, and on
                      private ones only once you follow them. */}
                  {!isPrivateLocked &&
                    (() => {
                      const badge = residencyBadge((profile as any)?.location);
                      if (!badge) return null;
                      return (
                        <div
                          style={{
                            display: "inline-block",
                            marginTop: 8,
                            background: "#F2EFE5",
                            borderRadius: 999,
                            padding: "5px 11px",
                            fontFamily: SANS,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            color: "rgba(26,26,26,0.7)",
                            lineHeight: 1,
                          }}
                        >
                          {badge}
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
                  background: "#F2EFE5",
                  color: "#1A1A1A",
                  border: "1px solid #E8E4DF",
                  fontFamily: SANS,
                  fontWeight: 600,
                  fontSize: 13,
                  letterSpacing: "0.02em",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {following ? "Following" : requested ? "Requested" : "Follow"}
              </button>
            )}
          </div>


          {/* Stats inner card — a private account shows nobody its follower,
              following or saved numbers until they approve them. The counts
              are a fact about who this person knows and what they like, which
              is exactly what privacy is being asked to cover. */}
          {!isPrivateLocked && (
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
              { label: (counts?.followers ?? 0) === 1 ? "FOLLOWER" : "FOLLOWERS", value: counts?.followers ?? 0, to: `/profile/${id}/followers`, clickable: true, scrollTo: null as string | null },
              { label: "FOLLOWING", value: counts?.following ?? 0, to: `/profile/${id}/following`, clickable: true, scrollTo: null },
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
                cursor: s.clickable ? "pointer" : "default",
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
          )}
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
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#F2EFE5",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Lock size={18} strokeWidth={1.8} color={INK} />
            </div>
            <h2
              style={{
                fontFamily: HEAD,
                fontWeight: 550,
                fontSize: 15,
                letterSpacing: "0.01em",
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
                ? `${personName === "this user" ? "They" : personName} still has to approve your follow request. You'll be notified when they do.`
                : "Send a follow request to see their followers, who they follow and everything they've saved. They'll need to approve it first."}
            </p>
            {!isOwnProfile && (
              <button
                onClick={handleFollowClick}
                disabled={isPending}
                style={{
                  marginTop: 18,
                  height: 38,
                  padding: "0 22px",
                  borderRadius: 999,
                  background: requested ? "transparent" : "#423324",
                  color: requested ? INK : "#FFFFFF",
                  border: requested ? `1px solid ${LINE}` : "none",
                  fontFamily: SANS,
                  fontWeight: 600,
                  fontSize: 13,
                  letterSpacing: "0.02em",
                  cursor: isPending ? "default" : "pointer",
                  opacity: isPending ? 0.6 : 1,
                }}
              >
                {requested ? "Cancel request" : "Send follow request"}
              </button>
            )}
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
                  fontWeight: 700,
                  color: active ? TAB_INK : TAB_SUBTLE,
                  letterSpacing: "0.02em",
                  lineHeight: 1.2,
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
          className="[&>button]:hidden"
          style={{
            background: "#ffffff",
            borderRadius: 28,
            border: "none",
            left: 12,
            right: 12,
            bottom: 12,
            width: "auto",
            padding: "10px 0 8px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          }}
        >
          <div
            style={{
              width: 40,
              height: 5,
              borderRadius: 999,
              background: "#E6E0CC",
              margin: "0 auto 14px",
            }}
          />
          <SheetHeader style={{ padding: "0 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <SheetTitle
                style={{
                  fontFamily: HEAD,
                  fontWeight: 700,
                  fontSize: 22,
                  letterSpacing: "-0.2px",
                  color: INK,
                  textTransform: "none",
                }}
              >
                Options
              </SheetTitle>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  background: "#EFEADD",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <X size={18} strokeWidth={2} color={INK} />
              </button>
            </div>
          </SheetHeader>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 10, padding: "0 22px" }}>
            {[
              { label: "Share This Profile", icon: Share2, danger: false, onClick: handleShare },
              {
                label: "Report User",
                icon: Flag,
                danger: false,
                onClick: () => {
                  setMenuOpen(false);
                  if (!requireAuth("report users")) return;
                  setReportOpen(true);
                },
              },
              {
                label: isBlocked ? "Unblock User" : "Block User",
                icon: Ban,
                danger: true,
                onClick: () => {
                  setMenuOpen(false);
                  if (!requireAuth(isBlocked ? "unblock users" : "block users")) return;
                  if (isBlocked) {
                    setUnblockOpen(true);
                  } else if (blockCooldown?.isActive) {
                    // Still inside the wait from the last unblock — say so up
                    // front rather than letting the insert be refused.
                    setCooldownOpen(true);
                  } else {
                    setBlockOpen(true);
                  }
                },
              },
            ].map((o, i) => (
              <button
                key={o.label}
                onClick={o.onClick}
                style={{
                  textAlign: "left",
                  padding: "16px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
                  background: "transparent",
                  border: "none",
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopStyle: "solid",
                  borderTopColor: i === 0 ? "transparent" : LINE,
                  fontFamily: SANS,
                  fontSize: 17,
                  fontWeight: 400,
                  color: o.danger ? "#B4321F" : INK,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  width: "100%",
                }}
              >
                <o.icon size={20} strokeWidth={2} color={o.danger ? "#B4321F" : "#423324"} />
                <span style={{ flex: 1 }}>{o.label}</span>
                <ChevronRight size={18} strokeWidth={2} color="#8A8578" />
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>


      {/* Unfollow confirmation */}
      <Dialog open={unfollowOpen} onOpenChange={setUnfollowOpen}>
        <DialogContent
          style={{
            background: "#FFFFFF",
            border: "none",
            borderRadius: 28,
            padding: "28px 24px 24px",
            maxWidth: 340,
          }}
        >
          <DialogHeader style={{ padding: 0, gap: 10 }}>
            <DialogTitle
              style={{
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                color: INK,
              }}
            >
              Unfollow {titleCase(profile?.display_name) || "this user"}?
            </DialogTitle>
            <p
              style={{
                fontFamily: SANS,
                fontWeight: 400,
                fontSize: 14,
                lineHeight: 1.45,
                color: MUTED,
                margin: "4px 0 0",
              }}
            >
              Their profile is private, so you'll have to request to follow them
              again and wait for them to approve it.
            </p>

          </DialogHeader>
          <DialogFooter
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 12,
              marginTop: 24,
              padding: 0,
            }}
          >
            <button
              onClick={() => setUnfollowOpen(false)}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 999,
                background: "transparent",
                border: `1.5px solid ${LINE}`,
                color: INK,
                fontFamily: SANS,
                fontSize: 15,
                fontWeight: 600,
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
                height: 48,
                borderRadius: 999,
                background: INK,
                border: "none",
                color: "#FFFFFF",
                fontFamily: SANS,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Unfollow
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block confirmation — bottom sheet matching the app's other modals */}
      <BlockActionSheet
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        title={`Block ${personName}?`}
        body="You will unfollow each other, and they won't be able to follow you or see your profile. You can unblock them at a later stage through your account privacy settings."
        note={blockCooldownNotice()}
        confirmLabel="Block User"
        onConfirm={() => {
          setBlockOpen(false);
          handleBlock();
        }}
      />

      {/* Unblock confirmation — this is where the cooldown starts, so say so */}
      <BlockActionSheet
        open={unblockOpen}
        onClose={() => setUnblockOpen(false)}
        title={`Unblock ${personName}?`}
        body="They'll be able to find your profile and follow you again. Any follows the block removed are not restored."
        note={unblockCooldownWarning(personName)}
        confirmLabel="Unblock"
        onConfirm={() => {
          setUnblockOpen(false);
          handleUnblock();
        }}
      />

      {/* Cooldown explainer — shown instead of a block they cannot make yet */}
      <BlockActionSheet
        open={cooldownOpen}
        onClose={() => setCooldownOpen(false)}
        title="You can't block them just yet"
        body={
          blockCooldown
            ? blockCooldownBlockedMessage(personName, blockCooldown)
            : `There's a wait before you can block ${personName} again after unblocking them. Please try again later.`
        }
      />


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
