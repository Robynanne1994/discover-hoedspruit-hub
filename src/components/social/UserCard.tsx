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
      className="flex items-center active:scale-[0.98] transition-transform duration-200"
      style={{
        gap: 14,
        padding: 16,
        borderRadius: 16,
        background: "rgba(18,18,20,0.03)",
        border: "1px solid rgba(18,18,20,0.06)",
      }}
    >
      <div
        className="shrink-0 overflow-hidden flex items-center justify-center"
        style={{
          width: 52,
          height: 52,
          borderRadius: 999,
          background: "rgba(18,18,20,0.04)",
          border: "1px solid rgba(18,18,20,0.06)",
        }}
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.display_name || "User"} className="h-full w-full object-cover" />
        ) : (
          <UserCircle
            style={{
              width: 28,
              height: 28,
              color: "rgba(18,18,20,0.18)",
            }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#2b2420",
            lineHeight: 1.15,
            margin: 0,
            letterSpacing: "-0.2px",
          }}
          className="truncate"
        >
          {user.display_name || "User"}
        </p>

        {user.location && (
          <p
            className="flex items-center truncate"
            style={{
              gap: 4,
              fontSize: 12,
              color: "rgba(18,18,20,0.4)",
              margin: 0,
              marginTop: 6,
              lineHeight: 1.3,
            }}
          >
            <MapPin size={12} strokeWidth={2} />
            <span className="truncate">{user.location}</span>
          </p>
        )}
      </div>

      <div className="shrink-0">
        <FollowButton targetUserId={user.id} size="sm" />
      </div>
    </Link>
  );
};

export default UserCard;
