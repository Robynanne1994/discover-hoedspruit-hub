import { useNavigate } from "react-router-dom";
import { CSSProperties } from "react";

const COLORS = {
  cream: "#EEE8DA",
  ink: "#2A2A24",
};

const FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export type BackButtonVariant = "default" | "on-image" | "with-cancel" | "open-menu";

interface BackButtonProps {
  variant?: BackButtonVariant;
  to?: string;
  onClick?: () => void;
  onCancelTap?: () => void;
  cancelLabel?: string;
  style?: CSSProperties;
  /** @deprecated kept for backwards compatibility — no longer used */
  iconColor?: string;
}

const ArrowIcon = ({ size = 18, color = COLORS.ink }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const CloseIcon = ({ size = 16, color = COLORS.cream }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const BackButton = ({
  variant = "default",
  to,
  onClick,
  onCancelTap,
  cancelLabel = "Cancel",
  style,
}: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) return onClick();
    if (to) return navigate(to);
    navigate(-1);
  };

  const handleCancel = () => {
    if (onCancelTap) return onCancelTap();
    handleClick();
  };

  const isOnImage = variant === "on-image";
  const isOpenMenu = variant === "open-menu";

  const diameter = isOnImage ? 40 : 44;
  const iconSize = isOnImage ? 16 : 18;
  const fill = isOpenMenu ? COLORS.ink : COLORS.cream;

  const pressDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(0.96)";
  };
  const pressUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(1)";
  };

  // Maintain 44px tap target even for the 40px on-image variant
  const wrapperPadding = isOnImage ? 2 : 0;

  const button = (
    <button
      type="button"
      aria-label={isOpenMenu ? "Close menu" : "Go back"}
      onClick={handleClick}
      onPointerDown={pressDown}
      onPointerUp={pressUp}
      onPointerLeave={pressUp}
      onPointerCancel={pressUp}
      style={{
        width: diameter,
        height: diameter,
        minWidth: diameter,
        minHeight: diameter,
        borderRadius: "50%",
        background: fill,
        border: "none",
        padding: 0,
        margin: wrapperPadding,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "transform 150ms ease-out",
        transform: "scale(1)",
        flexShrink: 0,
      }}
    >
      {isOpenMenu ? (
        <CloseIcon size={iconSize} color={COLORS.cream} />
      ) : (
        <ArrowIcon size={iconSize} color={COLORS.ink} />
      )}
    </button>
  );

  if (variant === "with-cancel") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          ...style,
        }}
      >
        {button}
        <button
          type="button"
          onClick={handleCancel}
          style={{
            background: "none",
            border: "none",
            padding: "10px 4px",
            cursor: "pointer",
            fontFamily: FONT_BODY,
            fontSize: 14,
            fontWeight: 400,
            color: COLORS.cream,
            opacity: 0.75,
            letterSpacing: "0.01em",
          }}
        >
          {cancelLabel}
        </button>
      </div>
    );
  }

  if (style) {
    return <div style={{ display: "inline-flex", ...style }}>{button}</div>;
  }

  return button;
};

export default BackButton;
