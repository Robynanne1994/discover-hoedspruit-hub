import { Calendar, UtensilsCrossed, Compass, Home, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  { label: "Events", icon: Calendar, href: "/events" },
  { label: "Restaurants", icon: UtensilsCrossed, href: "/categories" },
  { label: "Activities", icon: Compass, href: "/categories" },
  { label: "Lodges", icon: Home, href: "/categories" },
  { label: "Specials", icon: Sparkles, href: "/categories" },
];

const CategoryPills = () => {
  return (
    <section className="px-6 pt-3 pb-2">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.label}
              to={cat.href}
              className="flex items-center gap-1.5 px-3 py-2 bg-card rounded-full border border-border/50 shadow-card whitespace-nowrap transition-all active:scale-95"
            >
              <Icon className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">{cat.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryPills;
