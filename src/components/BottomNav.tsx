import { Link, useLocation } from "react-router-dom";
import { Home, Search, Tag, Calendar, User } from "lucide-react";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/categories", icon: Search },
  { label: "Specials", href: "/specials", icon: Tag },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Profile", href: "/my-account", icon: User },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: "#48484a",
        borderRadius: "16px 16px 0 0",
        height: 74,
        padding: "0 20px 8px 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", height: "100%" }}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.href);
          const Icon = item.icon;
          const color = isActive ? "#ffffff" : "rgba(255,255,255,0.4)";

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
                  fill="none"
                />
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 10, fontWeight: 500, color }}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
