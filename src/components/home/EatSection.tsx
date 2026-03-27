import SectionHeader from "./SectionHeader";
import VenueCard from "./VenueCard";
import restaurantBistro from "@/assets/restaurant-bistro.jpg";
import restaurantCafe from "@/assets/restaurant-cafe.jpg";

const restaurants = [
  { name: "Baobab Bistro", rating: 4.5, location: "Central", image: restaurantBistro },
  { name: "Wild Fig Cafe", rating: 4.7, location: "Bushveld", image: restaurantCafe },
];

const EatSection = () => {
  return (
    <section className="pb-4">
      <SectionHeader title="Eat in Hoedspruit" />
      <div className="flex gap-3 px-4">
        {restaurants.map((r) => (
          <VenueCard key={r.name} {...r} />
        ))}
      </div>
    </section>
  );
};

export default EatSection;
