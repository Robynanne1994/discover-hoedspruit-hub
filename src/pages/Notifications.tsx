import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { MUTED as TOKEN_MUTED, SECTION_INSET, type } from "@/lib/type";
import {
  FILTER_TYPE_META,
  NotificationFilterType,
  NotificationSource,
  fetchNotificationOptions,
} from "@/lib/notificationCategories";

type BoolKey =
  | "push_enabled"
  | "events_new"
  | "events_reminders"
  | "events_updates"
  | "listings_new"
  | "listings_updates"
  | "specials_new"
  | "specials_updates"
  | "specials_ending"
  | "community_followers"
  | "community_follow_requests"
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
  specials_updates: false,
  specials_ending: true,
  community_followers: true,
  community_follow_requests: true,
  hh_app_updates: true,
};

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const C = {
  bg: "#E6E0CC",
  card: "#FFFFFF",
  ink: "#1A1A1A",
  dark: "#2E2418",
  muted: TOKEN_MUTED,
  line: "#E2DAC6",
  rust: "#423324",
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
      { key: "specials_updates", title: "Special Updates" },
      { key: "specials_ending", title: "Specials Ending Soon" },
    ],
  },
  {
    label: "Community",
    rows: [
      { key: "community_followers", title: "New Followers" },
      { key: "community_follow_requests", title: "Follower Requests" },
      { key: "hh_app_updates", title: "App Updates & News" },
    ],
  },
];

const PrefRow = ({
  title,
  checked,
  onToggle,
  disabled,
  filterLink,
}: {
  title: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  filterLink?: { to: string; selected: number; total: number; noun: string };
}) => {
  const nounPlural = filterLink ? filterLink.noun : "";
  const allSelected = filterLink && filterLink.selected === filterLink.total;
  const linkText = filterLink
    ? allSelected
      ? `All ${filterLink.total} ${nounPlural}`
      : `${filterLink.selected} of ${filterLink.total} ${nounPlural}`
    : null;

  return (
    <div
      style={{
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          minHeight: 56,
          padding: "10px 16px",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: SANS,
            fontSize: 16,
            fontWeight: 500,
            color: C.ink,
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </div>
        <button
          onClick={onToggle}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", flexShrink: 0 }}
          aria-label={`Toggle ${title}`}
        >
          <Toggle checked={checked} />
        </button>
      </div>
      {filterLink && (
        <Link
          to={filterLink.to}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "0 16px 14px",
            padding: "10px 14px",
            background: "#F5F0E8",
            borderRadius: 12,
            textDecoration: "none",
          }}
        >
          <Tag size={16} color={C.ink} strokeWidth={1.5} />
          <span
            style={{
              flex: 1,
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 500,
              color: C.ink,
              letterSpacing: "-0.1px",
            }}
          >
            {linkText}
          </span>
          <ChevronRight size={16} color="#B4AE9E" strokeWidth={2} />
        </Link>
      )}
    </div>
  );
};

const RowDivider = () => (
  <div style={{ height: 1, background: C.line, marginLeft: 16, marginRight: 16 }} />
);


const ScopeSelector = ({
  value,
  onChange,
  options,
  disabled,
}: {
  value: "all" | "saved";
  onChange: (v: "all" | "saved") => void;
  options: { value: "all" | "saved"; label: string }[];
  disabled?: boolean;
}) => (
  <div
    style={{
      display: "flex",
      background: "#F5F0E8",
      borderRadius: 12,
      padding: 3,
      gap: 3,
      margin: "2px 16px 16px",
      opacity: disabled ? 0.55 : 1,
      pointerEvents: disabled ? "none" : "auto",
    }}
  >
    {options.map((opt) => {
      const active = value === opt.value;
      return (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: active ? "#FFFFFF" : "transparent",
            border: active ? "1px solid rgba(26,26,26,0.06)" : "1px solid transparent",
            borderRadius: 10,
            padding: "0 10px",
            cursor: "pointer",
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "-0.1px",
            color: active ? C.ink : C.muted,
            boxShadow: active ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
            transition: "background-color 200ms ease-out, color 200ms ease-out",
          }}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

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
  const [eventsUpdatesScope, setEventsUpdatesScope] = useState<"all" | "saved">("all");
  const [specialsUpdatesScope, setSpecialsUpdatesScope] = useState<"all" | "saved">("all");
  const [loaded, setLoaded] = useState(false);
  // Live totals per source (real categories / event tags / special tags), used
  // to render the "X of Y" summary under each category-linked toggle.
  const [optionTotals, setOptionTotals] = useState<Partial<Record<NotificationSource, number>>>({});
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("is_private")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setIsPrivate(!!(data as any)?.is_private));
  }, [user]);

  useEffect(() => {
    let active = true;
    const sources: NotificationSource[] = ["category", "event_tag", "special_tag"];
    Promise.all(sources.map((s) => fetchNotificationOptions(s).then((o) => [s, o.length] as const))).then(
      (entries) => {
        if (active) setOptionTotals(Object.fromEntries(entries) as Record<NotificationSource, number>);
      },
    );
    return () => {
      active = false;
    };
  }, []);

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
        const scope = ((data as any).events_updates_scope === "saved" ? "saved" : "all") as "all" | "saved";
        setEventsUpdatesScope(scope);
        const sScope = ((data as any).specials_updates_scope === "saved" ? "saved" : "all") as "all" | "saved";
        setSpecialsUpdatesScope(sScope);
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
      }
    },
    [user, bools, cats],
  );

  const setScope = useCallback(
    async (which: "events" | "specials", scope: "all" | "saved") => {
      if (!user) return;
      const col = which === "events" ? "events_updates_scope" : "specials_updates_scope";
      const prev = which === "events" ? eventsUpdatesScope : specialsUpdatesScope;
      if (which === "events") setEventsUpdatesScope(scope);
      else setSpecialsUpdatesScope(scope);
      const { error } = await supabase
        .from("notification_preferences")
        .update({ [col]: scope } as any)
        .eq("user_id", user.id);
      if (error) {
        if (which === "events") setEventsUpdatesScope(prev);
        else setSpecialsUpdatesScope(prev);
        toast.error("Could not save preference");
      }
    },
    [user, eventsUpdatesScope, specialsUpdatesScope],
  );


  const masterOn = bools.push_enabled;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 100, fontFamily: SANS }}>
      {/* Top bar */}
      <PageHeader title="Notification Preferences" />

      {/* Master card */}
      <div style={{ padding: `20px ${SECTION_INSET}px 0`, marginBottom: 28 }}>
        <div
          onClick={() => toggleBool("push_enabled")}
          style={{
            background: C.card,
            borderRadius: 20,
            padding: "16px 16px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            cursor: "pointer",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 500, color: C.ink, marginBottom: 2, letterSpacing: "-0.01em" }}>
              Push Notifications
            </div>
            <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 12.5, color: "#6B6A5E", lineHeight: 1.3 }}>
              Turn all alerts on or off in one tap.
            </div>
          </div>
          <Toggle checked={masterOn} />
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28, opacity: loaded ? 1 : 0, transition: "opacity 200ms ease-out" }}>
        {loaded && SECTIONS.map((section) => (
          <div key={section.label}>
            <div
              style={{
                ...type.sectionEyebrow,
                padding: `0 ${SECTION_INSET}px`,
              }}
            >
              {section.label}
            </div>
            <div style={{ padding: `0 ${SECTION_INSET}px` }}>
              <div
                style={{
                  background: C.card,
                  borderRadius: 20,
                  overflow: "hidden",
                }}
              >
                {section.rows.filter((r) => r.key !== "community_follow_requests" || isPrivate).map((row, i) => {
                  const filterLink = row.filterCol && row.filterType
                    ? (() => {
                        const meta = FILTER_TYPE_META[row.filterType!];
                        const total = optionTotals[meta.source] ?? 0;
                        const arr = cats[row.filterCol!];
                        const selected = arr === null ? total : Math.min(arr.length, total);
                        return { to: `/notifications/categories/${row.filterType}`, selected, total, noun: meta.itemNoun.many };
                      })()
                    : undefined;
                  return (
                    <div key={row.key}>
                      {i > 0 && <RowDivider />}
                      <PrefRow
                        title={row.title}
                        checked={bools[row.key]}
                        onToggle={() => toggleBool(row.key)}
                        disabled={!masterOn}
                        filterLink={filterLink}
                      />

                      {row.key === "events_updates" && bools.events_updates && masterOn && (
                        <ScopeSelector
                          value={eventsUpdatesScope}
                          onChange={(v) => setScope("events", v)}
                          options={[
                            { value: "all", label: "All Events" },
                            { value: "saved", label: "Saved Only" },
                          ]}
                        />
                      )}
                      {row.key === "specials_updates" && bools.specials_updates && masterOn && (
                        <ScopeSelector
                          value={specialsUpdatesScope}
                          onChange={(v) => setScope("specials", v)}
                          options={[
                            { value: "all", label: "All Specials" },
                            { value: "saved", label: "Saved Only" },
                          ]}
                        />
                      )}
                    </div>
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
