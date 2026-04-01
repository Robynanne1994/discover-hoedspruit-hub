import { Mail, Send, Loader2, Check, Star, Users, Eye, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";

const BENEFITS = [
  { icon: Eye, title: "Local Visibility", description: "Reach locals & visitors actively exploring Hoedspruit" },
  { icon: Users, title: "Targeted Audience", description: "Connect with an engaged, discovery-ready community" },
  { icon: Star, title: "Premium Placement", description: "Stand out with featured positions across the platform" },
  { icon: TrendingUp, title: "Grow Your Brand", description: "Build lasting awareness in the Hoedspruit area" },
];

const Advertise = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Please enter a valid email";
    if (!message.trim()) errs.message = "Tell us a bit about what you're looking for";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitForm = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("contact_submissions")
        .insert({
          name: name.trim(),
          email: email.trim(),
          message: `[Advertising Enquiry]${business ? ` Business: ${business.trim()}.` : ""} ${message.trim()}`,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setSubmitted(true);
      setName("");
      setEmail("");
      setBusiness("");
      setMessage("");
      setErrors({});
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) submitForm.mutate();
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Back button */}
      <div className="px-5 pt-4 pb-1">
        <BackButton />
      </div>

      {/* Hero intro */}
      <div className="px-5 pt-2 pb-6">
        <h1
          className="text-2xl font-bold text-foreground leading-tight mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Reach the Hoedspruit
          <br />
          Community
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
          Hello Hoedspruit is the go-to platform for locals and visitors discovering restaurants, activities, events, and services. Partner with us to put your business in the spotlight.
        </p>
      </div>

      {/* Benefits */}
      <div className="px-5 mb-8">
        <div className="space-y-3">
          {BENEFITS.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3.5 bg-card rounded-xl p-4 border border-border/50"
            >
              <div className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm text-foreground mb-0.5">{item.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why section */}
      <div className="px-5 mb-8">
        <div className="bg-card rounded-xl p-5 border border-border/50">
          <h2
            className="font-semibold text-base text-foreground mb-1.5"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Why Hello Hoedspruit?
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We're more than a directory — we're a trusted community hub. Your listing reaches people who are ready to explore, dine, and experience Hoedspruit.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="px-5 mb-8">
        <h2
          className="text-lg font-bold text-foreground mb-4"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Get in Touch
        </h2>

        {submitted ? (
          <div className="bg-card border border-border/50 rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Check className="h-5 w-5 text-primary" />
            </div>
            <h3
              className="font-bold text-base text-foreground mb-1.5"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Thanks for your interest!
            </h3>
            <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
              We've received your enquiry and will be in touch soon to discuss options.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
              onClick={() => setSubmitted(false)}
            >
              Send Another Enquiry
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: "" })); }}
                className={`rounded-xl bg-card h-11 border ${errors.name ? "border-destructive" : "border-border/50"}`}
              />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: "" })); }}
                className={`rounded-xl bg-card h-11 border ${errors.email ? "border-destructive" : "border-border/50"}`}
              />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <Input
                placeholder="Business name (optional)"
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                className="rounded-xl bg-card h-11 border border-border/50"
              />
            </div>
            <div>
              <Textarea
                placeholder="Tell us about your advertising needs..."
                value={message}
                onChange={(e) => { setMessage(e.target.value); if (errors.message) setErrors(p => ({ ...p, message: "" })); }}
                rows={4}
                className={`rounded-xl bg-card border ${errors.message ? "border-destructive" : "border-border/50"}`}
              />
              {errors.message && <p className="text-destructive text-xs mt-1">{errors.message}</p>}
            </div>
            <Button
              type="submit"
              className="w-full rounded-xl h-11 gap-2 text-sm font-medium"
              disabled={submitForm.isPending}
            >
              {submitForm.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="h-4 w-4" /> Send Enquiry</>
              )}
            </Button>
          </form>
        )}
      </div>

      {/* Email fallback */}
      <div className="px-5 mb-8">
        <div className="bg-card border border-border/50 rounded-xl p-5 text-center">
          <Mail className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Or email us directly at{" "}
            <a href="mailto:hellohoedspruit@gmail.com" className="text-primary font-medium">
              hellohoedspruit@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Advertise;
