import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as LucideIcons from "lucide-react";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import lodgeImg from "@/assets/lodge-card.jpg";
import restaurantImg from "@/assets/restaurant-card.jpg";
import activitiesImg from "@/assets/activities-card.jpg";

const fallbackImages: Record<string, string> = {
  Utensils: restaurantImg,
  Tent: lodgeImg,
  TreePine: activitiesImg,
};

const getIcon = (name: string) => {
  const Icon = (LucideIcons as any)[name];
  return Icon || LucideIcons.Folder;
};

const Categories = () => {
  const { data: featured } = useQuery({
    queryKey: ["categories-featured"],
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

  const { data: quick } = useQuery({
    queryKey: ["categories-quick"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_quick_category", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-16 section-padding bg-background">
        <div className="container-wide">
          <BackButton />
          <div className="text-center mb-12">
            <span className="text-primary font-medium text-sm tracking-widest uppercase">
              Explore
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4 font-sans lg:text-6xl">
              Discover the 'Hoed
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Explore everything that Hoedspruit has to offer
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
            {featured?.map((cat) => {
              const img = cat.image_url || fallbackImages[cat.icon] || lodgeImg;
              return (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className="group relative rounded-none overflow-hidden aspect-[3/4] shadow-card hover:shadow-warm transition-all duration-300"
                >
                  <img
                    src={img}
                    alt={cat.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                  <div className="relative h-full flex flex-col justify-end p-6">
                    <div className="mb-2">
                      <span className="text-accent text-sm font-medium">
                        {cat.description}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-primary-foreground mb-1 font-sans">
                      {cat.title}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>

          {quick && quick.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3">
              {quick.map((cat) => {
                const Icon = getIcon(cat.icon);
                return (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.id}`}
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-card border border-border hover:border-primary hover:shadow-warm transition-all duration-200"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-foreground font-medium text-sm">
                      {cat.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Categories;
