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
    <section className="px-4 py-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.label}
              to={cat.href}
              className="flex items-center gap-2 px-4 py-2.5 bg-card rounded-full border border-border shadow-card whitespace-nowrap transition-all active:scale-95 hover:shadow-warm"
            >
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{cat.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryPills;
