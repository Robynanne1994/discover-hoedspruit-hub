import { Calendar, UtensilsCrossed, Compass, Home, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  { label: "Events", icon: Calendar, href: "/events" },
  { label: "Restaurants", icon: UtensilsCrossed, href: "/categories" },
  { label: "Activities", icon: Compass, href: "/categories" },
  { label: "Lodges", icon: Home, href: "/categories" },
  { label: "Specials", icon: Sparkles, href: "/specials" },
];

const CategoryPills = () => {
  return (
    <section style={{ padding: "12px 16px 8px" }}>
      <div style={{ display: "flex", gap: 8, overflowX: "auto" }} className="scrollbar-hide">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.label}
              to={cat.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                background: "#F2EEE5",
                borderRadius: 9999,
                whiteSpace: "nowrap",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              <Icon size={16} color="#1A1A1A" strokeWidth={1.8} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "#1A1A1A" }}>
                {cat.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryPills;
