import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { type } from "@/lib/type";

/**
 * The app's one "go and look at more" pill: a full-width brown bar carrying the
 * label and a trailing arrow. Search uses it to push on to categories, events
 * or specials, and the follow lists use it for Find People and Share Profile.
 * Both routes render the same box from here, so the two can never drift apart.
 */

const DARK = "#423324";

const pressScale = (s = "0.98") => ({
  onPointerDown: (e: ReactPointerEvent) =>
    ((e.currentTarget as HTMLElement).style.transform = `scale(${s})`),
  onPointerUp: (e: ReactPointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  onPointerLeave: (e: ReactPointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
});

const baseStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  height: 48,
  width: "100%",
  margin: "4px 0 0",
  borderRadius: 9999,
  background: DARK,
  border: "none",
  cursor: "pointer",
  boxSizing: "border-box",
  ...type.cardTitleM,
  color: "#FFFFFF",
  textDecoration: "none",
  transition: "transform 0.12s ease, opacity 0.12s ease",
};

type ArrowCtaProps = {
  label: string;
  /** Renders a router link when given. */
  to?: string;
  /** Renders a button when given (used where the tap runs code, not navigation). */
  onClick?: () => void;
};

export const ArrowCta = ({ label, to, onClick }: ArrowCtaProps) => {
  const inner = (
    <>
      {label}
      <ArrowUpRight size={18} strokeWidth={2} color="#FFFFFF" />
    </>
  );

  if (to) {
    return (
      <Link to={to} style={baseStyle} {...pressScale()}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} style={baseStyle} {...pressScale()}>
      {inner}
    </button>
  );
};

export default ArrowCta;
