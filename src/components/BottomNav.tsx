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

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      <div className="absolute inset-0 bg-card border-t border-border/50" />
      <div
        className="relative flex items-center justify-around h-14"
      >
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.href}
              className="flex-1 flex justify-center py-1.5"
            >
              <div
                className={cn(
                  "flex flex-col items-center gap-0.5 font-medium transition-colors text-[10px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    isActive && item.icon === Heart && "fill-primary"
                  )}
                  strokeWidth={isActive ? 2 : 1.5}
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
