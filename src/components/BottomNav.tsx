import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Tag, Calendar, User } from "lucide-react";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/categories", icon: Compass },
  { label: "Specials", href: "/specials", icon: Tag },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Profile", href: "/my-profile", icon: User },
];

const PILL_BG = "#f5f0e8";
const PILL_FG = "#2b2420";
const INACTIVE = "#f5f0e8";

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed left-3 right-3 z-50 md:hidden"
      style={{
        bottom: 12,
        background: "#2b2420",
        borderRadius: 28,
        height: 74,
        padding: "0 10px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", height: "100%", gap: 6 }}>
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
              style={{
                flex: isActive ? 2 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                height: 48,
                borderRadius: 999,
                background: isActive ? PILL_BG : "transparent",
                gap: 8,
                padding: isActive ? "0 16px" : 0,
                transition: "flex 200ms ease, background 200ms ease, padding 200ms ease",
              }}
            >
              <Icon
                size={24}
                color={isActive ? PILL_FG : INACTIVE}
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              {isActive && (
                <span
                  style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: PILL_FG,
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
