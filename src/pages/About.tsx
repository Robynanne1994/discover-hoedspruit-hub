import BackButton from "@/components/BackButton";
import { MapPin, Heart, Sun, TreePine } from "lucide-react";

const values = [
  { icon: MapPin, title: "Local Knowledge", description: "Curated listings and insider tips from people who know and love Hoedspruit." },
  { icon: Heart, title: "Community Driven", description: "Supporting local businesses and helping them connect with visitors and residents." },
  { icon: Sun, title: "Always Up to Date", description: "From seasonal events to new openings, we keep our finger on the pulse of the town." },
  { icon: TreePine, title: "Nature at Heart", description: "Celebrating the incredible natural beauty and wildlife that makes Hoedspruit unique." },
];

const About = () => {
  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Back button */}
      <div className="pt-4 px-4">
        <BackButton />
      </div>

      {/* Intro */}
      <div className="pt-2 pb-6 px-5 text-center">
        <h1
          className="text-2xl font-bold text-foreground tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          About Hello Hoedspruit
        </h1>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-xs mx-auto">
          Your full guide to Hoedspruit — eat, explore, and experience everything this incredible bushveld town has to offer.
        </p>
      </div>

      <div className="px-5 space-y-6">
        {/* Founder section */}
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src="https://media.licdn.com/dms/image/v2/D4D03AQEovnKgk_KDnw/profile-displayphoto-crop_800_800/B4DZxSzIvCJcAM-/0/1770915663825?e=1775692800&v=beta&t=cqieS2K8_BvM9SoPttQVDEJWbBVERBzXXdwEie_hLnk"
              alt="Robyn Dawes — Founder of Hello Hoedspruit"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-5 space-y-3">
            <h2
              className="text-lg font-bold text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Meet the Founder
            </h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>
                My name is Robyn Dawes, and Hoedspruit has been my home for as long as I can remember. I grew up surrounded by the beauty of the Lowveld, and over the years I've watched this little town blossom into something truly special.
              </p>
              <p>
                Having spent my whole life here, I know just how much Hoedspruit has to offer — from incredible wildlife and outdoor adventures to its warm community spirit and hidden gems that only a local would know.
              </p>
              <p>
                The idea behind Hello Hoedspruit came from a simple frustration: there was no single place where visitors and locals alike could find everything our town has to offer. Whether you're planning a trip, new to the area, or a fellow lifelong local — Hello Hoedspruit is my way of bringing our community together.
              </p>
            </div>
          </div>
        </div>


        {/* Value cards */}
        <div>
          <h2
            className="text-lg font-bold text-foreground mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            What We Stand For
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {values.map((item) => (
              <div
                key={item.title}
                className="bg-card border border-border/60 rounded-2xl p-4 space-y-2"
              >
                <div className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center">
                  <item.icon className="h-4 w-4 text-foreground/70" />
                </div>
                <h3
                  className="text-sm font-semibold text-foreground"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 text-center">
          <h2
            className="text-lg font-bold text-foreground mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Want to be listed?
          </h2>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            If you run a business in Hoedspruit and want to reach more people, we'd love to feature you.
          </p>
          <a
            href="/contact"
            className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-medium active:scale-[0.97] transition-transform"
          >
            Get in Touch
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;
