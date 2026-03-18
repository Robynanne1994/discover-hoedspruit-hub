import { MapPin, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer id="about" className="bg-foreground text-primary-foreground section-padding">
      <div className="container-wide">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="lg:col-span-2">
            <h3 className="font-heading text-2xl font-bold mb-4">
              Discover <span className="text-accent">Hoedspruit</span>
            </h3>
            <p className="text-primary-foreground/60 max-w-md leading-relaxed">
              Your complete guide to everything Hoedspruit – from game drives and bush walks to craft markets and sundowner spots in the heart of the Lowveld.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-primary-foreground/60">
              <li><a href="#categories" className="hover:text-accent transition-colors">Explore</a></li>
              <li><a href="#events" className="hover:text-accent transition-colors">Events</a></li>
              <li><a href="#advertise" className="hover:text-accent transition-colors">Advertise</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Get in Touch</h4>
            <ul className="space-y-3 text-primary-foreground/60 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" />
                Hoedspruit, Limpopo
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" />
                hello@discoverhoedspruit.co.za
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent" />
                +27 15 793 0000
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-8 text-center text-primary-foreground/40 text-sm">
          © {new Date().getFullYear()} Discover Hoedspruit. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
