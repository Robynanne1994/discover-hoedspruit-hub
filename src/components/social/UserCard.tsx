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
        background: "#f5f0e8",
        textDecoration: "none",
      }}
    >
      <div
        className="shrink-0 overflow-hidden flex items-center justify-center"
        style={{
          width: 50,
          height: 50,
          borderRadius: 999,
          background: "rgba(255,255,255,0.6)",
          border: "2px solid rgba(113,90,61,0.15)",
        }}
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.display_name || "User"} className="h-full w-full object-cover" />
        ) : (
          <UserCircle
            style={{
              width: 26,
              height: 26,
              color: "#B8916A",
            }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="truncate"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 15,
            fontWeight: 700,
            color: "#2b2420",
            lineHeight: 1.2,
            margin: 0,
            letterSpacing: "-0.2px",
          }}
        >
          {user.display_name || "User"}
        </p>

        {user.location && (
          <p
            className="flex items-center truncate"
            style={{
              gap: 4,
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "#827b75",
              margin: 0,
              marginTop: 4,
              lineHeight: 1.3,
            }}
          >
            <MapPin size={11} strokeWidth={2} />
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
