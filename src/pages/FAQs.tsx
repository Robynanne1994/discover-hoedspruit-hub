import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MessageCircle, Mail } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const OLIVE = "#5C6446";
const CREAM = "#EEE8DA";
const DEEP_INK = "#2A2A24";
const MUTED_INK = "#6B6A5E";
const LINE = "#D9D2C0";
const RUST = "#9B5A3C";
const DEEP_RUST = "#7E4530";

const BLOB_1 = "50% 45% 55% 50% / 55% 50% 60% 45%";
const BLOB_2 = "55% 45% 50% 55% / 50% 60% 45% 55%";

const press = (e: React.PointerEvent<HTMLElement>) => {
  e.currentTarget.style.transform = "scale(0.98)";
};
const release = (e: React.PointerEvent<HTMLElement>) => {
  e.currentTarget.style.transform = "scale(1)";
};

const BackArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={DEEP_INK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

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
      { q: "What does \"Visited\" mean?", a: "Marking a place as visited keeps a private log of where you've been. It doesn't get shared, and helps you remember your favourites." },
      { q: "How do I find events in Hoedspruit?", a: "Open the Events tab to see what's on, browse by date in the calendar view, or save events you're interested in to your saved page." },
    ],
  },
  {
    title: "Listings & Information",
    items: [
      { q: "How are businesses chosen for listing?", a: "We aim to feature every legitimate business in and around Hoedspruit. Listings are added by our team and verified with the business owner where possible." },
      { q: "Is the information accurate?", a: "We work hard to keep details current, but opening hours, prices, and offerings can change. Always check directly with the business for time-sensitive plans." },
      { q: "Why are some listings missing details?", a: "Some businesses haven't shared all their information yet. If you spot something missing or incorrect, you can suggest an edit from the listing page." },
    ],
  },
  {
    title: "For Business Owners",
    items: [
      { q: "How do I get my business listed?", a: "Head to the Advertise page and send us an enquiry, or email hello@hellohoedspruit.com. Standard listings are free." },
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

const Eyebrow = ({ children, opacity = 0.7, size = 11 }: { children: React.ReactNode; opacity?: number; size?: number }) => (
  <div style={{ fontFamily: SANS, fontSize: size, fontWeight: 400, letterSpacing: "2.4px", textTransform: "uppercase", color: `rgba(238,232,218,${opacity})` }}>
    {children}
  </div>
);

const FAQRow = ({ item, isFirst, open, onToggle }: { item: FAQ; isFirst: boolean; open: boolean; onToggle: () => void }) => (
  <div style={{ borderTop: isFirst ? "none" : `1px solid ${LINE}` }}>
    <button
      onClick={onToggle}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "none",
        border: "none",
        padding: "18px 0",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: SANS,
      }}
    >
      <span style={{ flex: 1, fontSize: 15.5, fontWeight: 400, lineHeight: 1.3, letterSpacing: "-0.1px", color: DEEP_INK }}>
        {item.q}
      </span>
      <span
        aria-hidden
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "rgba(106,106,94,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 200ms ease-out",
          fontSize: 12,
          color: DEEP_INK,
          lineHeight: 1,
        }}
      >
        ▾
      </span>
    </button>
    {open && (
      <div style={{ fontSize: 14.5, fontFamily: SANS, fontWeight: 400, lineHeight: 1.55, color: "rgba(42,42,36,0.8)", paddingTop: 4, paddingBottom: 16 }}>
        {item.a}
      </div>
    )}
  </div>
);

const FAQs = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    const id = "playfair-faqs-font";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;1,300;1,400&display=swap";
    document.head.appendChild(link);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS
      .map((s) => ({ ...s, items: s.items.filter((i) => i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q)) }))
      .filter((s) => s.items.length > 0);
  }, [query]);

  return (
    <div style={{ minHeight: "100vh", background: OLIVE, fontFamily: SANS, color: CREAM, paddingBottom: 140 }}>
      {/* Top bar */}
      <div style={{ padding: "32px 24px 0" }}>
        <button
          onClick={() => navigate(-1)}
          onPointerDown={press}
          onPointerUp={release}
          onPointerLeave={release}
          aria-label="Back"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: CREAM,
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "transform 150ms ease-out",
          }}
        >
          <BackArrow />
        </button>
      </div>

      {/* Hero */}
      <div style={{ padding: "18px 24px 0" }}>
        <div style={{ marginBottom: 14 }}>
          <Eyebrow size={12}>STUCK? START HERE</Eyebrow>
        </div>
        <h1 style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 72, lineHeight: 0.92, letterSpacing: "-2.5px", color: CREAM, margin: 0, marginBottom: 24 }}>
          help.
        </h1>
      </div>

      {/* Search */}
      <div style={{ padding: "0 24px", marginBottom: 32 }}>
        <div
          style={{
            height: 52,
            borderRadius: 999,
            background: "rgba(238,232,218,0.92)",
            display: "flex",
            alignItems: "center",
            padding: "0 22px",
            gap: 12,
          }}
        >
          <Search size={18} color={MUTED_INK} strokeWidth={1.6} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FAQs"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: SANS,
              fontSize: 14,
              fontWeight: 400,
              color: DEEP_INK,
            }}
          />
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {filtered.map((section) => (
          <div key={section.title}>
            <div style={{ padding: "0 24px", marginBottom: 10 }}>
              <Eyebrow>{section.title}</Eyebrow>
            </div>
            <div style={{ padding: "0 24px" }}>
              <div style={{ background: CREAM, borderRadius: 20, padding: "4px 22px", overflow: "hidden" }}>
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

      {/* CTA */}
      <div style={{ padding: "0 24px", marginTop: 28, marginBottom: 12 }}>
        <div style={{ position: "relative", background: RUST, borderRadius: 28, padding: "30px 28px 28px", overflow: "hidden" }}>
          <div aria-hidden style={{ position: "absolute", right: -80, bottom: -100, width: 240, height: 260, background: DEEP_RUST, borderRadius: BLOB_1, opacity: 0.6 }} />
          <div aria-hidden style={{ position: "absolute", right: -30, top: -60, width: 160, height: 170, background: "rgba(238,232,218,0.08)", borderRadius: BLOB_2 }} />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ marginBottom: 14 }}>
              <Eyebrow opacity={0.8} size={11.5}>STILL STUCK</Eyebrow>
            </div>
            <h2 style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 38, lineHeight: 1, letterSpacing: "-1px", color: CREAM, margin: 0, marginBottom: 14, textTransform: "lowercase" }}>
              ask us anything.
            </h2>
            <p style={{ fontSize: 14.5, fontWeight: 400, lineHeight: 1.55, color: "rgba(238,232,218,0.9)", margin: 0, marginBottom: 24, maxWidth: 280 }}>
              We're a small team but we answer every message. Drop us a line and we'll get back to you.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <a
                href="https://wa.me/27000000000"
                target="_blank"
                rel="noreferrer"
                onPointerDown={press}
                onPointerUp={release}
                onPointerLeave={release}
                aria-label="WhatsApp"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 50,
                  background: CREAM,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  transition: "transform 150ms ease-out",
                }}
              >
                <MessageCircle size={20} color={DEEP_INK} strokeWidth={1.6} fill="none" />
              </a>
              <a
                href="mailto:hello@hellohoedspruit.com"
                onPointerDown={press}
                onPointerUp={release}
                onPointerLeave={release}
                aria-label="Email"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 50,
                  background: CREAM,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  transition: "transform 150ms ease-out",
                }}
              >
                <Mail size={20} color={DEEP_INK} strokeWidth={1.6} fill="none" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default FAQs;
