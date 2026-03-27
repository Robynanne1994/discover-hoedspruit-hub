import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import SectionHeader from "./SectionHeader";
import featuredSafari from "@/assets/featured-safari.jpg";
import featuredDinner from "@/assets/featured-dinner.jpg";

const featuredItems = [
  {
    id: "1",
    title: "Elephant Safari Tour",
    meta: "Today · 5km away",
    image: featuredSafari,
  },
  {
    id: "2",
    title: "Sunset Dinner Special",
    meta: "Limited Offer",
    image: featuredDinner,
  },
];

const FeaturedCarousel = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const cardWidth = scrollRef.current.offsetWidth * 0.72;
    setActiveIndex(Math.round(scrollLeft / cardWidth));
  };

  return (
    <section className="pb-4">
      <SectionHeader title="Featured Now" />
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory"
      >
        {featuredItems.map((item) => (
          <div
            key={item.id}
            className="snap-start flex-shrink-0 w-[72%] rounded-xl overflow-hidden relative aspect-[4/3] group"
          >
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              width={640}
              height={512}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-bold text-base mb-0.5">{item.title}</h3>
              <p className="text-white/75 text-xs mb-2.5">{item.meta}</p>
              <Button
                size="sm"
                className="bg-accent hover:bg-accent-hover text-accent-foreground text-xs px-4 py-1.5 rounded-lg h-auto"
              >
                View Details
              </Button>
            </div>
          </div>
        ))}
      </div>
      {/* Dot indicators */}
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
    </section>
  );
};

export default FeaturedCarousel;
