import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import SectionHeader from "./SectionHeader";

const FeaturedCarousel = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: featuredItems = [], isLoading } = useQuery({
    queryKey: ["featured-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, description, image_url, location")
        .eq("is_featured", true)
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const cardWidth = scrollRef.current.offsetWidth * 0.72;
    setActiveIndex(Math.round(scrollLeft / cardWidth));
  };

  if (isLoading) {
    return (
      <section className="pb-4">
        <SectionHeader title="Featured Now" />
        <div className="flex gap-3 px-4">
          <Skeleton className="flex-shrink-0 w-[72%] aspect-[4/3] rounded-xl" />
          <Skeleton className="flex-shrink-0 w-[72%] aspect-[4/3] rounded-xl" />
        </div>
      </section>
    );
  }

  if (featuredItems.length === 0) return null;

  return (
    <section className="pb-4">
      <SectionHeader title="Featured Now" />
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory"
      >
        {featuredItems.map((item) => (
          <Link
            to={`/listing/${item.id}`}
            key={item.id}
            className="snap-start flex-shrink-0 w-[72%] rounded-xl overflow-hidden relative aspect-[4/3] group"
          >
            <img
              src={item.image_url || "/placeholder.svg"}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              width={640}
              height={512}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-bold text-base mb-0.5">{item.title}</h3>
              {item.location && (
                <p className="text-white/75 text-xs mb-2.5">{item.location}</p>
              )}
              <Button
                size="sm"
                className="bg-accent hover:bg-accent-hover text-accent-foreground text-xs px-4 py-1.5 rounded-lg h-auto"
              >
                View Details
              </Button>
            </div>
          </Link>
        ))}
      </div>
      {featuredItems.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {featuredItems.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex ? "w-4 bg-primary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedCarousel;
