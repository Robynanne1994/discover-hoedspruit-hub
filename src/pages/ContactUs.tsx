import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import BackArrowIcon from "@/components/ui/BackArrowIcon";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const FF_SERIF = "'Playfair Display', Georgia, serif";

const OLIVE = "#5C6446";
const CREAM = "#EEE8DA";
const SOFT_CREAM = "#F4EFE3";
const INK = "#2A2A24";
const MUTED = "#6B6A5E";
const RUST = "#9B5A3C";
const DEEP_RUST = "#7E4530";

const CONTACT_EMAIL = "admin@hellohoedspruit.co";
const CONTACT_PHONE = "061 332 1709";
const PHONE_DIGITS = "27613321709";
const WHATSAPP_URL = `https://wa.me/${PHONE_DIGITS}`;
const INSTAGRAM_URL = "https://instagram.com/hellohoedspruit";

const press = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(0.985)"; },
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
};

const SecondaryCard = ({
  eyebrow,
  value,
  meta,
  bg = CREAM,
  href,
  external,
  onClick,
  fullWidth,
}: {
  eyebrow: string;
  value: string;
  meta: string;
  bg?: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
}) => {
  const inner = (
    <div
      {...press}
      style={{
        background: bg,
        borderRadius: 20,
        padding: fullWidth ? "20px 22px 22px" : "18px 20px 20px",
        position: "relative",
        height: "100%",
        boxSizing: "border-box",
        transition: "transform 150ms ease-out",
        cursor: "pointer",
        minWidth: 0,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: fullWidth ? 18 : 14,
          right: fullWidth ? 18 : 14,
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "rgba(106,106,94,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: INK,
          fontSize: 12,
          lineHeight: 1,
        }}
      >
        ↗
      </div>
      <p
        style={{
          fontFamily: FF,
          fontSize: 11,
          fontWeight: 400,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: MUTED,
          margin: 0,
          marginBottom: fullWidth ? 8 : 10,
          paddingRight: 36,
        }}
      >
        {eyebrow}
      </p>
      <p
        style={{
          fontFamily: FF,
          fontSize: 18,
          fontWeight: 400,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          color: INK,
          margin: 0,
          marginBottom: fullWidth ? 5 : 6,
          paddingRight: 36,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontFamily: FF_SERIF,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 13,
          color: MUTED,
          margin: 0,
          lineHeight: 1.3,
        }}
      >
        {meta}
      </p>
    </div>
  );

  const sharedStyle: React.CSSProperties = { textDecoration: "none", color: "inherit", display: "block", height: "100%", minWidth: 0 };

  if (href) {
    return (
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} style={sharedStyle}>
        {inner}
      </a>
    );
  }
  return (
    <button onClick={onClick} style={{ ...sharedStyle, background: "none", border: "none", padding: 0, width: "100%", textAlign: "left", cursor: "pointer" }}>
      {inner}
    </button>
  );
};

const ContactUs = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: OLIVE,
        paddingBottom: 120,
        fontFamily: FF,
        overflowX: "hidden",
      }}
    >
      {/* Top bar */}
      <div style={{ paddingTop: "calc(env(safe-area-inset-top) + 32px)", paddingLeft: 24, paddingRight: 24 }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          {...press}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: CREAM,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 150ms ease-out",
          }}
        >
          <BackArrowIcon size={18} color={INK} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ paddingTop: 18, paddingLeft: 24, paddingRight: 24, paddingBottom: 28 }}>
        <p
          style={{
            fontFamily: FF,
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(238,232,218,0.7)",
            margin: 0,
            marginBottom: 14,
            lineHeight: 1,
          }}
        >
          Drop us a line
        </p>
        <h1
          style={{
            fontFamily: FF_SERIF,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 72,
            lineHeight: 0.92,
            letterSpacing: "-0.035em",
            color: CREAM,
            margin: 0,
            marginBottom: 18,
            textTransform: "lowercase",
          }}
        >
          get in touch.
        </h1>
        <p
          style={{
            fontFamily: FF,
            fontSize: 15,
            fontWeight: 400,
            lineHeight: 1.65,
            color: "rgba(238,232,218,0.9)",
            margin: 0,
            maxWidth: 320,
          }}
        >
          Questions, feedback, or a local tip worth sharing. We read everything.
        </p>
      </div>

      {/* Featured Email card */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 14 }}>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          style={{ textDecoration: "none", color: "inherit", display: "block" }}
        >
          <div
            {...press}
            style={{
              background: RUST,
              borderRadius: 28,
              padding: "32px 28px 28px",
              position: "relative",
              overflow: "hidden",
              transition: "transform 150ms ease-out",
              cursor: "pointer",
            }}
          >
            {/* Blob 1 */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                right: -80,
                bottom: -100,
                width: 240,
                height: 260,
                background: DEEP_RUST,
                borderRadius: "50% 45% 55% 50% / 55% 50% 60% 45%",
                opacity: 0.6,
                pointerEvents: "none",
              }}
            />
            {/* Blob 2 */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                right: -30,
                top: -60,
                width: 160,
                height: 170,
                background: "rgba(238,232,218,0.08)",
                borderRadius: "55% 45% 50% 55% / 50% 60% 45% 55%",
                pointerEvents: "none",
              }}
            />
            {/* Arrow */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: 24,
                right: 24,
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "rgba(238,232,218,0.25)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: CREAM,
                fontSize: 16,
                lineHeight: 1,
                zIndex: 2,
              }}
            >
              ↗
            </div>

            <div style={{ position: "relative", zIndex: 1 }}>
              <p
                style={{
                  fontFamily: FF,
                  fontSize: 11.5,
                  fontWeight: 400,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(238,232,218,0.8)",
                  margin: 0,
                  marginBottom: 36,
                  lineHeight: 1,
                }}
              >
                Primary
              </p>
              <h2
                style={{
                  fontFamily: FF_SERIF,
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: 38,
                  lineHeight: 1,
                  letterSpacing: "-0.025em",
                  color: CREAM,
                  margin: 0,
                  marginBottom: 10,
                }}
              >
                Email us
              </h2>
              <p
                style={{
                  fontFamily: FF,
                  fontSize: 14.5,
                  fontWeight: 400,
                  lineHeight: 1.55,
                  color: "rgba(238,232,218,0.9)",
                  margin: 0,
                  marginBottom: 4,
                  wordBreak: "break-word",
                }}
              >
                {CONTACT_EMAIL}
              </p>
              <p
                style={{
                  fontFamily: FF_SERIF,
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: 14,
                  color: "rgba(238,232,218,0.75)",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                Reply within 48 hours.
              </p>
            </div>
          </div>
        </a>
      </div>

      {/* Two-column row: Call + WhatsApp */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 14 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 14,
            alignItems: "stretch",
          }}
        >
          <SecondaryCard
            eyebrow="Call"
            value={CONTACT_PHONE}
            meta="Mon to Fri, 9 to 5"
            href={`tel:${PHONE_DIGITS}`}
          />
          <SecondaryCard
            eyebrow="Whatsapp"
            value={CONTACT_PHONE}
            meta="Reply same day"
            href={WHATSAPP_URL}
            external
          />
        </div>
      </div>

      {/* Contact form card */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 14 }}>
        <SecondaryCard
          eyebrow="Write to us"
          value="Contact form"
          meta="Send a longer message"
          onClick={() => navigate("/feedback")}
          fullWidth
        />
      </div>

      {/* Instagram card */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 14 }}>
        <SecondaryCard
          eyebrow="Instagram"
          value="@hellohoedspruit"
          meta="Daily picks, openings, and what's on"
          bg={SOFT_CREAM}
          href={INSTAGRAM_URL}
          external
          fullWidth
        />
      </div>

      {/* Sign-off */}
      <div style={{ paddingTop: 24, paddingLeft: 24, paddingRight: 24 }}>
        <p
          style={{
            fontFamily: FF_SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 17,
            color: "rgba(238,232,218,0.75)",
            margin: 0,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          — with love from the 'Hoed.
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default ContactUs;
