import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AdvertiseWithUs = () => {
  const navigate = useNavigate();

  return (
    <section className="px-5 pt-8 pb-12">
      <div className="rounded-2xl bg-primary/8 px-6 py-6 flex items-center gap-5 border border-border/40">
        <div className="flex-1 min-w-0">
          <h2
            className="text-foreground tracking-tight font-sans text-[#111113] font-bold text-sm"
          >
            Want to be listed?
          </h2>
          <p className="text-muted-foreground text-[12.5px] leading-relaxed mt-1">
            If you run a business in Hoedspruit and want to reach more people, we'd love to feature you.
          </p>
        </div>
        <Button
          onClick={() => navigate("/contact")}
          className="rounded-full px-6 text-[13px] font-medium shrink-0"
          variant="default"
        >
          Get in Touch
        </Button>
      </div>
    </section>
  );
};

export default AdvertiseWithUs;
