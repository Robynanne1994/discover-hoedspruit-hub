import { Link } from "react-router-dom";
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
} from "lucide-react";
import BackButton from "@/components/BackButton";

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

const PrivacySecurity = () => {
  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Top bar */}
      <div className="pt-14 pb-1 px-5 relative">
        <div className="absolute left-5 top-14">
          <BackButton className="text-primary mb-0" />
        </div>
        <h1 className="text-center text-[13px] font-medium text-muted-foreground uppercase tracking-[0.08em]">
          Privacy & Security
        </h1>
      </div>

      {/* Intro card */}
      <div className="px-5 pt-6 mb-5">
        <div className="bg-card border border-border/40 rounded-2xl px-5 py-5">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[16px] font-semibold text-foreground tracking-tight font-sans leading-tight">
                Your Privacy Matters
              </h2>
              <p className="text-[12.5px] text-muted-foreground mt-1.5 leading-relaxed">
                We only collect what we need to make Hello Hoedspruit useful, safe, and easy to use. We do not sell your personal data.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/70 mt-3.5 pt-3 border-t border-border/20 leading-relaxed">
            You stay in control of your account, saved places, and communication preferences.
          </p>
        </div>
      </div>

      {/* What We Collect */}
      <Section title="What We Collect">
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
          {collectItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`flex items-start gap-3.5 px-4 py-3.5 ${i < collectItems.length - 1 ? "border-b border-border/20" : ""}`}
              >
                <Icon className="h-4 w-4 text-primary/70 shrink-0 mt-0.5" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-medium text-foreground block leading-tight">{item.title}</span>
                  <span className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground/60 mt-2.5 px-1 leading-relaxed">
          We only collect information that helps run, improve, and protect the app experience.
        </p>
      </Section>

      {/* How We Use Information */}
      <Section title="How We Use Information">
        <div className="bg-card border border-border/40 rounded-xl px-4 py-3.5">
          <ul className="space-y-2.5">
            {useItems.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Check className="h-3.5 w-3.5 text-primary/60 shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-[12px] text-muted-foreground leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Your Choices and Controls */}
      <Section title="Your Choices & Controls">
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
          {controlItems.map((item, i) => (
            <div
              key={item.title}
              className={`flex items-center gap-3.5 px-4 py-3.5 ${i < controlItems.length - 1 ? "border-b border-border/20" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-medium text-foreground block leading-tight">{item.title}</span>
                <span className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/60 mt-2.5 px-1 leading-relaxed">
          Choose what you hear from us and how your information is used where controls are available.
        </p>
      </Section>

      {/* Data Sharing */}
      <Section title="Data Sharing & Third Parties">
        <div className="bg-card border border-border/40 rounded-xl px-4 py-4 space-y-3">
          {[
            "We may use trusted service providers to support hosting, analytics, security, communication, or app functionality.",
            "Listings may link to external websites, Google Maps, Google Business Profiles, WhatsApp, social platforms, or booking services.",
            "When you leave Hello Hoedspruit, the privacy and security practices of those third parties apply.",
            "We do not sell personal data.",
          ].map((text, i) => (
            <p key={i} className="text-[12px] text-muted-foreground leading-relaxed">
              {text}
            </p>
          ))}
        </div>
      </Section>

      {/* Security */}
      <Section title="Security">
        <div className="bg-card border border-border/40 rounded-xl px-4 py-4">
          <div className="flex items-center gap-2.5 mb-3">
            <Shield className="h-4 w-4 text-primary/70" strokeWidth={1.5} />
            <span className="text-[13px] font-medium text-foreground">How we protect your data</span>
          </div>
          <ul className="space-y-2.5">
            {securityChecks.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Check className="h-3.5 w-3.5 text-primary/60 shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-[12px] text-muted-foreground leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[11px] text-muted-foreground/60 mt-2.5 px-1 leading-relaxed">
          No digital system can ever be guaranteed 100% secure, but we take privacy and security seriously and follow sensible best practices.
        </p>
      </Section>

      {/* Community & User Content */}
      <Section title="Community, Listings & User Content">
        <div className="bg-card border border-border/40 rounded-xl px-4 py-4 space-y-3">
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Features like following other users, saving places, marking places as visited, and engaging with events store activity to support those features and personalise your experience.
          </p>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            If you submit listings, event details, profile content, or messages, this content may be reviewed, stored, and displayed where relevant within the app.
          </p>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Please only share information you are comfortable submitting.
          </p>
        </div>
      </Section>

      {/* Children's Privacy */}
      <Section title="Children's Privacy">
        <div className="bg-card border border-border/40 rounded-xl px-4 py-3.5">
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Hello Hoedspruit is not intended for young children without appropriate supervision.
          </p>
        </div>
      </Section>

      {/* Policy Links */}
      <div className="px-5 mb-6">
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
          {[
            { icon: FileText, label: "Read Full Privacy Policy", href: "/terms/privacy" },
            { icon: FileText, label: "View Terms & Policies", href: "/terms" },
            { icon: Mail, label: "Contact Us About Privacy", href: "/contact" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/20 transition-colors ${i < 2 ? "border-b border-border/20" : ""}`}
              >
                <Icon className="h-4 w-4 text-primary/70 shrink-0" strokeWidth={1.5} />
                <span className="text-[13px] font-medium text-foreground flex-1">{item.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="px-5 mb-5">
    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-2.5 px-1">
      {title}
    </h3>
    {children}
  </div>
);

export default PrivacySecurity;
