import { useState } from "react";
import { Mail, Phone, MessageCircle, HelpCircle, ChevronRight, Send, Check, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const CONTACT_EMAIL = "hellohoedspruit@gmail.com";
const CONTACT_PHONE = "+27 72 123 4567";
const WHATSAPP = "https://wa.me/27721234567";

const ContactUs = () => {
  const navigate = useNavigate();
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
      action: () => setShowForm((prev) => !prev),
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: 72 }}>
      {/* Back button */}
      <div style={{ paddingTop: 52, paddingLeft: 24, paddingRight: 24 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <ArrowLeft size={18} strokeWidth={2} color="rgba(18,18,20,0.4)" />
          <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(18,18,20,0.4)", letterSpacing: 0.2 }}>
            Back
          </span>
        </button>
      </div>

      {/* Heading */}
      <div style={{ marginTop: 28, paddingLeft: 24, paddingRight: 24 }}>
        <h1 style={{
          fontSize: 40,
          fontWeight: 900,
          lineHeight: 0.95,
          letterSpacing: -0.5,
          color: "#121214",
          textTransform: "uppercase",
          margin: 0,
        }}>
          GET IN<br />TOUCH
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ marginTop: 12, paddingLeft: 24, paddingRight: 24 }}>
        <p style={{
          fontSize: 14,
          color: "rgba(18,18,20,0.4)",
          letterSpacing: 0.2,
          lineHeight: 1.4,
          fontStyle: "italic",
          fontFamily: "Georgia, 'Times New Roman', serif",
          margin: 0,
        }}>
          Questions, feedback or local advice
        </p>
      </div>

      {/* Contact options */}
      <div style={{ marginTop: 32, paddingLeft: 24, paddingRight: 24 }}>
        {contactOptions.map((opt, i) => {
          const Icon = opt.icon;
          const inner = (
            <div style={{
              display: "flex",
              alignItems: "center",
              padding: "16px 0",
              borderBottom: i < contactOptions.length - 1 ? "1px solid rgba(18,18,20,0.06)" : "none",
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(18,18,20,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon size={22} strokeWidth={1.5} color="rgba(18,18,20,0.3)" />
              </div>
              <div style={{ flex: 1, minWidth: 0, marginLeft: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#121214" }}>{opt.title}</div>
                <div style={{ fontSize: 12, color: "rgba(18,18,20,0.35)", marginTop: 2 }}>{opt.subtitle}</div>
              </div>
              <ChevronRight size={16} strokeWidth={2} color="rgba(18,18,20,0.2)" />
            </div>
          );

          if (opt.action) {
            return (
              <button
                key={opt.title}
                onClick={opt.action}
                style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {inner}
              </button>
            );
          }

          return (
            <a
              key={opt.title}
              href={opt.href}
              target={opt.external ? "_blank" : undefined}
              rel={opt.external ? "noopener noreferrer" : undefined}
              style={{ display: "block", textDecoration: "none", color: "inherit" }}
            >
              {inner}
            </a>
          );
        })}
      </div>

      {/* Contact form */}
      {showForm && (
        <div style={{ marginTop: 32, paddingLeft: 24, paddingRight: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#121214", marginBottom: 16 }}>
            Send us a message
          </h2>

          {submitted ? (
            <div style={{
              background: "rgba(18,18,20,0.03)",
              border: "1px solid rgba(18,18,20,0.06)",
              borderRadius: 16,
              padding: 32,
              textAlign: "center",
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(18,18,20,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <Check size={28} color="#121214" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#121214", marginBottom: 8 }}>
                Thanks for reaching out
              </h3>
              <p style={{ fontSize: 14, color: "rgba(18,18,20,0.4)", marginBottom: 20 }}>
                We've received your message and will get back to you soon.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                style={{
                  background: "none",
                  border: "1px solid rgba(18,18,20,0.15)",
                  borderRadius: 12,
                  padding: "10px 24px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#121214",
                  cursor: "pointer",
                }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <input
                  placeholder="Name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: "" })); }}
                  style={{
                    width: "100%",
                    background: "rgba(18,18,20,0.03)",
                    border: errors.name ? "1px solid #ef4444" : "1px solid rgba(18,18,20,0.08)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    fontSize: 15,
                    color: "#121214",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {errors.name && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{errors.name}</p>}
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: "" })); }}
                  style={{
                    width: "100%",
                    background: "rgba(18,18,20,0.03)",
                    border: errors.email ? "1px solid #ef4444" : "1px solid rgba(18,18,20,0.08)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    fontSize: 15,
                    color: "#121214",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {errors.email && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{errors.email}</p>}
              </div>
              <div>
                <textarea
                  placeholder="How can we help?"
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); if (errors.message) setErrors((p) => ({ ...p, message: "" })); }}
                  rows={5}
                  style={{
                    width: "100%",
                    background: "rgba(18,18,20,0.03)",
                    border: errors.message ? "1px solid #ef4444" : "1px solid rgba(18,18,20,0.08)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    fontSize: 15,
                    color: "#121214",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
                {errors.message && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{errors.message}</p>}
              </div>
              <button
                type="submit"
                disabled={submitForm.isPending}
                style={{
                  width: "100%",
                  background: "#121214",
                  borderRadius: 12,
                  padding: 16,
                  border: "none",
                  color: "#ffffff",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: submitForm.isPending ? 0.6 : 1,
                }}
              >
                {submitForm.isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Sending...</>
                ) : (
                  <><Send size={16} /> Send Message</>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Supportive message */}
      <div style={{ marginTop: 32, paddingLeft: 24, paddingRight: 24, marginBottom: 100 }}>
        <div style={{
          background: "rgba(18,18,20,0.03)",
          border: "1px solid rgba(18,18,20,0.06)",
          borderRadius: 16,
          padding: 24,
        }}>
          <p style={{
            fontSize: 14,
            color: "rgba(18,18,20,0.4)",
            lineHeight: 1.6,
            textAlign: "center",
            margin: 0,
          }}>
            We're just a message away. Whether you have questions, feedback, or need local advice, we'd love to hear from you.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ContactUs;
