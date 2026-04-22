import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, ArrowUpRight, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const HW = "'Helvetica World', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const HN = "'Helvetica Neue', 'Helvetica World', Helvetica, Arial, sans-serif";

const PAGE_BG = "#EBEBEB";
const SURFACE = "#FFFFFF";
const CORAL = "#F26A48";
const TEXT = "#0A0A0A";
const MUTED = "#8A8480";
const WARM = "#F2EFEC";
const WARM_GREY = "#E8E4DF";

type Platform = "Facebook" | "Whatsapp" | "Instagram" | "Websites" | "Radio";
type AvatarTone = "warm" | "warm-grey" | "coral" | "dark";

interface Resource {
  id: string;
  title: string;
  platform: Platform;
  meta: string;
  description: string;
  url: string;
  tone: AvatarTone;
}

const FEATURED = {
  eyebrow: "This Week's Pick",
  title: "Hoedspruit Helpers",
  description:
    "The unofficial town hall. Lost dogs, found keys, plumber recommendations and the actual road conditions to Tzaneen.",
  platform: "Facebook Group",
  count: "14.2k Members",
  url: "https://www.facebook.com/groups/hoedspruithelpers",
};

const RESOURCES: Resource[] = [
  // Facebook
  { id: "fb-1", title: "Buy & Sell Hoedspruit", platform: "Facebook", meta: "Facebook Group · 9.8k members", description: "Furniture, bakkies, wedding dresses, the occasional zebra. Everything ends up here first.", url: "https://www.facebook.com", tone: "warm" },
  { id: "fb-2", title: "Lost & Found Pets", platform: "Facebook", meta: "Facebook Group · 3.1k members", description: "Reunites about a dog a week. Worth joining even if you don't have one.", url: "https://www.facebook.com", tone: "coral" },
  { id: "fb-3", title: "Khulula Tribe", platform: "Facebook", meta: "Facebook Group · 2.4k members", description: "Local community fund. Posts about projects, events, and ways to get involved.", url: "https://www.facebook.com", tone: "warm" },
  { id: "fb-4", title: "Hoedspruit Noticeboard", platform: "Facebook", meta: "Facebook Group · 7.6k members", description: "Notices, jobs, services and the occasional opinion piece nobody asked for.", url: "https://www.facebook.com", tone: "warm-grey" },
  // Whatsapp
  { id: "wa-1", title: "Hoedspruit Alerts", platform: "Whatsapp", meta: "Whatsapp Channel · Broadcast only", description: "Power outages, road closures, security incidents. The first place anything breaks.", url: "https://whatsapp.com", tone: "dark" },
  { id: "wa-2", title: "Farmers Market Updates", platform: "Whatsapp", meta: "Whatsapp Channel · Weekly", description: "Who's setting up, what's in season, what time the bread runs out.", url: "https://whatsapp.com", tone: "warm" },
  { id: "wa-3", title: "School Run Carpool", platform: "Whatsapp", meta: "Whatsapp Group · Invite only", description: "Parents coordinating lifts to and from the local schools each week.", url: "https://whatsapp.com", tone: "warm-grey" },
  // Instagram
  { id: "ig-1", title: "@VisitHoedspruit", platform: "Instagram", meta: "Instagram · 28k followers", description: "The official tourism feed. Reliable for what's open, what's new and which lodges are hiring.", url: "https://instagram.com", tone: "coral" },
  { id: "ig-2", title: "@EatOutHoedspruit", platform: "Instagram", meta: "Instagram · 6.3k followers", description: "Restaurant openings, weekly specials, who's doing pizza nights.", url: "https://instagram.com", tone: "warm" },
  // Websites
  { id: "web-1", title: "Hoedspruit Tourism Association", platform: "Websites", meta: "Website · Official", description: "The directory the lodges actually use. Listings, events and town updates.", url: "https://hoedspruit.co.za", tone: "warm-grey" },
  { id: "web-2", title: "Kruger Park Daily", platform: "Websites", meta: "Website · News", description: "Park news, sightings and gate updates from the wider Kruger region.", url: "https://krugerparkdaily.com", tone: "warm" },
  // Radio
  { id: "ra-1", title: "HoedspruitFM 95.6", platform: "Radio", meta: "Radio · 95.6 FM", description: "Local voices, local music, traffic reports for the R40 you'll actually use.", url: "https://hoedspruitfm.co.za", tone: "dark" },
];

const PLATFORM_ORDER: Platform[] = ["Facebook", "Whatsapp", "Instagram", "Websites", "Radio"];
const CHIPS: ("All" | Platform)[] = ["All", ...PLATFORM_ORDER];

const toneStyles: Record<AvatarTone, { bg: string; fg: string }> = {
  warm: { bg: WARM, fg: TEXT },
  "warm-grey": { bg: WARM_GREY, fg: TEXT },
  coral: { bg: CORAL, fg: "#FFFFFF" },
  dark: { bg: TEXT, fg: "#FFFFFF" },
};

const baseText = { fontFamily: HN, fontWeight: 400 as const, fontStretch: "normal" as const, fontSynthesis: "none" as const };

const IconButton = ({ children, onClick, ariaLabel, size = 44 }: { children: React.ReactNode; onClick: () => void; ariaLabel: string; size?: number }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      background: SURFACE,
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    }}
  >
    {children}
  </button>
);

const Avatar = ({ tone, label }: { tone: AvatarTone; label: string }) => {
  const { bg, fg } = toneStyles[tone];
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 999,
        background: bg,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ fontFamily: HW, fontWeight: 500, fontSize: 20, color: fg, lineHeight: 1 }}>{label}</span>
    </div>
  );
};

const ResourceCard = ({ r }: { r: Resource }) => {
  const [parts1, parts2] = r.meta.split(" · ");
  const initial = r.title.replace(/^@/, "").charAt(0).toUpperCase();

  const open = () => window.open(r.url, "_blank", "noopener,noreferrer");

  return (
    <button
      onClick={open}
      style={{
        ...baseText,
        textAlign: "left",
        background: SURFACE,
        border: "none",
        borderRadius: 24,
        padding: 20,
        margin: "0 24px",
        cursor: "pointer",
        position: "relative",
        display: "block",
        width: "calc(100% - 48px)",
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <Avatar tone={r.tone} label={initial} />
        <div style={{ flex: 1, minWidth: 0, paddingRight: 24 }}>
          <h4 style={{ ...baseText, fontSize: 22, lineHeight: "25.3px", letterSpacing: "-0.22px", color: TEXT, margin: 0 }}>{r.title}</h4>
          <div style={{ ...baseText, fontSize: 12, lineHeight: "15.6px", letterSpacing: "0.12px", color: MUTED, marginTop: 6 }}>
            {parts1}
            {parts2 && (
              <>
                <span style={{ color: WARM_GREY, margin: "0 6px" }}>·</span>
                {parts2}
              </>
            )}
          </div>
          <p style={{ ...baseText, fontSize: 14, lineHeight: "20.3px", color: TEXT, margin: "10px 0 0" }}>{r.description}</p>
        </div>
      </div>
      <ArrowUpRight size={16} color={TEXT} strokeWidth={1.75} style={{ position: "absolute", top: 20, right: 20 }} />
    </button>
  );
};

const SuggestSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!name.trim() || !message.trim()) {
      toast.error("Please add your name and a short description.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contact_submissions").insert({
      name: name.trim(),
      email: email.trim() || "noreply@bush-telegraph.local",
      message: `[Bush Telegraph suggestion]\n${message.trim()}`,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't send right now. Try again shortly.");
      return;
    }
    toast.success("Thanks — we'll take a look.");
    setName(""); setEmail(""); setMessage("");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(10,10,10,0.4)", display: "flex", alignItems: "flex-end" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...baseText,
          width: "100%",
          background: SURFACE,
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          padding: "20px 24px 32px",
          animation: "bt-slide-up 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        <style>{`@keyframes bt-slide-up { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 12, lineHeight: "14.4px", letterSpacing: "0.24px", color: MUTED }}>Off The App</div>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}>
            <X size={20} color={TEXT} strokeWidth={1.75} />
          </button>
        </div>
        <h2 style={{ fontFamily: HW, fontWeight: 500, fontSize: 28, lineHeight: "30px", letterSpacing: "-0.84px", color: TEXT, margin: "0 0 8px" }}>Suggest A Resource</h2>
        <p style={{ ...baseText, fontSize: 14, lineHeight: "20.3px", color: MUTED, margin: "0 0 20px" }}>
          Know a good local channel, group or feed? Drop the details and we'll have a look.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email (optional)" style={inputStyle} />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Resource name, link, and why it's worth being on" rows={4} style={{ ...inputStyle, resize: "none", paddingTop: 14 }} />
        </div>
        <button
          onClick={submit}
          disabled={submitting}
          style={{
            ...baseText,
            marginTop: 16,
            width: "100%",
            height: 52,
            borderRadius: 999,
            background: TEXT,
            color: "#FFFFFF",
            border: "none",
            fontSize: 14,
            cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Sending..." : "Send Suggestion"}
        </button>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  fontFamily: HN,
  fontWeight: 400,
  fontSize: 14,
  color: TEXT,
  background: WARM,
  border: "none",
  borderRadius: 14,
  padding: "14px 16px",
  outline: "none",
  width: "100%",
};

const SectionHeader = ({ title, count }: { title: string; count: string }) => (
  <div style={{ margin: "0 24px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
    <h2 style={{ fontFamily: HW, fontWeight: 500, fontSize: 35, lineHeight: "35px", letterSpacing: "-1.05px", color: TEXT, margin: 0 }}>{title}</h2>
    <span style={{ ...baseText, fontSize: 12, color: MUTED }}>{count}</span>
  </div>
);

const BushTelegraph = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState<"All" | Platform>("All");
  const [sheetOpen, setSheetOpen] = useState(false);

  const sections = useMemo(() => {
    const list = active === "All" ? PLATFORM_ORDER : [active as Platform];
    return list.map((p) => ({
      platform: p,
      items: RESOURCES.filter((r) => r.platform === p),
    }));
  }, [active]);

  const totalShown = sections.reduce((s, x) => s + x.items.length, 0);

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, paddingBottom: 140, ...baseText }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0" }}>
        <IconButton onClick={() => navigate(-1)} ariaLabel="Back">
          <ChevronLeft size={20} color={TEXT} strokeWidth={2} />
        </IconButton>
        <IconButton onClick={() => setSheetOpen(true)} ariaLabel="Suggest a resource">
          <Plus size={20} color={TEXT} strokeWidth={2} />
        </IconButton>
      </div>

      {/* Hero */}
      <div style={{ padding: "24px 24px 0" }}>
        <div style={{ fontSize: 12, lineHeight: "14.4px", letterSpacing: "0.24px", color: MUTED }}>Off The App</div>
        <h1 style={{ fontFamily: HW, fontWeight: 500, fontSize: 40, lineHeight: "40px", letterSpacing: "-1.2px", color: TEXT, margin: "12px 0 0" }}>
          The Bush Telegraph
        </h1>
        <p style={{ ...baseText, fontSize: 16, lineHeight: "23.2px", color: MUTED, margin: "12px 0 0", maxWidth: 320 }}>
          The local channels, groups and feeds worth being on. Curated, not crowdsourced.
        </p>
      </div>

      {/* Chips */}
      <div style={{ marginTop: 32, overflowX: "auto", scrollbarWidth: "none" }}>
        <style>{`.bt-scroll::-webkit-scrollbar { display: none; }`}</style>
        <div className="bt-scroll" style={{ display: "flex", gap: 8, padding: "0 24px", width: "max-content" }}>
          {CHIPS.map((c) => {
            const isActive = c === active;
            return (
              <button
                key={c}
                onClick={() => setActive(c)}
                style={{
                  ...baseText,
                  fontSize: 14,
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: isActive ? TEXT : SURFACE,
                  color: isActive ? "#FFFFFF" : TEXT,
                  boxShadow: isActive ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
                  whiteSpace: "nowrap",
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured */}
      <div style={{ padding: "24px 24px 0" }}>
        <div style={{ background: SURFACE, borderRadius: 24, padding: 20, position: "relative" }}>
          <div style={{ fontSize: 12, lineHeight: "14.4px", letterSpacing: "0.24px", color: MUTED }}>{FEATURED.eyebrow}</div>
          <h2 style={{ fontFamily: HW, fontWeight: 500, fontSize: 35, lineHeight: "35px", letterSpacing: "-1.05px", color: TEXT, margin: "16px 0 0" }}>
            {FEATURED.title}
          </h2>
          <p style={{ ...baseText, fontSize: 14, lineHeight: "20.3px", color: MUTED, margin: "12px 0 0", paddingRight: 56 }}>
            {FEATURED.description}
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap", paddingRight: 56 }}>
            <span style={{ ...baseText, display: "inline-flex", alignItems: "center", gap: 8, background: WARM, color: TEXT, fontSize: 12, padding: "6px 12px", borderRadius: 999 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: CORAL, display: "inline-block" }} />
              {FEATURED.platform}
            </span>
            <span style={{ ...baseText, background: WARM, color: TEXT, fontSize: 12, padding: "6px 12px", borderRadius: 999 }}>{FEATURED.count}</span>
          </div>
          <button
            onClick={() => window.open(FEATURED.url, "_blank", "noopener,noreferrer")}
            aria-label="Open featured resource"
            style={{
              position: "absolute",
              right: 20,
              bottom: 20,
              width: 44,
              height: 44,
              borderRadius: 999,
              background: TEXT,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowUpRight size={18} color="#FFFFFF" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Sections */}
      {totalShown === 0 ? (
        <div style={{ padding: "64px 24px 0", textAlign: "center" }}>
          <h4 style={{ ...baseText, fontSize: 22, lineHeight: "25.3px", letterSpacing: "-0.22px", color: TEXT, margin: 0 }}>Nothing here yet</h4>
          <p style={{ ...baseText, fontSize: 14, lineHeight: "20.3px", color: MUTED, margin: "8px auto 0", maxWidth: 280 }}>
            We're still scouting good ones for this category. Check back soon.
          </p>
        </div>
      ) : (
        sections.map((section) => {
          if (section.items.length === 0) return null;
          const count = String(section.items.length).padStart(2, "0");
          return (
            <div key={section.platform} style={{ marginTop: 40 }}>
              <SectionHeader title={section.platform} count={count} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                {section.items.map((r) => <ResourceCard key={r.id} r={r} />)}
              </div>
            </div>
          );
        })
      )}

      <SuggestSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
};

export default BushTelegraph;
