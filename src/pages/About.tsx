import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapPin, Heart, Sun, TreePine } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-16 section-padding bg-muted/30">
        <div className="container-wide max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mb-6">
            About <span className="text-primary">Discover Hoedspruit</span>
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto">
            Your full guide to Hoedspruit — eat, explore, and experience everything this incredible bushveld town has to offer, all in one place.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-wide max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="rounded-xl overflow-hidden aspect-[4/5] bg-muted">
              <img
                src="/placeholder.svg"
                alt="About Discover Hoedspruit"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-4">
              <h2 className="font-heading text-3xl font-bold text-foreground">Who am I?</h2>
              <div className="text-muted-foreground leading-relaxed space-y-4">
                <p>
                  I'm the person behind Discover Hoedspruit — a local who fell in love with this incredible bushveld town and wanted to share it with the world.
                </p>
                <p>
                  After years of exploring every hidden gem, tasting every menu, and connecting with the passionate people who call Hoedspruit home, I decided to create a single place where all of this could live.
                </p>
                <p>
                  This platform is my way of celebrating the community, supporting local businesses, and helping visitors experience Hoedspruit the way it deserves to be experienced.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-wide max-w-4xl mx-auto space-y-12">
          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p>
              Nestled at the foot of the Drakensberg escarpment in Limpopo, South Africa, Hoedspruit is a gateway to some of the country's most breathtaking wildlife reserves, adventure activities, and culinary experiences.
            </p>
            <p>
              <strong className="text-foreground">Discover Hoedspruit</strong> was created to bring together the best of what this town has to offer — from restaurants and cafés to outdoor adventures, family-friendly activities, and community events. Whether you're a first-time visitor or a long-time local, we're here to help you make the most of your time in Hoedspruit.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: MapPin, title: "Local Knowledge", description: "Curated listings and insider tips from people who know and love Hoedspruit." },
              { icon: Heart, title: "Community Driven", description: "Supporting local businesses and helping them connect with visitors and residents alike." },
              { icon: Sun, title: "Always Up to Date", description: "From seasonal events to new openings, we keep our finger on the pulse of the town." },
              { icon: TreePine, title: "Nature at Heart", description: "Celebrating the incredible natural beauty and wildlife that makes Hoedspruit unique." },
            ].map((item) => (
              <div key={item.title} className="bg-card border border-border rounded-xl p-6 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-xl p-8 text-center space-y-4">
            <h2 className="font-heading text-2xl font-bold text-foreground">Want to be listed?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              If you run a business in Hoedspruit and want to reach more people, we'd love to feature you on Discover Hoedspruit.
            </p>
            <a href="/contact" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
              Get in Touch
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
