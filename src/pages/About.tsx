import { MapPin, Heart, Sun, TreePine, ArrowLeft, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const values = [
  { icon: MapPin, title: "Local Knowledge", description: "Curated listings and insider tips from people who know and love Hoedspruit." },
  { icon: Heart, title: "Community Driven", description: "Supporting local businesses and helping them connect with visitors and residents." },
  { icon: Sun, title: "Always Up to Date", description: "From seasonal events to new openings, we keep our finger on the pulse of the town." },
  { icon: TreePine, title: "Nature at Heart", description: "Celebrating the incredible natural beauty and wildlife that makes Hoedspruit unique." },
];

const cardStyle: React.CSSProperties = {
  background: "rgba(18,18,20,0.03)",
  border: "1px solid rgba(18,18,20,0.06)",
  borderRadius: 16,
};

const About = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#ebebeb", paddingBottom: 100 }}>
      {/* Back */}
      <div style={{ paddingTop: 44, paddingLeft: 20, paddingRight: 20, marginBottom: 28 }}>
        <button onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ArrowLeft size={18} strokeWidth={2} color="rgba(18,18,20,0.4)" />
          <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(18,18,20,0.4)", letterSpacing: 0.2 }}>Back</span>
        </button>
      </div>

      {/* Heading */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 12 }}>
        <h1 style={{ fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif", fontWeight: 400, fontSize: 40, lineHeight: 0.95, letterSpacing: "-0.01em", color: "#020202", textTransform: "capitalize", margin: 0 }}>
          About Hello Hoedspruit
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ padding: "0 20px", marginBottom: 32 }}>
        <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontStyle: "italic", fontSize: 14, color: "rgba(18,18,20,0.4)", letterSpacing: 0.2, lineHeight: 1.4, margin: 0 }}>
          Your full guide to Hoedspruit
        </p>
      </div>

      {/* Founder photo */}
      <div style={{ padding: "0 20px", marginBottom: 28 }}>
        <div style={{ borderRadius: 16, overflow: "hidden", height: 320 }}>
          <img
            src="https://media.licdn.com/dms/image/v2/D4D03AQEovnKgk_KDnw/profile-displayphoto-crop_800_800/B4DZxSzIvCJcAM-/0/1770915663825?e=1775692800&v=beta&t=cqieS2K8_BvM9SoPttQVDEJWbBVERBzXXdwEie_hLnk"
            alt="Robyn Dawes — Founder of Hello Hoedspruit"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>

      {/* Founder section heading */}
      <div style={{ padding: "0 20px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 6 }}>THE STORY</div>
        <h2 style={{ fontWeight: 400, fontSize: 22, color: "#020202", textTransform: "uppercase", letterSpacing: 0.5, margin: 0 }}>MEET THE FOUNDER</h2>
      </div>

      {/* Founder story */}
      <div style={{ padding: "0 20px", marginBottom: 36 }}>
        <p style={{ fontSize: 14, color: "rgba(18,18,20,0.5)", lineHeight: 1.7, margin: "0 0 16px" }}>
          My name is Robyn Dawes, and Hoedspruit has been my home for as long as I can remember. I grew up surrounded by the beauty of the Lowveld, and over the years I've watched this little town blossom into something truly special.
        </p>
        <p style={{ fontSize: 14, color: "rgba(18,18,20,0.5)", lineHeight: 1.7, margin: "0 0 16px" }}>
          Having spent my whole life here, I know just how much Hoedspruit has to offer — from incredible wildlife and outdoor adventures to its warm community spirit and hidden gems that only a local would know.
        </p>
        <p style={{ fontSize: 14, color: "rgba(18,18,20,0.5)", lineHeight: 1.7, margin: 0 }}>
          The idea behind Hello Hoedspruit came from a simple frustration: there was no single place where visitors and locals alike could find everything our town has to offer. Whether you're planning a trip, new to the area, or a fellow lifelong local — Hello Hoedspruit is my way of bringing our community together.
        </p>
      </div>

      {/* Values heading */}
      <div style={{ padding: "0 20px", marginBottom: 18 }}>
        <h2 style={{ fontWeight: 400, fontSize: 22, color: "#020202", textTransform: "uppercase", letterSpacing: 0.5, margin: 0 }}>WHAT WE STAND FOR</h2>
      </div>

      {/* Value cards grid */}
      <div style={{ padding: "0 20px", marginBottom: 36, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {values.map((item) => (
          <div key={item.title} style={{ ...cardStyle, padding: "16px 16px 16px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(18,18,20,0.04)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <item.icon size={22} strokeWidth={1.5} color="#121214" />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2b2420", whiteSpace: "nowrap" }}>{item.title}</div>
          </div>
        ))}
      </div>

      {/* CTA card */}
      <div style={{ padding: "0 20px", marginBottom: 20 }}>
        <div style={{
          background: "#000000",
          borderRadius: 16,
          padding: "28px 22px 26px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.04)" }} />

          {/* Top arrow */}
          <div style={{ display: "flex", justifyContent: "flex-end", position: "relative", zIndex: 1 }}>
            <button
              onClick={() => navigate("/advertise")}
              style={{
                background: "transparent",
                border: "none",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ArrowUpRight size={16} color="#ffffff" strokeWidth={2} />
            </button>
          </div>

          {/* Content */}
          <div style={{ position: "relative", zIndex: 1, marginTop: -8 }}>
            <div style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 11,
              fontWeight: 600,
              color: "#737373",
              textTransform: "uppercase",
              letterSpacing: 3,
              marginBottom: 10,
            }}>
              FOR BUSINESSES
            </div>
            <div style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontWeight: 700,
              fontSize: 32,
              color: "#ffffff",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              marginBottom: 14,
            }}>
              Want To Be Listed?
            </div>
            <p style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontStyle: "italic",
              fontSize: 14,
              color: "#737373",
              lineHeight: 1.5,
              margin: "0 0 22px",
            }}>
              If you run a business in Hoedspruit and want to reach more people, we'd love to feature you.
            </p>
            <button
              onClick={() => navigate("/advertise")}
              style={{
                background: "#ffffff",
                borderRadius: 12,
                padding: "12px 22px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: "none",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: "#020202", letterSpacing: "-0.02em" }}>Get in Touch</span>
              <ArrowUpRight size={14} color="#020202" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default About;
