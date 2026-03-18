import { Utensils, Tent, Hotel, TreePine, ShoppingBag, Heart } from "lucide-react";
import lodgeImg from "@/assets/lodge-card.jpg";
import restaurantImg from "@/assets/restaurant-card.jpg";
import activitiesImg from "@/assets/activities-card.jpg";

const categories = [
  {
    title: "Restaurants & Cafés",
    description: "From bushveld braais to fine dining under the stars",
    icon: Utensils,
    image: restaurantImg,
    count: 24,
  },
  {
    title: "Lodges & Safari",
    description: "Luxury lodges and unforgettable Big Five encounters",
    icon: Tent,
    image: lodgeImg,
    count: 18,
  },
  {
    title: "Activities & Adventures",
    description: "Hot air balloons, river rafting and bush walks",
    icon: TreePine,
    image: activitiesImg,
    count: 32,
  },
];

const quickCategories = [
  { icon: Hotel, label: "Hotels" },
  { icon: ShoppingBag, label: "Shopping" },
  { icon: Heart, label: "Wellness" },
];

const CategoriesSection = () => {
  return (
    <section id="categories" className="section-padding bg-background">
      <div className="container-wide">
        <div className="text-center mb-12">
          <span className="text-primary font-medium text-sm tracking-widest uppercase">
            Explore
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-4">
            What are you looking for?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Browse the best Hoedspruit has to offer, from world-class game lodges to hidden gem restaurants.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {categories.map((cat) => (
            <a
              key={cat.title}
              href="#"
              className="group relative rounded-xl overflow-hidden aspect-[4/5] shadow-card hover:shadow-warm transition-all duration-300"
            >
              <img
                src={cat.image}
                alt={cat.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-6">
                <div className="flex items-center gap-2 mb-2">
                  <cat.icon className="h-5 w-5 text-accent" />
                  <span className="text-accent text-sm font-medium">{cat.count} listings</span>
                </div>
                <h3 className="font-heading text-2xl font-bold text-primary-foreground mb-1">
                  {cat.title}
                </h3>
                <p className="text-primary-foreground/70 text-sm">
                  {cat.description}
                </p>
              </div>
            </a>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {quickCategories.map((cat) => (
            <a
              key={cat.label}
              href="#"
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-card border border-border hover:border-primary hover:shadow-warm transition-all duration-200"
            >
              <cat.icon className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium text-sm">{cat.label}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
