import { Loader2, Check } from "lucide-react";
import { useState, useEffect, CSSProperties } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import BackArrowIcon from "@/components/ui/BackArrowIcon";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";

const OLIVE = "#5C6446";
const CREAM = "#EEE8DA";
const INK = "#2A2A24";
const MUTED = "#6B6A5E";
const LINE = "#D9D2C0";
const RUST = "#9B5A3C";
const DEEP_RUST = "#7E4530";

const BLOB_RADIUS_A = "50% 45% 55% 50% / 55% 50% 60% 45%";
const BLOB_RADIUS_B = "55% 45% 50% 55% / 50% 60% 45% 55%";

const BENEFITS = [
  { n: "i.", title: "Local Visibility", description: "Show up when people search for places to eat, stay, shop and explore in Hoedspruit." },
  { n: "ii.", title: "Targeted Audience", description: "Reach an engaged community already in discovery mode and ready to spend locally." },
  { n: "iii.", title: "Featured Placement", description: "Stand out in carousels, category pages and curated picks across the app." },
  { n: "iv.", title: "Grow Your Brand", description: "Build steady, lasting awareness with the Hoedspruit community over time." },
];

const AVATAR_FALLBACKS = [
  "linear-gradient(135deg, #C9805C, #7E4530)",
  "linear-gradient(135deg, #B8916A, #6B4A30)",
  "linear-gradient(135deg, #D6A687, #9B5A3C)",
  "linear-gradient(135deg, #A57352, #5b3826)",
];

const tap = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(0.98)"; },
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
};

const formatPlus = (n: number | null | undefined, fallback: string) => {
  if (n == null) return fallback;
  return `${n.toLocaleString("en-US")}+`;
};

const Advertise = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load Playfair Display
  useEffect(() => {
    const id = "playfair-display-font";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;1,300;1,400&display=swap";
    document.head.appendChild(link);
  }, []);

  // Placeholder + focus styles
  useEffect(() => {
    const id = "advertise-placeholder-style";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .adv-input::placeholder { color: ${MUTED}; opacity: 1; font-family: ${FF}; font-size: 15px; font-weight: 400; }
      .adv-input:focus { background: ${CREAM} !important; color: ${INK}; }
    `;
    document.head.appendChild(style);
  }, []);

  // Live counts
  const { data: userCount } = useQuery({
    queryKey: ["advertise-user-count"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });
  const { data: businessCount } = useQuery({
    queryKey: ["advertise-business-count"],
    queryFn: async () => {
      const { count } = await supabase.from("listings").select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });
  const { data: avatarUrls } = useQuery({
    queryKey: ["advertise-business-avatars"],
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("image_url")
        .not("image_url", "is", null)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(4);
      return (data ?? []).map((l) => l.image_url as string).filter(Boolean);
    },
  });

  const heroNumber = formatPlus(userCount, "2,400+");
  const heroNumberSize = heroNumber.length >= 7 ? 90 : 108; // shrink if 5-digit
  const businessNumber = formatPlus(businessCount, "389+");

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

  const inputBase: CSSProperties = {
    width: "100%", background: "rgba(238, 232, 218, 0.92)", border: "none",
    borderRadius: 16, height: 52, padding: "0 20px",
    fontFamily: FF, fontSize: 15, fontWeight: 400, color: INK,
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: OLIVE, paddingBottom: 140, fontFamily: FF }}>
      {/* Top bar */}
      <div style={{ paddingTop: 32, paddingLeft: 24, paddingRight: 24 }}>
        <button
          onClick={() => navigate(-1)}
          {...tap}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: CREAM, border: "none", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.15s ease",
          }}
          aria-label="Back"
        >
          <BackArrowIcon size={18} color={INK} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ padding: "18px 24px 0" }}>
        <p style={{
          fontFamily: FF, fontSize: 12, fontWeight: 400,
          letterSpacing: "2.4px", textTransform: "uppercase",
          color: "rgba(238, 232, 218, 0.7)", margin: "0 0 14px",
        }}>For Local Businesses</p>
        <h1 style={{
          fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 300,
          fontSize: 72, lineHeight: 0.92, letterSpacing: "-2.5px",
          color: CREAM, margin: "0 0 18px", textTransform: "lowercase",
        }}>advertise.</h1>
        <p style={{
          fontFamily: FF, fontSize: 15, fontWeight: 400, lineHeight: 1.65,
          color: "rgba(238, 232, 218, 0.9)", maxWidth: 330, margin: "0 0 32px",
        }}>
          Get in front of locals, visitors, and newcomers using Hello Hoedspruit to find what's open, what's on, and what's worth their time.
        </p>
      </div>

      {/* Stats card */}
      <div style={{ padding: "0 24px", marginBottom: 18 }}>
        <div style={{
          background: RUST, borderRadius: 28, padding: 28,
          position: "relative", overflow: "hidden", boxSizing: "border-box",
        }}>
          <div style={{
            position: "absolute", right: -90, bottom: -110,
            width: 240, height: 260, background: DEEP_RUST,
            borderRadius: BLOB_RADIUS_A, opacity: 0.55, zIndex: 1,
          }} />
          <div style={{
            position: "absolute", left: -50, top: -60,
            width: 140, height: 150, background: "rgba(238,232,218,0.08)",
            borderRadius: BLOB_RADIUS_B, zIndex: 1,
          }} />
          <div style={{ position: "relative", zIndex: 2 }}>
            <p style={{
              fontFamily: FF, fontSize: 11.5, fontWeight: 400,
              letterSpacing: "2.4px", textTransform: "uppercase",
              color: "rgba(238,232,218,0.8)", margin: "0 0 14px",
            }}>Active Community</p>
            <div style={{
              fontFamily: PLAYFAIR, fontWeight: 400,
              fontSize: heroNumberSize, lineHeight: 0.95,
              letterSpacing: "-3px", color: CREAM, margin: "0 0 14px",
            }}>{heroNumber}</div>
            <p style={{
              fontFamily: FF, fontSize: 14.5, fontWeight: 400, lineHeight: 1.55,
              color: "rgba(238,232,218,0.9)", maxWidth: 280, margin: 0,
            }}>
              Locals, visitors, and newcomers using Hello Hoedspruit monthly to find what's open and what's on.
            </p>
          </div>
        </div>
      </div>

      {/* Section heading */}
      <div style={{
        padding: "0 24px", marginTop: 14, marginBottom: 16,
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
      }}>
        <h2 style={{
          fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 400,
          fontSize: 32, lineHeight: 1, letterSpacing: "-0.5px",
          color: CREAM, margin: 0,
        }}>why advertise</h2>
      </div>

      {/* Numbered features card */}
      <div style={{ padding: "0 24px", marginBottom: 20 }}>
        <div style={{
          background: CREAM, borderRadius: 24, padding: "6px 24px",
          overflow: "hidden", boxSizing: "border-box",
        }}>
          {BENEFITS.map((b, i) => (
            <div key={b.n} style={{
              display: "flex", gap: 18, alignItems: "flex-start",
              padding: "22px 0",
              borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
            }}>
              <div style={{
                fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 400,
                fontSize: 34, lineHeight: 1, letterSpacing: "-0.5px",
                color: MUTED, width: 46, flexShrink: 0,
              }}>{b.n}</div>
              <div style={{ flex: 1 }}>
                <h5 style={{
                  fontFamily: FF, fontSize: 18, fontWeight: 400,
                  lineHeight: 1.2, letterSpacing: "-0.2px",
                  color: INK, margin: "0 0 7px",
                }}>{b.title}</h5>
                <div style={{
                  fontFamily: FF, fontSize: 13.5, fontWeight: 400, lineHeight: 1.5,
                  color: "rgba(42,42,36,0.75)",
                }}>{b.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social proof */}
      <div style={{
        padding: "0 24px", marginBottom: 24,
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {[0, 1, 2, 3].map((i) => {
            const src = avatarUrls?.[i];
            return (
              <div
                key={i}
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  border: `2px solid ${OLIVE}`,
                  marginLeft: i === 0 ? 0 : -8,
                  background: src ? "transparent" : AVATAR_FALLBACKS[i],
                  overflow: "hidden", flexShrink: 0,
                }}
              >
                {src && (
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                )}
              </div>
            );
          })}
        </div>
        <div style={{ lineHeight: 1.4 }}>
          <div style={{ fontFamily: FF, fontSize: 14.5, fontWeight: 400, color: CREAM }}>
            {businessNumber} businesses
          </div>
          <div style={{
            fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 400,
            fontSize: 14.5, color: "rgba(238,232,218,0.75)",
          }}>already on the app.</div>
        </div>
      </div>

      {/* CTA card */}
      <div style={{ padding: "0 24px", marginBottom: 32 }}>
        <div style={{
          background: RUST, borderRadius: 28,
          padding: "30px 28px 28px",
          position: "relative", overflow: "hidden", boxSizing: "border-box",
        }}>
          <div style={{
            position: "absolute", right: -80, top: -100,
            width: 240, height: 260, background: DEEP_RUST,
            borderRadius: BLOB_RADIUS_A, opacity: 0.55, zIndex: 1,
          }} />
          <div style={{
            position: "absolute", left: -50, bottom: -70,
            width: 160, height: 170, background: "rgba(238,232,218,0.08)",
            borderRadius: BLOB_RADIUS_B, zIndex: 1,
          }} />
          <div style={{ position: "relative", zIndex: 2 }}>
            <p style={{
              fontFamily: FF, fontSize: 11.5, fontWeight: 400,
              letterSpacing: "2.4px", textTransform: "uppercase",
              color: "rgba(238,232,218,0.8)", margin: "0 0 14px",
            }}>For Local Businesses</p>
            <h2 style={{
              fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 300,
              fontSize: 38, lineHeight: 1, letterSpacing: "-1px",
              color: CREAM, margin: "0 0 14px",
            }}>Join the directory.</h2>
            <p style={{
              fontFamily: FF, fontSize: 14.5, fontWeight: 400, lineHeight: 1.55,
              color: "rgba(238,232,218,0.9)", maxWidth: 280, margin: "0 0 24px",
            }}>
              Pick a plan that fits, get your business live on the app, and start reaching the Hoedspruit community this week.
            </p>
            <button
              onClick={() => navigate("/plans")}
              {...tap}
              style={{
                background: CREAM, color: INK, border: "none",
                borderRadius: 999, padding: "14px 22px",
                fontFamily: FF, fontSize: 14, fontWeight: 400,
                display: "inline-flex", alignItems: "center", gap: 8,
                cursor: "pointer", transition: "transform 0.15s ease",
              }}
            >
              See Plans
              <span style={{ fontSize: 14, color: INK, lineHeight: 1 }}>↗</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Enquiry form */}
      <div style={{ padding: "0 24px", marginBottom: 18 }}>
        {submitted ? (
          <div style={{
            background: CREAM, borderRadius: 24, padding: 32, textAlign: "center",
            boxSizing: "border-box",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: "rgba(106,106,94,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            }}>
              <Check size={22} strokeWidth={2} color={INK} />
            </div>
            <div style={{
              fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 400,
              fontSize: 24, color: INK, marginBottom: 8,
            }}>Thanks for your interest.</div>
            <p style={{
              fontFamily: FF, fontSize: 14, color: MUTED, lineHeight: 1.5, margin: "0 0 20px",
            }}>We've received your enquiry and will be in touch soon.</p>
            <button
              onClick={() => setSubmitted(false)}
              {...tap}
              style={{
                background: "none", border: `1px solid ${LINE}`, borderRadius: 999,
                padding: "10px 20px", fontSize: 13, fontWeight: 400, color: INK,
                fontFamily: FF, cursor: "pointer", transition: "transform 0.15s ease",
              }}
            >
              Send Another Enquiry
            </button>
          </div>
        ) : (
          <>
            <p style={{
              fontFamily: FF, fontSize: 11, fontWeight: 400,
              letterSpacing: "2.4px", textTransform: "uppercase",
              color: "rgba(238,232,218,0.7)", margin: "0 0 10px",
            }}>Quick Enquiry</p>
            <h2 style={{
              fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 300,
              fontSize: 48, lineHeight: 0.95, letterSpacing: "-1.4px",
              color: CREAM, margin: "0 0 24px",
            }}>say hello.</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <input
                  className="adv-input"
                  placeholder="Name and surname"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: "" })); }}
                  style={inputBase}
                />
                {errors.name && <p style={{ fontSize: 12, color: "#FFD9D0", margin: "6px 0 0", paddingLeft: 18, fontFamily: FF }}>{errors.name}</p>}
              </div>
              <div>
                <input
                  className="adv-input"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: "" })); }}
                  style={inputBase}
                />
                {errors.email && <p style={{ fontSize: 12, color: "#FFD9D0", margin: "6px 0 0", paddingLeft: 18, fontFamily: FF }}>{errors.email}</p>}
              </div>
              <div>
                <input
                  className="adv-input"
                  placeholder="Business name"
                  value={business}
                  onChange={(e) => { setBusiness(e.target.value); if (errors.business) setErrors(p => ({ ...p, business: "" })); }}
                  style={inputBase}
                />
                {errors.business && <p style={{ fontSize: 12, color: "#FFD9D0", margin: "6px 0 0", paddingLeft: 18, fontFamily: FF }}>{errors.business}</p>}
              </div>
              <div>
                <textarea
                  className="adv-input"
                  placeholder="Tell us what you're looking for"
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); if (errors.message) setErrors(p => ({ ...p, message: "" })); }}
                  style={{
                    ...inputBase,
                    height: "auto", minHeight: 110,
                    paddingTop: 18, paddingBottom: 18, paddingLeft: 20, paddingRight: 20,
                    resize: "none", lineHeight: 1.5,
                  }}
                />
                {errors.message && <p style={{ fontSize: 12, color: "#FFD9D0", margin: "6px 0 0", paddingLeft: 18, fontFamily: FF }}>{errors.message}</p>}
              </div>
              <button
                type="submit"
                disabled={submitForm.isPending}
                {...tap}
                style={{
                  width: "100%", marginTop: 8, marginBottom: 16,
                  background: INK, color: CREAM, border: "none",
                  borderRadius: 999, height: 54,
                  fontFamily: FF, fontSize: 15, fontWeight: 400,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  cursor: "pointer", opacity: submitForm.isPending ? 0.6 : 1,
                  transition: "transform 0.15s ease",
                }}
              >
                {submitForm.isPending ? (
                  <><Loader2 size={16} color={CREAM} className="animate-spin" /> Sending</>
                ) : "Submit"}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Email-direct card */}
      <div style={{ padding: "0 24px", marginBottom: 12 }}>
        <a
          href="mailto:admin@hellohoedspruit.co"
          {...tap}
          style={{
            display: "block", background: CREAM, borderRadius: 20,
            padding: "18px 22px",
            textDecoration: "none", boxSizing: "border-box", position: "relative",
            transition: "transform 0.15s ease",
          }}
        >
          <div style={{
            position: "absolute", top: 14, right: 14,
            width: 30, height: 30, borderRadius: "50%",
            background: "rgba(106,106,94,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 12, color: INK, lineHeight: 1 }}>↗</span>
          </div>
          <p style={{
            fontFamily: FF, fontSize: 11, fontWeight: 400,
            letterSpacing: "2.2px", textTransform: "uppercase",
            color: MUTED, margin: "0 0 6px",
          }}>Or Email Us Directly</p>
          <div style={{
            fontFamily: FF, fontSize: 16, fontWeight: 400,
            letterSpacing: "-0.1px", color: INK,
          }}>admin@hellohoedspruit.co</div>
        </a>
      </div>
    </div>
  );
};

export default Advertise;
