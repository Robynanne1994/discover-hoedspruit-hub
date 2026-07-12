import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Tag, Calendar, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
      className="fixed left-3 right-3 z-50 md:hidden"
      style={{
        bottom: 12,
        background: BAR_BG,
        borderRadius: 32,
        height: 66,
        padding: "0 10px",
        border: "1px solid rgba(0,0,0,0.05)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", height: "100%", gap: 4 }}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? location.pathname === "/"
              : item.href === "/categories"
                ? location.pathname.startsWith("/categories") ||
                  location.pathname.startsWith("/category") ||
                  location.pathname.startsWith("/listing")
                : location.pathname.startsWith(item.href);
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
                height: 44,
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
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#ffffff",
                    letterSpacing: "0.01em",
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
