import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const AdvertiseWithUs = () => {
  const navigate = useNavigate();

  return (
    <section style={{ padding: "36px 16px 40px" }}>
      <div style={{
        background: "#121214",
        borderRadius: 16,
        padding: "32px 24px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.06)",
        }} />
        <div style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.04)",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 10 }}>
            FOR BUSINESSES
          </div>
          <div style={{ fontWeight: 900, fontSize: 22, color: "#ffffff", textTransform: "uppercase", letterSpacing: 0.3, lineHeight: 1.1, marginBottom: 10 }}>
            WANT TO BE LISTED?
          </div>
          <p style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            fontSize: 13,
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.5,
            marginBottom: 22,
          }}>
            If you run a business in Hoedspruit and want to reach more people, we'd love to feature you.
          </p>
          <button
            onClick={() => navigate("/contact")}
            style={{
              background: "#ffffff",
              borderRadius: 9999,
              padding: "12px 22px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "none",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "#2b2420", letterSpacing: 0.3 }}>Get in Touch</span>
            <ArrowUpRight size={14} color="#121214" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default AdvertiseWithUs;
