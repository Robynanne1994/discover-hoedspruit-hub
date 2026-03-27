import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/categories", icon: Search },
  { label: "Saved", href: "/my-account", icon: Heart },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Profile", href: "/my-account", icon: User },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = item.href === "/" 
            ? location.pathname === "/" 
            : location.pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link key={item.label} to={item.href} className="flex-1 flex justify-center py-2">
              <div className={cn(
                "flex flex-col items-center gap-1 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                <Icon className={cn("h-5 w-5", isActive && item.icon === Heart && "fill-primary")} />
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
