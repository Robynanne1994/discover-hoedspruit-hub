import { Megaphone, BarChart3, Eye, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, any> = { Eye, BarChart3, CheckCircle };

const AdvertiseSection = () => {
  const { data } = useQuery({
    queryKey: ["site-content", "advertise"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("content").eq("section", "advertise").single();
      if (error) throw error;
      return data?.content as { title?: string; description?: string; benefits?: string[] } | null;
    },
  });

  const title = data?.title ?? "Advertise Your Business";
  const description = data?.description ?? "";
  const benefits = data?.benefits ?? [];

  return (
    <section id="advertise" className="section-padding bg-background">
      <div className="container-wide">
        <div className="relative rounded-2xl overflow-hidden p-5 sm:p-8 bg-primary">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
            <div className="absolute inset-0 bg-gradient-to-l from-secondary-foreground/20 to-transparent" />
          </div>

          <div className="relative z-10 max-w-xl">

            <h2 className="text-xl sm:text-2xl font-bold text-secondary-foreground mb-2 font-sans">{title}</h2>
            <p className="text-secondary-foreground/80 mb-4 leading-relaxed text-xs">{description}</p>

            <ul className="space-y-2 mb-4">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-secondary-foreground/90">
                  <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                  <span className="font-medium text-sm">{b}</span>
                </li>
              ))}
            </ul>

            <Button size="sm" className="text-sm px-6 py-3 shadow-warm rounded-none bg-secondary-border">Get Started</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdvertiseSection;
