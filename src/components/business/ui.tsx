import { ReactNode, CSSProperties, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export const COLORS = {
  bg: "#EBEBEB",
  card: "#FFFFFF",
  accent: "#D4654A",
  accentHover: "#BF5840",
  heading: "#020202",
  body: "#2B2420",
  bodySoft: "rgba(18,18,20,0.55)",
  divider: "rgba(18,18,20,0.08)",
  inputBorder: "rgba(18,18,20,0.1)",
  placeholder: "rgba(18,18,20,0.35)",
  errorRed: "#C4392D",
  pendingFg: "#D4964A",
  pendingBg: "rgba(212,150,74,0.12)",
  approvedFg: "#3B7D4F",
  approvedBg: "rgba(59,125,79,0.12)",
  rejectedFg: "#C4392D",
  rejectedBg: "rgba(196,57,45,0.12)",
  changesFg: "#2B2420",
  changesBg: "rgba(18,18,20,0.06)",
};

export const Card = ({ children, style, onClick }: { children: ReactNode; style?: CSSProperties; onClick?: () => void }) => (
  <div
    onClick={onClick}
    style={{
      background: COLORS.card,
      border: `1px solid rgba(18,18,20,0.06)`,
      borderRadius: 16,
      padding: 20,
      transition: "transform 0.15s ease",
      cursor: onClick ? "pointer" : "default",
      ...style,
    }}
  >
    {children}
  </div>
);

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent";
  full?: boolean;
}

export const Button = ({ variant = "primary", full, style, children, ...rest }: BtnProps) => {
  const base: CSSProperties = {
    fontFamily: FONT,
    fontWeight: 600,
    fontSize: 15,
    borderRadius: 24,
    minHeight: 48,
    padding: "12px 24px",
    cursor: "pointer",
    transition: "opacity 0.15s ease",
    width: full ? "100%" : undefined,
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    lineHeight: 1.2,
  };
  let v: CSSProperties = {};
  if (variant === "primary") v = { background: "#020202", color: "#FFFFFF" };
  if (variant === "secondary") v = { background: "transparent", color: COLORS.body, border: "1.5px solid rgba(18,18,20,0.15)" };
  if (variant === "accent") v = { background: COLORS.accent, color: "#FFFFFF" };
  return (
    <button {...rest} style={{ ...base, ...v, ...style, opacity: rest.disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
};

export const Label = ({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) => (
  <label
    htmlFor={htmlFor}
    style={{
      display: "block",
      fontFamily: FONT,
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: COLORS.body,
      marginBottom: 8,
    }}
  >
    {children}
  </label>
);

const inputStyle: CSSProperties = {
  width: "100%",
  background: "#FFFFFF",
  border: `1px solid ${COLORS.inputBorder}`,
  borderRadius: 14,
  padding: "12px 16px",
  fontFamily: FONT,
  fontSize: 15,
  color: COLORS.body,
  outline: "none",
};

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} style={{ ...inputStyle, ...props.style }} />
);

export const Textarea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} style={{ ...inputStyle, minHeight: 96, resize: "vertical", ...props.style }} />
);

export const FieldError = ({ children }: { children: ReactNode }) =>
  children ? (
    <p style={{ color: COLORS.errorRed, fontSize: 14, marginTop: 6, fontFamily: FONT }}>{children}</p>
  ) : null;

export type StatusKind = "pending" | "approved" | "rejected" | "changes_requested";

export const StatusPill = ({ status }: { status: StatusKind | string }) => {
  const map: Record<string, { fg: string; bg: string; label: string }> = {
    pending: { fg: COLORS.pendingFg, bg: COLORS.pendingBg, label: "Pending" },
    approved: { fg: COLORS.approvedFg, bg: COLORS.approvedBg, label: "Approved" },
    rejected: { fg: COLORS.rejectedFg, bg: COLORS.rejectedBg, label: "Rejected" },
    changes_requested: { fg: COLORS.changesFg, bg: COLORS.changesBg, label: "Changes requested" },
  };
  const s = map[status] ?? { fg: COLORS.changesFg, bg: COLORS.changesBg, label: status };
  return (
    <span
      style={{
        display: "inline-block",
        background: s.bg,
        color: s.fg,
        borderRadius: 20,
        padding: "6px 14px",
        fontSize: 13,
        fontWeight: 500,
        fontFamily: FONT,
      }}
    >
      {s.label}
    </span>
  );
};

export const H2 = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <h2 style={{ fontFamily: FONT, fontSize: 34, fontWeight: 400, color: COLORS.heading, margin: 0, lineHeight: 1.1, ...style }}>
    {children}
  </h2>
);

export const H3 = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <h3
    style={{
      fontFamily: FONT,
      fontSize: 26,
      fontWeight: 400,
      color: COLORS.heading,
      textTransform: "uppercase",
      letterSpacing: "0.01em",
      margin: 0,
      ...style,
    }}
  >
    {children}
  </h3>
);

export const Body = ({ children, soft, style }: { children: ReactNode; soft?: boolean; style?: CSSProperties }) => (
  <p style={{ fontFamily: FONT, fontSize: 16, fontWeight: 400, lineHeight: 1.45, color: soft ? COLORS.bodySoft : COLORS.body, margin: 0, ...style }}>
    {children}
  </p>
);

export const Small = ({ children, soft, style }: { children: ReactNode; soft?: boolean; style?: CSSProperties }) => (
  <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 400, lineHeight: 1.45, color: soft ? COLORS.bodySoft : COLORS.body, margin: 0, ...style }}>
    {children}
  </p>
);

export const EmptyState = ({ message, action }: { message: string; action?: ReactNode }) => (
  <div style={{ textAlign: "center", padding: "48px 16px" }}>
    <Small soft>{message}</Small>
    {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
  </div>
);

export const ConfirmSheet = ({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  onCancel,
  onConfirm,
  busy,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) => {
  if (!open) return null;
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          borderRadius: "24px 24px 0 0",
          padding: 24,
          width: "100%",
          maxWidth: 720,
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: "rgba(18,18,20,0.15)",
            borderRadius: 2,
            margin: "0 auto 20px",
          }}
        />
        <h3 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 500, color: COLORS.heading, margin: 0 }}>{title}</h3>
        {description && (
          <p style={{ fontFamily: FONT, fontSize: 14, color: COLORS.bodySoft, margin: "8px 0 24px", lineHeight: 1.45 }}>
            {description}
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button
            variant={destructive ? "accent" : "primary"}
            full
            onClick={onConfirm}
            disabled={busy}
            style={destructive ? { background: COLORS.errorRed } : undefined}
          >
            {busy ? "Working..." : confirmLabel}
          </Button>
          <Button variant="secondary" full onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
