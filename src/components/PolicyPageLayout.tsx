import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

interface PolicySection {
  heading: string;
  body: string;
}

interface PolicyPageLayoutProps {
  title: string;
  lastUpdated: string;
  sections: PolicySection[];
}

const renderBody = (text: string) => {
  const lines = text.split("\n").filter(Boolean);
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10, listStyleType: "disc" }}>
          {bulletBuffer.map((b, j) => (
            <li key={j} style={{ fontSize: 14, color: "rgba(18,18,20,0.5)", lineHeight: 1.7 }}>{b}</li>
          ))}
        </ul>
      );
      bulletBuffer = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      bulletBuffer.push(trimmed.slice(2));
    } else {
      flushBullets();
      elements.push(
        <p key={`p-${i}`} style={{ fontSize: 14, color: "rgba(18,18,20,0.5)", lineHeight: 1.7, margin: 0, marginBottom: 14 }}>{trimmed}</p>
      );
    }
  });
  flushBullets();

  return elements;
};

const PolicyPageLayout = ({ title, lastUpdated, sections }: PolicyPageLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: 100 }}>
      {/* Back button */}
      <div style={{ paddingTop: 44, paddingLeft: 24 }}>
        <button
          onClick={() => navigate("/terms")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft size={18} strokeWidth={2} color="rgba(18,18,20,0.4)" />
          <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(18,18,20,0.4)", letterSpacing: 0.2 }}>Back</span>
        </button>
      </div>

      {/* Title */}
      <div style={{ padding: "28px 24px 0" }}>
        <h1 style={{ fontSize: 40, fontWeight: 400, textTransform: "none", lineHeight: 0.95, letterSpacing: -0.5, color: "#2b2420", margin: 0 }}>
          {title}
        </h1>
        <p style={{ fontSize: 12, color: "rgba(18,18,20,0.3)", marginTop: 12, marginBottom: 32 }}>
          {lastUpdated}
        </p>
      </div>

      {/* Sections */}
      <div style={{ padding: "0 20px" }}>
        {sections.map((section, i) => (
          <div key={i} style={{ marginTop: i === 0 ? 0 : 32 }}>
            <h2 style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "none", letterSpacing: 3, margin: 0, marginBottom: 14 }}>
              {section.heading}
            </h2>
            {renderBody(section.body)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PolicyPageLayout;
