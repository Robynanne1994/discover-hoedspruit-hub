import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackArrowIcon from "@/components/ui/BackArrowIcon";

const OLIVE = "#5C6446";
const CREAM = "#EEE8DA";
const RUST = "#9B5A3C";
const RUST_DEEP = "#7E4530";
const INK = "#2A2A24";
const INK_SOFT = "#6B6A5E";
const LINE = "#D9D2C0";
const INK_10 = "rgba(106,106,94,0.1)";

const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const ROWS = [
  { title: "FAQs", desc: "Quick answers to the questions that come up most.", to: "/faqs" },
  { title: "About", desc: "How Hello Hoedspruit started, and who's behind it.", to: "/about" },
  { title: "Terms & Policies", desc: "Privacy, terms, cookies, and how we look after you.", to: "/terms" },
  { title: "Contact Us", desc: "Drop us a note. We read every message.", to: "/contact" },
];

const HelpCentre = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const id = "playfair-display-font";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;1,300;1,400&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: OLIVE, paddingBottom: 140 }}>
      {/* Top bar */}
      <div style={{ paddingTop: 32, paddingLeft: 24 }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            width: 44, height: 44, borderRadius: 999, background: CREAM,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "none", cursor: "pointer",
          }}
        >
          <BackArrowIcon size={18} color={INK} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ padding: "36px 24px 0" }}>
        <div style={{
          fontFamily: SANS, fontWeight: 400, fontSize: 12, letterSpacing: "2.4px",
          textTransform: "uppercase", color: CREAM, opacity: 0.7,
        }}>
          WE'RE HERE TO HELP
        </div>
        <h1 style={{
          marginTop: 14, marginBottom: 0,
          fontFamily: SERIF, fontStyle: "italic", fontWeight: 300,
          fontSize: 72, lineHeight: 0.92, letterSpacing: "-2.5px", color: CREAM,
        }}>
          help centre.
        </h1>
        <p style={{
          marginTop: 18, marginBottom: 0,
          fontFamily: SANS, fontWeight: 400, fontSize: 15, lineHeight: 1.65,
          color: CREAM, opacity: 0.9, maxWidth: 320,
        }}>
          Quick answers, the small print, and a bit about us.
        </p>
      </div>

      {/* Section eyebrow */}
      <div style={{ padding: "32px 24px 0" }}>
        <div style={{
          fontFamily: SANS, fontWeight: 400, fontSize: 11, letterSpacing: "2.4px",
          textTransform: "uppercase", color: CREAM, opacity: 0.7, marginBottom: 12,
        }}>
          FIND WHAT YOU NEED
        </div>

        {/* List card */}
        <div style={{ background: CREAM, borderRadius: 24, padding: "6px 22px" }}>
          {ROWS.map((row, i) => (
            <button
              key={row.title}
              onClick={() => navigate(row.to)}
              style={{
                display: "flex", alignItems: "center", gap: 14, width: "100%",
                padding: "20px 0", background: "transparent", border: "none",
                borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
                cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: SANS, fontWeight: 400, fontSize: 16, lineHeight: 1.2,
                  letterSpacing: "-0.1px", color: INK,
                }}>
                  {row.title}
                </div>
              </div>
              <div style={{
                width: 30, height: 30, borderRadius: 999, background: INK_10,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: SANS, fontSize: 12, color: INK, flexShrink: 0,
              }}>
                ↗
              </div>
            </button>
          ))}
        </div>

        {/* Rust feature card */}
        <div style={{
          marginTop: 20, background: RUST, borderRadius: 28,
          padding: "32px 28px 28px", position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -60, right: -50, width: 180, height: 180,
            borderRadius: "50%", background: RUST_DEEP, opacity: 0.55,
          }} />
          <div style={{
            position: "absolute", bottom: -40, left: -30, width: 120, height: 120,
            borderRadius: "50%", background: "rgba(238,232,218,0.08)",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              fontFamily: SANS, fontWeight: 400, fontSize: 12, letterSpacing: "2.4px",
              textTransform: "uppercase", color: CREAM, opacity: 0.7, marginBottom: 12,
            }}>
              STILL STUCK?
            </div>
            <h3 style={{
              margin: 0, fontFamily: SERIF, fontStyle: "italic", fontWeight: 300,
              fontSize: 38, lineHeight: 1, letterSpacing: "-1px", color: CREAM,
            }}>
              Drop us a line.
            </h3>
            <p style={{
              marginTop: 14, marginBottom: 22,
              fontFamily: SANS, fontWeight: 400, fontSize: 14.5, lineHeight: 1.55,
              color: CREAM, opacity: 0.9, maxWidth: 280,
            }}>
              If you can't find what you're after, we'd love to hear from you. We read every message.
            </p>
            <button
              onClick={() => navigate("/contact")}
              style={{
                height: 44, padding: "0 22px", borderRadius: 999, background: CREAM,
                color: INK, fontFamily: SANS, fontWeight: 400, fontSize: 14,
                border: "none", cursor: "pointer",
              }}
            >
              Get In Touch
            </button>
          </div>
        </div>

        {/* Whisper */}
        <div style={{
          marginTop: 44, textAlign: "center",
          fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 17,
          color: CREAM, opacity: 0.65, letterSpacing: "-0.2px",
        }}>
          with love from the 'hoed.
        </div>
      </div>
    </div>
  );
};

export default HelpCentre;
