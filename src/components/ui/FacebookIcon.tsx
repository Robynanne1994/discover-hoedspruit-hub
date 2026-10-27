import { forwardRef } from "react";
import { Facebook, type LucideProps } from "lucide-react";

/** One consistent outline, matching InstagramIcon so both read as a pair. */
const FacebookIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 20, color = "currentColor", strokeWidth = 1.75, ...props }, ref) => (
    <Facebook {...props} ref={ref} size={size} color={color} strokeWidth={strokeWidth} fill="none" aria-hidden="true" />
  ),
);
FacebookIcon.displayName = "FacebookIcon";

export default FacebookIcon;
