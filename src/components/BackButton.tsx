import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CSSProperties } from "react";

interface BackButtonProps {
  to?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

const BackButton = ({ to, onClick, style }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) return onClick();
    if (to) return navigate(to);
    navigate(-1);
  };

  const handleDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.opacity = "0.6";
  };
  const handleUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.opacity = "1";
  };

  return (
    <button
      onClick={handleClick}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
      style={{
        display: "inline-flex",
        alignItems: "center",
        lineHeight: 1,
        gap: 4,
        minHeight: 44,
        minWidth: 44,
        padding: 0,
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "#020202",
        transition: "opacity 0.15s ease",
        opacity: 1,
        ...style,
      }}
    >
      <ChevronLeft
        size={22}
        strokeWidth={1.8}
        color="#020202"
        style={{ display: "block", transform: "scale(1.4)", transformOrigin: "center" }}
      />
      <span
        style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: 15,
          fontWeight: 400,
          color: "#020202",
          letterSpacing: 0,
          lineHeight: 1,
          display: "inline-block",
        }}
      >
        Back
      </span>
    </button>
  );
};

export default BackButton;
