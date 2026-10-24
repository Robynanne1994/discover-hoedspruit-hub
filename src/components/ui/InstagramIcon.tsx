import { forwardRef } from "react";
import { Instagram, type LucideProps } from "lucide-react";

/** One consistent camera outline, inheriting each placement's brand colour. */
const InstagramIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 20, color = "currentColor", strokeWidth = 1.75, ...props }, ref) => (
    <Instagram {...props} ref={ref} size={size} color={color} strokeWidth={strokeWidth} fill="none" aria-hidden="true" />
  ),
);
InstagramIcon.displayName = "InstagramIcon";

export default InstagramIcon;