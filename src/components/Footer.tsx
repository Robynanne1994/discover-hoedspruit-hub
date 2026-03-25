import { MapPin, Mail, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FooterContent {
  tagline?: string;
  address?: string;
  email?: string;
  phone?: string;
}

const Footer = () => {
  const { data } = useQuery({
    queryKey: ["site-content", "footer"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("content").eq("section", "footer").single();
      if (error) throw error;
      return data?.content as FooterContent | null;
    }
  });

  const tagline = data?.tagline ?? "Your full guide to Hoedspruit, all in one place.";
  const address = data?.address ?? "Hoedspruit, Limpopo";
  const email = data?.email ?? "hello@discoverhoedspruit.co.za";
  const phone = data?.phone ?? "+27 15 793 0000";

  return (
    <footer id="about" className="bg-foreground text-primary-foreground py-16 px-6 lg:px-12">
      <div className="container-wide max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-[2fr_0.8fr_0.8fr_1.5fr] gap-x-4 gap-y-10 mb-14">
          <div>
            <h3 className="text-2xl font-bold mb-3 font-sans">
              Hello <span className="text-amber-600 font-sans">Hoedspruit</span>
            </h3>
            <p className="text-primary-foreground/60 max-w-xs leading-relaxed text-sm">{tagline}</p>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-3 font-sans">Discover</h4>
            <ul className="space-y-2.5 text-primary-foreground/60 text-sm">
              <li><a href="#categories" className="hover:text-accent transition-colors">Explore</a></li>
              <li><a href="#events" className="hover:text-accent transition-colors">Events</a></li>
              <li><a href="/quiz" className="hover:text-accent transition-colors">Discover</a></li>
              <li><a href="/directories" className="hover:text-accent transition-colors">Directory</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-3 font-sans">About</h4>
            <ul className="space-y-2.5 text-primary-foreground/60 text-sm">
              <li><a href="/about" className="hover:text-accent transition-colors">About</a></li>
              <li><a href="/contact" className="hover:text-accent transition-colors">Contact</a></li>
              <li><a href="#advertise" className="hover:text-accent transition-colors">Advertise</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-3 font-sans">Get in Touch</h4>
            <ul className="space-y-3 text-primary-foreground/60 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-accent" />
                {address}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-accent" />
                {email}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-accent" />
                {phone}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-6 text-center text-primary-foreground/40 text-sm">
          © {new Date().getFullYear()} Hello Hoedspruit. All rights reserved.
        </div>
      </div>
    </footer>);

};

export default Footer;