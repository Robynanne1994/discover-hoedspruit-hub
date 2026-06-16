import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useGuestAuth";
import { useIsFollowing, useFollowMutation } from "@/hooks/useFollows";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Clock } from "lucide-react";

interface FollowButtonProps {
  targetUserId: string;
  size?: "sm" | "default";
}

const FollowButton = ({ targetUserId, size = "default" }: FollowButtonProps) => {
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const { data: status, isLoading } = useIsFollowing(targetUserId);
  const { follow, unfollow } = useFollowMutation(targetUserId);

  if (user && user.id === targetUserId) return null;

  const isAccepted = status === "accepted";
  const isPending = status === "pending";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!requireAuth("follow people")) return;
    if (isAccepted || isPending) {
      // both unfollow and cancel-request = delete the row
      unfollow.mutate();
    } else {
      follow.mutate();
    }
  };

  const busy = follow.isPending || unfollow.isPending;
  const label = isAccepted ? "Following" : isPending ? "Requested" : "Follow";
  const Icon = isAccepted ? UserCheck : isPending ? Clock : UserPlus;

  if (size === "sm") {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading || busy}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
          isAccepted || isPending
            ? "bg-primary/10 text-primary border border-primary/30"
            : "bg-[#423324] text-white"
        }`}
      >
        <Icon className="h-3 w-3" />
        {label}
      </button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || busy}
      variant={isAccepted || isPending ? "outline" : "default"}
      className="rounded-full gap-2"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
};

export default FollowButton;
