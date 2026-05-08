import BackArrowIcon from "@/components/ui/BackArrowIcon";
import { useNavigate } from "react-router-dom";
import { CSSProperties } from "react";

interface BackButtonProps {
  to?: string;
  onClick?: () => void;
  style?: CSSProperties;
  iconColor?: string;
}

const BackButton = ({ to, onClick, style, iconColor = "#020202" }: BackButtonProps) => {
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
        color: iconColor,
        transition: "opacity 0.15s ease",
        opacity: 1,
        ...style,
      }}
    >
      <BackArrowIcon
        size={22}
        color={iconColor}
      />
    </button>
  );
};

export default BackButton;
