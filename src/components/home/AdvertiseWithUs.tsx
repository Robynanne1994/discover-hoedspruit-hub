import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const AdvertiseWithUs = () => {
  const navigate = useNavigate();

  return (
    <section style={{ padding: "36px 24px 40px" }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(43,36,32,0.35)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 10 }}>
          FOR BUSINESSES
        </div>
        <div style={{ fontWeight: 900, fontSize: 22, color: "#2b2420", textTransform: "uppercase", letterSpacing: 0.3, lineHeight: 1.1, marginBottom: 10 }}>
          WANT TO BE LISTED?
        </div>
        <p style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          fontSize: 13,
          color: "rgba(43,36,32,0.45)",
          lineHeight: 1.5,
          marginBottom: 22,
        }}>
          If you run a business in Hoedspruit and want to reach more people, we'd love to feature you.
        </p>
        <button
          onClick={() => navigate("/contact")}
          style={{
            background: "#2b2420",
            borderRadius: 9999,
            padding: "12px 22px",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", letterSpacing: 0.3 }}>Get in Touch</span>
          <ArrowUpRight size={14} color="#ffffff" strokeWidth={2.5} />
        </button>
      </div>
    </section>
  );
};

export default AdvertiseWithUs;
