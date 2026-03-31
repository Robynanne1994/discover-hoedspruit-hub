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
      className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 active:scale-[0.98] transition-transform"
    >
      <div className="h-12 w-12 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <UserCircle className="h-8 w-8 text-muted-foreground/40" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {user.display_name || "User"}
        </p>
        {user.location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" />
            {user.location}
          </p>
        )}
      </div>
      <FollowButton targetUserId={user.id} size="sm" />
    </Link>
  );
};

export default UserCard;
