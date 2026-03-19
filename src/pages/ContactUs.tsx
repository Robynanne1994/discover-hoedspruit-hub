import { MapPin, Mail, Phone, Send } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { toast } from "sonner";

interface FooterContent {
  tagline?: string;
  address?: string;
  email?: string;
  phone?: string;
}

const ContactUs = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const { data } = useQuery({
    queryKey: ["site-content", "footer"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("content").eq("section", "footer").single();
      if (error) throw error;
      return data?.content as FooterContent | null;
    }
  });

  const address = data?.address ?? "Hoedspruit, Limpopo";
  const contactEmail = data?.email ?? "hello@discoverhoedspruit.co.za";
  const phone = data?.phone ?? "+27 61 332 1709";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you for your message! We'll get back to you soon.");
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 section-padding pt-32">
        <div className="container-wide max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground font-mono">
            Contact <span className="text-orange-800 font-mono">us</span>
          </h1>
          <p className="text-muted-foreground mb-12 max-w-xl">
            Have a question or want to get in touch? We'd love to hear from you.
          </p>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-accent/10">
                  <MapPin className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1 font-mono">Address</h3>
                  <p className="text-muted-foreground">{address}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-accent/10">
                  <Mail className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1 font-mono">Email</h3>
                  <a href={`mailto:${contactEmail}`} className="text-muted-foreground hover:text-accent transition-colors">
                    {contactEmail}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-accent/10">
                  <Phone className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1 font-mono">Phone</h3>
                  <a href={`tel:${phone}`} className="text-muted-foreground hover:text-accent transition-colors">
                    {phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" rows={5} required />
              </div>
              <Button type="submit" className="w-full gap-2">
                <Send className="h-4 w-4" /> Send Message
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>);

};

export default ContactUs;