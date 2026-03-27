import SectionHeader from "./SectionHeader";
import VenueCard from "./VenueCard";
import lodgeRiver from "@/assets/lodge-river.jpg";
import lodgeCamp from "@/assets/lodge-camp.jpg";

const lodges = [
  { name: "River Lodge Retreat", rating: 4.6, location: "Riverside", image: lodgeRiver },
  { name: "Savanna Camp", rating: 4.8, location: "Game Reserve", image: lodgeCamp },
];

const StaySection = () => {
  return (
    <section className="pb-6">
      <SectionHeader title="Places to Stay" />
      <div className="flex gap-3 px-4">
        {lodges.map((l) => (
          <VenueCard key={l.name} {...l} />
        ))}
      </div>
    </section>
  );
};

export default StaySection;
