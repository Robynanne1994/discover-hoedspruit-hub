import { Link, useLocation } from "react-router-dom";
import { Compass, Calendar, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Discover", href: "/#categories", icon: Compass },
  { label: "Events", href: "/#events", icon: Calendar },
  { label: "Explore", href: "/quiz", icon: Sparkles },
];

const BottomNav = () => {
  const location = useLocation();

  const handleClick = (href: string) => {
    const hash = href.replace("/", "");
    if (hash.startsWith("#")) {
      if (location.pathname === "/") {
        const el = document.getElementById(hash.slice(1));
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isHashLink = item.href.startsWith("/#");
          const hash = item.href.replace("/", "");
          const isActive = isHashLink
            ? location.pathname === "/" && location.hash === hash
            : location.pathname === item.href;

          const Icon = item.icon;

          const content = (
            <div className={cn(
              "flex flex-col items-center gap-1 text-xs font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </div>
          );

          if (isHashLink) {
            return location.pathname === "/" ? (
              <button key={item.label} onClick={() => handleClick(item.href)} className="flex-1 flex justify-center py-2">
                {content}
              </button>
            ) : (
              <Link key={item.label} to={item.href} className="flex-1 flex justify-center py-2">
                {content}
              </Link>
            );
          }

          return (
            <Link key={item.label} to={item.href} className="flex-1 flex justify-center py-2">
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
