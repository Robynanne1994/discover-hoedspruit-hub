import { ReactNode, useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Settings, LogOut, CreditCard, ArrowLeftRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const BG = "#EBEBEB";
const INK = "#020202";
const MUTED = "rgba(2,2,2,0.55)";
const DIVIDER = "rgba(2,2,2,0.08)";
const ACCENT = "#5C6446";

interface Tab {
  to: string;
  label: string;
  match: (p: string) => boolean;
}

const TABS: Tab[] = [
  { to: "/business/dashboard", label: "Overview", match: (p) => p === "/business/dashboard" },
  { to: "/business/specials", label: "Specials", match: (p) => p.startsWith("/business/specials") },
  { to: "/business/events", label: "Events", match: (p) => p.startsWith("/business/events") },
  { to: "/business/listing", label: "Listing", match: (p) => p.startsWith("/business/listing") },
];

interface Props {
  businessName?: string | null;
  children: ReactNode;
}

const BusinessLayout = ({ businessName, children }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = "playfair-display-font";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;1,300;1,400&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, color: INK, paddingBottom: 80 }}>
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: BG,
          borderBottom: `1px solid ${DIVIDER}`,
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "18px 20px 0",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: "1.8px",
                textTransform: "uppercase",
                color: MUTED,
                margin: 0,
                marginBottom: 2,
              }}
            >
              Business
            </p>
            <h1
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 24,
                lineHeight: 1.1,
                letterSpacing: "-0.4px",
                color: INK,
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {businessName || "your business"}
            </h1>
          </div>

          <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                border: `1px solid ${DIVIDER}`,
                background: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Settings size={16} strokeWidth={1.5} color={INK} />
            </button>
            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 48,
                  background: "#fff",
                  borderRadius: 16,
                  border: `1px solid ${DIVIDER}`,
                  boxShadow: "0 10px 32px rgba(0,0,0,0.08)",
                  minWidth: 200,
                  padding: 6,
                  zIndex: 40,
                }}
              >
                <MenuItem
                  icon={<CreditCard size={15} strokeWidth={1.5} />}
                  label="Plan & billing"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/business/billing");
                  }}
                />
                <MenuItem
                  icon={<ArrowLeftRight size={15} strokeWidth={1.5} />}
                  label="Switch to personal"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/my-account");
                  }}
                />
                <div style={{ height: 1, background: DIVIDER, margin: "4px 8px" }} />
                <MenuItem
                  icon={<LogOut size={15} strokeWidth={1.5} />}
                  label="Sign out"
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <nav
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "14px 12px 0",
            display: "flex",
            gap: 4,
            overflowX: "auto",
          }}
        >
          {TABS.map((t) => {
            const active = t.match(location.pathname);
            return (
              <Link
                key={t.to}
                to={t.to}
                style={{
                  position: "relative",
                  padding: "10px 12px 14px",
                  fontFamily: SANS,
                  fontSize: 13.5,
                  fontWeight: 400,
                  letterSpacing: "0.01em",
                  color: active ? INK : MUTED,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {t.label}
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      right: 12,
                      bottom: -1,
                      height: 2,
                      background: ACCENT,
                      borderRadius: 2,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      <main style={{ padding: "20px", maxWidth: 720, margin: "0 auto" }}>{children}</main>
    </div>
  );
};

const MenuItem = ({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      padding: "10px 10px",
      background: "transparent",
      border: "none",
      borderRadius: 10,
      cursor: "pointer",
      fontFamily: SANS,
      fontSize: 14,
      color: INK,
      textAlign: "left",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(2,2,2,0.04)")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
  >
    <span style={{ display: "inline-flex", color: MUTED }}>{icon}</span>
    {label}
  </button>
);

export default BusinessLayout;
