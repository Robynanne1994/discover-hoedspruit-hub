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

  const tagline = data?.tagline ?? "Your complete guide to everything Hoedspruit – from game drives and bush walks to craft markets and sundowner spots in the heart of the Lowveld.";
  const address = data?.address ?? "Hoedspruit, Limpopo";
  const email = data?.email ?? "hello@discoverhoedspruit.co.za";
  const phone = data?.phone ?? "+27 15 793 0000";

  return (
    <footer id="about" className="bg-foreground text-primary-foreground section-padding">
      <div className="container-wide">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="lg:col-span-2">
            <h3 className="font-heading text-2xl font-bold mb-4">
              Discover <span className="text-amber-600 font-sans">Hoedspruit</span>
            </h3>
            <p className="text-primary-foreground/60 max-w-md leading-relaxed">{tagline}</p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-primary-foreground/60">
              <li><a href="#categories" className="hover:text-accent transition-colors">Explore</a></li>
              <li><a href="#events" className="hover:text-accent transition-colors">Events</a></li>
              <li><a href="#advertise" className="hover:text-accent transition-colors">Advertise</a></li>
              <li><a href="/contact" className="hover:text-accent transition-colors">Contact us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Get in Touch</h4>
            <ul className="space-y-3 text-primary-foreground/60 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" />
                {address}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" />
                {email}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent" />
                {phone}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-8 text-center text-primary-foreground/40 text-sm">
          © {new Date().getFullYear()} Discover Hoedspruit. All rights reserved.
        </div>
      </div>
    </footer>);

};

export default Footer;