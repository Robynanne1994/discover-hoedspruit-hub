import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  User,
  Activity,
  Smartphone,
  Phone,
  ImagePlus,
  MapPin,
  FileText,
  Mail,
  ArrowLeft,
} from "lucide-react";

const OLIVE = "#5C6446";
const CREAM = "#EEE8DA";
const SOFT_CREAM = "#F4EFE3";
const INK = "#2A2A24";
const MUTED = "#6B6A5E";
const LINE = "#D9D2C0";
const RUST = "#9B5A3C";

const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const collectItems = [
  { icon: User, title: "Account Information", desc: "Name, email, profile details, and login information you choose to provide." },
  { icon: Activity, title: "Activity in the App", desc: "Saved listings, visited places, event interactions, follows, and profile activity." },
  { icon: Smartphone, title: "Device & Usage Data", desc: "Basic technical information like device type, app activity, and performance data." },
  { icon: Phone, title: "Contact Actions", desc: "If you tap to call, email, visit a website, open WhatsApp, or use maps from a listing." },
  { icon: ImagePlus, title: "Content You Add", desc: "Profile photo, comments, event submissions, listing enquiries, or other optional content you submit." },
  { icon: MapPin, title: "Location Data", desc: "Only if location-based features are enabled on the device or in the app." },
];

const useBullets = [
  "To create and manage your account.",
  "To save listings, visited places, and event activity.",
  "To personalise discovery and improve relevance.",
  "To respond to support requests and enquiries.",
  "To keep the app secure and prevent misuse.",
  "To improve app performance, features, and content quality.",
  "To send essential service messages and optional updates based on your preferences.",
];

const securityBullets = [
  "Secure data transmission.",
  "Protected servers and platform security measures.",
  "Access controls for account-related information.",
  "Monitoring and updates to help keep the app safe.",
  "Reasonable steps to protect information from misuse, loss, or unauthorised access.",
];

const actionRows = [
  { title: "Update Profile Information", desc: "Edit your name, photo, bio, and contact details at any time.", to: "/account/info" },
  { title: "Manage Notification Preferences", desc: "Choose what you hear from us and how often.", to: "/notifications" },
  { title: "Control Location Access", desc: "Manage location permissions through your device settings.", to: "/account/settings" },
  { title: "Download Or Request Your Data", desc: "Get in touch to request a copy of the data we hold.", to: "/contact" },
  { title: "Request Account Deletion", desc: "You can request to have your account and data removed.", to: "/account/settings" },
];

const Eyebrow = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 400, letterSpacing: 2.4, textTransform: "uppercase", color: "rgba(238,232,218,0.7)", padding: "0 24px", marginBottom: 10, ...style }}>
    {children}
  </div>
);

const Bridge = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 14.5, lineHeight: 1.55, color: "rgba(238,232,218,0.7)", padding: "0 28px", margin: "8px 0 24px" }}>
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
  <div style={{ width: 30, height: 30, borderRadius: 15, background: "rgba(106,106,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: INK, fontSize: 12, lineHeight: 1, fontFamily: SANS }}>
    ↗
  </div>
);

const ParagraphCard = ({ paragraphs }: { paragraphs: { text: string; emphasis?: boolean }[] }) => (
  <div style={{ background: CREAM, borderRadius: 20, margin: "0 24px", padding: "20px 22px 22px" }}>
    {paragraphs.map((p, i) => (
      <p
        key={i}
        style={{
          fontFamily: SANS,
          fontSize: 14.5,
          lineHeight: 1.6,
          color: INK,
          opacity: p.emphasis ? 1 : 0.85,
          fontWeight: 400,
          margin: 0,
          marginBottom: i < paragraphs.length - 1 ? 14 : 0,
        }}
      >
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
    <div style={{ minHeight: "100vh", background: OLIVE, paddingBottom: 40 }}>
      {/* Top bar */}
      <div style={{ paddingTop: 32, paddingLeft: 24, paddingRight: 24 }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{ width: 44, height: 44, borderRadius: 22, background: CREAM, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft size={18} strokeWidth={1.6} color={INK} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ padding: "18px 24px 0" }}>
        <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 400, letterSpacing: 2.4, textTransform: "uppercase", color: "rgba(238,232,218,0.7)", marginBottom: 14 }}>
          Privacy & Security
        </div>
        <h1 style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 72, lineHeight: 0.92, letterSpacing: "-2.5px", color: CREAM, margin: 0, marginBottom: 14, textTransform: "none" }}>
          your data.
        </h1>
        <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontWeight: 400, fontSize: 15, lineHeight: 1.65, color: "rgba(238,232,218,0.9)", maxWidth: 300, margin: 0, marginBottom: 28 }}>
          How we handle your information, and how you stay in control.
        </p>
      </div>

      {/* Featured card */}
      <div style={{ margin: "0 24px 22px", background: SOFT_CREAM, borderRadius: 24, padding: "24px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: RUST, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Shield size={18} strokeWidth={1.6} color={CREAM} fill="none" />
          </div>
          <h2 style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 24, lineHeight: 1, letterSpacing: "-0.4px", color: INK, margin: 0 }}>
            your privacy matters.
          </h2>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.55, color: INK, opacity: 0.8, margin: 0, marginBottom: 10 }}>
          We only collect what we need to make Hello Hoedspruit useful, safe, and easy to use.{" "}
          <span style={{ fontFamily: SERIF, fontStyle: "italic" }}>We do not sell your personal data.</span>
        </p>
        <p style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.55, color: INK, opacity: 0.8, margin: 0 }}>
          You stay in control of your account, saved places, and communication preferences.
        </p>
      </div>

      {/* What We Collect */}
      <Eyebrow>What We Collect</Eyebrow>
      <div style={cardBase}>
        {collectItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                paddingTop: 16,
                paddingBottom: 18,
                borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
              }}
            >
              <Icon size={20} strokeWidth={1.6} color={INK} fill="none" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 400, lineHeight: 1.2, letterSpacing: "-0.1px", color: INK, marginBottom: 5 }}>
                  {item.title}
                </div>
                <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 13.5, lineHeight: 1.45, color: MUTED }}>
                  {item.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Bridge>We only collect information that helps run, improve, and protect the app experience.</Bridge>

      {/* How We Use Information */}
      <Eyebrow>How We Use Information</Eyebrow>
      <div style={cardBase}>
        {useBullets.map((text, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              paddingTop: 14,
              paddingBottom: 14,
              borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
            }}
          >
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
          <Link
            key={row.title}
            to={row.to}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              paddingTop: 18,
              paddingBottom: 20,
              borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 400, lineHeight: 1.2, color: INK, marginBottom: 5 }}>
                {row.title}
              </div>
              <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 13.5, lineHeight: 1.4, color: MUTED }}>
                {row.desc}
              </div>
            </div>
            <ArrowCircle />
          </Link>
        ))}
      </div>

      <Bridge>Choose what you hear from us, and how your information is used where controls are available.</Bridge>

      {/* Data Sharing & Third Parties */}
      <Eyebrow>Data Sharing & Third Parties</Eyebrow>
      <ParagraphCard
        paragraphs={[
          { text: "We may use trusted service providers to support hosting, analytics, security, communication, or app functionality." },
          { text: "Listings may link to external websites, Google Maps, Google Business Profiles, WhatsApp, social platforms, or booking services." },
          { text: "When you leave Hello Hoedspruit, the privacy and security practices of those third parties apply." },
          { text: "We do not sell personal data.", emphasis: true },
        ]}
      />

      <div style={{ height: 24 }} />

      {/* Security */}
      <Eyebrow>Security</Eyebrow>
      <div style={cardBase}>
        {securityBullets.map((text, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              paddingTop: 14,
              paddingBottom: 14,
              borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
            }}
          >
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
          { text: "If you submit listings, event details, profile content, or messages, this content may be reviewed, stored, and displayed where relevant within the app." },
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

      <div style={{ height: 24 }} />

      {/* Bottom links */}
      <div style={{ ...cardBase, marginBottom: 12 }}>
        {[
          { icon: FileText, label: "Read Full Privacy Policy", to: "/privacy-policy" },
          { icon: FileText, label: "View Terms & Policies", to: "/terms" },
          { icon: Mail, label: "Contact Us About Privacy", to: "/contact", external: false },
        ].map((row, i, arr) => {
          const Icon = row.icon;
          return (
            <Link
              key={row.label}
              to={row.to}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                paddingTop: 18,
                paddingBottom: 18,
                borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Icon size={18} strokeWidth={1.5} color={MUTED} fill="none" style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontFamily: SANS, fontSize: 16, color: INK }}>{row.label}</span>
              <ArrowCircle />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default PrivacySecurity;
