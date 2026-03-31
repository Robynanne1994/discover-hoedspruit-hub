import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AdvertiseWithUs = () => {
  const navigate = useNavigate();

  return (
    <section className="px-5 pt-8 pb-12">
      <div className="rounded-xl bg-primary/8 p-8 text-center space-y-4 border border-border/60">
        <h2
          className="text-[22px] font-semibold text-foreground tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Want to be listed?
        </h2>
        <p className="text-muted-foreground text-[13px] leading-relaxed max-w-xs mx-auto">
          If you run a business in Hoedspruit and want to reach more people, we'd love to feature you.
        </p>
        <Button
          onClick={() => navigate("/contact")}
          className="rounded-full px-8 mt-2 text-[13px] font-medium"
          variant="default"
        >
          Get in Touch
        </Button>
      </div>
    </section>
  );
};

export default AdvertiseWithUs;
