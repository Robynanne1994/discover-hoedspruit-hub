import { useState } from "react";
import { Mail, Phone, MapPin, Instagram, Facebook, Send, Check, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import heroBg from "@/assets/hero-homepage.jpg";

const CONTACT_EMAIL = "hellohoedspruit@gmail.com";
const CONTACT_PHONE = "+27 72 123 4567";
const CONTACT_ADDRESS = "Hoedspruit, Limpopo\nSouth Africa";
const INSTAGRAM = "https://instagram.com/hellohoedspruit";
const FACEBOOK = "https://facebook.com/hellohoedspruit";
const TIKTOK = "https://tiktok.com/@hellohoedspruit";

const ContactUs = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Please enter a valid email";
    if (!message.trim()) errs.message = "Message is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitForm = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("contact_submissions")
        .insert({ name: name.trim(), email: email.trim(), message: message.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
      setErrors({});
    },
    onError: () => {
      toast.error("Something went wrong. Please try again in a moment.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) submitForm.mutate();
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Hero */}
      <section className="relative">
        <div className="relative h-[240px] overflow-hidden">
          <img src={heroBg} alt="Hoedspruit" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
            <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ fontFamily: "var(--font-heading)" }}>
              Hello<br />Hoedspruit
            </h1>
            <p className="text-xl font-semibold mt-2" style={{ fontFamily: "var(--font-heading)" }}>
              Contact Us
            </p>
            <p className="text-white/80 text-sm mt-1">We'd love to hear from you</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-background rounded-t-[2rem]" />
      </section>

      <div className="relative -mt-6 px-4 pt-2">
        {/* Welcome text */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Welcome to Hello Hoedspruit!
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Whether you have a question, need local advice, or would like to list your business or event, we're here to help. Reach out to us using any of the options below and we'll get back to you as soon as possible.
          </p>
        </div>

        {/* Contact cards grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Email card */}
          <a href={`mailto:${CONTACT_EMAIL}`} className="bg-card border border-border rounded-2xl p-4 text-center active:scale-[0.97] transition-transform">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-sm text-foreground mb-1">Email Us</h3>
            <p className="text-primary text-xs font-medium mb-1">{CONTACT_EMAIL}</p>
            <p className="text-muted-foreground text-[10px] leading-tight">We typically reply within 24 hours.</p>
          </a>

          {/* Call card */}
          <a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`} className="bg-card border border-border rounded-2xl p-4 text-center active:scale-[0.97] transition-transform">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-2">
              <Phone className="h-5 w-5 text-secondary" />
            </div>
            <h3 className="font-bold text-sm text-foreground mb-1">Call Us</h3>
            <p className="text-primary text-xs font-medium mb-1">{CONTACT_PHONE}</p>
            <p className="text-muted-foreground text-[10px] leading-tight">Mon–Fri, 8am–5pm SAST</p>
          </a>

          {/* Visit card */}
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-sm text-foreground mb-1">Visit Us</h3>
            <p className="text-muted-foreground text-xs whitespace-pre-line leading-tight">{CONTACT_ADDRESS}</p>
            <p className="text-muted-foreground text-[10px] mt-1">By appointment.</p>
          </div>

          {/* Follow card */}
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="bg-card border border-border rounded-2xl p-4 text-center active:scale-[0.97] transition-transform">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
              <Instagram className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-sm text-foreground mb-1">Follow Us</h3>
            <p className="text-primary text-xs font-medium mb-1">@hellohoedspruit</p>
            <p className="text-muted-foreground text-[10px] leading-tight">Join us for local tips, updates, and inspiration.</p>
          </a>
        </div>

        {/* Contact form */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            Send Us a Message
          </h2>

          {submitted ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center mx-auto mb-4">
                <Check className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                Thanks for reaching out
              </h3>
              <p className="text-muted-foreground text-sm mb-5">
                We've received your message and will get back to you soon.
              </p>
              <Button variant="outline" className="rounded-full" onClick={() => setSubmitted(false)}>
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: "" })); }}
                  className={`rounded-xl bg-card h-12 ${errors.name ? "border-destructive" : ""}`}
                />
                {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: "" })); }}
                  className={`rounded-xl bg-card h-12 ${errors.email ? "border-destructive" : ""}`}
                />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <Textarea
                  placeholder="How can we help?"
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); if (errors.message) setErrors(p => ({ ...p, message: "" })); }}
                  rows={5}
                  className={`rounded-xl bg-card ${errors.message ? "border-destructive" : ""}`}
                />
                {errors.message && <p className="text-destructive text-xs mt-1">{errors.message}</p>}
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl h-12 gap-2"
                disabled={submitForm.isPending}
              >
                {submitForm.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="h-4 w-4" /> Send Message</>
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Social block */}
        <div className="bg-card border border-border rounded-2xl p-6 text-center mb-8">
          <h3 className="font-bold text-lg text-foreground mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            Love Hoedspruit?
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Follow us for local inspiration, events, and hidden gems.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href={FACEBOOK} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center active:scale-95 transition-transform">
              <Facebook className="h-5 w-5 text-primary" />
            </a>
            <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center active:scale-95 transition-transform">
              <Instagram className="h-5 w-5 text-primary" />
            </a>
            <a href={TIKTOK} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center active:scale-95 transition-transform">
              <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.4a8.16 8.16 0 0 0 4.77 1.52V7.56a4.85 4.85 0 0 1-1.01-.87z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
