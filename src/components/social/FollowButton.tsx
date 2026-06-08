import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useGuestAuth";
import { useIsFollowing, useFollowMutation } from "@/hooks/useFollows";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck } from "lucide-react";

interface FollowButtonProps {
  targetUserId: string;
  size?: "sm" | "default";
}

const FollowButton = ({ targetUserId, size = "default" }: FollowButtonProps) => {
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const { data: isFollowing, isLoading } = useIsFollowing(targetUserId);
  const { follow, unfollow } = useFollowMutation(targetUserId);

  if (user && user.id === targetUserId) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!requireAuth("follow people")) return;
    if (isFollowing) {
      unfollow.mutate();
    } else {
      follow.mutate();
    }
  };

  const isPending = follow.isPending || unfollow.isPending;

  if (size === "sm") {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading || isPending}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
          isFollowing
            ? "bg-primary/10 text-primary border border-primary/30"
            : "bg-[#423324] text-white"
        }`}
      >
        {isFollowing ? (
          <>
            <UserCheck className="h-3 w-3" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="h-3 w-3" />
            Follow
          </>
        )}
      </button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || isPending}
      variant={isFollowing ? "outline" : "default"}
      className="rounded-full gap-2"
    >
      {isFollowing ? (
        <>
          <UserCheck className="h-4 w-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Follow
        </>
      )}
    </Button>
  );
};

export default FollowButton;
