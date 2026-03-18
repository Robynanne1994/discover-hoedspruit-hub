import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as LucideIcons from "lucide-react";
import lodgeImg from "@/assets/lodge-card.jpg";
import restaurantImg from "@/assets/restaurant-card.jpg";
import activitiesImg from "@/assets/activities-card.jpg";

const fallbackImages: Record<string, string> = {
  "Utensils": restaurantImg,
  "Tent": lodgeImg,
  "TreePine": activitiesImg,
};

const getIcon = (name: string) => {
  const Icon = (LucideIcons as any)[name];
  return Icon || LucideIcons.Folder;
};

const CategoriesSection = () => {
  const { data: featured } = useQuery({
    queryKey: ["categories-featured"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("is_quick_category", false).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: quick } = useQuery({
    queryKey: ["categories-quick"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("is_quick_category", true).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <section id="categories" className="section-padding bg-background">
      <div className="container-wide">
        <div className="text-center mb-12">
          <span className="text-primary font-medium text-sm tracking-widest uppercase">Explore</span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-4">
            What are you looking for?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Browse the best Hoedspruit has to offer, from world-class game lodges to hidden gem restaurants.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {featured?.map((cat) => {
            const Icon = getIcon(cat.icon);
            const img = cat.image_url || fallbackImages[cat.icon] || lodgeImg;
            return (
              <a key={cat.id} href="#" className="group relative rounded-xl overflow-hidden aspect-[4/5] shadow-card hover:shadow-warm transition-all duration-300">
                <img src={img} alt={cat.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                <div className="relative h-full flex flex-col justify-end p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-accent" />
                    <span className="text-accent text-sm font-medium">{cat.description}</span>
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-primary-foreground mb-1">{cat.title}</h3>
                </div>
              </a>
            );
          })}
        </div>

        {quick && quick.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3">
            {quick.map((cat) => {
              const Icon = getIcon(cat.icon);
              return (
                <a key={cat.id} href="#" className="flex items-center gap-2 px-5 py-3 rounded-full bg-card border border-border hover:border-primary hover:shadow-warm transition-all duration-200">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-foreground font-medium text-sm">{cat.title}</span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesSection;
