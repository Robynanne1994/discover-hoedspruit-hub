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
        height: "calc(74px + var(--safe-bottom))",
        padding: "0 10px var(--safe-bottom)",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", height: 74, gap: 4 }}>
        {(() => {
          const path = location.pathname;
          const starts = (...prefixes: string[]) => prefixes.some((p) => path === p || path.startsWith(p + "/"));

          // Every route maps to exactly one tab. Anything unmatched falls back
          // to Profile, so the bar is never fully inactive.
          let activeHref: string;
          if (path === "/" || starts("/search", "/local-channels", "/lowdown", "/lowveld-lowdown", "/directories", "/quiz", "/quizzes", "/about", "/advertise")) {
            activeHref = "/";
          } else if (starts("/categories", "/category", "/listing", "/explore")) {
            activeHref = "/categories";
          } else if (starts("/specials")) {
            activeHref = "/specials";
          } else if (starts("/events")) {
            activeHref = "/events";
          } else {
            activeHref = user ? "/my-profile" : "/my-profile-guest";
          }

          return navItems.map((item) => {
            const isActive = item.href === activeHref;
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
                height: 40,
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
          });
        })()}
      </div>
    </nav>
  );
};

export default BottomNav;
