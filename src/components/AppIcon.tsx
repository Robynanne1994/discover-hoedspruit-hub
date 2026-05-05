import type { LucideIcon } from "lucide-react";
import { useIconOverrides } from "@/hooks/useIconOverrides";

interface AppIconProps {
  slot: string;
  fallback: LucideIcon;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

/**
 * Renders a custom uploaded icon for the given `slot` if one exists in
 * the icon_overrides table, otherwise falls back to the provided Lucide icon.
 *
 * Custom icons are rendered as <img> tags. Color tinting is applied via CSS
 * mask so transparent PNG/SVG icons inherit the requested color.
 */
const AppIcon = ({
  slot,
  fallback: Fallback,
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  className,
}: AppIconProps) => {
  const { data: overrides } = useIconOverrides();
  const url = overrides?.[slot];

  if (url) {
    return (
      <span
        aria-hidden
        className={className}
        style={{
          display: "inline-block",
          width: size,
          height: size,
          backgroundColor: color,
          WebkitMaskImage: `url(${url})`,
          maskImage: `url(${url})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    );
  }

  return (
    <Fallback
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
};

export default AppIcon;
