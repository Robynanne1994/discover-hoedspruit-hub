import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const AdvertiseWithUs = () => {
  const navigate = useNavigate();

  return (
    <section style={{ padding: "48px 24px 0" }}>
      <div style={{
        background: "#F5F0E8",
        borderRadius: 16,
        padding: 24,
        position: "relative",
      }}>
        {/* Arrow button */}
        <button
          onClick={() => navigate("/contact")}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(18,18,20,0.06)",
            border: "none",
            borderRadius: "50%",
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ArrowUpRight size={20} color="rgba(18,18,20,0.3)" strokeWidth={1.8} />
        </button>

        <p style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: 16,
          fontWeight: 400,
          color: "#2B2420",
          lineHeight: 1.4,
          maxWidth: "75%",
          marginBottom: 24,
        }}>
          If you run a business in Hoedspruit and want to reach more people, we'd love to feature you.
        </p>

        <div style={{ display: "flex", gap: 24 }}>
          <div style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 36,
            fontWeight: 700,
            color: "#D4654A",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}>
            Get<br />Listed
          </div>
          <div style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 36,
            fontWeight: 700,
            color: "#D4654A",
            opacity: 0.5,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}>
            Reach<br />More
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdvertiseWithUs;
