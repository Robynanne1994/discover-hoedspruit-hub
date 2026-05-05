import { Link, useLocation } from "react-router-dom";
import { Home, SearchCheck, Tag, CalendarDays, User } from "lucide-react";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/categories", icon: SearchCheck },
  { label: "Specials", href: "/specials", icon: Tag },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Profile", href: "/my-account", icon: User },
];

const ACTIVE = "#f5f0e8";
const INACTIVE = "rgba(245,240,232,0.45)";

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
        padding: "0 12px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", height: "100%" }}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.href);
          const Icon = item.icon;
          const color = isActive ? ACTIVE : INACTIVE;

          return (
            <Link
              key={item.label}
              to={item.href}
              style={{ flex: 1, display: "flex", justifyContent: "center", textDecoration: "none" }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <Icon size={26} color={color} strokeWidth={isActive ? 2.25 : 1.75} fill="none" />
                <span
                  style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: isActive ? 600 : 400,
                    color,
                    letterSpacing: "0.01em",
                  }}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
