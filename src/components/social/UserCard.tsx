import { Link } from "react-router-dom";
import { UserCircle, MapPin } from "lucide-react";
import FollowButton from "./FollowButton";

interface UserCardProps {
  user: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    location?: string | null;
  };
}

const UserCard = ({ user }: UserCardProps) => {
  return (
    <Link
      to={`/profile/${user.id}`}
      className="flex items-center gap-4 bg-card border border-border/60 rounded-xl p-4 active:scale-[0.98] transition-all hover:border-border"
    >
      <div className="h-12 w-12 rounded-full bg-muted/60 overflow-hidden flex items-center justify-center shrink-0 ring-1 ring-border/40">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <UserCircle className="h-7 w-7 text-muted-foreground/30" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold text-foreground truncate"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {user.display_name || "User"}
        </p>
        {user.location && (
          <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{user.location}</span>
          </p>
        )}
      </div>
      <FollowButton targetUserId={user.id} size="sm" />
    </Link>
  );
};

export default UserCard;
