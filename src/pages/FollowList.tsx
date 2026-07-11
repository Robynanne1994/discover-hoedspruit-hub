import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useFollowersList,
  useFollowingList,
  useFollowMutation,
  useMyFollowingIds,
  useFollowCounts,
} from "@/hooks/useFollows";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const COLOR = {
  page: "#E6E0CC",
  card: "#FFFFFF",
  cream: "#F5F0E4",
  ink: "#1A1A1A",
  muted: "#8A8275",
  subtle: "rgba(26,26,26,0.55)",
  line: "rgba(26,26,26,0.10)",
  pillBorder: "#E8E4DF",
  brown: "#423324",
  soft: "#F2EFE5",
};

const SERIF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const initialsOf = (name?: string | null) => {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
};

type RowUser = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  username?: string | null;
  location?: string | null;
};

const ActionButton = ({
  variant,
  label,
  onClick,
  disabled,
}: {
  variant: "outlined" | "solid";
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) => {
  const isSolid = variant === "solid";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 34,
        padding: "0 18px",
        borderRadius: 999,
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: "0.02em",
        cursor: disabled ? "default" : "pointer",
        flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
        transition: "transform 120ms ease",
        background: isSolid ? COLOR.brown : COLOR.soft,
        border: "none",
        color: isSolid ? "#FFFFFF" : "#020202",
        minWidth: 92,
      }}
    >
      {label}
    </button>
  );
};

const UserRow = ({
  user,
  index,
  label,
  isSolid,
  onToggle,
  pending,
  isSelf,
}: {
  user: RowUser;
  index: number;
  label: string;
  isSolid: boolean;
  onToggle: () => void;
  pending: boolean;
  isSelf?: boolean;
}) => {
  const navigate = useNavigate();
  const handle = user.username
    ? `@${user.username.toLowerCase()}`
    : `@${(user.display_name || "user").toLowerCase().replace(/\s+/g, "")}`;
  const initials = initialsOf(user.display_name);

  return (
    <div
      onClick={() => navigate(`/profile/${user.id}`)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 0",
        borderTop: index === 0 ? "none" : `1px solid ${COLOR.line}`,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          flexShrink: 0,
          overflow: "hidden",
          background: user.avatar_url ? "#000" : "#FFFFFF",
          border: user.avatar_url ? "none" : `1px solid ${COLOR.pillBorder}`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : undefined,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: SANS,
          fontWeight: 500,
          fontSize: 16,
          color: COLOR.ink,
        }}
      >
        {!user.avatar_url && initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: 16,
            lineHeight: 1.2,
            letterSpacing: "-0.1px",
            color: COLOR.ink,
            marginBottom: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user.display_name || "User"}
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: SANS,
            fontStyle: "normal",
            fontWeight: 400,
            fontSize: 13,
            color: COLOR.muted,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {handle}
        </p>
      </div>

      {!isSelf && (
        <div onClick={(e) => e.stopPropagation()}>
          <ActionButton
            variant={isSolid ? "solid" : "outlined"}
            label={label}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            disabled={pending}
          />
        </div>
      )}
    </div>
  );
};

const RowWithMutation = ({
  user,
  index,
  isFollowedInitially,
  isOwnFollowingPage,
  isSelf,
}: {
  user: RowUser;
  index: number;
  isFollowedInitially: boolean;
  isOwnFollowingPage: boolean;
  isSelf?: boolean;
}) => {
  const { follow, unfollow } = useFollowMutation(user.id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // On own following page, force outlined Following state
  const isFollowed = isOwnFollowingPage ? true : isFollowedInitially;

  const handleToggle = () => {
    if (isFollowed) {
      setConfirmOpen(true);
    } else {
      follow.mutate();
    }
  };

  return (
    <>
      <UserRow
        user={user}
        index={index}
        isFollowed={isFollowed}
        onToggle={handleToggle}
        pending={follow.isPending || unfollow.isPending}
        isSelf={isSelf}
      />
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unfollow {user.display_name || "this user"}?</DialogTitle>
            <DialogDescription>
              You can follow them again at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setConfirmOpen(false)}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                border: `1px solid ${COLOR.line}`,
                background: "transparent",
                color: COLOR.ink,
                fontFamily: SANS,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                unfollow.mutate();
                setConfirmOpen(false);
              }}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                border: "none",
                background: COLOR.ink,
                color: COLOR.cream,
                fontFamily: SANS,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Unfollow
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const ShareIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const FollowList = () => {
  const { id, type } = useParams<{ id: string; type: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const isFollowers = type === "followers";
  const isOwnPage = !!authUser && authUser.id === id;

  const { data: followers, isLoading: loadingFollowers } = useFollowersList(
    isFollowers ? id : undefined,
  );
  const { data: following, isLoading: loadingFollowing } = useFollowingList(
    !isFollowers ? id : undefined,
  );
  const { data: myFollowingIds } = useMyFollowingIds();
  const { data: counts } = useFollowCounts(id);

  // Fetch viewed user's display name/username so empty states can address them by name
  const { data: viewedProfile } = useQuery({
    queryKey: ["follow-list-profile", id],
    enabled: !!id && !isOwnPage,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", id!)
        .maybeSingle();
      return data as { display_name: string | null; username: string | null } | null;
    },
  });
  const viewedName =
    viewedProfile?.display_name?.trim() ||
    (viewedProfile?.username ? `@${viewedProfile.username}` : "This user");

  const users = (isFollowers ? followers : following) as RowUser[] | undefined;
  const isLoading = isFollowers ? loadingFollowers : loadingFollowing;
  const count = users?.length ?? 0;

  const title = isFollowers ? "followers." : "following.";
  const lede = isFollowers
    ? "People who follow your finds."
    : "People whose taste you trust.";

  const sisterPath = `/profile/${id}/${isFollowers ? "following" : "followers"}`;
  const sisterLabel = isFollowers ? "see who you follow ↗" : "see your followers ↗";

  const handlePrimaryCta = async () => {
    if (isFollowers) {
      const url = `${window.location.origin}/profile/${id}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: "My profile", url });
        } else {
          await navigator.clipboard.writeText(url);
        }
      } catch {
        /* no-op */
      }
    } else {
      navigate("/search", { state: { fromProfile: true, profileId: id } });
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: COLOR.page, paddingBottom: 100 }}>
      {/* Top bar */}
      <PageHeader title="Connections" />

      {/* Tabs */}
      <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 18, paddingBottom: 18 }}>
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${COLOR.line}`,
          }}
        >
          {[
            { key: "followers", label: "Followers", count: counts?.followers ?? 0 },
            { key: "following", label: "Following", count: counts?.following ?? 0 },
          ].map((tab) => {
            const active = (tab.key === "followers") === isFollowers;
            return (
              <Link
                key={tab.key}
                to={`/profile/${id}/${tab.key}`}
                replace

                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "12px 0",
                  fontFamily: SANS,
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: active ? COLOR.ink : COLOR.subtle,
                  textDecoration: "none",
                  borderBottom: active ? `2px solid ${COLOR.ink}` : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {tab.label} ({tab.count})
              </Link>
            );
          })}
        </div>
      </div>

      {/* List card */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 24 }}>
        {isLoading ? (
          <div
            style={{
              background: COLOR.card,
              borderRadius: 18,
              padding: "6px 18px",
              overflow: "hidden",
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${COLOR.line}`,
                }}
              >
                <Skeleton className="h-12 w-12 rounded-full" />
                <div style={{ flex: 1 }}>
                  <Skeleton className="h-4 w-28 mb-2 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : count === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p
              style={{
                margin: 0,
                marginBottom: 12,
                fontFamily: SANS,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 15,
                color: COLOR.ink,
              }}
            >
              {isOwnPage
                ? isFollowers
                  ? "No followers yet."
                  : "No one to follow yet."
                : isFollowers
                ? `${viewedName} does not have any followers yet.`
                : `${viewedName} is not following anyone yet.`}
            </p>
            {isOwnPage && (
              <p
                style={{
                  margin: "0 auto",
                  fontFamily: SANS,
                  fontWeight: 400,
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: COLOR.muted,
                  maxWidth: 260,
                }}
              >
                {isFollowers
                  ? "Share your profile to grow your circle."
                  : "Find people whose taste you trust."}
              </p>
            )}
          </div>
        ) : (
          <div
            style={{
              background: COLOR.card,
              borderRadius: 18,
              padding: "6px 18px",
              overflow: "hidden",
            }}
          >
            {users!.map((u, i) => (
              <RowWithMutation
                key={u.id}
                user={u}
                index={i}
                isFollowedInitially={myFollowingIds?.has(u.id) ?? false}
                isOwnFollowingPage={!isFollowers && isOwnPage}
                isSelf={!!authUser && authUser.id === u.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Primary CTA — only on your own profile */}
      {isOwnPage && (
        <div style={{ textAlign: "center", marginTop: 8, marginBottom: 24 }}>
          <button
            onClick={handlePrimaryCta}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#423324",
              color: "#ffffff",
              border: "none",
              borderRadius: 999,
              padding: "14px 24px",
              fontFamily: SANS,
              fontWeight: 400,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {isFollowers ? (
              <>
                <ShareIcon size={14} />
                Share Your Profile
              </>
            ) : (
              <>
                <Plus size={14} strokeWidth={1.8} />
                Find People
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
};

export default FollowList;
