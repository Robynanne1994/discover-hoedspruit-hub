import { useEffect, useState } from "react";
import loadingIcon from "@/assets/loading-icon.svg";

/**
 * Splash shown while auth resolves.
 * - Delays render by 200ms to avoid a flash on fast loads.
 * - Uses a smooth, steady fade (not animate-pulse) so it doesn't feel jumpy.
 */
const LoadingSplash = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#ebebeb" }}
    >
      <img
        src={loadingIcon}
        alt=""
        aria-hidden="true"
        style={{
          width: 120,
          height: "auto",
          opacity: show ? 1 : 0,
          transition: "opacity 400ms ease-out",
          animation: show ? "splash-breathe 1.8s ease-in-out infinite" : "none",
          willChange: "opacity",
        }}
      />
      <style>{`
        @keyframes splash-breathe {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LoadingSplash;
