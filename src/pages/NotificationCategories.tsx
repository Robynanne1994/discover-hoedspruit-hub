import BackButton from "@/components/BackButton";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  FILTER_TYPE_META,
  NotificationFilterType,
  allCategoryIds,
  totalCategoryCount,
} from "@/lib/notificationCategories";

const FONT_STACK = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const ITALIC_STACK = "'Playfair Display', Georgia, serif";

const COLORS = {
  olive: "#5C6446",
  cream: "#EEE8DA",
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

const Toggle = ({ checked }: { checked: boolean }) => (
  <div
    style={{
      width: 44,
      height: 24,
      borderRadius: 999,
      background: checked ? COLORS.ink : COLORS.line,
      position: "relative",
      transition: "background-color 200ms ease-out",
      flexShrink: 0,
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
      border: `1px solid ${active ? COLORS.ink : "rgba(238, 232, 218, 0.35)"}`,
      color: COLORS.cream,
      fontFamily: FONT_STACK,
      fontSize: 13,
      fontWeight: 400,
      letterSpacing: "0.1px",
      cursor: "pointer",
      transition: "background-color 200ms ease-out, border-color 200ms ease-out",
      ...baseText,
    }}
  >
    {label}
  </button>
);

const NotificationCategories = () => {
  const { type } = useParams<{ type: string }>();
  const { user } = useAuth();

  const meta = type && (type in FILTER_TYPE_META) ? FILTER_TYPE_META[type as NotificationFilterType] : null;

  const allIds = useMemo(() => (meta ? allCategoryIds(meta.groups) : []), [meta]);
  const total = meta ? totalCategoryCount(meta.groups) : 0;

  const [selected, setSelected] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
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
      setSelected(arr === null || arr === undefined ? allIds : arr);
      setLoaded(true);
    };
    load();
  }, [user, meta, allIds]);

  const persist = useCallback(
    async (next: string[]) => {
      if (!user || !meta) return;
      const { error } = await supabase
        .from("notification_preferences")
        .update({ [meta.column]: next } as any)
        .eq("user_id", user.id);
      if (error) toast.error("Could not save");
      else toast("Saved.", { duration: 1500 });
    },
    [user, meta],
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
          {meta.eyebrow}
        </div>
        <h1
          style={{
            ...baseText,
            fontFamily: ITALIC_STACK,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 56,
            lineHeight: 0.95,
            letterSpacing: "-1.8px",
            color: COLORS.cream,
            margin: 0,
            marginBottom: 14,
          }}
        >
          {meta.title}
        </h1>
        <p
          style={{
            ...baseText,
            fontFamily: FONT_STACK,
            fontSize: 15,
            fontWeight: 400,
            color: COLORS.cream,
            opacity: 0.9,
            lineHeight: 1.65,
            margin: 0,
            marginBottom: 24,
            maxWidth: 300,
          }}
        >
          {meta.subline}
        </p>
      </div>

      {/* Quick actions */}
      <div
        style={{
          padding: "0 24px",
          marginBottom: 28,
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
            fontFamily: ITALIC_STACK,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 14,
            color: COLORS.cream,
            opacity: 0.7,
          }}
        >
          {selected.length} of {total}
        </span>
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {meta.groups.map((group) => (
          <div key={group.label}>
            <div
              style={{
                ...baseText,
                fontFamily: FONT_STACK,
                fontSize: 11,
                fontWeight: 400,
                color: COLORS.cream,
                opacity: 0.7,
                textTransform: "uppercase",
                letterSpacing: "0.218em",
                padding: "0 24px",
                marginBottom: 10,
              }}
            >
              {group.label}
            </div>
            <div style={{ padding: "0 24px" }}>
              <div
                style={{
                  background: COLORS.cream,
                  borderRadius: 20,
                  padding: "4px 22px",
                  overflow: "hidden",
                }}
              >
                {group.items.map((item, i) => {
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
                        padding: "14px 0",
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
                            fontFamily: FONT_STACK,
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
            </div>
          </div>
        ))}
      </div>

      {/* Footnote */}
      <div
        style={{
          padding: "16px 26px 0 28px",
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
            fontFamily: ITALIC_STACK,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 14,
            color: COLORS.cream,
            opacity: 0.7,
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
