import { Link } from "react-router-dom";
import { ChevronRight, ArrowUpRight } from "lucide-react";

// Shared Settings-style list primitives. Same metrics as /my-account:
// 24px page inset, 20px radius white card, 56px rows, brown leading icons,
// dividers inset 50px so the icon column reads as a continuous rail.
export const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
export const SETTINGS_BG = "#E6E0CC";
export const SETTINGS_CARD = "#FFFFFF";
export const SETTINGS_INK = "#1A1A1A";
export const SETTINGS_LABEL = "#6B6A5E";
export const SETTINGS_LINE = "#E2DAC6";
export const SETTINGS_LEAD_ICON = "#715A3D";
export const SETTINGS_TRAIL_ICON = "#B4AE9E";

export type SettingsRowItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: any;
  subtitle?: string;
  external?: boolean;
  /** Replaces the trailing chevron / arrow, e.g. a switch. */
  trailing?: React.ReactNode;
};

export const ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  minHeight: 56,
  padding: "10px 16px",
  textDecoration: "none",
  width: "100%",
  background: "transparent",
  border: "none",
  textAlign: "left",
  font: "inherit",
  color: "inherit",
};

export const SettingsEyebrow = ({ children }: { children: React.ReactNode }) => {
  if (!children) return null;
  return (
    <p
      style={{
        margin: "0 0 10px",
        padding: "0 24px",
        fontFamily: SANS,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: SETTINGS_LABEL,
      }}
    >
      {children}
    </p>
  );
};

export const SettingsRowBody = ({ item }: { item: SettingsRowItem }) => (
  <>
    {item.icon ? (
      <div style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <item.icon size={20} strokeWidth={1.6} color={SETTINGS_LEAD_ICON} />
      </div>
    ) : null}
    <span style={{ flex: 1, display: "block", minWidth: 0 }}>
      <span
        style={{
          display: "block",
          fontFamily: SANS,
          fontSize: 16,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: SETTINGS_INK,
          lineHeight: 1.25,
        }}
      >
        {item.label}
      </span>
      {item.subtitle ? (
        <span
          style={{
            display: "block",
            marginTop: 2,
            fontFamily: SANS,
            fontSize: 12.5,
            fontWeight: 400,
            color: SETTINGS_LABEL,
            lineHeight: 1.3,
          }}
        >
          {item.subtitle}
        </span>
      ) : null}
    </span>
    {item.trailing !== undefined ? (
      item.trailing
    ) : item.external ? (
      <ArrowUpRight size={16} strokeWidth={2} color={SETTINGS_TRAIL_ICON} style={{ flexShrink: 0 }} />
    ) : (
      <ChevronRight size={16} strokeWidth={2} color={SETTINGS_TRAIL_ICON} style={{ flexShrink: 0 }} />
    )}
  </>
);

export const SettingsDivider = () => (
  <div style={{ height: 1, background: SETTINGS_LINE, marginLeft: 50, marginRight: 16 }} />
);

export const SettingsCard = ({
  items,
  children,
}: {
  items?: SettingsRowItem[];
  children?: React.ReactNode;
}) => {
  const rows = (items ?? []).filter((i) => i.label);
  if (!children && rows.length === 0) return null;
  return (
    <div style={{ background: SETTINGS_CARD, borderRadius: 20, margin: "0 24px", overflow: "hidden" }}>
      {children ??
        rows.map((item, i) => (
          <div key={item.label}>
            {i > 0 && <SettingsDivider />}
            {item.external && item.href ? (
              <a href={item.href} target="_blank" rel="noopener noreferrer" style={ROW_STYLE}>
                <SettingsRowBody item={item} />
              </a>
            ) : item.href ? (
              <Link to={item.href} style={ROW_STYLE}>
                <SettingsRowBody item={item} />
              </Link>
            ) : (
              <button type="button" onClick={item.onClick} style={{ ...ROW_STYLE, cursor: "pointer" }}>
                <SettingsRowBody item={item} />
              </button>
            )}
          </div>
        ))}
    </div>
  );
};

export const SettingsSection = ({
  label,
  items,
  children,
}: {
  label?: string;
  items?: SettingsRowItem[];
  children?: React.ReactNode;
}) => {
  const rows = (items ?? []).filter((i) => i.label);
  if (!children && rows.length === 0) return null;
  return (
    <div style={{ marginBottom: 28 }}>
      {label ? <SettingsEyebrow>{label}</SettingsEyebrow> : null}
      <SettingsCard items={rows}>{children}</SettingsCard>
    </div>
  );
};
