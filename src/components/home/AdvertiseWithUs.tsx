import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const AdvertiseWithUs = () => {
  const navigate = useNavigate();

  return (
    <section style={{ padding: "36px 4px 40px" }}>
      <div style={{
        background: "#000000",
        borderRadius: 16,
        padding: "28px 22px 26px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Top row: tagline + arrow */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 32,
        }}>
          <p style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 14,
            fontWeight: 400,
            color: "#737373",
            lineHeight: 1.4,
            maxWidth: "70%",
            margin: 0,
          }}>
            If you run a business in Hoedspruit and want to reach more people, we'd love to feature you.
          </p>
          <button
            onClick={() => navigate("/contact")}
            style={{
              background: "transparent",
              border: "none",
              borderRadius: 8,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <ArrowUpRight size={16} color="#ffffff" strokeWidth={2} />
          </button>
        </div>

        {/* Bottom: Featured + two large titles */}
        <div>
          <div style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 11,
            fontWeight: 400,
            color: "#737373",
            marginBottom: 8,
          }}>
            Featured
          </div>
          <div style={{
            display: "flex",
            gap: 24,
          }}>
            <div style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 32,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}>
              Get<br />Listed
            </div>
            <div style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 32,
              fontWeight: 700,
              color: "#737373",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}>
              Reach<br />More
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdvertiseWithUs;
