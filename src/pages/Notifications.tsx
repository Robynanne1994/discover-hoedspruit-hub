import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
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

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const C = {
  bg: "#E6E0CC",
  card: "#FFFFFF",
  ink: "#1A1A1A",
  dark: "#2E2418",
  muted: "#7A6E5C",
  line: "#E2DAC6",
  rust: "#C0392B",
  offTrack: "#D9CFB8",
};

const Toggle = ({ checked, disabled }: { checked: boolean; disabled?: boolean }) => (
  <div
    style={{
      width: 44,
      height: 24,
      borderRadius: 999,
      background: checked ? C.dark : C.offTrack,
      position: "relative",
      transition: "background-color 200ms ease-out",
      flexShrink: 0,
      opacity: disabled ? 0.55 : 1,
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

interface RowDef {
  key: BoolKey;
  title: string;
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
      { key: "events_new", title: "New Events", filterCol: "events_new_categories", filterType: "events_new" },
      { key: "events_reminders", title: "Event Reminders" },
      { key: "events_updates", title: "Event Updates" },
    ],
  },
  {
    label: "Listings",
    rows: [
      { key: "listings_new", title: "New Listings", filterCol: "listings_new_categories", filterType: "listings_new" },
      { key: "listings_updates", title: "Listing Updates", filterCol: "listings_updates_categories", filterType: "listings_updates" },
    ],
  },
  {
    label: "Specials",
    rows: [
      { key: "specials_new", title: "New Specials", filterCol: "specials_new_categories", filterType: "specials_new" },
      { key: "specials_ending", title: "Specials Ending Soon" },
    ],
  },
  {
    label: "Community",
    rows: [
      { key: "community_followers", title: "New Followers" },
      { key: "community_activity", title: "Activity From People You Follow" },
    ],
  },
  {
    label: "From Hello Hoedspruit",
    rows: [
      { key: "hh_app_updates", title: "App Updates & News" },
    ],
  },
];

const PrefRow = ({
  title,
  checked,
  onToggle,
  disabled,
  isFirst,
  filterLink,
}: {
  title: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  isFirst: boolean;
  filterLink?: { to: string; selected: number; total: number };
}) => {
  const allSelected = filterLink && filterLink.selected === filterLink.total;
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
        borderTop: isFirst ? "none" : `1px solid ${C.line}`,
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <div style={{ flex: 1, paddingRight: 8 }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 16,
            fontWeight: 700,
            color: C.ink,
            lineHeight: 1.2,
            letterSpacing: "-0.1px",
          }}
        >
          {title}
        </div>
        {filterLink && (
          <Link
            to={filterLink.to}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 500,
              color: C.rust,
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

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
        const loadedCats: Record<CatKey, string[] | null> = {
          events_new_categories: (data as any).events_new_categories ?? null,
          listings_new_categories: (data as any).listings_new_categories ?? null,
          listings_updates_categories: (data as any).listings_updates_categories ?? null,
          specials_new_categories: (data as any).specials_new_categories ?? null,
        };
        // If any category array is explicitly empty, turn off the parent toggle
        const catToBool: Record<CatKey, BoolKey> = {
          events_new_categories: "events_new",
          listings_new_categories: "listings_new",
          listings_updates_categories: "listings_updates",
          specials_new_categories: "specials_new",
        };
        const updates: Partial<Record<BoolKey, boolean>> = {};
        for (const [catKey, boolKey] of Object.entries(catToBool) as [CatKey, BoolKey][]) {
          if (loadedCats[catKey] !== null && loadedCats[catKey]!.length === 0 && b[boolKey]) {
            b[boolKey] = false;
            updates[boolKey] = false;
          }
        }
        setBools(b);
        setCats(loadedCats);
        if (Object.keys(updates).length > 0) {
          await supabase.from("notification_preferences").update(updates as any).eq("user_id", user.id);
        }
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
      const prevBools = bools;
      const prevCats = cats;

      // Find if this bool is linked to a category column
      const linkedRow = SECTIONS.flatMap((s) => s.rows).find((r) => r.key === key);
      const filterCol = linkedRow?.filterCol;

      const update: Record<string, any> = { [key]: next };
      const nextCats = { ...cats };
      if (filterCol) {
        // Toggle on => select all (null sentinel). Toggle off => clear (empty array).
        nextCats[filterCol] = next ? null : [];
        update[filterCol] = next ? null : [];
      }

      setBools((b) => ({ ...b, [key]: next }));
      if (filterCol) setCats(nextCats);

      const { error } = await supabase
        .from("notification_preferences")
        .update(update as any)
        .eq("user_id", user.id);
      if (error) {
        setBools(prevBools);
        setCats(prevCats);
        toast.error("Could not save preference");
      } else {
        toast("Saved.", { duration: 1500 });
      }
    },
    [user, bools, cats],
  );


  const masterOn = bools.push_enabled;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 120, fontFamily: SANS }}>
      {/* Top bar */}
      <PageHeader title="Notification Preferences" />

      {/* Master card */}
      <div style={{ padding: "0 20px", marginBottom: 28 }}>
        <div
          onClick={() => toggleBool("push_enabled")}
          style={{
            background: C.card,
            borderRadius: 18,
            padding: "20px 22px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            cursor: "pointer",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 4, letterSpacing: "-0.2px" }}>
              Push Notifications
            </div>
            <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 14, color: C.muted, lineHeight: 1.4 }}>
              Turn all alerts on or off in one tap.
            </div>
          </div>
          <Toggle checked={masterOn} />
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22, opacity: loaded ? 1 : 0, transition: "opacity 200ms ease-out" }}>
        {loaded && SECTIONS.map((section) => (
          <div key={section.label}>
            <div
              style={{
                fontFamily: SANS,
                fontSize: 11,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                padding: "0 24px",
                marginBottom: 10,
              }}
            >
              {section.label}
            </div>
            <div style={{ padding: "0 20px" }}>
              <div
                style={{
                  background: C.card,
                  borderRadius: 18,
                  padding: "4px 22px",
                  overflow: "hidden",
                }}
              >
                {section.rows.map((row, i) => {
                  const filterLink = row.filterCol && row.filterType
                    ? (() => {
                        const meta = FILTER_TYPE_META[row.filterType!];
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
    </div>
  );
};

export default Notifications;
