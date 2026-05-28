import { Link } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import hhLogo from "@/assets/hh-logo.png";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const HomeMasthead = () => {
  return (
    <div style={{ paddingTop: 56, padding: "56px 20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "stretch", gap: 12, minWidth: 0 }}>
          <img
            src={hhLogo}
            alt="Hello Hoedspruit"
            style={{
              height: 62,
              width: "auto",
              objectFit: "contain",
              flexShrink: 0,
              alignSelf: "stretch",
            }}
          />
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: HN,
                fontWeight: 400,
                fontSize: 22,
                lineHeight: 1.05,
                letterSpacing: "0.01em",
                color: "#020202",
              }}
            >
              Hello
              <br />
              Hoedspruit
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                fontFamily: HN,
                fontWeight: 400,
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#6B6A5E",
              }}
            >
              Your Lowveld local
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Link
            to="/search"
            aria-label="Search"
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <Search size={18} color="#020202" strokeWidth={1.8} />
          </Link>
          <Link
            to="/my-notifications"
            aria-label="Notifications"
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <Bell size={18} color="#020202" strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomeMasthead;
