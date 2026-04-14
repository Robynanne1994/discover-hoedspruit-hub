import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import SectionHeader from "./SectionHeader";
import { MapPin } from "lucide-react";

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
    const cardWidth = scrollRef.current.offsetWidth * 0.78;
    setActiveIndex(Math.round(scrollLeft / cardWidth));
  };

  if (isLoading) {
    return (
      <section className="pb-6">
        <SectionHeader title="Featured" />
        <div className="flex gap-4 px-6">
          <Skeleton className="flex-shrink-0 w-[78%] aspect-[3/4] rounded-xl" />
          <Skeleton className="flex-shrink-0 w-[78%] aspect-[3/4] rounded-xl" />
        </div>
      </section>
    );
  }

  if (featuredItems.length === 0) return null;

  return (
    <section className="pb-2">
      <SectionHeader title="Featured" />
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-pl-5"
      >
        {featuredItems.map((item, index) => (
          <Link
            to={`/listing/${item.id}`}
            key={item.id}
            className={`snap-start flex-shrink-0 w-[78%] rounded-xl overflow-hidden relative aspect-[3/4] group ${index === 0 ? "ml-5" : ""} ${index === featuredItems.length - 1 ? "mr-5" : ""}`}
          >
            <img
              src={item.image_url || "/placeholder.svg"}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
              width={640}
              height={853}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3
                className="text-white font-semibold text-lg leading-snug mb-1"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {item.title}
              </h3>
              {item.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-white/70" />
                  <p className="text-white/70 text-[12px]">{item.location}</p>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
      {featuredItems.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {featuredItems.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${
                i === activeIndex ? "w-5 h-1 bg-primary" : "w-1 h-1 bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedCarousel;
