import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, Calendar, User } from "lucide-react";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/categories", icon: Search },
  { label: "Saved", href: "/my-hoedspruit", icon: Heart },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Profile", href: "/my-account", icon: User },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: "#FFFFFF",
        height: 84,
        paddingBottom: 34,
        boxShadow: "0 -1px 0 rgba(18,18,20,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", height: 50 }}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.href);
          const Icon = item.icon;
          const inactiveColor = "rgba(18,18,20,0.35)";

          return (
            <Link
              key={item.label}
              to={item.href}
              style={{ flex: 1, display: "flex", justifyContent: "center", textDecoration: "none" }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <Icon
                  size={28}
                  strokeWidth={1.8}
                  color={isActive ? "#020202" : inactiveColor}
                  fill={isActive && item.icon === Heart ? "#020202" : "none"}
                />
                {isActive ? (
                  <span style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                    color: "#FFFFFF",
                    background: "#020202",
                    borderRadius: 16,
                    padding: "6px 14px",
                  }}>{item.label}</span>
                ) : (
                  <span style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                    color: inactiveColor,
                  }}>{item.label}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
