import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  Lock,
  User,
  Activity,
  Smartphone,
  Phone,
  ImagePlus,
  MapPin,
  ChevronRight,
  Check,
  Users,
  FileText,
  Mail,
  ArrowLeft,
} from "lucide-react";

const collectItems = [
  { icon: User, title: "Account Information", desc: "Name, email, profile details, and login information you choose to provide." },
  { icon: Activity, title: "Activity in the App", desc: "Saved listings, visited places, event interactions, follows, and profile activity." },
  { icon: Smartphone, title: "Device and Usage Data", desc: "Basic technical information like device type, app activity, and performance data." },
  { icon: Phone, title: "Contact Actions", desc: "If you tap to call, email, visit a website, open WhatsApp, or use maps from a listing." },
  { icon: ImagePlus, title: "Content You Add", desc: "Profile photo, comments, event submissions, listing enquiries, or other optional content you submit." },
  { icon: MapPin, title: "Location Data", desc: "Only if location-based features are enabled on the device or in the app." },
];

const useItems = [
  "To create and manage your account",
  "To save listings, visited places, and event activity",
  "To personalise discovery and improve relevance",
  "To respond to support requests and enquiries",
  "To keep the app secure and prevent misuse",
  "To improve app performance, features, and content quality",
  "To send essential service messages and optional updates based on your preferences",
];

const controlItems = [
  { title: "Update Profile Information", desc: "Edit your name, photo, bio, and contact details at any time." },
  { title: "Manage Notification Preferences", desc: "Choose what you hear from us and how often." },
  { title: "Control Location Access", desc: "Manage location permissions through your device settings." },
  { title: "Download or Request Your Data", desc: "Get in touch to request a copy of the data we hold." },
  { title: "Request Account Deletion", desc: "You can request to have your account and data removed." },
];

const securityChecks = [
  "Secure data transmission",
  "Protected servers and platform security measures",
  "Access controls for account-related information",
  "Monitoring and updates to help keep the app safe",
  "Reasonable steps to protect information from misuse, loss, or unauthorised access",
];

const dataSharingTexts = [
  "We may use trusted service providers to support hosting, analytics, security, communication, or app functionality.",
  "Listings may link to external websites, Google Maps, Google Business Profiles, WhatsApp, social platforms, or booking services.",
  "When you leave Hello Hoedspruit, the privacy and security practices of those third parties apply.",
  "We do not sell personal data.",
];

const communityTexts = [
  "Features like following other users, saving places, marking places as visited, and engaging with events store activity to support those features and personalise your experience.",
  "If you submit listings, event details, profile content, or messages, this content may be reviewed, stored, and displayed where relevant within the app.",
  "Please only share information you are comfortable submitting.",
];

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid rgba(18,18,20,0.06)",
  borderRadius: 16,
  overflow: "hidden",
};

const SECTION_PX = 20;

const rowBorder: React.CSSProperties = {
  borderBottom: "1px solid rgba(18,18,20,0.06)",
};

const PrivacySecurity = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "#ebebeb" }}>
      {/* Back button */}
      <div style={{ paddingTop: 16, paddingLeft: 20, paddingRight: 20, marginBottom: 12 }}>
        <BackButton />
      </div>

      {/* Heading */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 12 }}>
        <h1 style={{ fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif", fontWeight: 400, fontSize: 40, lineHeight: 0.95, letterSpacing: "-0.01em", color: "#020202", textTransform: "capitalize", margin: 0 }}>
          Privacy & Security
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 32 }}>
        <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontStyle: "italic", fontSize: 14, color: "rgba(18,18,20,0.4)", letterSpacing: "0.2px", lineHeight: 1.4 }}>
          How we handle your information
        </p>
      </div>

      {/* Intro card */}
      <div style={{ paddingLeft: SECTION_PX, paddingRight: SECTION_PX, marginBottom: 8 }}>
        <div style={{ ...cardStyle, padding: 16, boxShadow: "var(--card-shadow)" }}>
          <div className="flex items-start" style={{ gap: 12 }}>
            <Shield style={{ width: 22, height: 22, strokeWidth: 1.5, color: "#2b2420", flexShrink: 0, marginTop: 2 }} />
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#2b2420", marginBottom: 8 }}>Your Privacy Matters</h2>
              <p style={{ fontSize: 14, color: "rgba(18,18,20,0.5)", lineHeight: 1.6 }}>
                We only collect what we need to make Hello Hoedspruit useful, safe, and easy to use. We do not sell your personal data.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div style={{ paddingLeft: SECTION_PX, paddingRight: SECTION_PX, marginBottom: 32 }}>
        <p style={{ fontSize: 13, color: "rgba(18,18,20,0.35)", lineHeight: 1.5 }}>
          You stay in control of your account, saved places, and communication preferences.
        </p>
      </div>

      {/* What We Collect */}
      <Section title="What We Collect">
        <div style={cardStyle}>
          {collectItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start" style={{ padding: 16, gap: 12, ...(i < collectItems.length - 1 ? rowBorder : {}) }}>
                <Icon style={{ width: 20, height: 20, strokeWidth: 1.5, color: "#2b2420", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#2b2420", marginBottom: 3 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: "rgba(18,18,20,0.4)", lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 13, color: "rgba(18,18,20,0.35)", lineHeight: 1.5, marginTop: 8 }}>
          We only collect information that helps run, improve, and protect the app experience.
        </p>
      </Section>

      {/* How We Use Information */}
      <Section title="How We Use Information">
        <div style={cardStyle}>
          {useItems.map((item, i) => (
            <div key={i} className="flex items-start" style={{ padding: "12px 16px", gap: 10, ...(i < useItems.length - 1 ? rowBorder : {}) }}>
              <Check style={{ width: 16, height: 16, color: "#2b2420", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 14, color: "rgba(18,18,20,0.5)", lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Your Choices & Controls */}
      <Section title="Your Choices & Controls">
        <div style={cardStyle}>
          {controlItems.map((item, i) => (
            <div key={item.title} className="flex items-start" style={{ padding: 16, gap: 12, ...(i < controlItems.length - 1 ? rowBorder : {}) }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#2b2420", marginBottom: 3 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "rgba(18,18,20,0.4)", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: "rgba(18,18,20,0.35)", lineHeight: 1.5, marginTop: 8 }}>
          Choose what you hear from us and how your information is used where controls are available.
        </p>
      </Section>

      {/* Data Sharing & Third Parties */}
      <Section title="Data Sharing & Third Parties">
        <div style={{ ...cardStyle, padding: 16, boxShadow: "var(--card-shadow)" }}>
          {dataSharingTexts.map((text, i) => (
            <p key={i} style={{ fontSize: 14, color: "rgba(18,18,20,0.5)", lineHeight: 1.7, marginBottom: i < dataSharingTexts.length - 1 ? 14 : 0 }}>{text}</p>
          ))}
        </div>
      </Section>

      {/* Security */}
      <Section title="Security">
        <div style={cardStyle}>
          {securityChecks.map((item, i) => (
            <div key={i} className="flex items-start" style={{ padding: "12px 16px", gap: 10, ...(i < securityChecks.length - 1 ? rowBorder : {}) }}>
              <Check style={{ width: 16, height: 16, color: "#2b2420", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 14, color: "rgba(18,18,20,0.5)", lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: "rgba(18,18,20,0.35)", lineHeight: 1.5, marginTop: 8 }}>
          No digital system can ever be guaranteed 100% secure, but we take privacy and security seriously and follow sensible best practices.
        </p>
      </Section>

      {/* Community, Listings & User Content */}
      <Section title="Community, Listings & User Content">
        <div style={{ ...cardStyle, padding: 16, boxShadow: "var(--card-shadow)" }}>
          {communityTexts.map((text, i) => (
            <p key={i} style={{ fontSize: 14, color: "rgba(18,18,20,0.5)", lineHeight: 1.7, marginBottom: i < communityTexts.length - 1 ? 14 : 0 }}>{text}</p>
          ))}
        </div>
      </Section>

      {/* Children's Privacy */}
      <Section title="Children's Privacy">
        <div style={{ ...cardStyle, padding: 16, boxShadow: "var(--card-shadow)" }}>
          <p style={{ fontSize: 14, color: "rgba(18,18,20,0.5)", lineHeight: 1.7 }}>
            Hello Hoedspruit is not intended for young children without appropriate supervision.
          </p>
        </div>
      </Section>

      {/* Policy Links */}
      <div style={{ paddingLeft: SECTION_PX, paddingRight: SECTION_PX, marginBottom: 100 }}>
        <div style={cardStyle}>
          {[
            { icon: FileText, label: "Read Full Privacy Policy", href: "/terms/privacy" },
            { icon: FileText, label: "View Terms & Policies", href: "/terms" },
            { icon: Mail, label: "Contact Us About Privacy", href: "/contact" },
          ].map((item, i, arr) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.href}
                className="flex items-center"
                style={{ padding: 16, gap: 12, ...(i < arr.length - 1 ? rowBorder : {}) }}
              >
                <Icon style={{ width: 20, height: 20, strokeWidth: 1.5, color: "#2b2420", flexShrink: 0 }} />
                <span style={{ fontSize: 15, fontWeight: 600, color: "#2b2420", flex: 1 }}>{item.label}</span>
                <ChevronRight style={{ width: 16, height: 16, strokeWidth: 2, color: "rgba(18,18,20,0.2)", flexShrink: 0 }} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ paddingLeft: SECTION_PX, paddingRight: SECTION_PX, marginBottom: 28 }}>
    <h3 style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 14 }}>
      {title}
    </h3>
    {children}
  </div>
);

export default PrivacySecurity;
