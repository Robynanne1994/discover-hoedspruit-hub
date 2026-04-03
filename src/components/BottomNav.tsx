import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/categories", icon: Search },
  { label: "Saved", href: "/saved", icon: Heart },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Profile", href: "/my-account", icon: User },
];

const BottomNav = () => {
  const location = useLocation();
  const isDarkPage = location.pathname === "/categories";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={
        isDarkPage
          ? {
              background: "#111111",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              height: 72,
            }
          : undefined
      }
    >
      {!isDarkPage && (
        <div className="absolute inset-0 bg-card border-t border-border/50" />
      )}
      <div
        className={cn(
          "relative flex items-center justify-around",
          isDarkPage ? "h-[72px]" : "h-14"
        )}
      >
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.href);
          const Icon = item.icon;

          const activeColor = isDarkPage ? "#FFFFFF" : undefined;
          const inactiveColor = isDarkPage
            ? "rgba(255,255,255,0.4)"
            : undefined;

          return (
            <Link
              key={item.label}
              to={item.href}
              className="flex-1 flex justify-center py-1.5"
            >
              <div
                className={cn(
                  "flex flex-col items-center gap-0.5 font-medium transition-colors",
                  !isDarkPage &&
                    (isActive ? "text-primary" : "text-muted-foreground")
                )}
                style={{
                  fontSize: isDarkPage ? 10 : 10,
                  ...(isDarkPage
                    ? { color: isActive ? activeColor : inactiveColor }
                    : {}),
                }}
              >
                <Icon
                  className={cn(
                    isDarkPage ? "h-[22px] w-[22px]" : "h-[18px] w-[18px]",
                    !isDarkPage &&
                      isActive &&
                      item.icon === Heart &&
                      "fill-primary"
                  )}
                  strokeWidth={isActive ? 2 : 1.5}
                  style={
                    isDarkPage
                      ? { color: isActive ? activeColor : inactiveColor }
                      : undefined
                  }
                />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
