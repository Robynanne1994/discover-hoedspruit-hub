import { Link } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import hhLogo from "@/assets/hh-logo.png";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const NOHEMI = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const HomeMasthead = () => {
  const { user } = useAuth();
  const unread = useUnreadNotifications();
  return (
    // Notch-safe: sits just under the status bar so the cream background runs
    // edge-to-edge to the top of the screen. See --masthead-top in index.css.
    <div style={{ padding: "var(--masthead-top) 20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "stretch", gap: 12, minWidth: 0 }}>
          <img
            src={hhLogo}
            alt="Hello Hoedspruit"
            width={62}
            height={62}
            fetchPriority="high"
            decoding="async"
            style={{
              height: 62,
              width: "auto",
              objectFit: "contain",
              flexShrink: 0,
              alignSelf: "stretch",
            }}
          />
          <div style={{ minWidth: 0 }}>
            <h1
              aria-label="Hello Hoedspruit — Your Lowveld local guide to restaurants, lodges, events and specials"
              style={{
                margin: 0,
                fontFamily: NOHEMI,
                fontWeight: 550,
                fontSize: 22,
                lineHeight: 1.05,
                letterSpacing: "0.01em",
                color: "#1A1A1A",
              }}
            >
              Hello
              <br />
              Hoedspruit
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                fontFamily: HN,
                fontWeight: 400,
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#6B6A5E",
              }}
            >
              Your Lowveld local
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Link
            to="/search"
            aria-label="Search"
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <Search size={18} color="#1A1A1A" strokeWidth={1.8} />
          </Link>
          {user && (
            <Link
              to="/my-notifications"
              aria-label="Notifications"
              style={{
                position: "relative",
                width: 40,
                height: 40,
                borderRadius: 999,
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <Bell size={18} color="#1A1A1A" strokeWidth={1.8} />
              {unread > 0 && (
                <span
                  aria-label={`${unread} unread notifications`}
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    minWidth: 18,
                    height: 18,
                    padding: "0 5px",
                    borderRadius: 999,
                    background: "#E0322B",
                    color: "#FFFFFF",
                    border: "2px solid #ffffff",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeMasthead;
