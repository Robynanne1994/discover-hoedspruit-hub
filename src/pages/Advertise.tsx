import { Loader2, Check, ChevronLeft, ArrowUpRight } from "lucide-react";
import { useState, CSSProperties } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const PAGE_BG = "#EBEBEB";
const CORAL = "#D4654A";
const INK = "#020202";
const MUTED = "rgba(18,18,20,0.55)";
const HAIRLINE = "rgba(18,18,20,0.08)";

const HERO_STAT = { number: "2,400+", eyebrow: "Active community", caption: "Locals, visitors and newcomers using the app each month to find what's open and what's on." };

const BENEFITS = [
  { n: "01", title: "Local visibility", description: "Show up when people search for places to eat, stay, shop and explore in Hoedspruit." },
  { n: "02", title: "Targeted audience", description: "Reach an engaged community already in discovery mode and ready to spend locally." },
  { n: "03", title: "Featured placement", description: "Stand out in carousels, category pages and curated picks across the app." },
  { n: "04", title: "Grow your brand", description: "Build steady, lasting awareness with the Hoedspruit community over time." },
];

const SOCIAL_PROOF = { count: "120+ businesses", suffix: " already on the app." };

const AVATARS = [
  "https://i.pravatar.cc/72?img=12",
  "https://i.pravatar.cc/72?img=32",
  "https://i.pravatar.cc/72?img=47",
  "https://i.pravatar.cc/72?img=58",
];

const overline: CSSProperties = {
  fontFamily: FF, fontSize: 12, fontWeight: 500, letterSpacing: "0.06em",
  textTransform: "uppercase", color: MUTED, margin: 0,
};

const sectionTitle: CSSProperties = {
  fontFamily: FF, fontSize: 34, fontWeight: 400, lineHeight: 1.1,
  letterSpacing: "0.01em", color: INK, margin: 0,
};

const pillInput: CSSProperties = {
  width: "100%", background: "#FFFFFF", border: `1px solid rgba(18,18,20,0.1)`,
  padding: "14px 20px", fontSize: 15, fontWeight: 400, color: INK,
  fontFamily: FF, outline: "none", boxSizing: "border-box",
};

const pressDown = (el: HTMLElement) => { el.style.transform = "scale(0.98)"; };
const pressUp = (el: HTMLElement) => { el.style.transform = "scale(1)"; };
const tap = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => pressDown(e.currentTarget),
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => pressUp(e.currentTarget),
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => pressUp(e.currentTarget),
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

  const visibleBenefits = BENEFITS.filter(b => b.title.trim());

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, paddingBottom: 120, fontFamily: FF }}>
      {/* Safe area + back */}
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24 }}>
        <button
          onClick={() => navigate(-1)}
          {...tap}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(18,18,20,0.06)", border: "none", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.15s ease",
          }}
          aria-label="Back"
        >
          <ChevronLeft size={20} strokeWidth={1.8} color={INK} />
        </button>
      </div>

      {/* Heading block */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginTop: 24 }}>
        <p style={overline}>Partner with us</p>
        <h1 style={{
          fontFamily: FF, fontSize: 53, fontWeight: 400, lineHeight: 1,
          letterSpacing: "0.01em", color: INK, margin: "12px 0 0",
          wordBreak: "break-word",
        }}>
          Reach the Hoedspruit community
        </h1>
        <p style={{
          fontFamily: FF, fontSize: 15, fontWeight: 400, lineHeight: 1.35,
          color: MUTED, maxWidth: 300, margin: "16px 0 0",
        }}>
          Get in front of locals, visitors, and newcomers using the app to find what's open, what's on, and what's worth their time.
        </p>
      </div>

      {/* Hero stat card */}
      {HERO_STAT.number.trim() && (
        <div style={{ paddingLeft: 24, paddingRight: 24, marginTop: 32 }}>
          <div style={{
            background: CORAL, borderRadius: 16, padding: 22, width: "100%",
            boxSizing: "border-box", transition: "transform 0.15s ease",
          }} {...tap}>
            <p style={{
              fontFamily: FF, fontSize: 12, fontWeight: 500, letterSpacing: "0.06em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.8)", margin: 0,
            }}>{HERO_STAT.eyebrow}</p>
            <div style={{
              fontFamily: FF, fontSize: 72, fontWeight: 400, lineHeight: 0.95,
              letterSpacing: "0.01em", color: "#FFFFFF", margin: "12px 0 12px",
            }}>{HERO_STAT.number}</div>
            <p style={{
              fontFamily: FF, fontSize: 15, fontWeight: 400, lineHeight: 1.4,
              color: "rgba(255,255,255,0.9)", maxWidth: 240, margin: 0,
            }}>{HERO_STAT.caption}</p>
          </div>
        </div>
      )}

      {/* Benefits card */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginTop: 36 }}>
        <div style={{
          background: "#FFFFFF", borderRadius: 16, padding: "4px 20px",
          boxSizing: "border-box", transition: "transform 0.15s ease",
        }} {...tap}>
          {visibleBenefits.map((b, i) => (
            <div key={b.n} style={{
              padding: "20px 0", display: "flex", alignItems: "flex-start", gap: 20,
              borderBottom: i < visibleBenefits.length - 1 ? `1px solid ${HAIRLINE}` : "none",
            }}>
              <div style={{
                fontFamily: FF, fontSize: 34, fontWeight: 400, lineHeight: 1,
                color: CORAL, minWidth: 40,
              }}>{b.n}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: FF, fontSize: 17, fontWeight: 500, lineHeight: 1.2,
                  letterSpacing: "0.01em", color: INK,
                }}>{b.title}</div>
                <div style={{
                  fontFamily: FF, fontSize: 14, fontWeight: 400, lineHeight: 1.5,
                  color: MUTED, marginTop: 6,
                }}>{b.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social proof */}
      {SOCIAL_PROOF.count.trim() && (
        <div style={{ paddingLeft: 24, paddingRight: 24, marginTop: 32, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {AVATARS.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  border: `2px solid ${PAGE_BG}`,
                  marginLeft: i === 0 ? 0 : -10,
                  objectFit: "cover", display: "block",
                }}
              />
            ))}
          </div>
          <p style={{
            fontFamily: FF, fontSize: 13, fontWeight: 400, color: MUTED, margin: 0, lineHeight: 1.4,
          }}>
            <span style={{ fontWeight: 500, color: INK }}>{SOCIAL_PROOF.count}</span>{SOCIAL_PROOF.suffix}
          </p>
        </div>
      )}

      {/* CTA card */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginTop: 32 }}>
        <div style={{
          background: INK, borderRadius: 16, padding: 22, color: "#FFFFFF",
          boxSizing: "border-box", transition: "transform 0.15s ease",
        }} {...tap}>
          <p style={{
            fontFamily: FF, fontSize: 12, fontWeight: 500, letterSpacing: "0.06em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.7)", margin: 0,
          }}>Listing plans</p>
          <h2 style={{
            fontFamily: FF, fontSize: 34, fontWeight: 400, lineHeight: 1.1,
            letterSpacing: "0.01em", color: "#FFFFFF", margin: "10px 0 12px",
            wordBreak: "break-word",
          }}>Join the directory</h2>
          <p style={{
            fontFamily: FF, fontSize: 14, fontWeight: 400, lineHeight: 1.5,
            color: "rgba(255,255,255,0.75)", maxWidth: 280, margin: "0 0 20px",
          }}>
            Pick a plan that fits, get your business live on the app, and start reaching the community this week.
          </p>
          <button
            onClick={() => navigate("/plans")}
            {...tap}
            style={{
              background: CORAL, color: "#FFFFFF", border: "none",
              padding: "12px 24px", borderRadius: 24, fontSize: 15, fontWeight: 600,
              fontFamily: FF, display: "inline-flex", alignItems: "center", gap: 8,
              cursor: "pointer", transition: "transform 0.15s ease",
            }}
          >
            See plans
            <ArrowUpRight size={14} strokeWidth={2.5} color="#FFFFFF" />
          </button>
        </div>
      </div>

      {/* Form */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginTop: 36 }}>
        {submitted ? (
          <div style={{
            background: "#FFFFFF", borderRadius: 16, padding: 32, textAlign: "center",
            boxSizing: "border-box",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: "rgba(18,18,20,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            }}>
              <Check size={22} strokeWidth={2} color={INK} />
            </div>
            <div style={{
              fontFamily: FF, fontWeight: 500, fontSize: 17, color: INK, marginBottom: 8,
            }}>Thanks for your interest</div>
            <p style={{
              fontFamily: FF, fontSize: 14, color: MUTED, lineHeight: 1.5, margin: "0 0 20px",
            }}>We've received your enquiry and will be in touch soon.</p>
            <button
              onClick={() => setSubmitted(false)}
              {...tap}
              style={{
                background: "none", border: `1px solid ${HAIRLINE}`, borderRadius: 24,
                padding: "10px 20px", fontSize: 13, fontWeight: 500, color: INK,
                fontFamily: FF, cursor: "pointer", transition: "transform 0.15s ease",
              }}
            >
              Send another enquiry
            </button>
          </div>
        ) : (
          <>
            <p style={overline}>Quick enquiry</p>
            <h2 style={{ ...sectionTitle, margin: "12px 0 20px" }}>Tell us a bit about you</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: "" })); }}
                  style={{
                    ...pillInput, borderRadius: 999,
                    borderColor: errors.name ? "#e53e3e" : "rgba(18,18,20,0.1)",
                  }}
                />
                {errors.name && <p style={{ fontSize: 12, color: "#e53e3e", margin: "6px 0 0", paddingLeft: 16 }}>{errors.name}</p>}
              </div>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: "" })); }}
                  style={{
                    ...pillInput, borderRadius: 999,
                    borderColor: errors.email ? "#e53e3e" : "rgba(18,18,20,0.1)",
                  }}
                />
                {errors.email && <p style={{ fontSize: 12, color: "#e53e3e", margin: "6px 0 0", paddingLeft: 16 }}>{errors.email}</p>}
              </div>
              <div style={{ marginBottom: 12 }}>
                <input
                  placeholder="Business name (optional)"
                  value={business}
                  onChange={(e) => setBusiness(e.target.value)}
                  style={{ ...pillInput, borderRadius: 999 }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <textarea
                  placeholder="Tell us what you're looking for"
                  value={message}
                  rows={5}
                  onChange={(e) => { setMessage(e.target.value); if (errors.message) setErrors(p => ({ ...p, message: "" })); }}
                  style={{
                    ...pillInput, borderRadius: 20, minHeight: 120, resize: "vertical",
                    borderColor: errors.message ? "#e53e3e" : "rgba(18,18,20,0.1)",
                    fontFamily: FF,
                  }}
                />
                {errors.message && <p style={{ fontSize: 12, color: "#e53e3e", margin: "6px 0 0", paddingLeft: 16 }}>{errors.message}</p>}
              </div>
              <button
                type="submit"
                disabled={submitForm.isPending}
                {...tap}
                style={{
                  width: "100%", background: INK, color: "#FFFFFF", border: "none",
                  borderRadius: 24, padding: "14px 22px", minHeight: 48,
                  fontSize: 15, fontWeight: 600, fontFamily: FF,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  cursor: "pointer", opacity: submitForm.isPending ? 0.6 : 1,
                  transition: "transform 0.15s ease",
                }}
              >
                {submitForm.isPending ? (
                  <><Loader2 size={16} color="#FFFFFF" className="animate-spin" /> Sending</>
                ) : "Send enquiry"}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Email panel */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginTop: 28 }}>
        <a
          href="mailto:hellohoedspruit@gmail.com"
          {...tap}
          style={{
            display: "block", background: "#F5F0E8", borderRadius: 16, padding: 20,
            textDecoration: "none", boxSizing: "border-box",
            transition: "transform 0.15s ease",
          }}
        >
          <p style={{
            fontFamily: FF, fontSize: 11, fontWeight: 500, letterSpacing: "0.06em",
            textTransform: "uppercase", color: "rgba(18,18,20,0.55)", margin: 0,
          }}>Or email us directly</p>
          <div style={{
            fontFamily: FF, fontSize: 18, fontWeight: 500, color: INK, marginTop: 6,
          }}>hellohoedspruit@gmail.com</div>
        </a>
      </div>

      <BottomNav />
    </div>
  );
};

export default Advertise;
