import { useNavigate } from "react-router-dom";
import {
  Users,
  HelpCircle,
  Store,
  Calendar,
  Tag,
} from "lucide-react";

import PageHeader from "@/components/PageHeader";
import Seo from "@/components/Seo";
import {
  SANS,
  SETTINGS_BG,
  SETTINGS_CARD,
  SETTINGS_INK,
  SettingsSection,
  type SettingsRowItem,
} from "@/components/settings/SettingsList";
import { MUTED } from "@/lib/type";
import hhLogo from "@/assets/hh-logo.png";

// The lists below are the same rows, in the same order, with the same labels
// as the signed-in Settings hub (/my-account). Guests get the identical
// Settings-list treatment — same eyebrows, cards, icon rail and dividers — so
// Support and Submissions don't change shape the moment you sign in.
const submissionsItems: SettingsRowItem[] = [
  { label: "Businesses", href: "https://hellohoedspruit.co/submissions/listing", icon: Store, external: true },
  { label: "Events", href: "https://hellohoedspruit.co/submissions/event", icon: Calendar, external: true },
  { label: "Promotions", href: "https://hellohoedspruit.co/submissions/special", icon: Tag, external: true },
];

const supportItems: SettingsRowItem[] = [
  { label: "Local Channels", href: "/local-channels", icon: Users },
  { label: "Help Centre", href: "/help-centre", icon: HelpCircle },
];

const MyProfileGuest = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: SETTINGS_BG,
        paddingBottom: 100,
        fontFamily: SANS,
      }}
    >
      <Seo
        title="Profile — Hello Hoedspruit"
        description="Save places, events and specials. Follow locals. Never miss what's on."
        path="/my-profile-guest"
        noIndex
      />

      <PageHeader title="Profile" onBack={() => navigate("/")} />

      <div style={{ height: 24 }} />

      {/* Sign-in card — the hero of the guest screen */}
      <div
        style={{
          margin: "0 24px 28px",
          background: SETTINGS_CARD,
          borderRadius: 20,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: "#F5F0E8",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img src={hhLogo} alt="Hello Hoedspruit" style={{ width: 30, height: 30, objectFit: "contain" }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: SANS,
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "#443221",
                marginBottom: 4,
              }}
            >
              Your Lowveld local
            </div>
            <h2
              style={{
                fontFamily: '"Nohemi", ' + SANS,
                fontWeight: 500,
                fontSize: 22,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                color: "#443221",
                margin: 0,
              }}
            >
              Create Your Free Account
            </h2>
          </div>
        </div>

        <p style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.5, color: MUTED, margin: "0 0 20px" }}>
          Save places, events and specials. Follow locals. Never miss what's on.
        </p>
        <button
          onClick={() => navigate("/welcome", { state: { mode: "signup" } })}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 999,
            background: "#423324",
            color: "#FFFFFF",
            border: "none",
            fontFamily: SANS,
            fontSize: 15,
            fontWeight: 400,
            letterSpacing: "0.1px",
            cursor: "pointer",
            marginBottom: 14,
          }}
        >
          Create Account
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontFamily: SANS,
            fontSize: 13.5,
            color: MUTED,
          }}
        >
          <span>Already have an account?</span>
          <button
            onClick={() => navigate("/welcome", { state: { mode: "signin" } })}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontFamily: SANS,
              fontSize: 13.5,
              fontWeight: 700,
              color: "#715a3d",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              cursor: "pointer",
            }}
          >
            Log In
          </button>
        </div>
      </div>


      <SettingsSection label="Submissions" items={submissionsItems} />

      <SettingsSection label="Support" items={supportItems} />
    </div>
  );
};

export default MyProfileGuest;
