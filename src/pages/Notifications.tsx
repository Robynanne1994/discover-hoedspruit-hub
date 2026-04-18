import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  isLast?: boolean;
}

const ToggleSwitch = ({
  checked,
  size = "small",
}: {
  checked: boolean;
  size?: "large" | "small";
}) => {
  const w = size === "large" ? 48 : 44;
  const h = size === "large" ? 28 : 26;
  const circle = size === "large" ? 22 : 20;
  const pad = 3;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: h / 2,
        background: checked ? "#121214" : "rgba(18,18,20,0.12)",
        position: "relative",
        transition: "background-color 200ms",
        flexShrink: 0,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: circle,
          height: circle,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: pad,
          left: checked ? w - circle - pad : pad,
          transition: "left 200ms",
        }}
      />
    </div>
  );
};

const ToggleRow = ({ title, description, checked, onChange, disabled, isLast }: ToggleRowProps) => (
  <div
    onClick={disabled ? undefined : onChange}
    style={{
      padding: "16px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom: isLast ? "none" : "1px solid rgba(18,18,20,0.06)",
      cursor: disabled ? "default" : "pointer",
    }}
  >
    <div style={{ flex: 1, paddingRight: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#2b2420", marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 12, color: "rgba(18,18,20,0.35)", lineHeight: 1.4 }}>{description}</div>
    </div>
    <ToggleSwitch checked={checked} />
  </div>
);

interface Section {
  label: string;
  rows: { key: PrefKey; title: string; description: string }[];
}

const SECTIONS: Section[] = [
  {
    label: "EVENTS",
    rows: [
      { key: "events_new", title: "New events nearby", description: "When new events are added in Hoedspruit" },
      { key: "events_reminders", title: "Event reminders", description: "Reminders for events you've saved" },
      { key: "events_updates", title: "Event updates", description: "Changes to events you've saved" },
    ],
  },
  {
    label: "LISTINGS",
    rows: [
      { key: "listings_new", title: "New listings", description: "When new businesses are added" },
      { key: "listings_updates", title: "Listing updates", description: "Changes to places you've saved or visited" },
    ],
  },
  {
    label: "COMMUNITY",
    rows: [
      { key: "community_followers", title: "New followers", description: "When someone follows you" },
      { key: "community_activity", title: "Activity from people you follow", description: "Saves and visits from people you follow" },
    ],
  },
  {
    label: "FROM HELLO HOEDSPRUIT",
    rows: [
      { key: "hh_tips", title: "Tips and recommendations", description: "Curated picks and local suggestions" },
      { key: "hh_app_updates", title: "App updates and news", description: "New features and improvements" },
    ],
  },
];

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>({ ...DEFAULTS });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        setLoaded(true);
        return;
      }

      if (data) {
        const p = { ...DEFAULTS };
        for (const k of Object.keys(DEFAULTS) as PrefKey[]) {
          if (data[k] !== undefined && data[k] !== null) p[k] = data[k] as boolean;
        }
        setPrefs(p);
      } else {
        await supabase.from("notification_preferences").insert({ user_id: user.id, ...DEFAULTS });
      }
      setLoaded(true);
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
    <div style={{ background: "#ebebeb", minHeight: "100vh", paddingBottom: 100 }}>
      {/* Back */}
      <div style={{ paddingTop: 16, paddingLeft: 20, paddingRight: 20, marginBottom: 12 }}>
        <BackButton />
      </div>

      {/* Heading */}
      <div style={{ paddingTop: 28, paddingLeft: 20, paddingRight: 20 }}>
        <h1 style={{ fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif", fontSize: 40, fontWeight: 400, textTransform: "capitalize", lineHeight: 0.95, letterSpacing: "-0.01em", color: "#020202", margin: 0 }}>
          Notifications
        </h1>
        <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontStyle: "italic", fontSize: 14, color: "rgba(18,18,20,0.4)", letterSpacing: 0.2, lineHeight: 1.4, marginTop: 12, marginBottom: 32 }}>
          Choose what you hear from us
        </p>
      </div>

      {/* Master toggle */}
      <div style={{ padding: "0 20px", marginBottom: 28 }}>
        <div
          onClick={() => updatePref("push_enabled")}
          style={{
            background: "rgba(18,18,20,0.03)",
            border: "1px solid rgba(18,18,20,0.06)",
            borderRadius: 16,
            padding: "16px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#2b2420", marginBottom: 4 }}>Push notifications</div>
            <div style={{ fontSize: 12, color: "rgba(18,18,20,0.35)" }}>Master switch for all notifications</div>
          </div>
          <ToggleSwitch checked={masterEnabled} size="large" />
        </div>
      </div>

      {/* Sections */}
      <div style={{ opacity: masterEnabled ? 1 : 0.4, transition: "opacity 200ms", pointerEvents: masterEnabled ? "auto" : "none" }}>
        {SECTIONS.map((section) => (
          <div key={section.label} style={{ padding: "0 20px", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 14 }}>
              {section.label}
            </div>
            <div style={{ background: "rgba(18,18,20,0.03)", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, overflow: "hidden" }}>
              {section.rows.map((row, i) => (
                <ToggleRow
                  key={row.key}
                  title={row.title}
                  description={row.description}
                  checked={prefs[row.key]}
                  onChange={() => updatePref(row.key)}
                  isLast={i === section.rows.length - 1}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div style={{ padding: "0 20px", marginBottom: 100 }}>
        <div style={{ background: "rgba(18,18,20,0.03)", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: 16, boxShadow: "var(--card-shadow)", textAlign: "center" }}>
          <span style={{ fontSize: 13, color: "rgba(18,18,20,0.35)", lineHeight: 1.5 }}>
            Changes are saved automatically. You can update these at any time.
          </span>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
