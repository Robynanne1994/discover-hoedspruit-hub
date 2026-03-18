import { Megaphone, BarChart3, Eye, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  { icon: Eye, text: "Reach thousands of visitors monthly" },
  { icon: BarChart3, text: "Track your listing performance" },
  { icon: CheckCircle, text: "Featured placement in search results" },
];

const AdvertiseSection = () => {
  return (
    <section id="advertise" className="section-padding bg-background">
      <div className="container-wide">
        <div className="relative rounded-2xl overflow-hidden bg-secondary p-8 sm:p-12 lg:p-16">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
            <div className="absolute inset-0 bg-gradient-to-l from-secondary-foreground/20 to-transparent" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-secondary-foreground/10 rounded-full px-4 py-2 mb-6">
              <Megaphone className="h-4 w-4 text-secondary-foreground" />
              <span className="text-secondary-foreground text-sm font-medium">
                For Businesses
              </span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-secondary-foreground mb-4">
              Advertise Your Business
            </h2>
            <p className="text-secondary-foreground/80 text-lg mb-8 leading-relaxed">
              Get your restaurant, lodge, or activity in front of tourists and locals exploring Hoedspruit. Affordable packages for every business size.
            </p>

            <ul className="space-y-3 mb-8">
              {benefits.map((b) => (
                <li key={b.text} className="flex items-center gap-3 text-secondary-foreground/90">
                  <b.icon className="h-5 w-5 text-accent flex-shrink-0" />
                  <span className="font-medium">{b.text}</span>
                </li>
              ))}
            </ul>

            <Button size="lg" className="text-base px-8 py-6 shadow-warm">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdvertiseSection;
