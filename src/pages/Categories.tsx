import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav from "@/components/BottomNav";
import heroBg from "@/assets/hero-homepage.jpg";

const Categories = () => {
  const [search, setSearch] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_quick_category", false)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!categories) return [];
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) => c.title.toLowerCase().includes(q));
  }, [categories, search]);

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Hero */}
      <section className="relative">
        <div className="relative h-[200px] overflow-hidden">
          <img
            src={heroBg}
            alt="Hoedspruit bushveld"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "var(--hero-overlay)" }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h1
              className="text-3xl font-bold tracking-tight leading-tight text-center"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Hello
              <br />
              Hoedspruit
            </h1>
          </div>
        </div>

        <div className="px-4 -mt-3 relative z-10">
          <p
            className="text-center text-lg font-semibold text-foreground mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Explore Hoedspruit
          </p>

          {/* Search bar */}
          <div className="flex items-center bg-card rounded-full shadow-card border border-border px-4 py-3 gap-3">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="px-4 pt-5 pb-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-foreground font-semibold text-lg mb-1">
              {search ? "No matching categories found" : "Nothing to explore just yet"}
            </p>
            <p className="text-muted-foreground text-sm">
              {search
                ? "Try another search term"
                : "We're getting Hoedspruit ready for you"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                className="group relative rounded-xl overflow-hidden aspect-[4/3] shadow-card active:scale-[0.97] transition-transform duration-150"
              >
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted" />
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                {/* Title */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white text-sm font-bold drop-shadow-md">
                    {cat.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Categories;
