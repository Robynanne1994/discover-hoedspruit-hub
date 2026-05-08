import BackButton from "@/components/BackButton";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  FILTER_TYPE_META,
  NotificationFilterType,
  totalCategoryCount,
} from "@/lib/notificationCategories";

type BoolKey =
  | "push_enabled"
  | "events_new"
  | "events_reminders"
  | "events_updates"
  | "listings_new"
  | "listings_updates"
  | "specials_new"
  | "specials_ending"
  | "community_followers"
  | "community_activity"
  | "hh_tips"
  | "hh_app_updates";

type CatKey =
  | "events_new_categories"
  | "listings_new_categories"
  | "listings_updates_categories"
  | "specials_new_categories";

const DEFAULT_BOOLS: Record<BoolKey, boolean> = {
  push_enabled: true,
  events_new: true,
  events_reminders: true,
  events_updates: false,
  listings_new: false,
  listings_updates: true,
  specials_new: true,
  specials_ending: true,
  community_followers: true,
  community_activity: false,
  hh_tips: true,
  hh_app_updates: false,
};

const FONT_STACK = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const ITALIC_STACK = "'Playfair Display', Georgia, serif";

const COLORS = {
  olive: "#5C6446",
  cream: "#EEE8DA",
  softCream: "#F4EFE3",
  ink: "#2A2A24",
  muted: "#6B6A5E",
  line: "#D9D2C0",
  rust: "#9B5A3C",
};

const baseText: React.CSSProperties = {
  fontStretch: "normal",
  fontSynthesis: "none",
  transform: "none",
};

const Toggle = ({
  checked,
  variant = "ink",
  disabled,
}: {
  checked: boolean;
  variant?: "ink" | "rust";
  disabled?: boolean;
}) => {
  const onColor = variant === "rust" ? COLORS.rust : COLORS.ink;
  return (
    <div
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        background: checked ? onColor : COLORS.line,
        position: "relative",
        transition: "background-color 200ms ease-out",
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
        marginTop: 2,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          transition: "left 200ms ease-out",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
};

const Eyebrow = ({ children, opacity = 0.7 }: { children: React.ReactNode; opacity?: number }) => (
  <div
    style={{
      ...baseText,
      fontFamily: FONT_STACK,
      fontSize: 11,
      fontWeight: 400,
      color: COLORS.cream,
      opacity,
      textTransform: "uppercase",
      letterSpacing: "0.218em",
      padding: "0 24px",
      marginBottom: 10,
    }}
  >
    {children}
  </div>
);

interface RowProps {
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  isFirst: boolean;
  filterLink?: { to: string; selected: number; total: number };
}

const PrefRow = ({ title, description, checked, onToggle, disabled, isFirst, filterLink }: RowProps) => {
  const allSelected = filterLink && filterLink.selected === filterLink.total;
  const noneSelected = filterLink && filterLink.selected === 0 && checked;
  const linkText = filterLink
    ? allSelected
      ? `All ${filterLink.total} categories ›`
      : `${filterLink.selected} of ${filterLink.total} categories ›`
    : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        padding: "18px 0",
        borderTop: isFirst ? "none" : `1px solid ${COLORS.line}`,
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <div style={{ flex: 1, paddingRight: 8 }}>
        <div
          style={{
            ...baseText,
            fontFamily: FONT_STACK,
            fontSize: 16,
            fontWeight: 400,
            color: COLORS.ink,
            lineHeight: 1.2,
            marginBottom: 5,
          }}
        >
          {title}
        </div>
        <div
          style={{
            ...baseText,
            fontFamily: ITALIC_STACK,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 13.5,
            color: COLORS.muted,
            lineHeight: 1.4,
          }}
        >
          {description}
        </div>
        {filterLink && (
          <Link
            to={filterLink.to}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 10,
              fontFamily: FONT_STACK,
              fontSize: 12,
              fontWeight: 400,
              color: COLORS.rust,
              opacity: noneSelected ? 1 : 0.85,
              textDecoration: "none",
            }}
          >
            {linkText}
          </Link>
        )}
      </div>
      <button
        onClick={onToggle}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        aria-label={`Toggle ${title}`}
      >
        <Toggle checked={checked} />
      </button>
    </div>
  );
};

interface RowDef {
  key: BoolKey;
  title: string;
  description: string;
  filterCol?: CatKey;
  filterType?: NotificationFilterType;
}

interface SectionDef {
  label: string;
  rows: RowDef[];
}

const SECTIONS: SectionDef[] = [
  {
    label: "Events",
    rows: [
      { key: "events_new", title: "New Events", description: "Fresh gigs, markets, and things to do in town.", filterCol: "events_new_categories", filterType: "events_new" },
      { key: "events_reminders", title: "Event Reminders", description: "A nudge the day before events you've saved." },
      { key: "events_updates", title: "Event Updates", description: "Changes to time, venue, or line-up." },
    ],
  },
  {
    label: "Listings",
    rows: [
      { key: "listings_new", title: "New Listings", description: "When new places join the app.", filterCol: "listings_new_categories", filterType: "listings_new" },
      { key: "listings_updates", title: "Listing Updates", description: "Menu changes, new hours, and specials from places you follow.", filterCol: "listings_updates_categories", filterType: "listings_updates" },
    ],
  },
  {
    label: "Specials",
    rows: [
      { key: "specials_new", title: "New Specials", description: "Fresh deals from local businesses.", filterCol: "specials_new_categories", filterType: "specials_new" },
      { key: "specials_ending", title: "Specials Ending Soon", description: "A heads-up before saved specials expire." },
    ],
  },
  {
    label: "Community",
    rows: [
      { key: "community_followers", title: "New Followers", description: "Let us know when someone follows you." },
      { key: "community_activity", title: "Activity From People You Follow", description: "Saves, reviews, and recommendations from your circle." },
    ],
  },
  {
    label: "From Hello Hoedspruit",
    rows: [
      { key: "hh_app_updates", title: "App Updates & News", description: "New features, small improvements, and the occasional story." },
    ],
  },
];

const Notifications = () => {
  const { user } = useAuth();
  const [bools, setBools] = useState<Record<BoolKey, boolean>>({ ...DEFAULT_BOOLS });
  const [cats, setCats] = useState<Record<CatKey, string[] | null>>({
    events_new_categories: null,
    listings_new_categories: null,
    listings_updates_categories: null,
    specials_new_categories: null,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        const b = { ...DEFAULT_BOOLS };
        for (const k of Object.keys(DEFAULT_BOOLS) as BoolKey[]) {
          if ((data as any)[k] !== undefined && (data as any)[k] !== null) b[k] = (data as any)[k];
        }
        setBools(b);
        setCats({
          events_new_categories: (data as any).events_new_categories ?? null,
          listings_new_categories: (data as any).listings_new_categories ?? null,
          listings_updates_categories: (data as any).listings_updates_categories ?? null,
          specials_new_categories: (data as any).specials_new_categories ?? null,
        });
      } else {
        await supabase.from("notification_preferences").insert({ user_id: user.id, ...DEFAULT_BOOLS });
      }
      setLoaded(true);
    };
    load();
  }, [user]);

  const toggleBool = useCallback(
    async (key: BoolKey) => {
      if (!user) return;
      const next = !bools[key];
      const prev = bools;
      setBools((b) => ({ ...b, [key]: next }));
      const { error } = await supabase
        .from("notification_preferences")
        .update({ [key]: next } as any)
        .eq("user_id", user.id);
      if (error) {
        setBools(prev);
        toast.error("Could not save preference");
      } else {
        toast("Saved.", { duration: 1500 });
      }
    },
    [user, bools],
  );

  const masterOn = bools.push_enabled;

  return (
    <div style={{ background: COLORS.olive, minHeight: "100vh", paddingBottom: 120 }}>
      <div style={{ paddingTop: 32, paddingLeft: 24, paddingRight: 24, marginBottom: 18 }}>
        <BackButton iconColor={COLORS.ink} />
      </div>

      {/* Hero */}
      <div style={{ padding: "18px 24px 0" }}>
        <div
          style={{
            ...baseText,
            fontFamily: FONT_STACK,
            fontSize: 12,
            fontWeight: 400,
            color: COLORS.cream,
            opacity: 0.7,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            marginBottom: 14,
          }}
        >
          STAY IN THE LOOP
        </div>
        <h1
          style={{
            ...baseText,
            fontFamily: ITALIC_STACK,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 64,
            lineHeight: 0.92,
            letterSpacing: "-2.2px",
            color: COLORS.cream,
            margin: 0,
            marginBottom: 14,
          }}
        >
          notifications.
        </h1>
        <p
          style={{
            ...baseText,
            fontFamily: ITALIC_STACK,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 17,
            color: COLORS.cream,
            opacity: 0.75,
            margin: 0,
            marginBottom: 28,
            lineHeight: 1.4,
          }}
        >
          Pick what you want to hear about, skip what you don't.
        </p>
      </div>

      {/* Master card */}
      <div style={{ padding: "0 24px", marginBottom: 28 }}>
        <div
          onClick={() => toggleBool("push_enabled")}
          style={{
            background: COLORS.softCream,
            borderRadius: 20,
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            cursor: "pointer",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                ...baseText,
                fontFamily: FONT_STACK,
                fontSize: 17,
                fontWeight: 400,
                color: COLORS.ink,
                marginBottom: 4,
              }}
            >
              Push Notifications
            </div>
            <div
              style={{
                ...baseText,
                fontFamily: ITALIC_STACK,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 13.5,
                color: COLORS.muted,
                lineHeight: 1.4,
              }}
            >
              Turn all alerts on or off in one tap.
            </div>
          </div>
          <Toggle checked={masterOn} variant="rust" />
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <Eyebrow>{section.label}</Eyebrow>
            <div style={{ padding: "0 24px" }}>
              <div
                style={{
                  background: COLORS.cream,
                  borderRadius: 20,
                  padding: "4px 22px",
                  overflow: "hidden",
                }}
              >
                {section.rows.map((row, i) => {
                  const filterLink = row.filterCol && row.filterType
                    ? (() => {
                        const meta = FILTER_TYPE_META[row.filterType];
                        const total = totalCategoryCount(meta.groups);
                        const arr = cats[row.filterCol!];
                        const selected = arr === null ? total : arr.length;
                        return { to: `/notifications/categories/${row.filterType}`, selected, total };
                      })()
                    : undefined;
                  return (
                    <PrefRow
                      key={row.key}
                      title={row.title}
                      description={row.description}
                      checked={bools[row.key]}
                      onToggle={() => toggleBool(row.key)}
                      disabled={!masterOn}
                      isFirst={i === 0}
                      filterLink={filterLink}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footnote */}
      <div style={{ padding: "16px 26px 0 28px", display: "flex", gap: 12, alignItems: "flex-start", marginTop: 16 }}>
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: COLORS.rust,
            marginTop: 8,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            ...baseText,
            fontFamily: ITALIC_STACK,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 14,
            color: COLORS.cream,
            opacity: 0.7,
            lineHeight: 1.55,
          }}
        >
          Changes are saved automatically. You can come back and update these at any time.
        </span>
      </div>
    </div>
  );
};

export default Notifications;
