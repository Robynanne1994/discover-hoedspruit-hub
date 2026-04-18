import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Search, Sun } from "lucide-react";

const SANS = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
const DISPLAY = "'Helvetica Neue', Helvetica, 'Pragmatica', sans-serif";
const SERIF = "'Playfair Display', 'Helvetica Neue', serif";

const HomeMasthead = () => {
  const [temp, setTemp] = useState<number | null>(null);

  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=-24.35&longitude=30.95&current=temperature_2m&timezone=Africa%2FJohannesburg"
    )
      .then((r) => r.json())
      .then((d) => d?.current && setTemp(Math.round(d.current.temperature_2m)))
      .catch(() => {});
  }, []);

  return (
    <div style={{ paddingTop: 16 }}>
      {/* Top bar: only menu button on the right */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 20px 0" }}>
        <Link
          to="/account-settings"
          aria-label="Menu"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          <Menu size={16} color="#0A0A0A" strokeWidth={2} />
        </Link>
      </div>

      {/* Masthead */}
      <div style={{ padding: "28px 20px 0" }}>
        <p style={{ margin: 0, fontFamily: SANS, fontSize: 12, color: "#8A8480", marginBottom: 14 }}>
          Your local guide
        </p>
        <h1
          style={{
            margin: 0,
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 58,
            lineHeight: 0.92,
            letterSpacing: "-0.035em",
            color: "#0A0A0A",
          }}
        >
          Hello<br />Hoedspruit
        </h1>
        <p
          style={{
            marginTop: 18,
            marginBottom: 0,
            fontFamily: SANS,
            fontSize: 15,
            color: "#8A8480",
            lineHeight: 1.45,
            maxWidth: 260,
          }}
        >
          A{" "}
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, color: "#0A0A0A" }}>
            slow-paced
          </span>{" "}
          guide to eating, staying and exploring the bushveld.
        </p>
      </div>

      {/* Search row */}
      <div style={{ padding: "24px 20px 0", display: "flex", gap: 8 }}>
        <Link
          to="/categories"
          style={{
            flex: 1,
            background: "#FFFFFF",
            borderRadius: 999,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            minWidth: 0,
          }}
        >
          <Search size={16} color="#8A8480" strokeWidth={2} />
          <span
            style={{
              fontFamily: SANS,
              fontSize: 15,
              color: "#8A8480",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Search places and events
          </span>
        </Link>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 999,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <Sun size={16} color="#F26A48" strokeWidth={2} fill="#F26A48" />
          <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 500, color: "#0A0A0A" }}>
            {temp !== null ? `${temp}°` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HomeMasthead;
