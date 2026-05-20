import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, ChevronDown } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const PAGE_BG = "#ECE3CF";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const BODY = "#5C544A";
const MUTED = "#9C9387";
const LINE = "#EAE4D5";
const ROW_LINE = "#EFE9DA";

type FAQ = { q: string; a: string };
type Section = { title: string; items: FAQ[] };

const SECTIONS: Section[] = [
  {
    title: "About Hello Hoedspruit",
    items: [
      { q: "What is Hello Hoedspruit?", a: "Hello Hoedspruit is a local guide to everything happening in and around Hoedspruit, from places to eat, stay, and explore to events, specials, and community news." },
      { q: "Who is behind Hello Hoedspruit?", a: "It's a small local team led by founder Robyn Dawes, born and raised in Hoedspruit, working with local businesses to keep the guide accurate and up to date." },
      { q: "Is the app free to use?", a: "Yes, the app is free for everyone to download and use. Listed businesses can opt into paid features like featured placement." },
    ],
  },
  {
    title: "Using The App",
    items: [
      { q: "How do I find a specific business?", a: "Use the search bar on the home screen, or browse by category. You can also filter by area, amenities, and other details on each category page." },
      { q: "Can I save listings to view later?", a: "Yes. Tap the heart icon on any listing to save it to your favourites, and organise them into custom collections from your account." },
      { q: "How do I find events in Hoedspruit?", a: "Open the Events tab to see what's on, browse by date in the calendar view, or save events you're interested in to your saved page." },
    ],
  },
  {
    title: "Listings & Information",
    items: [
      { q: "How do I list my business?", a: "Head to the Advertise page and send us an enquiry, or email hello@hellohoedspruit.com. Standard listings are free." },
      { q: "How are businesses chosen for listing?", a: "We aim to feature every legitimate business in and around Hoedspruit. Listings are added by our team and verified with the business owner where possible." },
      { q: "Is the information accurate?", a: "We work hard to keep details current, but opening hours, prices, and offerings can change. Always check directly with the business for time-sensitive plans." },
      { q: "Why are some listings missing details?", a: "Some businesses haven't shared all their information yet. If you spot something missing or incorrect, you can suggest an edit from the listing page." },
    ],
  },
  {
    title: "For Business Owners",
    items: [
      { q: "Can I update my listing details?", a: "Yes. Claim your listing from the business portal, or send us your updates and we'll handle them for you." },
      { q: "Can I be featured or advertise?", a: "Yes. We offer featured placement, sponsored content, and event promotion. See the Advertise page for details." },
    ],
  },
  {
    title: "Account & Privacy",
    items: [
      { q: "Do I need an account to use the app?", a: "Yes, a free account is required to save listings, follow people, and personalise your experience." },
      { q: "How is my data handled?", a: "We only collect what's needed to run the app, and we never sell your data. See our Privacy Policy for the full breakdown." },
      { q: "How do I delete my account?", a: "Go to Settings, then Account, and tap Delete Account. This permanently removes your profile and saved data." },
    ],
  },
  {
    title: "General",
    items: [
      { q: "First time in Hoedspruit. Where do I start?", a: "Browse the Explore tab for a feel of the area, check the Lowveld Lowdown for local stories, and see what's on this week in Events." },
      { q: "How do I report a problem or give feedback?", a: "Use the Feedback page in your account, or message us via WhatsApp or email from the Contact page. We read every message." },
    ],
  },
];

const FAQRow = ({
  item,
  isFirst,
  open,
  onToggle,
}: {
  item: FAQ;
  isFirst: boolean;
  open: boolean;
  onToggle: () => void;
}) => (
  <div style={{ borderTop: isFirst ? "none" : `1px solid ${ROW_LINE}` }}>
    <button
      onClick={onToggle}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "none",
        border: "none",
        padding: "16px 0",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: FF,
      }}
    >
      <span
        style={{
          flex: 1,
          fontSize: 14.5,
          fontWeight: open ? 600 : 500,
          lineHeight: 1.35,
          letterSpacing: "-0.1px",
          color: INK,
        }}
      >
        {item.q}
      </span>
      <span
        aria-hidden
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "#F1ECDD",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 200ms ease-out",
          color: INK,
        }}
      >
        <ChevronDown size={14} strokeWidth={2} />
      </span>
    </button>
    {open && (
      <div
        style={{
          fontSize: 14,
          fontFamily: FF,
          fontWeight: 400,
          lineHeight: 1.55,
          color: BODY,
          paddingBottom: 18,
          paddingRight: 8,
        }}
      >
        {item.a}
      </div>
    )}
  </div>
);

const FAQs = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(`${SECTIONS[0].title}-${SECTIONS[0].items[0].q}`);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS
      .map((s) => ({ ...s, items: s.items.filter((i) => i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q)) }))
      .filter((s) => s.items.length > 0);
  }, [query]);

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, fontFamily: FF, color: INK, paddingBottom: 120 }}>
      {/* Top bar */}
      <div
        style={{
          paddingTop: 60,
          paddingLeft: 20,
          paddingRight: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: 44,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: CARD,
            border: "none",
            padding: 0,
            margin: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          <ArrowLeft size={20} strokeWidth={2} color={INK} />
        </button>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            marginRight: 40,
            fontFamily: FF,
            fontSize: 22,
            fontWeight: 700,
            color: INK,
            lineHeight: 1,
            letterSpacing: "-0.2px",
          }}
        >
          FAQs
        </div>
      </div>

      <div style={{ height: 1, background: LINE, marginTop: 18, marginLeft: 20, marginRight: 20 }} />

      {/* Search */}
      <div style={{ padding: "20px 20px 0" }}>
        <div
          style={{
            height: 48,
            background: CARD,
            borderRadius: 14,
            padding: "0 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <Search size={18} strokeWidth={1.8} color={MUTED} style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FAQs"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: FF,
              fontSize: 14.5,
              color: INK,
            }}
          />
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 24 }}>
        {filtered.map((section) => (
          <div key={section.title}>
            <div
              style={{
                padding: "0 24px",
                marginBottom: 10,
                fontFamily: FF,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: MUTED,
              }}
            >
              {section.title}
            </div>
            <div style={{ padding: "0 20px" }}>
              <div
                style={{
                  background: CARD,
                  borderRadius: 18,
                  padding: "2px 20px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                {section.items.map((item, idx) => {
                  const key = `${section.title}-${item.q}`;
                  return (
                    <FAQRow
                      key={key}
                      item={item}
                      isFirst={idx === 0}
                      open={openKey === key}
                      onToggle={() => setOpenKey(openKey === key ? null : key)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default FAQs;
