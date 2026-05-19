import { useNavigate } from "react-router-dom";
import { Mail, MessageCircle, Phone, Instagram, ChevronRight, MapPin } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import BackArrowIcon from "@/components/ui/BackArrowIcon";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const BG = "#ECE3CF";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED = "#7A6E5C";
const LINE = "#E2DAC6";
const ICON_BG = "#EFE7D4";

const CONTACT_EMAIL = "admin@hellohoedspruit.co";
const CONTACT_PHONE = "061 332 1709";
const PHONE_DIGITS = "27613321709";
const WHATSAPP_URL = `https://wa.me/${PHONE_DIGITS}`;
const INSTAGRAM_URL = "https://instagram.com/hellohoedspruit";

type RowProps = {
  icon: React.ReactNode;
  eyebrow: string;
  value: string;
  href: string;
  external?: boolean;
  isFirst?: boolean;
};

const Row = ({ icon, eyebrow, value, href, external, isFirst }: RowProps) => (
  <a
    href={href}
    target={external ? "_blank" : undefined}
    rel={external ? "noopener noreferrer" : undefined}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "16px 0",
      borderTop: isFirst ? "none" : `1px solid ${LINE}`,
      textDecoration: "none",
      color: "inherit",
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: ICON_BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontFamily: FF,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: MUTED,
          marginBottom: 4,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: FF,
          fontSize: 16,
          fontWeight: 400,
          color: INK,
          lineHeight: 1.2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </div>
    <ChevronRight size={18} color={MUTED} style={{ flexShrink: 0 }} />
  </a>
);

const ContactUs = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        paddingBottom: 120,
        fontFamily: FF,
        overflowX: "hidden",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 60px)",
          paddingLeft: 24,
          paddingRight: 24,
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: 44,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#fff",
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            lineHeight: 0,
            flexShrink: 0,
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <BackArrowIcon size={18} color={INK} />
        </button>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            marginRight: 40,
            fontFamily: FF,
            fontSize: 20,
            fontWeight: 700,
            color: INK,
            lineHeight: 1,
          }}
        >
          Contact Us
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(26,26,26,0.10)", marginTop: 20 }} />

      {/* Intro */}
      <p
        style={{
          fontFamily: FF,
          fontSize: 15,
          fontWeight: 400,
          color: INK,
          lineHeight: 1.5,
          margin: 0,
          padding: "24px 24px 0",
        }}
      >
        Have a question, feedback, or need support? We're here to help you get the most out of Hello Hoedspruit.
      </p>

      {/* Contact methods card */}
      <div style={{ padding: "24px 20px 0" }}>
        <div
          style={{
            background: CARD,
            borderRadius: 20,
            padding: "4px 20px",
          }}
        >
          <Row
            icon={<Mail size={18} color={INK} strokeWidth={1.6} />}
            eyebrow="Email"
            value={CONTACT_EMAIL}
            href={`mailto:${CONTACT_EMAIL}`}
            isFirst
          />
          <Row
            icon={<MessageCircle size={18} color={INK} strokeWidth={1.6} />}
            eyebrow="WhatsApp"
            value={CONTACT_PHONE}
            href={WHATSAPP_URL}
            external
          />
          <Row
            icon={<Phone size={18} color={INK} strokeWidth={1.6} />}
            eyebrow="Call"
            value={CONTACT_PHONE}
            href={`tel:${PHONE_DIGITS}`}
          />
          <Row
            icon={<Instagram size={18} color={INK} strokeWidth={1.6} />}
            eyebrow="Instagram"
            value="@hellohoedspruit"
            href={INSTAGRAM_URL}
            external
          />
        </div>
      </div>

      {/* Location card */}
      <div style={{ padding: "20px 20px 0" }}>
        <div
          style={{
            background: CARD,
            borderRadius: 20,
            padding: "28px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#D9CFB8",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <MapPin size={22} color={INK} strokeWidth={1.6} />
          </div>
          <div
            style={{
              fontFamily: FF,
              fontSize: 18,
              fontWeight: 700,
              color: INK,
              marginBottom: 10,
            }}
          >
            Based in Hoedspruit
          </div>
          <p
            style={{
              fontFamily: FF,
              fontSize: 14,
              fontWeight: 400,
              color: MUTED,
              lineHeight: 1.5,
              margin: 0,
              maxWidth: 280,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Locally built and managed to bring you the best of our beautiful town.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ContactUs;
