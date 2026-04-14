import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as LucideIcons from "lucide-react";
import lodgeImg from "@/assets/lodge-card.jpg";
import restaurantImg from "@/assets/restaurant-card.jpg";
import activitiesImg from "@/assets/activities-card.jpg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext } from
"@/components/ui/carousel";

const fallbackImages: Record<string, string> = {
  "Utensils": restaurantImg,
  "Tent": lodgeImg,
  "TreePine": activitiesImg
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
    }
  });

  const { data: quick } = useQuery({
    queryKey: ["categories-quick"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("is_quick_category", true).order("sort_order");
      if (error) throw error;
      return data;
    }
  });

  return (
    <section id="categories" className="section-padding bg-background">
      <div className="container-wide">
        <div className="mb-12">
          <span className="text-primary font-medium text-sm tracking-widest uppercase">Explore</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4 font-sans lg:text-6xl">
            ​Discover the 'Hoed   
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg text-left">
            Explore everything that Hoedspruit has to offer
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-foreground font-sans">Categories</h3>
            <Link to="/categories" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              View all
              <LucideIcons.ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <Carousel opts={{ align: "start", loop: false }} className="w-full">
            <CarouselContent className="-ml-2">
              {featured?.map((cat) => {
                const img = cat.image_url || fallbackImages[cat.icon] || lodgeImg;
                return (
                  <CarouselItem key={cat.id} className="pl-2 basis-1/2">
                    <Link to={`/category/${cat.id}`} className="group block">
                      <div className="relative rounded-2xl overflow-hidden aspect-square shadow-card hover:shadow-warm transition-all duration-300">
                        <img src={img} alt={cat.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="pt-1.5 px-0.5">
                        <span className="text-muted-foreground text-[8px] font-medium leading-tight">{cat.description}</span>
                        <h3 className="text-xs font-bold text-foreground font-sans mt-0.5">{cat.title}</h3>
                      </div>
                    </Link>
                  </CarouselItem>);

              })}
            </CarouselContent>
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </div>

        {quick && quick.length > 0 &&
        <div className="flex flex-wrap justify-center gap-3">
            {quick.map((cat) => {
            const Icon = getIcon(cat.icon);
            return (
              <Link key={cat.id} to={`/category/${cat.id}`} className="flex items-center gap-2 px-5 py-3 rounded-full bg-card border border-border hover:border-primary hover:shadow-warm transition-all duration-200">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-foreground font-medium text-sm">{cat.title}</span>
                </Link>);
          })}
          </div>
        }
      </div>
    </section>);
};

export default CategoriesSection;