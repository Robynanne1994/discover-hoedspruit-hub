import { useState } from "react";
import { ChevronLeft, ArrowUpRight, Send, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const CONTACT_EMAIL = "hellohoedspruit@gmail.com";
const CONTACT_PHONE = "061 332 1709";
const PHONE_DIGITS = "27613321709";
const WHATSAPP_URL = `https://wa.me/${PHONE_DIGITS}`;
const INSTAGRAM_HANDLE = "@hellohoedspruit";
const INSTAGRAM_URL = "https://instagram.com/hellohoedspruit";

const press = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(0.98)"; },
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
};

const overlineStyle: React.CSSProperties = {
  fontFamily: FF,
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "rgba(18,18,20,0.55)",
  margin: 0,
  lineHeight: 1,
};

const ContactCard = ({
  overline,
  value,
  sub,
  href,
  onClick,
  external,
  valueMode = "default",
  title,
}: {
  overline: string;
  value?: string;
  sub?: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
  valueMode?: "default" | "nowrap" | "wrap";
  title?: string;
}) => {
  const valueBaseStyle: React.CSSProperties = {
    fontFamily: FF,
    fontWeight: 500,
    letterSpacing: "0.01em",
    color: "#020202",
    margin: 0,
    paddingRight: 36,
  };

  const valueStyle: React.CSSProperties =
    valueMode === "nowrap"
      ? { ...valueBaseStyle, fontSize: 16, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "clip" }
      : valueMode === "wrap"
      ? { ...valueBaseStyle, fontSize: 16, lineHeight: 1.25, wordBreak: "break-word" }
      : { ...valueBaseStyle, fontSize: 17, lineHeight: 1.2 };

  const inner = (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        padding: "18px 16px",
        position: "relative",
        height: "100%",
        minWidth: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.15s ease",
        cursor: "pointer",
        boxSizing: "border-box",
      }}
      {...press}
    >
      <div style={{
        position: "absolute", top: 14, right: 14,
        width: 32, height: 32, borderRadius: "50%",
        background: "rgba(18,18,20,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <ArrowUpRight size={12} strokeWidth={2.5} style={{ color: "rgba(18,18,20,0.3)" }} />
      </div>
      <p style={{ ...overlineStyle, marginBottom: 12, paddingRight: 36 }}>{overline}</p>
      {title && (
        <p style={{
          fontFamily: FF, fontSize: 18, fontWeight: 500, lineHeight: 1.2,
          letterSpacing: "0.01em", color: "#020202", margin: 0, paddingRight: 36,
        }}>
          {title}
        </p>
      )}
      {value && <p style={valueStyle}>{value}</p>}
      <div style={{ flexGrow: 1, minHeight: 8 }} />
      {sub && (
        <p style={{
          fontFamily: FF, fontSize: 12, fontWeight: 400,
          color: "rgba(18,18,20,0.55)", margin: 0,
        }}>
          {sub}
        </p>
      )}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        style={{ textDecoration: "none", color: "inherit", display: "block", minWidth: 0, height: "100%" }}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      onClick={onClick}
      style={{ background: "none", border: "none", padding: 0, width: "100%", height: "100%", textAlign: "left", cursor: "pointer", minWidth: 0 }}
    >
      {inner}
    </button>
  );
};

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

  const handleFormClick = () => {
    setShowForm((p) => {
      const next = !p;
      if (next) setTimeout(() => {
        document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      return next;
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#EBEBEB", paddingBottom: 120, fontFamily: FF, overflowX: "hidden" }}>
      {/* Back button */}
      <div style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)", paddingLeft: 24, paddingRight: 24, marginBottom: 16 }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(18,18,20,0.06)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.15s ease",
          }}
          {...press}
        >
          <ChevronLeft size={20} strokeWidth={1.8} style={{ color: "#020202" }} />
        </button>
      </div>

      {/* Title block */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 36 }}>
        
        <h1 style={{
          fontFamily: FF,
          fontSize: 53, fontWeight: 400,
          lineHeight: 1, letterSpacing: "0.01em",
          color: "#020202", margin: 0, marginBottom: 16,
        }}>
          Get in<br />touch
        </h1>
        <p style={{
          fontFamily: FF, fontSize: 15, fontWeight: 400,
          lineHeight: 1.35, color: "rgba(18,18,20,0.55)",
          margin: 0, maxWidth: 300,
        }}>
          Questions, feedback, or a local tip worth sharing. We read everything.
        </p>
      </div>

      {/* Primary coral WhatsApp card */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 16 }}>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none", color: "inherit", display: "block" }}
        >
          <div
            style={{
              background: "#D4654A",
              borderRadius: 16,
              padding: 20,
              color: "#FFFFFF",
              position: "relative",
              minHeight: 180,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.15s ease",
              cursor: "pointer",
            }}
            {...press}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{
                background: "rgba(255,255,255,0.92)",
                color: "#020202",
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 11, fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontFamily: FF,
                lineHeight: 1,
              }}>
                Fastest reply
              </span>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(255,255,255,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ArrowUpRight size={14} strokeWidth={2.5} style={{ color: "#FFFFFF" }} />
              </div>
            </div>
            <div>
              <h2 style={{
                fontFamily: FF,
                fontSize: 26, fontWeight: 400,
                lineHeight: 1, letterSpacing: "0.01em",
                color: "#FFFFFF",
                textTransform: "none",
                margin: 0, marginBottom: 8,
              }}>
                Whatsapp
              </h2>
              <p style={{
                fontFamily: FF, fontSize: 13, fontWeight: 400,
                color: "rgba(255,255,255,0.7)", margin: 0,
              }}>
                {CONTACT_PHONE} · Reply same day
              </p>
            </div>
          </div>
        </a>
      </div>

      {/* Two-column grid */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 48 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 10,
          alignItems: "stretch",
        }}>
          {CONTACT_PHONE && (
            <div style={{ minWidth: 0 }}>
              <ContactCard
                overline="Call"
                value={CONTACT_PHONE}
                valueMode="nowrap"
                sub="Mon to Fri, 9 to 5"
                href={`tel:${PHONE_DIGITS}`}
              />
            </div>
          )}
          {CONTACT_EMAIL && (
            <div style={{ minWidth: 0 }}>
              <ContactCard
                overline="Email"
                value={CONTACT_EMAIL}
                valueMode="wrap"
                sub="Reply within 48 hours"
                href={`mailto:${CONTACT_EMAIL}`}
              />
            </div>
          )}
          <div style={{ gridColumn: "span 2", minWidth: 0 }}>
            <ContactCard
              overline="Write to us"
              title="Contact form"
              sub="Send a longer message"
              onClick={handleFormClick}
            />
          </div>
        </div>
      </div>

      {/* Inline form (toggled) */}
      {showForm && (
        <div id="contact-form" style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 48 }}>
          {submitted ? (
            <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 32, textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "rgba(18,18,20,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <Check size={28} strokeWidth={1.8} color="#020202" />
              </div>
              <h3 style={{ fontFamily: FF, fontSize: 18, fontWeight: 500, color: "#020202", marginBottom: 8 }}>
                Thanks for reaching out
              </h3>
              <p style={{ fontFamily: FF, fontSize: 14, color: "rgba(18,18,20,0.55)", marginBottom: 20 }}>
                We've received your message and will get back to you soon.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                style={{
                  background: "none", border: "1px solid rgba(18,18,20,0.15)",
                  borderRadius: 24, padding: "10px 20px",
                  fontSize: 14, fontWeight: 500, color: "#020202",
                  cursor: "pointer", fontFamily: FF,
                }}
              >
                Send another message
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
                    style={{
                      width: "100%", background: "#FFFFFF",
                      border: errors[f.key] ? "1px solid #ef4444" : "1px solid rgba(18,18,20,0.1)",
                      borderRadius: 14, padding: "14px 16px",
                      fontSize: 15, color: "#020202", outline: "none",
                      boxSizing: "border-box", fontFamily: FF,
                    }}
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
                  style={{
                    width: "100%", background: "#FFFFFF",
                    border: errors.message ? "1px solid #ef4444" : "1px solid rgba(18,18,20,0.1)",
                    borderRadius: 14, padding: "14px 16px",
                    fontSize: 15, color: "#020202", outline: "none",
                    resize: "vertical", boxSizing: "border-box", fontFamily: FF,
                  }}
                />
                {errors.message && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{errors.message}</p>}
              </div>
              <button
                type="submit"
                disabled={submitForm.isPending}
                style={{
                  width: "100%", background: "#020202",
                  borderRadius: 16, padding: "12px 20px", height: 48,
                  border: "none", color: "#FFFFFF",
                  fontSize: 15, fontWeight: 500, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: submitForm.isPending ? 0.6 : 1,
                  fontFamily: FF, transition: "transform 0.15s ease",
                }}
                {...press}
              >
                {submitForm.isPending
                  ? <><Loader2 size={16} className="animate-spin" /> Sending</>
                  : <><Send size={16} strokeWidth={1.8} /> Send message</>}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Instagram footer */}
      {INSTAGRAM_HANDLE && (
        <div style={{ paddingLeft: 24, paddingRight: 24 }}>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
          >
            <div
              style={{
                background: "#F5F0E8",
                borderRadius: 16,
                padding: "22px 20px",
                position: "relative",
                transition: "transform 0.15s ease",
                cursor: "pointer",
              }}
              {...press}
            >
              <div style={{
                position: "absolute", top: 18, right: 18,
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(18,18,20,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ArrowUpRight size={12} strokeWidth={2.5} style={{ color: "rgba(18,18,20,0.3)" }} />
              </div>
              <p style={{ ...overlineStyle, marginBottom: 10, paddingRight: 36 }}>Instagram</p>
              <p style={{
                fontFamily: FF, fontSize: 20, fontWeight: 500,
                lineHeight: 1.2, letterSpacing: "0.01em", color: "#020202",
                margin: 0, paddingRight: 36,
              }}>
                {INSTAGRAM_HANDLE}
              </p>
              <p style={{
                fontFamily: FF, fontSize: 13, fontWeight: 400,
                color: "rgba(18,18,20,0.55)", margin: 0, marginTop: 6,
              }}>
                Daily picks, openings and what's on
              </p>
            </div>
          </a>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ContactUs;
