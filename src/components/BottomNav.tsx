import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, Calendar, User } from "lucide-react";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/categories", icon: Search },
  { label: "Saved", href: "/saved", icon: Heart },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Profile", href: "/my-account", icon: User },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: "#ffffff",
        borderTop: "1px solid rgba(18,18,20,0.08)",
        height: 72,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", height: "100%" }}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.href);
          const Icon = item.icon;
          const color = isActive ? "#121214" : "rgba(18,18,20,0.35)";

          return (
            <Link
              key={item.label}
              to={item.href}
              style={{ flex: 1, display: "flex", justifyContent: "center", textDecoration: "none" }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Icon
                  size={22}
                  color={color}
                  strokeWidth={isActive ? 2 : 1.5}
                  fill={isActive && item.icon === Heart ? color : "none"}
                />
                <span style={{ fontSize: 10, fontWeight: 500, color }}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
