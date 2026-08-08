import { Mail, Phone, ArrowUpRight, Clock, Globe } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";
import Seo from "@/components/Seo";
import { SECTION_INSET, type } from "@/lib/type";

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

const ThreadsIcon = ({ size = 22, color = "#1A1A1A" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.06 11.13c-.09-.04-.18-.08-.27-.12-.16-2.96-1.78-4.66-4.49-4.68h-.04c-1.62 0-2.97.69-3.81 1.95l1.49 1.02c.62-.94 1.6-1.14 2.32-1.14h.03c.9.01 1.57.27 2 .79.31.38.52.9.62 1.56-.77-.13-1.6-.17-2.49-.12-2.5.14-4.11 1.6-4 3.63.05 1.03.57 1.91 1.45 2.49.74.49 1.7.73 2.7.67 1.32-.07 2.36-.58 3.08-1.5.55-.7.9-1.61 1.05-2.76.63.38 1.1.88 1.36 1.48.44 1.02.47 2.7-.9 4.07-1.2 1.2-2.65 1.72-4.83 1.73-2.42-.02-4.25-.79-5.44-2.3C5.78 16.49 5.2 14.5 5.18 12c.02-2.5.6-4.49 1.71-5.92C8.08 4.57 9.9 3.8 12.33 3.78c2.44.02 4.29.79 5.51 2.31.6.74 1.05 1.68 1.34 2.77l1.71-.46c-.36-1.35-.93-2.51-1.7-3.46C17.62 2.99 15.31 2.01 12.34 2h-.01C9.36 2.02 7.08 3 5.57 4.92 4.21 6.64 3.51 9.04 3.49 12v.01c.02 2.96.72 5.36 2.08 7.08 1.51 1.92 3.79 2.9 6.76 2.92h.01c2.64-.02 4.51-.71 6.04-2.25 2.01-2.01 1.95-4.52 1.28-6.07-.47-1.1-1.39-2-2.6-2.56zm-4.66 3.46c-1.11.06-2.26-.44-2.32-1.51-.04-.79.57-1.68 2.39-1.78l.55-.01c.66 0 1.27.06 1.83.18-.21 2.61-1.44 3.06-2.45 3.12z"/>
  </svg>
);

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const BODY = "#2b2420";
const MUTED = "#9A8F7E";
const LABEL = "#6B6A5E";
const TRAIL_ICON = "#B4AE9E";
const LINE = "#E2DAC6";
const BROWN = "#715a3d";

const CONTACT_EMAIL = "admin@hellohoedspruit.co";
const CONTACT_PHONE = "061 332 1709";
const PHONE_DIGITS = "27613321709";
const WHATSAPP_URL = `https://wa.me/${PHONE_DIGITS}`;
const WEBSITE_CONTACT_URL = "https://hellohoedspruit.co/help/contact";
const INSTAGRAM_URL = "https://instagram.com/hellohoedspruit";
const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61573298922814";
const THREADS_URL = "https://www.threads.net/@hellohoedspruit";

type RowProps = {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  href?: string;
};

const Row = ({ icon, label, subtitle, href }: RowProps) => {
  const inner = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        minHeight: 56,
        padding: "10px 16px",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FF,
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            color: INK,
            lineHeight: 1.25,
          }}
        >
          {label}
        </div>
        {subtitle ? (
          <div style={{ fontFamily: FF, fontSize: 12.5, fontWeight: 400, color: LABEL, lineHeight: 1.3, marginTop: 2 }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      {href && <ArrowUpRight size={16} strokeWidth={2} color={TRAIL_ICON} style={{ flexShrink: 0 }} />}
    </div>
  );

  if (!href) return inner;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      {inner}
    </a>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{ ...type.sectionEyebrow, marginTop: 0 }}>{children}</p>
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
      borderRadius: 20,
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
        paddingBottom: 100,
        fontFamily: FF,
        overflowX: "hidden",
      }}
    >
      <Seo
        title="Contact Hello Hoedspruit"
        description="Get in touch with the Hello Hoedspruit team by email, phone, WhatsApp or social — we'd love to hear from you."
        path="/contact"
      />
      <PageHeader title="Contact Us" />

      <div style={{ height: 24 }} />

      <div style={{ marginBottom: 28 }}>
        <div style={{ padding: "0 24px" }}>
          <SectionLabel>Reach Out</SectionLabel>
        </div>
        <div
          style={{
            background: CARD,
            borderRadius: 20,
            margin: "0 24px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Row
            icon={<Mail size={20} color={BROWN} strokeWidth={1.6} />}
            label="Email"
            subtitle={CONTACT_EMAIL}
            href={`mailto:${CONTACT_EMAIL}`}
          />
          <div style={{ height: 1, background: LINE, marginLeft: 50, marginRight: 16 }} />
          <Row
            icon={<Phone size={20} color={BROWN} strokeWidth={1.6} />}
            label="Phone"
            subtitle={CONTACT_PHONE}
            href={`tel:${PHONE_DIGITS}`}
          />
          <div style={{ height: 1, background: LINE, marginLeft: 50, marginRight: 16 }} />
          <Row
            icon={<WhatsAppIcon size={20} color={BROWN} />}
            label="WhatsApp"
            subtitle={CONTACT_PHONE}
            href={WHATSAPP_URL}
          />
          <div style={{ height: 1, background: LINE, marginLeft: 50, marginRight: 16 }} />
          <Row
            icon={<Globe size={20} color={BROWN} strokeWidth={1.6} />}
            label="Contact Form"
            subtitle="Fill out a contact form on our website"
            href={WEBSITE_CONTACT_URL}
          />
        </div>
      </div>

      <div style={{ padding: `0 ${SECTION_INSET}px`, marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: type.sectionEyebrow.marginBottom }}>
          <p style={{ ...type.sectionEyebrow, margin: 0 }}>Office Hours</p>
          {(() => {
            const now = new Date();
            const day = now.getDay();
            const mins = now.getHours() * 60 + now.getMinutes();
            let open = false;
            if (day >= 1 && day <= 5) open = mins >= 9 * 60 && mins < 17 * 60;
            else if (day === 6) open = mins >= 9 * 60 && mins < 12 * 60;
            const color = open ? "#2E7D4F" : "#B42318";
            const label = open ? "Open Now" : "Closed Now";
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                <span style={{ fontFamily: `"Nohemi", ${FF}`, fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color }}>{label}</span>
              </div>
            );
          })()}
        </div>
        <div style={{ background: CARD, borderRadius: 20, overflow: "hidden", padding: "0 16px" }}>
          {[
            { day: "Monday – Friday", hours: "09:00 – 17:00", closed: false },
            { day: "Saturday", hours: "09:00 – 12:00", closed: false },
            { day: "Sunday", hours: "Closed", closed: true },
          ].map((r, i, arr) => (
            <div key={r.day}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 56, padding: "10px 0" }}>
                <span style={{ fontFamily: FF, fontSize: 15, fontWeight: r.closed ? 400 : 500, color: r.closed ? MUTED : INK }}>{r.day}</span>
                <span style={{ fontFamily: FF, fontSize: 15, fontWeight: 400, color: r.closed ? MUTED : BODY }}>{r.hours}</span>
              </div>
              {i < arr.length - 1 && <div style={{ height: 1, background: "#EFE7D4" }} />}
            </div>
          ))}
        </div>
      </div>


      <div style={{ padding: `0 ${SECTION_INSET}px`, marginBottom: 28 }}>
        <SectionLabel>Follow Along</SectionLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <SocialTile icon={<InstagramIcon size={22} color={INK} />} label="Instagram" href={INSTAGRAM_URL} />
          <SocialTile icon={<FacebookIcon size={22} color={INK} />} label="Facebook" href={FACEBOOK_URL} />
          <SocialTile icon={<ThreadsIcon size={22} color={INK} />} label="Threads" href={THREADS_URL} />
        </div>
      </div>


      <BottomNav />
    </div>
  );
};

export default ContactUs;
