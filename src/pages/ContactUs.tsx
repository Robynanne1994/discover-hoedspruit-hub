import { useState } from "react";
import { Mail, Phone, MessageCircle, HelpCircle, ChevronRight, Send, Check, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
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
      setName(""); setEmail(""); setMessage(""); setErrors({});
    },
    onError: () => { toast.error("Something went wrong. Please try again in a moment."); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) submitForm.mutate();
  };

  const contactOptions = [
    { icon: Phone, title: "Phone", subtitle: CONTACT_PHONE, href: `tel:${CONTACT_PHONE.replace(/\s/g, "")}` },
    { icon: Mail, title: "Email", subtitle: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
    { icon: MessageCircle, title: "Whatsapp", subtitle: "Typically replies in a few hours", href: WHATSAPP, external: true },
    { icon: HelpCircle, title: "Contact Form", subtitle: "Fill in our contact form", action: () => setShowForm((p) => !p) },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#ebebeb", paddingBottom: 84, fontFamily: FF }}>
      {/* Back */}
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24, marginBottom: 8 }}>
        <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ArrowLeft size={20} strokeWidth={1.8} color="#2B2420" />
          <span style={{ fontSize: 15, fontWeight: 500, color: "#2B2420", fontFamily: FF }}>Back</span>
        </button>
      </div>

      {/* Title */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 4 }}>
        <h1 style={{ fontSize: 53, fontWeight: 400, lineHeight: 1, letterSpacing: "0.01em", color: "#020202", textTransform: "none", margin: 0, fontFamily: FF }}>
          Get in Touch
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 32 }}>
        <p style={{ fontSize: 15, fontWeight: 400, lineHeight: 1.35, color: "rgba(18,18,20,0.55)", fontStyle: "italic", margin: 0, fontFamily: FF }}>
          Questions, feedback or local advice
        </p>
      </div>

      {/* Contact rows */}
      <div>
        {contactOptions.map((opt, i) => {
          const Icon = opt.icon;
          const isLast = i === contactOptions.length - 1;
          const inner = (
            <div
              style={{ display: "flex", alignItems: "center", padding: "16px 24px", transition: "transform 0.15s ease" }}
              onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.98)"; }}
              onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(18,18,20,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 16 }}>
                <Icon size={20} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 500, color: "#2B2420", lineHeight: 1.3, fontFamily: FF }}>{opt.title}</div>
                <div style={{ fontSize: 14, fontWeight: 400, color: "rgba(18,18,20,0.55)", lineHeight: 1.4, marginTop: 2, fontFamily: FF }}>{opt.subtitle}</div>
              </div>
              <ChevronRight size={20} strokeWidth={1.8} color="rgba(18,18,20,0.2)" style={{ flexShrink: 0, marginLeft: "auto" }} />
            </div>
          );

          const divider = !isLast ? <div style={{ height: 1, background: "rgba(18,18,20,0.08)", marginLeft: 80 }} /> : null;

          if (opt.action) {
            return (
              <div key={opt.title}>
                <button onClick={opt.action} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {inner}
                </button>
                {divider}
              </div>
            );
          }

          return (
            <div key={opt.title}>
              <a href={opt.href} target={opt.external ? "_blank" : undefined} rel={opt.external ? "noopener noreferrer" : undefined} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                {inner}
              </a>
              {divider}
            </div>
          );
        })}
      </div>

      {/* Contact form */}
      {showForm && (
        <div style={{ marginTop: 24, paddingLeft: 24, paddingRight: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 400, color: "#2B2420", marginBottom: 16, fontFamily: FF }}>Send us a message</h2>
          {submitted ? (
            <div style={{ background: "#FFFFFF", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: 32, textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(18,18,20,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Check size={28} strokeWidth={1.8} color="#2B2420" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 400, color: "#2B2420", marginBottom: 8, fontFamily: FF }}>Thanks for reaching out</h3>
              <p style={{ fontSize: 14, color: "rgba(18,18,20,0.55)", marginBottom: 20, fontFamily: FF }}>We've received your message and will get back to you soon.</p>
              <button onClick={() => setSubmitted(false)} style={{ background: "none", border: "1.5px solid rgba(18,18,20,0.15)", borderRadius: 24, padding: "10px 24px", fontSize: 14, fontWeight: 500, color: "#2B2420", cursor: "pointer", fontFamily: FF }}>
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { ph: "Name", val: name, set: setName, key: "name" },
                { ph: "Email", val: email, set: setEmail, key: "email", type: "email" },
              ].map((f) => (
                <div key={f.key}>
                  <input
                    type={f.type || "text"}
                    placeholder={f.ph}
                    value={f.val}
                    onChange={(e) => { f.set(e.target.value); if (errors[f.key]) setErrors((p) => ({ ...p, [f.key]: "" })); }}
                    style={{ width: "100%", background: "#FFFFFF", border: errors[f.key] ? "1px solid #ef4444" : "1px solid rgba(18,18,20,0.1)", borderRadius: 14, padding: "14px 16px", fontSize: 15, color: "#2B2420", outline: "none", boxSizing: "border-box", fontFamily: FF }}
                  />
                  {errors[f.key] && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{errors[f.key]}</p>}
                </div>
              ))}
              <div>
                <textarea
                  placeholder="How can we help?"
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); if (errors.message) setErrors((p) => ({ ...p, message: "" })); }}
                  rows={5}
                  style={{ width: "100%", background: "#FFFFFF", border: errors.message ? "1px solid #ef4444" : "1px solid rgba(18,18,20,0.1)", borderRadius: 14, padding: "14px 16px", fontSize: 15, color: "#2B2420", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: FF }}
                />
                {errors.message && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{errors.message}</p>}
              </div>
              <button
                type="submit"
                disabled={submitForm.isPending}
                style={{ width: "100%", background: "#020202", borderRadius: 24, padding: "12px 24px", minHeight: 48, border: "none", color: "#FFFFFF", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: submitForm.isPending ? 0.6 : 1, fontFamily: FF, transition: "transform 0.12s ease, opacity 0.12s ease", textTransform: "none" as const }}
                onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
                onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              >
                {submitForm.isPending ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><Send size={16} strokeWidth={1.8} /> Send Message</>}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Footer card */}
      <div style={{ marginLeft: 24, marginRight: 24, marginTop: 24 }}>
        <div style={{ background: "#FFFFFF", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 400, lineHeight: 1.5, color: "rgba(18,18,20,0.45)", textAlign: "center", margin: 0, fontFamily: FF }}>
            We're just a message away. Whether you have questions, feedback, or need local advice, we'd love to hear from you.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ContactUs;
