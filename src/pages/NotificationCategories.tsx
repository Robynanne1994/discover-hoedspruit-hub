import BackArrowIcon from "@/components/ui/BackArrowIcon";
import PageHeader from "@/components/PageHeader";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationOptions } from "@/hooks/useNotificationOptions";
import { toast } from "sonner";
import {
  FILTER_TYPE_META,
  NotificationFilterType,
} from "@/lib/notificationCategories";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const COLORS = {
  bg: "#E6E0CC",
  card: "#FFFFFF",
  ink: "#1A1A1A",
  muted: "#7A6E5C",
  line: "#E2DAC6",
  rust: "#423324",
  toggleOn: "#2E2418",
  toggleOff: "#D9CFB8",
};

const baseText: React.CSSProperties = {
  fontStretch: "normal",
  fontSynthesis: "none",
  transform: "none",
};

const Toggle = ({ checked }: { checked: boolean }) => (
  <div
    style={{
      width: 46,
      height: 26,
      borderRadius: 999,
      background: checked ? COLORS.toggleOn : COLORS.toggleOff,
      position: "relative",
      transition: "background-color 200ms ease-out",
      flexShrink: 0,
    }}
  >
    <div
      style={{
        width: 20,
        height: 20,
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

const Pill = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      height: 36,
      padding: "0 18px",
      borderRadius: 999,
      background: active ? COLORS.ink : "transparent",
      border: `1px solid ${active ? COLORS.ink : "rgba(26,26,26,0.25)"}`,
      color: active ? "#fff" : COLORS.ink,
      fontFamily: SANS,
      fontSize: 13,
      fontWeight: 400,
      letterSpacing: "0.1px",
      cursor: "pointer",
      transition: "background-color 200ms ease-out, border-color 200ms ease-out, color 200ms ease-out",
      ...baseText,
    }}
  >
    {label}
  </button>
);

const NotificationCategories = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const meta = type && (type in FILTER_TYPE_META) ? FILTER_TYPE_META[type as NotificationFilterType] : null;

  const { options, loading: optionsLoading } = useNotificationOptions(meta ? meta.source : null);
  const allIds = useMemo(() => options.map((o) => o.id), [options]);
  const total = options.length;

  const [selected, setSelected] = useState<string[]>([]);
  const [prefLoaded, setPrefLoaded] = useState(false);
  // Raw stored value: null => "all selected", otherwise an explicit list.
  const [storedAll, setStoredAll] = useState(false);
  const [selectAllActive, setSelectAllActive] = useState(false);
  const [clearAllActive, setClearAllActive] = useState(false);

  useEffect(() => {
    if (!user || !meta) return;
    const load = async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select(meta.column)
        .eq("user_id", user.id)
        .maybeSingle();
      const arr = (data as any)?.[meta.column] as string[] | null | undefined;
      if (arr === null || arr === undefined) {
        setStoredAll(true);
        setSelected([]);
      } else {
        setStoredAll(false);
        setSelected(arr);
      }
      setPrefLoaded(true);
    };
    load();
  }, [user, meta]);

  // Once both the stored preference and the live options are in, expand the
  // "all selected" sentinel into the actual list of live option ids.
  useEffect(() => {
    if (!prefLoaded || optionsLoading) return;
    if (storedAll) {
      setSelected(allIds);
      setStoredAll(false);
    }
  }, [prefLoaded, optionsLoading, storedAll, allIds]);

  const persist = useCallback(
    async (next: string[]) => {
      if (!user || !meta) return;
      const payload: Record<string, any> = { [meta.column]: next };
      // Keep the parent toggle on the main preferences page in sync:
      // if the user selects any category here, ensure the parent toggle is on.
      if (next.length > 0 && type) {
        payload[type] = true;
      }
      const { error } = await supabase
        .from("notification_preferences")
        .update(payload as any)
        .eq("user_id", user.id);
      if (error) toast.error("Could not save");
      else toast("Saved.", { duration: 1500 });
    },
    [user, meta, type],
  );

  if (!meta) return <Navigate to="/notifications" replace />;

  const toggleId = (id: string) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(next);
    persist(next);
  };

  const handleSelectAll = () => {
    setSelected(allIds);
    persist(allIds);
    setSelectAllActive(true);
    setTimeout(() => setSelectAllActive(false), 2000);
  };

  const handleClearAll = () => {
    setSelected([]);
    persist([]);
    setClearAllActive(true);
    setTimeout(() => setClearAllActive(false), 2000);
  };

  // Title-case the eyebrow text for the page title (e.g. "NEW EVENTS" -> "New Events")
  const pageTitle = meta.eyebrow
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", paddingBottom: 120, fontFamily: SANS }}>
      {/* Top bar */}
      <PageHeader title={pageTitle} />

      {/* Quick actions */}
      <div
        style={{
          padding: "20px 24px 0",
          marginBottom: 24,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <Pill label="Select All" active={selectAllActive} onClick={handleSelectAll} />
        <Pill label="Clear All" active={clearAllActive} onClick={handleClearAll} />
        <span
          style={{
            ...baseText,
            marginLeft: "auto",
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 13,
            color: COLORS.ink,
            alignSelf: "flex-end",
            lineHeight: 1,
            paddingBottom: 2,
          }}
        >
          {selected.length} of {total}
        </span>
      </div>

      {/* Subline */}
      <div
        style={{
          ...baseText,
          padding: "0 24px",
          marginTop: -8,
          marginBottom: 20,
          fontFamily: SANS,
          fontWeight: 400,
          fontSize: 14,
          color: COLORS.muted,
          lineHeight: 1.5,
        }}
      >
        {meta.subline}
      </div>

      {/* Live options — the app's real categories / tags */}
      <div style={{ padding: "0 24px" }}>
        {optionsLoading ? (
          <div style={{ ...baseText, fontFamily: SANS, fontSize: 14, color: COLORS.muted }}>
            Loading…
          </div>
        ) : total === 0 ? (
          <div style={{ ...baseText, fontFamily: SANS, fontSize: 14, color: COLORS.muted }}>
            No {meta.itemNoun.many} yet. Once some are added, they'll appear here.
          </div>
        ) : (
          <div
            style={{
              background: COLORS.card,
              borderRadius: 18,
              padding: "8px 22px",
              overflow: "hidden",
            }}
          >
            {options.map((item, i) => {
              const isOn = selected.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleId(item.id)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    borderTop: i === 0 ? "none" : `1px solid ${COLORS.line}`,
                    padding: "16px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        ...baseText,
                        fontFamily: SANS,
                        fontSize: 15.5,
                        fontWeight: 400,
                        color: COLORS.ink,
                        lineHeight: 1.2,
                      }}
                    >
                      {item.label}
                    </div>
                  </div>
                  <Toggle checked={isOn} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footnote */}
      <div
        style={{
          padding: "20px 26px 0 28px",
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          marginTop: 16,
        }}
      >
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
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: 14,
            color: COLORS.muted,
            lineHeight: 1.55,
          }}
        >
          Changes save automatically. Untoggled categories will not trigger a notification, even if the parent toggle is on.
        </span>
      </div>
    </div>
  );
};

export default NotificationCategories;
