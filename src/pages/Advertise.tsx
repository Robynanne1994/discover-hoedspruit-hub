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
  { icon: Eye, title: "Local Visibility", description: "Get your business in front of thousands of locals and visitors exploring Hoedspruit." },
  { icon: Users, title: "Targeted Audience", description: "Reach people actively searching for things to do, eat, and experience in the area." },
  { icon: Star, title: "Premium Placement", description: "Featured listings and homepage highlights to make your business stand out." },
  { icon: TrendingUp, title: "Grow Your Brand", description: "Build awareness and drive real foot traffic with a trusted local platform." },
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
    <div className="min-h-screen pb-20 bg-background">
      <div className="px-5 pt-4 pb-2">
        <BackButton />
      </div>
      <div className="px-5">
        {/* Intro */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Reach the Hoedspruit Community
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Hello Hoedspruit is the go-to platform for locals and visitors discovering restaurants, activities, events, and services. Partner with us to put your business in the spotlight.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {BENEFITS.map((item) => (
            <div key={item.title} className="bg-card border border-border rounded-2xl p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">{item.title}</h3>
              <p className="text-muted-foreground text-[10px] leading-tight">{item.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-accent/10 border border-accent/20 rounded-2xl p-6 text-center mb-6">
          <h3 className="font-bold text-lg text-foreground mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            Why Hello Hoedspruit?
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We're more than a directory — we're a trusted community hub. Your listing reaches people who are ready to explore, dine, and experience Hoedspruit.
          </p>
        </div>

        {/* Contact form */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            Get in Touch
          </h2>

          {submitted ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center mx-auto mb-4">
                <Check className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                Thanks for your interest!
              </h3>
              <p className="text-muted-foreground text-sm mb-5">
                We've received your enquiry and will be in touch soon to discuss options.
              </p>
              <Button variant="outline" className="rounded-full" onClick={() => setSubmitted(false)}>
                Send Another Enquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div>
                <Input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: "" })); }}
                  className={`rounded-xl bg-card h-12 ${errors.name ? "border-destructive" : ""}`}
                />
                {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: "" })); }}
                  className={`rounded-xl bg-card h-12 ${errors.email ? "border-destructive" : ""}`}
                />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <Input
                  placeholder="Business name (optional)"
                  value={business}
                  onChange={(e) => setBusiness(e.target.value)}
                  className="rounded-xl bg-card h-12"
                />
              </div>
              <div>
                <Textarea
                  placeholder="Tell us about your advertising needs..."
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); if (errors.message) setErrors(p => ({ ...p, message: "" })); }}
                  rows={5}
                  className={`rounded-xl bg-card ${errors.message ? "border-destructive" : ""}`}
                />
                {errors.message && <p className="text-destructive text-xs mt-1">{errors.message}</p>}
              </div>
              <Button type="submit" className="w-full rounded-xl h-12 gap-2" disabled={submitForm.isPending}>
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
        <div className="bg-card border border-border rounded-2xl p-6 text-center mb-8">
          <Mail className="h-6 w-6 text-primary mx-auto mb-2" />
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
