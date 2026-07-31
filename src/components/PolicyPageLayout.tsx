import { useNavigate } from "react-router-dom";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
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
            <li key={j} style={{ fontSize: 14, color: "#0a0a0a", lineHeight: 1.7 }}>{b}</li>
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
        <p key={`p-${i}`} style={{ fontSize: 14, color: "#0a0a0a", lineHeight: 1.7, margin: 0, marginBottom: 14 }}>{trimmed}</p>
      );
    }
  });
  flushBullets();

  return elements;
};

const PolicyPageLayout = ({ title, lastUpdated, sections }: PolicyPageLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#E6E0CC", paddingBottom: 100 }}>
      {/* Back button */}
      <div style={{ paddingTop: "var(--header-top)", paddingLeft: 20 }}>
        <button
          onClick={() => navigate("/terms")}
          aria-label="Back"
          style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "#FFFFFF", border: "none", padding: 0, cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <BackArrowIcon size={18} color="#1A1A1A" />
        </button>
      </div>


      {/* Title */}
      <div style={{ padding: "28px 24px 0" }}>
        <h1 style={{ fontSize: 40, fontWeight: 600, textTransform: "none", lineHeight: 0.95, letterSpacing: -0.5, color: "#0a0a0a", margin: 0 }}>
          {title}
        </h1>
        <p style={{ fontSize: 12, color: "#0a0a0a", marginTop: 12, marginBottom: 32 }}>
          {lastUpdated}
        </p>
      </div>

      {/* Sections */}
      <div style={{ padding: "0 20px" }}>
        {sections.map((section, i) => (
          <div key={i} style={{ marginTop: i === 0 ? 0 : 32 }}>
            <h2 style={{ fontFamily: "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 16, fontWeight: 800, color: "#0a0a0a", textTransform: "none", letterSpacing: 0, margin: 0, marginBottom: 14 }}>
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
