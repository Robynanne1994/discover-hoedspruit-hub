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
    <>
      {/* SVG displacement filter for the liquid glass refraction */}
      <svg
        aria-hidden
        width="0"
        height="0"
        style={{ position: "absolute", width: 0, height: 0 }}
      >
        <defs>
          <filter id="liquid-glass-distortion" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.012"
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="2" result="softNoise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="softNoise"
              scale="60"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <nav
        className="fixed left-3 right-3 z-50 md:hidden"
        style={{
          bottom: 12,
          background: "rgba(40, 36, 32, 0.35)",
          backdropFilter:
            "url(#liquid-glass-distortion) blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderRadius: 28,
          height: 74,
          padding: "0 10px",
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.2), inset 0 0 20px rgba(255,255,255,0.05)",
          isolation: "isolate",
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
                background: isActive
                  ? "rgba(255,255,255,0.85)"
                  : "transparent",
                backdropFilter: isActive ? "blur(12px) saturate(180%)" : undefined,
                WebkitBackdropFilter: isActive ? "blur(12px) saturate(180%)" : undefined,
                boxShadow: isActive
                  ? "inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 8px rgba(0,0,0,0.15)"
                  : "none",
                gap: 8,
                padding: isActive ? "0 16px" : 0,
                transition: "flex 200ms ease, background 200ms ease, padding 200ms ease",
              }}
            >
              <Icon
                size={24}
                color={isActive ? PILL_FG : "#ffffff"}
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
    </>
  );
};

export default BottomNav;
