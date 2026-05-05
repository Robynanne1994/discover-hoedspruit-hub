import { Loader2, Check, ChevronLeft, ArrowUpRight } from "lucide-react";
import { useState, useEffect, CSSProperties } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const FF = "'Helvetica Neue', 'Helvetica World', Helvetica, Arial, sans-serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";
const PAGE_BG = "#EBEBEB";
const SURFACE = "#FFFFFF";
const WARM = "#F2EFEC";
const CORAL = "#F26A48";
const INK = "#0A0A0A";
const MUTED = "#8A8480";
const DIVIDER = "#E8E4DF";

const HERO_STAT = {
  number: "2,400+",
  eyebrow: "Active Community",
  caption: "Locals, visitors and newcomers using Hello Hoedspruit Monthly to find what's open and what's on.",
};

const BENEFITS = [
  { n: "01", title: "Local visibility", description: "Show up when people search for places to eat, stay, shop and explore in Hoedspruit." },
  { n: "02", title: "Targeted audience", description: "Reach an engaged community already in discovery mode and ready to spend locally." },
  { n: "03", title: "Featured placement", description: "Stand out in carousels, category pages and curated picks across the app." },
  { n: "04", title: "Grow Your Brand", description: "Build steady, lasting awareness with the Hoedspruit community over time." },
];

const SOCIAL_PROOF = { count: "389+ businesses", suffix: " already on the app." };

const AVATARS = [
  "https://i.pravatar.cc/72?img=12",
  "https://i.pravatar.cc/72?img=32",
  "https://i.pravatar.cc/72?img=47",
  "https://i.pravatar.cc/72?img=58",
];

const eyebrow: CSSProperties = {
  fontFamily: FF, fontSize: 12, fontWeight: 400, lineHeight: "14.4px",
  letterSpacing: "0.24px", textTransform: "uppercase", color: MUTED, margin: 0,
};

const inputBase: CSSProperties = {
  width: "100%", background: WARM, border: "1px solid transparent",
  borderRadius: 16, height: 52, padding: "0 18px",
  fontFamily: FF, fontSize: 16, fontWeight: 400, lineHeight: "22.4px",
  color: INK, outline: "none", boxSizing: "border-box",
  transition: "background 0.15s ease, border-color 0.15s ease",
};

const tap = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(0.98)"; },
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
};

const Advertise = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focused, setFocused] = useState<string>("");

  // Load Playfair Display
  useEffect(() => {
    const id = "playfair-display-font";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400&display=swap";
    document.head.appendChild(link);
  }, []);

  // Placeholder colour
  useEffect(() => {
    const id = "advertise-placeholder-style";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .adv-input::placeholder { color: ${MUTED}; opacity: 1; font-family: ${FF}; font-size: 16px; font-weight: 400; }
      .adv-input:focus { background: ${SURFACE} !important; border-color: ${INK} !important; }
    `;
    document.head.appendChild(style);
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!business.trim()) errs.business = "Business name is required";
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
    <div style={{ minHeight: "100vh", background: "transparent", paddingBottom: 140, fontFamily: FF }}>
      {/* Top bar */}
      <div style={{ height: 56, paddingLeft: 24, paddingRight: 24, display: "flex", alignItems: "center" }}>
        <button
          onClick={() => navigate(-1)}
          {...tap}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: SURFACE, border: "none", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            transition: "transform 0.15s ease",
          }}
          aria-label="Back"
        >
          <ChevronLeft size={20} strokeWidth={1.8} color={INK} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ padding: "24px 24px 40px 24px" }}>
        
        <h1 style={{
          fontFamily: FF, fontSize: 52, fontWeight: 700, lineHeight: "52px",
          letterSpacing: "-1.56px", color: INK, margin: "0 0 20px",
        }}>
          Reach the Hoedspruit community
        </h1>
        <p style={{
          fontFamily: FF, fontSize: 16, fontWeight: 400, lineHeight: "23.2px",
          color: INK, maxWidth: 320, margin: 0,
        }}>
          Get in front of locals, visitors and newcomers using Hello Hoedspruit to find what's open, what's on, and what's worth their time.
        </p>
      </div>

      {/* Coral stat card */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <div style={{
          background: CORAL, borderRadius: 24, padding: "28px 24px 32px 24px",
          boxSizing: "border-box",
        }}>
          <p style={{
            fontFamily: FF, fontSize: 12, fontWeight: 400, lineHeight: "14.4px",
            letterSpacing: "0.24px", textTransform: "uppercase",
            color: "rgba(255,255,255,0.78)", margin: "0 0 12px",
          }}>{HERO_STAT.eyebrow}</p>
          <div style={{
            fontFamily: PLAYFAIR, fontSize: 100, fontWeight: 400, lineHeight: "90px",
            letterSpacing: "-2px", color: "#FFFFFF", margin: "0 0 20px",
          }}>{HERO_STAT.number}</div>
          <p style={{
            fontFamily: FF, fontSize: 15, fontWeight: 400, lineHeight: "21.75px",
            color: "rgba(255,255,255,0.88)", maxWidth: 280, margin: 0,
          }}>{HERO_STAT.caption}</p>
        </div>
      </div>

      {/* Benefits card */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 32 }}>
        <div style={{
          background: SURFACE, borderRadius: 24, padding: "8px 20px",
          boxSizing: "border-box",
        }}>
          {BENEFITS.map((b, i) => (
            <div key={b.n} style={{
              padding: "24px 0",
              display: "grid", gridTemplateColumns: "60px 1fr", columnGap: 16, alignItems: "start",
              borderBottom: i < BENEFITS.length - 1 ? `1px solid ${DIVIDER}` : "none",
            }}>
              <div style={{
                fontFamily: FF, fontSize: 32, fontWeight: 300, lineHeight: "32px",
                letterSpacing: "-0.64px", color: "#5b4632",
              }}>{b.n}</div>
              <div>
                <h5 style={{
                  fontFamily: FF, fontSize: 18, fontWeight: 400, lineHeight: "21.6px",
                  letterSpacing: "-0.18px", color: INK, margin: "0 0 6px",
                }}>{b.title}</h5>
                <div style={{
                  fontFamily: FF, fontSize: 14, fontWeight: 400, lineHeight: "20.3px",
                  color: MUTED,
                }}>{b.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social proof */}
      <div style={{ padding: "0 24px 40px 24px", display: "flex", alignItems: "center", gap: 14 }}>
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
          fontFamily: FF, fontSize: 14, fontWeight: 400, lineHeight: "20.3px",
          color: MUTED, margin: 0,
        }}>
          <span style={{ fontWeight: 700, color: INK }}>{SOCIAL_PROOF.count}</span>{SOCIAL_PROOF.suffix}
        </p>
      </div>

      {/* Black CTA card */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 40 }}>
        <div style={{
          background: INK, borderRadius: 24, padding: "28px 24px",
          boxSizing: "border-box",
        }}>
          <p style={{
            fontFamily: FF, fontSize: 12, fontWeight: 400, lineHeight: "14.4px",
            letterSpacing: "0.24px", textTransform: "uppercase",
            color: "rgba(255,255,255,0.6)", margin: "0 0 14px",
          }}>For Local Businesses</p>
          <h2 style={{
            fontFamily: FF, fontSize: 36, fontWeight: 700, lineHeight: "38px",
            letterSpacing: "-1.08px", color: "#FFFFFF", margin: "0 0 14px",
          }}>Join The Directory</h2>
          <p style={{
            fontFamily: FF, fontSize: 15, fontWeight: 400, lineHeight: "21.75px",
            color: "rgba(255,255,255,0.78)", maxWidth: 300, margin: "0 0 24px",
          }}>
            Pick a plan that fits, get your business live on the app, and start reaching the community this week.
          </p>
          <button
            onClick={() => navigate("/plans")}
            {...tap}
            style={{
              background: CORAL, color: "#FFFFFF", border: "none",
              height: 48, padding: "0 24px", borderRadius: 999,
              fontFamily: FF, fontSize: 15, fontWeight: 400,
              display: "inline-flex", alignItems: "center", gap: 8,
              cursor: "pointer", transition: "transform 0.15s ease",
            }}
          >
            See Plans
            <ArrowUpRight size={14} strokeWidth={1.5} color="#FFFFFF" />
          </button>
        </div>
      </div>

      {/* Quick Enquiry form */}
      <div style={{ padding: "0 24px 40px 24px" }}>
        {submitted ? (
          <div style={{
            background: SURFACE, borderRadius: 24, padding: 32, textAlign: "center",
            boxSizing: "border-box",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: WARM,
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            }}>
              <Check size={22} strokeWidth={2} color={INK} />
            </div>
            <div style={{
              fontFamily: FF, fontWeight: 700, fontSize: 18, color: INK, marginBottom: 8,
            }}>Thanks for your interest</div>
            <p style={{
              fontFamily: FF, fontSize: 14, color: MUTED, lineHeight: "20.3px", margin: "0 0 20px",
            }}>We've received your enquiry and will be in touch soon.</p>
            <button
              onClick={() => setSubmitted(false)}
              {...tap}
              style={{
                background: "none", border: `1px solid ${DIVIDER}`, borderRadius: 999,
                padding: "10px 20px", fontSize: 13, fontWeight: 400, color: INK,
                fontFamily: FF, cursor: "pointer", transition: "transform 0.15s ease",
              }}
            >
              Send Another Enquiry
            </button>
          </div>
        ) : (
          <>
            <p style={{ ...eyebrow, marginBottom: 16 }}>Quick Enquiry</p>
            <h2 style={{
              fontFamily: FF, fontSize: 44, fontWeight: 700, lineHeight: "44px",
              letterSpacing: "-1.32px", color: INK, margin: "0 0 28px",
            }}>Say Hello...</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <input
                  className="adv-input"
                  placeholder="Name and surname"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: "" })); }}
                  style={{
                    ...inputBase,
                    borderColor: errors.name ? "#e53e3e" : "transparent",
                  }}
                />
                {errors.name && <p style={{ fontSize: 12, color: "#e53e3e", margin: "6px 0 0", paddingLeft: 18 }}>{errors.name}</p>}
              </div>
              <div style={{ marginBottom: 12 }}>
                <input
                  className="adv-input"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: "" })); }}
                  style={{
                    ...inputBase,
                    borderColor: errors.email ? "#e53e3e" : "transparent",
                  }}
                />
                {errors.email && <p style={{ fontSize: 12, color: "#e53e3e", margin: "6px 0 0", paddingLeft: 18 }}>{errors.email}</p>}
              </div>
              <div style={{ marginBottom: 12 }}>
                <input
                  className="adv-input"
                  placeholder="Business name"
                  value={business}
                  onChange={(e) => { setBusiness(e.target.value); if (errors.business) setErrors(p => ({ ...p, business: "" })); }}
                  style={{
                    ...inputBase,
                    borderColor: errors.business ? "#e53e3e" : "transparent",
                  }}
                />
                {errors.business && <p style={{ fontSize: 12, color: "#e53e3e", margin: "6px 0 0", paddingLeft: 18 }}>{errors.business}</p>}
              </div>
              <div style={{ marginBottom: 0 }}>
                <textarea
                  className="adv-input"
                  placeholder="Tell us what you're looking for"
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); if (errors.message) setErrors(p => ({ ...p, message: "" })); }}
                  style={{
                    ...inputBase,
                    height: 120, paddingTop: 16, paddingBottom: 16, resize: "none",
                    lineHeight: "22.4px",
                    borderColor: errors.message ? "#e53e3e" : "transparent",
                  }}
                />
                {errors.message && <p style={{ fontSize: 12, color: "#e53e3e", margin: "6px 0 0", paddingLeft: 18 }}>{errors.message}</p>}
              </div>
              <button
                type="submit"
                disabled={submitForm.isPending}
                {...tap}
                style={{
                  width: "100%", marginTop: 20,
                  background: INK, color: "#FFFFFF", border: "none",
                  borderRadius: 999, height: 52,
                  fontFamily: FF, fontSize: 15, fontWeight: 400,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  cursor: "pointer", opacity: submitForm.isPending ? 0.6 : 1,
                  transition: "transform 0.15s ease",
                }}
              >
                {submitForm.isPending ? (
                  <><Loader2 size={16} color="#FFFFFF" className="animate-spin" /> Sending</>
                ) : "Submit"}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Email panel */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 40 }}>
        <a
          href="mailto:hellohoedspruit@gmail.com"
          {...tap}
          style={{
            display: "block", background: WARM, borderRadius: 16, padding: "18px 20px",
            textDecoration: "none", boxSizing: "border-box",
            transition: "transform 0.15s ease",
          }}
        >
          <p style={{
            fontFamily: FF, fontSize: 12, fontWeight: 400, lineHeight: "14.4px",
            letterSpacing: "0.24px", textTransform: "uppercase",
            color: MUTED, margin: "0 0 4px",
          }}>Or Email Us Directly</p>
          <div style={{
            fontFamily: FF, fontSize: 16, fontWeight: 400, lineHeight: "23.2px", color: INK,
          }}>hellohoedspruit@gmail.com</div>
        </a>
      </div>


      <BottomNav />
    </div>
  );
};

export default Advertise;
