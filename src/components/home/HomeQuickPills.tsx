import { Link } from "react-router-dom";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const PILLS = [
  { label: "emergencies", href: "/category/8d2d6a71-d5ee-4119-9fb4-dd24ff66a6d6" },
  { label: "party", href: "/category/2e2fe36b-a259-4487-837c-25b1ae84fef1" },
  { label: "learn", href: "/category/1383f76a-9f87-45e0-9a04-341da135bd72" },
  { label: "unwind", href: "/category/7d504654-a8d8-49c1-8cb7-75d2939bc7b1" },
  { label: "pamper", href: "/category/7d504654-a8d8-49c1-8cb7-75d2939bc7b1" },
  { label: "medical", href: "/category/21a5617a-1ef6-4697-8853-774d00f17e96" },
];

const HomeQuickPills = () => {
  return (
    <div style={{ padding: "0 20px", marginTop: 16 }}>
      <style>{`.quick-pills-scroll::-webkit-scrollbar{display:none;}`}</style>
      <div
        className="quick-pills-scroll"
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {PILLS.map(({ label, href }) => (
          <Link
            key={label}
            to={href}
            onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
            onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            style={{
              flexShrink: 0,
              whiteSpace: "nowrap",
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 999,
              padding: "7px 14px",
              fontFamily: HN,
              fontSize: 12,
              fontWeight: 400,
              color: "#2b2420",
              letterSpacing: "1px",
              textTransform: "lowercase",
              textDecoration: "none",
              transition: "transform 150ms ease-out",
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomeQuickPills;
