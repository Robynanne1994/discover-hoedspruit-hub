import { useState } from "react";
import { Mail, Phone, MessageCircle, HelpCircle, ChevronRight, Send, Check, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const CONTACT_EMAIL = "hellohoedspruit@gmail.com";
const CONTACT_PHONE = "+27 72 123 4567";
const WHATSAPP = "https://wa.me/27721234567";

const ContactUs = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);

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

  const contactOptions = [
    {
      icon: Phone,
      title: "Call us",
      subtitle: CONTACT_PHONE,
      href: `tel:${CONTACT_PHONE.replace(/\s/g, "")}`,
    },
    {
      icon: Mail,
      title: "Email us",
      subtitle: CONTACT_EMAIL,
      href: `mailto:${CONTACT_EMAIL}`,
    },
    {
      icon: MessageCircle,
      title: "WhatsApp us",
      subtitle: "Typically replies in a few hours",
      href: WHATSAPP,
      external: true,
    },
    {
      icon: HelpCircle,
      title: "Send a message",
      subtitle: "Fill in our contact form",
      action: () => setShowForm(true),
    },
  ];

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="pt-14 pb-6 px-5 text-center">
        <h1
          className="text-2xl font-bold text-foreground tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Contact
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Have questions? We're here to help!
        </p>
      </div>

      <div className="px-5">
        {/* Contact options card */}
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden mb-6">
          {contactOptions.map((opt, i) => {
            const Icon = opt.icon;
            const inner = (
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                  <Icon className="h-[18px] w-[18px] text-foreground/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold text-foreground"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {opt.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {opt.subtitle}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </div>
            );

            const divider = i < contactOptions.length - 1 && (
              <div className="mx-5 border-b border-border/40" />
            );

            if (opt.action) {
              return (
                <div key={opt.title}>
                  <button
                    onClick={opt.action}
                    className="w-full text-left active:bg-muted/30 transition-colors"
                  >
                    {inner}
                  </button>
                  {divider}
                </div>
              );
            }

            return (
              <div key={opt.title}>
                <a
                  href={opt.href}
                  target={opt.external ? "_blank" : undefined}
                  rel={opt.external ? "noopener noreferrer" : undefined}
                  className="block active:bg-muted/30 transition-colors"
                >
                  {inner}
                </a>
                {divider}
              </div>
            );
          })}
        </div>

        {/* Contact form (shown on demand) */}
        {showForm && (
          <div className="mb-6">
            <h2
              className="text-lg font-bold text-foreground mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Send us a message
            </h2>

            {submitted ? (
              <div className="bg-card border border-border/60 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-7 w-7 text-secondary" />
                </div>
                <h3
                  className="font-bold text-lg text-foreground mb-2"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Thanks for reaching out
                </h3>
                <p className="text-muted-foreground text-sm mb-5">
                  We've received your message and will get back to you soon.
                </p>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setSubmitted(false)}
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Input
                    placeholder="Name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                    }}
                    className={`rounded-xl bg-card h-12 ${errors.name ? "border-destructive" : ""}`}
                  />
                  {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                    }}
                    className={`rounded-xl bg-card h-12 ${errors.email ? "border-destructive" : ""}`}
                  />
                  {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Textarea
                    placeholder="How can we help?"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (errors.message) setErrors((p) => ({ ...p, message: "" }));
                    }}
                    rows={5}
                    className={`rounded-xl bg-card ${errors.message ? "border-destructive" : ""}`}
                  />
                  {errors.message && (
                    <p className="text-destructive text-xs mt-1">{errors.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-xl h-12 gap-2"
                  disabled={submitForm.isPending}
                >
                  {submitForm.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Send Message
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        )}

        {/* Supporting message */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 text-center mb-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            We're just a message away. Whether you have questions, feedback, or need local advice — we'd love to hear from you.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
