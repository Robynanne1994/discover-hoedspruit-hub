import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import {
  useFollowersList,
  useFollowingList,
  useFollowMutation,
  useMyFollowingIds,
} from "@/hooks/useFollows";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const COLOR = {
  olive: "#5C6446",
  cream: "#EEE8DA",
  ink: "#2A2A24",
  muted: "#6B6A5E",
  line: "#D9D2C0",
};

const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #8a6f4d, #c4a374)",
  "linear-gradient(135deg, #6b7a5a, #a8b58c)",
  "linear-gradient(135deg, #a86b52, #d4a087)",
  "linear-gradient(135deg, #5d6b7a, #8fa3b3)",
  "linear-gradient(135deg, #8a5d6b, #c08a96)",
  "linear-gradient(135deg, #7a6b4a, #b8a473)",
];

const initialsOf = (name?: string | null) => {
  if (!name) return "·";
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
  const base: React.CSSProperties = {
    height: 34,
    padding: "0 18px",
    borderRadius: 999,
    fontFamily: SANS,
    fontWeight: 400,
    fontSize: 13,
    letterSpacing: "0.1px",
    cursor: disabled ? "default" : "pointer",
    flexShrink: 0,
    opacity: disabled ? 0.6 : 1,
    transition: "transform 120ms ease",
  };
  if (variant === "outlined") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          ...base,
          background: "transparent",
          border: `1px solid ${COLOR.line}`,
          color: COLOR.ink,
        }}
      >
        {label}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...base,
        background: COLOR.ink,
        border: "none",
        color: COLOR.cream,
      }}
    >
      {label}
    </button>
  );
};

const UserRow = ({
  user,
  index,
  isFollowed,
  onToggle,
  pending,
}: {
  user: RowUser;
  index: number;
  isFollowed: boolean;
  onToggle: () => void;
  pending: boolean;
}) => {
  const navigate = useNavigate();
  const handle = user.username
    ? `@${user.username.toLowerCase()}`
    : `@${(user.display_name || "user").toLowerCase().replace(/\s+/g, "")}`;
  const grad = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];

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
          background: user.avatar_url ? "#000" : grad,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : grad,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 18,
          color: COLOR.cream,
        }}
      >
        {!user.avatar_url && initialsOf(user.display_name)}
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
            fontFamily: SERIF,
            fontStyle: "italic",
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

      <div onClick={(e) => e.stopPropagation()}>
        <ActionButton
          variant={isFollowed ? "outlined" : "solid"}
          label={isFollowed ? "Following" : "Follow Back"}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          disabled={pending}
        />
      </div>
    </div>
  );
};

const RowWithMutation = ({
  user,
  index,
  isFollowedInitially,
  isOwnFollowingPage,
}: {
  user: RowUser;
  index: number;
  isFollowedInitially: boolean;
  isOwnFollowingPage: boolean;
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
      navigate("/people");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: COLOR.olive, paddingBottom: 100 }}>
      {/* Top bar */}
      <div style={{ paddingTop: 32, paddingLeft: 24, paddingRight: 24 }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: COLOR.cream,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={18} strokeWidth={1.6} color={COLOR.ink} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ paddingTop: 18, paddingLeft: 24, paddingRight: 24, paddingBottom: 28 }}>
        <p
          style={{
            margin: 0,
            marginBottom: 14,
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: 12,
            letterSpacing: "2.4px",
            textTransform: "uppercase",
            color: "rgba(238,232,218,0.7)",
          }}
        >
          YOUR CIRCLE · {count}
        </p>
        <h1
          style={{
            margin: 0,
            marginBottom: 14,
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 72,
            lineHeight: 0.92,
            letterSpacing: "-2.5px",
            color: COLOR.cream,
            textTransform: "none",
          }}
        >
          {title}
        </h1>
      </div>

      {/* List card */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        {isLoading ? (
          <div
            style={{
              background: COLOR.cream,
              borderRadius: 20,
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
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 22,
                color: "rgba(238,232,218,0.8)",
              }}
            >
              {isFollowers ? "No followers yet." : "No one to follow yet."}
            </p>
            <p
              style={{
                margin: "0 auto",
                fontFamily: SANS,
                fontWeight: 400,
                fontSize: 15,
                lineHeight: 1.55,
                color: "rgba(238,232,218,0.7)",
                maxWidth: 260,
              }}
            >
              {isFollowers
                ? "Share your profile to grow your circle."
                : "Find people whose taste you trust."}
            </p>
          </div>
        ) : (
          <div
            style={{
              background: COLOR.cream,
              borderRadius: 20,
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
              />
            ))}
          </div>
        )}
      </div>

      {/* Primary CTA */}
      <div style={{ textAlign: "center", marginTop: 8, marginBottom: 24 }}>
        <button
          onClick={handlePrimaryCta}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: COLOR.ink,
            color: COLOR.cream,
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

    </div>
  );
};

export default FollowList;
