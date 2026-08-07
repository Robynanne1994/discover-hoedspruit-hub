import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Tag, Calendar, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { type } from "@/lib/type";

const BAR_BG = "#F5F0E8";
const ACTIVE_BG = "#423324";
const INACTIVE_FG = "#1A1A1A";

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Explore", href: "/categories", icon: Compass },
    { label: "Specials", href: "/specials", icon: Tag },
    { label: "Events", href: "/events", icon: Calendar },
    { label: "Profile", href: user ? "/my-profile" : "/my-profile-guest", icon: User },
  ];

  return (
    <nav
      className="fixed z-50"
      style={{
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        background: BAR_BG,
        borderRadius: "32px 32px 0 0",
        // The app draws edge-to-edge, so the bar grows by the home-indicator
        // inset and pads it out — the icons never sit under the indicator.
        height: "calc(84px + var(--safe-bottom))",
        padding: "0 10px var(--safe-bottom)",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", height: 84, gap: 4 }}>
        {navItems.map((item) => {
          const path = location.pathname;
          let isActive = false;
          if (item.href === "/") {
            isActive = path === "/" || path === "/search";
          } else if (item.href === "/categories") {
            isActive =
              path.startsWith("/categories") ||
              path.startsWith("/category") ||
              path.startsWith("/listing");
          } else if (item.href === "/specials") {
            isActive = path.startsWith("/specials");
          } else if (item.href === "/events") {
            isActive = path.startsWith("/events");
          } else if (item.href === "/my-profile" || item.href === "/my-profile-guest") {
            isActive =
              path.startsWith("/my-profile") ||
              path.startsWith("/my-account") ||
              path.startsWith("/account-settings") ||
              path.startsWith("/my-notifications") ||
              path.startsWith("/notification-preferences") ||
              path.startsWith("/notifications/categories") ||
              path.startsWith("/follow-requests");
          }
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.href}
              aria-label={item.label}
              style={{
                flex: isActive ? 2 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                height: 46,
                borderRadius: 999,
                background: isActive ? ACTIVE_BG : "transparent",
                gap: 8,
                padding: isActive ? "0 14px" : 0,
                transition: "background 200ms ease, padding 200ms ease",
              }}
            >
              <Icon
                size={22}
                color={isActive ? "#ffffff" : INACTIVE_FG}
                strokeWidth={isActive ? 2 : 1.75}
              />
              {isActive && (
                <span
                  style={{
                    ...type.navLabel,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
