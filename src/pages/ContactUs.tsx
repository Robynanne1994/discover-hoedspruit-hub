import { useNavigate } from "react-router-dom";
import { Mail, Phone, Instagram, ChevronRight, MapPin } from "lucide-react";

const WhatsAppIcon = ({ size = 18, color = "#1A1A1A" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.057 21.785h-.005a9.87 9.87 0 01-5.03-1.378l-.36-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
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
        Have a question, feedback or need support? We're here to help you get the most out of Hello Hoedspruit.
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
