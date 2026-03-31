import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AdvertiseWithUs = () => {
  const navigate = useNavigate();

  return (
    <section className="section-padding bg-background">
      <div className="container-wide">
        <div className="rounded-2xl bg-primary/15 p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            Want to be listed?
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            If you run a business in Hoedspruit and want to reach more people, we'd love to feature you on Hello Hoedspruit.
          </p>
          <Button
            onClick={() => navigate("/contact")}
            className="rounded-full px-8 mt-2"
          >
            Get in Touch
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AdvertiseWithUs;
