import BackButton from "@/components/BackButton";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type PrefKey =
  | "push_enabled"
  | "events_new"
  | "events_reminders"
  | "events_updates"
  | "listings_new"
  | "listings_updates"
  | "community_followers"
  | "community_activity"
  | "hh_tips"
  | "hh_app_updates";

const DEFAULTS: Record<PrefKey, boolean> = {
  push_enabled: true,
  events_new: true,
  events_reminders: true,
  events_updates: false,
  listings_new: false,
  listings_updates: true,
  community_followers: true,
  community_activity: false,
  hh_tips: true,
  hh_app_updates: false,
};

const FONT_STACK = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
const ITALIC_STACK = "'Playfair Display', Georgia, serif";

const baseTextStyle: React.CSSProperties = {
  fontStretch: "normal",
  fontSynthesis: "none",
  transform: "none",
};

interface ToggleSwitchProps {
  checked: boolean;
  variant?: "default" | "coral";
}

const ToggleSwitch = ({ checked, variant = "default" }: ToggleSwitchProps) => {
  const w = 46;
  const h = 28;
  const thumb = 22;
  const pad = 3;
  const onColor = variant === "coral" ? "#F26A48" : "#0A0A0A";
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 999,
        background: checked ? onColor : "#D9D4CE",
        position: "relative",
        transition: "background-color 0.2s ease",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: thumb,
          height: thumb,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: pad,
          left: checked ? w - thumb - pad : pad,
          transition: "left 0.2s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
        }}
      />
    </div>
  );
};

interface RowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  showDivider: boolean;
}

const Row = ({ title, description, checked, onChange, showDivider }: RowProps) => (
  <>
    <div
      onClick={onChange}
      style={{
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
      }}
    >
      <div style={{ flex: 1, paddingRight: 24 }}>
        <div
          style={{
            ...baseTextStyle,
            fontFamily: FONT_STACK,
            fontSize: 16,
            fontWeight: 500,
            color: "#0A0A0A",
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        <div
          style={{
            ...baseTextStyle,
            fontFamily: FONT_STACK,
            fontSize: 13,
            color: "#8A8480",
            lineHeight: 1.4,
          }}
        >
          {description}
        </div>
      </div>
      <ToggleSwitch checked={checked} />
    </div>
    {showDivider && (
      <div style={{ height: 1, background: "#F2EFEC", marginLeft: 20, marginRight: 20 }} />
    )}
  </>
);

interface Section {
  label: string;
  rows: { key: PrefKey; title: string; description: string }[];
}

const SECTIONS: Section[] = [
  {
    label: "Events",
    rows: [
      { key: "events_new", title: "New events nearby", description: "Fresh gigs, markets and things to do in town." },
      { key: "events_reminders", title: "Event reminders", description: "A nudge the day before events you've saved." },
      { key: "events_updates", title: "Event updates", description: "Changes to time, venue or line-up." },
    ],
  },
  {
    label: "Listings",
    rows: [
      { key: "listings_new", title: "New listings", description: "When new places join the app." },
      { key: "listings_updates", title: "Listing updates", description: "Menu changes, new hours and specials from places you follow." },
    ],
  },
  {
    label: "Community",
    rows: [
      { key: "community_followers", title: "New followers", description: "Let us know when someone follows you." },
      { key: "community_activity", title: "Activity from people you follow", description: "Saves, reviews and recommendations from your circle." },
    ],
  },
  {
    label: "From Hello Hoedspruit",
    rows: [
      { key: "hh_tips", title: "Tips and recommendations", description: "Handpicked ideas for your week, from us to you." },
      { key: "hh_app_updates", title: "App updates and news", description: "New features, small improvements and the occasional story." },
    ],
  },
];

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      ...baseTextStyle,
      fontFamily: FONT_STACK,
      fontSize: 11,
      fontWeight: 500,
      color: "#8A8480",
      textTransform: "uppercase",
      letterSpacing: "0.18em",
      padding: "0 24px",
      marginBottom: 12,
    }}
  >
    {children}
  </div>
);

const Notifications = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>({ ...DEFAULTS });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) return;

      if (data) {
        const p = { ...DEFAULTS };
        for (const k of Object.keys(DEFAULTS) as PrefKey[]) {
          if (data[k] !== undefined && data[k] !== null) p[k] = data[k] as boolean;
        }
        setPrefs(p);
      } else {
        await supabase.from("notification_preferences").insert({ user_id: user.id, ...DEFAULTS });
      }
    };
    load();
  }, [user]);

  const updatePref = useCallback(
    async (key: PrefKey) => {
      if (!user) return;
      const newVal = !prefs[key];
      const prev = { ...prefs };
      setPrefs((p) => ({ ...p, [key]: newVal }));

      const { error } = await supabase
        .from("notification_preferences")
        .update({ [key]: newVal } as any)
        .eq("user_id", user.id);

      if (error) {
        setPrefs(prev);
        toast.error("Could not save preference, please try again");
      }
    },
    [user, prefs],
  );

  const masterEnabled = prefs.push_enabled;

  return (
    <div style={{ background: "transparent", minHeight: "100vh", paddingBottom: 120 }}>
      {/* Top row */}
      <div
        style={{
          paddingTop: 16,
          paddingLeft: 24,
          paddingRight: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <BackButton />
        <span
          style={{
            ...baseTextStyle,
            fontFamily: ITALIC_STACK,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 16,
            color: "#8A8480",
          }}
        >
          Settings
        </span>
      </div>

      {/* Hero */}
      <div style={{ padding: "0 24px", marginBottom: 28 }}>
        <div
          style={{
            ...baseTextStyle,
            fontFamily: FONT_STACK,
            fontSize: 11,
            fontWeight: 500,
            color: "#8A8480",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            marginBottom: 14,
          }}
        >
          Your inbox
        </div>
        <h1
          style={{
            ...baseTextStyle,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 700,
            fontSize: 54,
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            color: "#0A0A0A",
            margin: 0,
          }}
        >
          Notifications
        </h1>
        <p
          style={{
            ...baseTextStyle,
            fontFamily: ITALIC_STACK,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 18,
            lineHeight: 1.4,
            color: "#8A8480",
            marginTop: 16,
            marginBottom: 0,
          }}
        >
          Choose what you'd like to hear from us, and when.
        </p>
      </div>

      {/* Master push card */}
      <div style={{ padding: "0 24px", marginBottom: 36 }}>
        <div
          onClick={() => updatePref("push_enabled")}
          style={{
            background: "#0A0A0A",
            borderRadius: 22,
            padding: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
          }}
        >
          <div style={{ flex: 1, paddingRight: 24 }}>
            <div
              style={{
                ...baseTextStyle,
                fontFamily: FONT_STACK,
                fontSize: 18,
                fontWeight: 500,
                color: "#FFFFFF",
                marginBottom: 4,
              }}
            >
              Push notifications
            </div>
            <div
              style={{
                ...baseTextStyle,
                fontFamily: FONT_STACK,
                fontSize: 13,
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.4,
              }}
            >
              Turn all alerts on or off in one tap.
            </div>
          </div>
          <ToggleSwitch checked={masterEnabled} variant="coral" />
        </div>
      </div>

      {/* Sections */}
      <div
        style={{
          opacity: masterEnabled ? 1 : 0.4,
          transition: "opacity 0.2s ease",
          pointerEvents: masterEnabled ? "auto" : "none",
        }}
      >
        {SECTIONS.map((section) => (
          <div key={section.label} style={{ marginBottom: 32 }}>
            <SectionLabel>{section.label}</SectionLabel>
            <div style={{ padding: "0 24px" }}>
              <div style={{ background: "#FFFFFF", borderRadius: 20, overflow: "hidden" }}>
                {section.rows.map((row, i) => (
                  <Row
                    key={row.key}
                    title={row.title}
                    description={row.description}
                    checked={prefs[row.key]}
                    onChange={() => updatePref(row.key)}
                    showDivider={i < section.rows.length - 1}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div style={{ padding: "0 24px" }}>
        <div
          style={{
            background: "#F2EFEC",
            borderRadius: 18,
            padding: "18px 20px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#F26A48",
              marginTop: 9,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              ...baseTextStyle,
              fontFamily: ITALIC_STACK,
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 14,
              color: "#8A8480",
              lineHeight: 1.5,
            }}
          >
            Changes are saved automatically. You can come back and update these at any time.
          </span>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
