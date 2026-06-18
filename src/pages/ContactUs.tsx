import { Mail, Phone, ArrowUpRight, MapPin, Clock, Globe, Navigation } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";
import Seo from "@/components/Seo";

const WhatsAppIcon = ({ size = 18, color = "#1A1A1A" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.057 21.785h-.005a9.87 9.87 0 01-5.03-1.378l-.36-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const InstagramIcon = ({ size = 22, color = "#1A1A1A" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const FacebookIcon = ({ size = 22, color = "#1A1A1A" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#020202";
const BODY = "#2b2420";
const MUTED = "#9A8F7E";
const ICON_BG = "#EFE7D4";
const BROWN = "#715a3d";

const CONTACT_EMAIL = "admin@hellohoedspruit.co";
const CONTACT_PHONE = "061 332 1709";
const PHONE_DIGITS = "27613321709";
const WHATSAPP_URL = `https://wa.me/${PHONE_DIGITS}`;
const INSTAGRAM_URL = "https://instagram.com/hellohoedspruit";
const FACEBOOK_URL = "https://facebook.com/hellohoedspruit";
const WEBSITE_URL = "https://hellohoedspruit.co";
const ADDRESS = "Hoedspruit, Limpopo 1380";
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent("Hoedspruit, Limpopo")}`;

type RowProps = {
  icon: React.ReactNode;
  eyebrow: string;
  value: React.ReactNode;
  href?: string;
  external?: boolean;
};

const Row = ({ icon, eyebrow, value, href, external }: RowProps) => {
  const inner = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: CARD,
        borderRadius: 16,
        padding: "16px 18px",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
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
        {eyebrow && (
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
        )}
        <div
          style={{
            fontFamily: FF,
            fontSize: 15,
            fontWeight: 400,
            color: INK,
            lineHeight: 1.3,
          }}
        >
          {value}
        </div>
      </div>
      {href && <ArrowUpRight size={18} color={INK} style={{ flexShrink: 0 }} />}
    </div>
  );

  if (!href) return inner;
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      {inner}
    </a>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontFamily: FF,
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: MUTED,
      padding: "0 4px",
      marginBottom: 10,
    }}
  >
    {children}
  </div>
);

const SocialTile = ({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      flex: 1,
      background: CARD,
      borderRadius: 16,
      padding: "18px 8px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      textDecoration: "none",
      color: INK,
    }}
  >
    {icon}
    <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 400, color: INK }}>{label}</div>
  </a>
);

const ContactUs = () => {
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
      <Seo
        title="Contact Hello Hoedspruit"
        description="Get in touch with the Hello Hoedspruit team by email, phone, WhatsApp or social — we'd love to hear from you."
        path="/contact"
      />
      <PageHeader title="Contact" />

      <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 4 }}>
        <Row
          icon={<Mail size={20} color={BROWN} strokeWidth={1.6} />}
          eyebrow="Email"
          value={CONTACT_EMAIL}
          href={`mailto:${CONTACT_EMAIL}`}
        />
        <Row
          icon={<Phone size={20} color={BROWN} strokeWidth={1.6} />}
          eyebrow="Phone"
          value={CONTACT_PHONE}
          href={`tel:${PHONE_DIGITS}`}
        />
        <Row
          icon={<WhatsAppIcon size={20} color={BROWN} />}
          eyebrow="WhatsApp"
          value={CONTACT_PHONE}
          href={WHATSAPP_URL}
          external
        />
        <Row
          icon={<MapPin size={20} color={BROWN} strokeWidth={1.6} />}
          eyebrow="Find Us"
          value={ADDRESS}
        />
      </div>

      <div style={{ padding: "24px 20px 0" }}>
        <SectionLabel>Office Hours</SectionLabel>
        <Row
          icon={<Clock size={20} color={BROWN} strokeWidth={1.6} />}
          eyebrow=""
          value={
            <div>
              <div>Mon–Fri  08:00–17:00</div>
              <div style={{ color: MUTED, marginTop: 2 }}>Sat  08:00–12:00 · Sun closed</div>
            </div>
          }
        />
      </div>

      <div style={{ padding: "24px 20px 0" }}>
        <SectionLabel>Follow Along</SectionLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <SocialTile icon={<InstagramIcon size={22} color={INK} />} label="Instagram" href={INSTAGRAM_URL} />
          <SocialTile icon={<FacebookIcon size={22} color={INK} />} label="Facebook" href={FACEBOOK_URL} />
          <SocialTile icon={<Globe size={22} color={INK} strokeWidth={1.6} />} label="Website" href={WEBSITE_URL} />
        </div>
      </div>

      <div style={{ padding: "28px 20px 0" }}>
        <a
          href={DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: "#3a2e1f",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 999,
            padding: "18px 24px",
            fontFamily: FF,
            fontSize: 16,
            fontWeight: 400,
            letterSpacing: "0.01em",
          }}
        >
          <Navigation size={18} strokeWidth={1.6} />
          Get Directions
        </a>
      </div>

      <BottomNav />
    </div>
  );
};

export default ContactUs;
