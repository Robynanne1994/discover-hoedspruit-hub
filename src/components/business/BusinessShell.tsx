import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface BusinessShellProps {
  title: string;
  back?: string | (() => void);
  children: ReactNode;
  hideBack?: boolean;
  theme?: "light" | "dark";
}

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const BusinessShell = ({ title, back, children, hideBack, theme = "light" }: BusinessShellProps) => {
  const navigate = useNavigate();
  const onBack = () => {
    if (typeof back === "function") return back();
    if (typeof back === "string") return navigate(back);
    navigate(-1);
  };

  const isDark = theme === "dark";
  const bg = isDark ? "#555340" : "#EBEBEB";
  const fg = isDark ? "#FFFFFF" : "#2B2420";
  const headingColor = isDark ? "#FFFFFF" : "#020202";

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: FONT, color: fg }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: bg,
          padding: "16px 24px 12px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: 56,
        }}
      >
        {!hideBack && (
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              minHeight: 44,
              minWidth: 44,
              marginLeft: -8,
              color: headingColor,
            }}
            aria-label="Back"
          >
            <ChevronLeft size={24} strokeWidth={1.8} />
          </button>
        )}
        <h1 style={{ fontSize: 20, fontWeight: 500, color: headingColor, margin: 0, fontFamily: FONT }}>
          {title}
        </h1>
      </header>
      <main style={{ padding: "0 24px 120px", maxWidth: 720, margin: "0 auto" }}>{children}</main>
    </div>
  );
};

export default BusinessShell;
