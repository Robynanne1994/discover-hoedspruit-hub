import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import BackArrowIcon from "@/components/ui/BackArrowIcon";

const OLIVE = "#5C6446";
const DEEP_OLIVE = "#454C36";
const CREAM = "#EEE8DA";
const INK = "#2A2A24";
const MUTED = "#6B6A5E";
const LINE = "#D9D2C0";
const RUST = "#9B5A3C";
const DEEP_RUST = "#7E4530";

const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const BLOB_1 = "50% 45% 55% 50% / 55% 50% 60% 45%";
const BLOB_2 = "55% 45% 50% 55% / 50% 60% 45% 55%";

const collectItems = [
  { title: "Account Information", desc: "Name, email, profile details, and login information you choose to provide." },
  { title: "Activity in the App", desc: "Saved listings, visited places, event interactions, follows and profile activity." },
  { title: "Device & Usage Data", desc: "Basic technical information like device type, app activity and performance data." },
  { title: "Contact Actions", desc: "If you tap to call, email, visit a website, open Whatsapp or use maps from a listing." },
  { title: "Content You Add", desc: "Profile photo, comments, event submissions, listing enquiries, or other optional content you submit." },
  { title: "Location Data", desc: "Only if location-based features are enabled on the device or in the app." },
];

const useBullets = [
  "To create and manage your account.",
  "To save listings, visited places, specials and event activity.",
  "To personalise discovery and improve relevance.",
  "To respond to support requests and enquiries.",
  "To keep the app secure and prevent misuse.",
  "To improve app performance, features and content quality.",
  "To send essential service messages and optional updates based on your preferences.",
];

const securityBullets = [
  "Secure data transmission.",
  "Protected servers and platform security measures.",
  "Access controls for account-related information.",
  "Monitoring and updates to help keep the app safe.",
  "Reasonable steps to protect information from misuse, loss or unauthorised access.",
];

const actionRows = [
  { title: "Update Profile Information", desc: "Edit your name, photo, bio and contact details at any time.", to: "/account-settings/info" },
  { title: "Manage Notification Preferences", desc: "Choose what you hear from us and how often.", to: "/my-notifications" },
  { title: "Control Location Access", desc: "Manage location permissions through your device settings.", to: "/account-settings" },
  { title: "Download or Request Your Data", desc: "Get in touch to request a copy of the data we hold.", to: "mailto:admin@hellohoedspruit.co", external: true },
  { title: "Request Account Deletion", desc: "You can request to have your account and data removed.", to: "/account-settings" },
];

const bottomLinks = [
  { label: "Read Full Privacy Policy", to: "/privacy-policy", external: false },
  { label: "View Terms & Policies", to: "/terms", external: false },
  { label: "Contact us About Privacy", to: "mailto:admin@hellohoedspruit.co", external: true },
];

const press = (e: React.PointerEvent<HTMLElement>) => {
  e.currentTarget.style.transform = "scale(0.98)";
};
const release = (e: React.PointerEvent<HTMLElement>) => {
  e.currentTarget.style.transform = "scale(1)";
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    fontFamily: SANS, fontSize: 11, fontWeight: 400, letterSpacing: "2.4px",
    textTransform: "uppercase", color: "rgba(238,232,218,0.7)",
    padding: "0 24px", marginBottom: 10,
  }}>
    {children}
  </div>
);

const Bridge = ({ children }: { children: React.ReactNode }) => (
  <p style={{
    fontFamily: SERIF, fontStyle: "italic", fontWeight: 400,
    fontSize: 14.5, lineHeight: 1.55, color: "rgba(238,232,218,0.7)",
    padding: "0 28px", margin: "8px 0 24px",
  }}>
    {children}
  </p>
);

const cardBase: React.CSSProperties = {
  background: CREAM,
  borderRadius: 20,
  margin: "0 24px",
  padding: "4px 22px",
};

const ArrowCircle = () => (
  <div style={{
    width: 30, height: 30, borderRadius: 15, background: "rgba(106,106,94,0.1)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    color: INK, fontSize: 12, lineHeight: 1, fontFamily: SANS,
  }}>
    ↗
  </div>
);

const RowLink = ({
  to, external, isFirst, title, desc,
}: { to: string; external?: boolean; isFirst: boolean; title: string; desc: string }) => {
  const sharedStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 16,
    padding: "20px 0",
    borderTop: isFirst ? "none" : `1px solid ${LINE}`,
    textDecoration: "none", color: "inherit",
  };
  const inner = (
    <>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: SANS, fontSize: 16, fontWeight: 400,
          lineHeight: 1.2, letterSpacing: "-0.1px", color: INK, marginBottom: 5,
        }}>
          {title}
        </div>
        <div style={{
          fontFamily: SERIF, fontStyle: "italic", fontWeight: 400,
          fontSize: 13.5, lineHeight: 1.4, color: MUTED,
        }}>
          {desc}
        </div>
      </div>
      <ArrowCircle />
    </>
  );
  return external ? (
    <a href={to} style={sharedStyle}>{inner}</a>
  ) : (
    <Link to={to} style={sharedStyle}>{inner}</Link>
  );
};

const ParagraphCard = ({ paragraphs }: { paragraphs: { text: string; emphasis?: boolean }[] }) => (
  <div style={{ background: CREAM, borderRadius: 20, margin: "0 24px", padding: "20px 22px 22px" }}>
    {paragraphs.map((p, i) => (
      <p key={i} style={{
        fontFamily: SANS, fontSize: 14.5, lineHeight: 1.6, color: INK,
        opacity: p.emphasis ? 1 : 0.85, fontWeight: 400, margin: 0,
        marginBottom: i < paragraphs.length - 1 ? 14 : 0,
      }}>
        {p.text}
      </p>
    ))}
  </div>
);

const PrivacySecurity = () => {
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
    <div style={{ minHeight: "100vh", background: OLIVE, paddingBottom: 140, position: "relative", overflowX: "hidden" }}>
      {/* Hero blobs */}
      <div aria-hidden style={{ position: "absolute", top: -120, right: -80, width: 260, height: 320, background: DEEP_OLIVE, borderRadius: BLOB_1, opacity: 0.85, zIndex: 1 }} />
      <div aria-hidden style={{ position: "absolute", top: 80, right: -30, width: 120, height: 130, background: "rgba(238,232,218,0.08)", borderRadius: BLOB_2, zIndex: 1 }} />

      {/* Top bar */}
      <div style={{ position: "relative", zIndex: 3, paddingTop: 32, paddingLeft: 24, paddingRight: 24 }}>
        <button
          onClick={() => navigate(-1)}
          onPointerDown={press}
          onPointerUp={release}
          onPointerLeave={release}
          aria-label="Back"
          style={{
            width: 44, height: 44, borderRadius: 999, background: CREAM,
            border: "none", display: "inline-flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer",
            transition: "transform 150ms ease-out",
          }}
        >
          <BackArrowIcon size={18} color={INK} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ position: "relative", zIndex: 2, padding: "18px 24px 0" }}>
        <div style={{
          fontFamily: SANS, fontSize: 12, fontWeight: 400, letterSpacing: "2.4px",
          textTransform: "uppercase", color: "rgba(238,232,218,0.7)", marginBottom: 14,
        }}>
          YOUR DATA
        </div>
        <h1 style={{
          fontFamily: SERIF, fontStyle: "italic", fontWeight: 300,
          fontSize: 72, lineHeight: 0.92, letterSpacing: "-2.5px",
          color: CREAM, margin: 0, marginBottom: 18,
        }}>
          your data.
        </h1>
        <p style={{
          fontFamily: SANS, fontWeight: 400, fontSize: 15, lineHeight: 1.65,
          color: "rgba(238,232,218,0.9)", maxWidth: 300, margin: 0, marginBottom: 28,
        }}>
          How we handle your information, and how you stay in control.
        </p>
      </div>

      {/* Lede */}
      <div style={{ position: "relative", zIndex: 2, padding: "0 24px", marginBottom: 32 }}>
        <p style={{
          fontFamily: SERIF, fontStyle: "italic", fontWeight: 400,
          fontSize: 17, lineHeight: 1.55, color: "rgba(238,232,218,0.85)",
          margin: 0,
        }}>
          We only collect what we need to make Hello Hoedspruit useful, safe and easy to use.
          We do not sell your personal data. You stay in control of your account, saved places
          and communication preferences.
        </p>
      </div>

      {/* What We Collect */}
      <Eyebrow>What We Collect</Eyebrow>
      <div style={cardBase}>
        {collectItems.map((item, i) => (
          <div key={item.title} style={{
            padding: "18px 0",
            borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
          }}>
            <div style={{
              fontFamily: SANS, fontSize: 16, fontWeight: 400,
              lineHeight: 1.2, letterSpacing: "-0.1px", color: INK, marginBottom: 5,
            }}>
              {item.title}
            </div>
            <div style={{
              fontFamily: SERIF, fontStyle: "italic", fontWeight: 400,
              fontSize: 13.5, lineHeight: 1.45, color: MUTED,
            }}>
              {item.desc}
            </div>
          </div>
        ))}
      </div>

      <Bridge>We only collect information that helps run, improve and protect the app experience.</Bridge>

      {/* How We Use Information */}
      <Eyebrow>How We Use Information</Eyebrow>
      <div style={cardBase}>
        {useBullets.map((text, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 14,
            paddingTop: 14, paddingBottom: 14,
            borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: RUST, flexShrink: 0, marginTop: 9, display: "inline-block" }} />
            <span style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.5, color: INK }}>{text}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 24 }} />

      {/* Your Choices & Controls */}
      <Eyebrow>Your Choices & Controls</Eyebrow>
      <div style={cardBase}>
        {actionRows.map((row, i) => (
          <RowLink
            key={row.title}
            to={row.to}
            external={(row as any).external}
            isFirst={i === 0}
            title={row.title}
            desc={row.desc}
          />
        ))}
      </div>

      <Bridge>Choose what you hear from us, and how your information is used where controls are available.</Bridge>

      {/* Data Sharing & Third Parties */}
      <Eyebrow>Data Sharing & Third Parties</Eyebrow>
      <ParagraphCard
        paragraphs={[
          { text: "We may use trusted service providers to support hosting, analytics, security, communication or app functionality." },
          { text: "Listings may link to external websites, Google Maps, Google Business Profiles, WhatsApp, social platforms or booking services." },
          { text: "When you leave Hello Hoedspruit, the privacy and security practices of those third parties apply." },
          { text: "We do not sell personal data.", emphasis: true },
        ]}
      />

      <div style={{ height: 24 }} />

      {/* Security */}
      <Eyebrow>Security</Eyebrow>
      <div style={cardBase}>
        {securityBullets.map((text, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 14,
            paddingTop: 14, paddingBottom: 14,
            borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: RUST, flexShrink: 0, marginTop: 9, display: "inline-block" }} />
            <span style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.5, color: INK }}>{text}</span>
          </div>
        ))}
      </div>

      <Bridge>No digital system can ever be guaranteed 100% secure, but we take privacy and security seriously and follow sensible best practices.</Bridge>

      {/* Community, Listings & User Content */}
      <Eyebrow>Community, Listings & User Content</Eyebrow>
      <ParagraphCard
        paragraphs={[
          { text: "Features like following other users, saving places, marking places as visited, and engaging with events store activity to support those features and personalise your experience." },
          { text: "If you submit listings, event details, profile content, or messages, this content may be reviewed, stored and displayed where relevant within the app." },
          { text: "Please only share information you are comfortable submitting.", emphasis: true },
        ]}
      />

      <div style={{ height: 24 }} />

      {/* Children's Privacy */}
      <Eyebrow>Children's Privacy</Eyebrow>
      <ParagraphCard
        paragraphs={[
          { text: "Hello Hoedspruit is not intended for young children without appropriate supervision." },
        ]}
      />

      <div style={{ height: 32 }} />

      {/* Read More */}
      <Eyebrow>Read More</Eyebrow>
      <div style={cardBase}>
        {bottomLinks.map((row, i) => (
          <RowLink
            key={row.label}
            to={row.to}
            external={row.external}
            isFirst={i === 0}
            title={row.label}
            desc=""
          />
        ))}
      </div>

      <div style={{ height: 28 }} />

      {/* Rust feature CTA */}
      <div style={{ padding: "0 24px", marginBottom: 12 }}>
        <div style={{ position: "relative", background: RUST, borderRadius: 28, padding: "30px 28px 28px", overflow: "hidden" }}>
          <div aria-hidden style={{ position: "absolute", right: -80, bottom: -100, width: 240, height: 260, background: DEEP_RUST, borderRadius: BLOB_1, opacity: 0.6 }} />
          <div aria-hidden style={{ position: "absolute", right: -30, top: -60, width: 160, height: 170, background: "rgba(238,232,218,0.08)", borderRadius: BLOB_2 }} />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{
              fontFamily: SANS, fontSize: 11.5, fontWeight: 400, letterSpacing: "2.4px",
              textTransform: "uppercase", color: "rgba(238,232,218,0.8)", marginBottom: 14,
            }}>
              QUESTIONS ABOUT YOUR DATA
            </div>
            <h2 style={{
              fontFamily: SERIF, fontStyle: "italic", fontWeight: 300,
              fontSize: 38, lineHeight: 1, letterSpacing: "-1px",
              color: CREAM, margin: 0, marginBottom: 14, textTransform: "lowercase",
            }}>
              we're an open book.
            </h2>
            <p style={{
              fontFamily: SANS, fontSize: 14.5, fontWeight: 400, lineHeight: 1.55,
              color: "rgba(238,232,218,0.9)", margin: 0, marginBottom: 24, maxWidth: 280,
            }}>
              If anything's unclear, drop us a line and we'll explain. We read every message.
            </p>
            <a
              href="mailto:admin@hellohoedspruit.co"
              onPointerDown={press}
              onPointerUp={release}
              onPointerLeave={release}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: CREAM, borderRadius: 999, padding: "14px 22px",
                border: "none", cursor: "pointer", textDecoration: "none",
                transition: "transform 150ms ease-out", fontFamily: SANS,
                fontSize: 14, fontWeight: 400, color: INK,
              }}
            >
              Email Us
              <span style={{ fontSize: 14, lineHeight: 1, color: INK }}>↗</span>
            </a>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default PrivacySecurity;
