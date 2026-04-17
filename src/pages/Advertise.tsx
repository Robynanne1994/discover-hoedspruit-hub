import { Mail, Send, Loader2, Check, Star, Users, Eye, TrendingUp, ArrowLeft, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const BENEFITS = [
  { icon: Eye, title: "Local Visibility", description: "Reach locals & visitors actively exploring Hoedspruit" },
  { icon: Users, title: "Targeted Audience", description: "Connect with an engaged, discovery-ready community" },
  { icon: Star, title: "Premium Placement", description: "Stand out with featured positions across the platform" },
  { icon: TrendingUp, title: "Grow Your Brand", description: "Build lasting awareness in the Hoedspruit area" },
];

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid rgba(18,18,20,0.06)",
  borderRadius: 16,
  overflow: "hidden",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(18,18,20,0.03)",
  border: "1px solid rgba(18,18,20,0.08)",
  borderRadius: 16,
  padding: "14px 16px",
  fontSize: 15,
  fontWeight: 500,
  color: "#2b2420",
  outline: "none",
  fontFamily: "inherit",
};

const Advertise = () => {
  const navigate = useNavigate();
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
      setName(""); setEmail(""); setBusiness(""); setMessage(""); setErrors({});
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) submitForm.mutate();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ebebeb", paddingBottom: 100 }}>
      {/* Back */}
      <div style={{ paddingTop: 44, paddingLeft: 20, paddingRight: 20, marginBottom: 28 }}>
        <button onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ArrowLeft size={18} strokeWidth={2} color="rgba(18,18,20,0.4)" />
          <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(18,18,20,0.4)", letterSpacing: 0.2 }}>Back</span>
        </button>
      </div>

      {/* Heading */}
      <div style={{ padding: "0 20px", marginBottom: 12 }}>
        <h1 style={{ fontWeight: 400, fontSize: 40, lineHeight: 0.95, letterSpacing: -0.5, color: "#020202", textTransform: "capitalize", margin: 0 }}>
          Reach The Hoedspruit Community
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ padding: "0 20px", marginBottom: 32 }}>
        <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontStyle: "italic", fontSize: 14, color: "rgba(18,18,20,0.4)", letterSpacing: 0.2, lineHeight: 1.4, margin: 0 }}>
          Partner with us to put your business in the spotlight
        </p>
      </div>

      {/* Benefits card */}
      <div style={{ padding: "0 20px", marginBottom: 32 }}>
        <div style={cardStyle}>
          {BENEFITS.map((item, i) => (
            <div key={item.title} style={{ padding: 16, display: "flex", alignItems: "flex-start", gap: 14, borderBottom: i < BENEFITS.length - 1 ? "1px solid rgba(18,18,20,0.06)" : "none" }}>
              <item.icon size={22} strokeWidth={1.5} color="#121214" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#2b2420", marginBottom: 3 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "rgba(18,18,20,0.4)", lineHeight: 1.4 }}>{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why card — matches homepage AdvertiseWithUs */}
      <div style={{ padding: "0 20px", marginBottom: 36 }}>
        <div style={{ background: "#000000", borderRadius: 16, padding: "28px 22px 26px", position: "relative", overflow: "hidden" }}>
          {/* Top row: tagline + arrow */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
            <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 14, fontWeight: 400, color: "#737373", lineHeight: 1.4, maxWidth: "70%", margin: 0 }}>
              We're more than a directory — we're a trusted community hub. Your listing reaches people ready to explore, dine, and experience Hoedspruit.
            </p>
            <div style={{ background: "transparent", border: "none", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ArrowUpRight size={16} color="#ffffff" strokeWidth={2} />
            </div>
          </div>
          {/* Bottom: two large titles */}
          <div>
            <div style={{ display: "flex", gap: 24 }}>
              <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 32, fontWeight: 700, color: "#ffffff", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                Get<br />Listed
              </div>
              <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 32, fontWeight: 700, color: "#737373", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                Reach<br />More
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form heading */}
      <div style={{ padding: "0 20px", marginBottom: 20 }}>
        <h2 style={{ fontWeight: 400, fontSize: 35, color: "#020202", textTransform: "capitalize", letterSpacing: 0.5, margin: 0 }}>Get In Touch</h2>
      </div>

      {/* Form or success */}
      <div style={{ padding: "0 20px", marginBottom: 28 }}>
        {submitted ? (
          <div style={{ ...cardStyle, padding: 32, textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(18,18,20,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Check size={22} strokeWidth={2} color="#121214" />
            </div>
            <div style={{ fontWeight: 400, fontSize: 18, color: "#020202", textTransform: "uppercase", marginBottom: 8 }}>Thanks for your interest!</div>
            <p style={{ fontSize: 14, color: "rgba(18,18,20,0.4)", lineHeight: 1.5, marginBottom: 20 }}>We've received your enquiry and will be in touch soon.</p>
            <button onClick={() => setSubmitted(false)} style={{ background: "none", border: "1px solid rgba(18,18,20,0.12)", borderRadius: 9999, padding: "10px 20px", fontSize: 13, fontWeight: 600, color: "#2b2420", cursor: "pointer" }}>
              Send Another Enquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={{ marginBottom: 16 }}>
              <input placeholder="Your name" value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: "" })); }}
                style={{ ...inputStyle, borderColor: errors.name ? "#e53e3e" : "rgba(18,18,20,0.08)" }}
                onFocus={(e) => e.currentTarget.style.borderColor = errors.name ? "#e53e3e" : "rgba(18,18,20,0.2)"}
                onBlur={(e) => e.currentTarget.style.borderColor = errors.name ? "#e53e3e" : "rgba(18,18,20,0.08)"}
              />
              {errors.name && <p style={{ fontSize: 12, color: "#e53e3e", marginTop: 4 }}>{errors.name}</p>}
            </div>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <input type="email" placeholder="Email address" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: "" })); }}
                style={{ ...inputStyle, borderColor: errors.email ? "#e53e3e" : "rgba(18,18,20,0.08)" }}
                onFocus={(e) => e.currentTarget.style.borderColor = errors.email ? "#e53e3e" : "rgba(18,18,20,0.2)"}
                onBlur={(e) => e.currentTarget.style.borderColor = errors.email ? "#e53e3e" : "rgba(18,18,20,0.08)"}
              />
              {errors.email && <p style={{ fontSize: 12, color: "#e53e3e", marginTop: 4 }}>{errors.email}</p>}
            </div>
            {/* Business */}
            <div style={{ marginBottom: 16 }}>
              <input placeholder="Business name (optional)" value={business} onChange={(e) => setBusiness(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = "rgba(18,18,20,0.2)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "rgba(18,18,20,0.08)"}
              />
            </div>
            {/* Message */}
            <div style={{ marginBottom: 24 }}>
              <textarea placeholder="Tell us about your advertising needs..." value={message} rows={5}
                onChange={(e) => { setMessage(e.target.value); if (errors.message) setErrors(p => ({ ...p, message: "" })); }}
                style={{ ...inputStyle, minHeight: 120, resize: "vertical", borderColor: errors.message ? "#e53e3e" : "rgba(18,18,20,0.08)" } as React.CSSProperties}
                onFocus={(e) => e.currentTarget.style.borderColor = errors.message ? "#e53e3e" : "rgba(18,18,20,0.2)"}
                onBlur={(e) => e.currentTarget.style.borderColor = errors.message ? "#e53e3e" : "rgba(18,18,20,0.08)"}
              />
              {errors.message && <p style={{ fontSize: 12, color: "#e53e3e", marginTop: 4 }}>{errors.message}</p>}
            </div>
            {/* Submit */}
            <button type="submit" disabled={submitForm.isPending} style={{
              width: "100%", background: "#020202", borderRadius: 16, height: 48, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", cursor: "pointer", opacity: submitForm.isPending ? 0.6 : 1, fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif",
            }}>
              {submitForm.isPending ? (
                <><Loader2 size={16} color="#ffffff" className="animate-spin" /> <span style={{ fontSize: 15, fontWeight: 600, color: "#ffffff" }}>Sending...</span></>
              ) : (
                <><Send size={16} color="#ffffff" /> <span style={{ fontSize: 15, fontWeight: 600, color: "#ffffff" }}>Send</span></>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Email fallback */}
      <div style={{ padding: "0 20px", marginBottom: 50 }}>
        <div style={{ ...cardStyle, padding: 24, textAlign: "center" }}>
          <Mail size={22} strokeWidth={1.5} color="#121214" style={{ margin: "0 auto 10px", display: "block" }} />
          <p style={{ fontSize: 13, color: "rgba(18,18,20,0.4)", margin: "0 0 4px" }}>Or email us directly at</p>
          <a href="mailto:hellohoedspruit@gmail.com" style={{ fontSize: 14, fontWeight: 600, color: "#2b2420", textDecoration: "none" }}>
            hellohoedspruit@gmail.com
          </a>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Advertise;
