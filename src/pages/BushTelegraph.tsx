import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Plus, ArrowUpRight, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const HW = "'Helvetica World', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const HN = "'Helvetica Neue', 'Helvetica World', Helvetica, Arial, sans-serif";

const PAGE_BG = "#EBEBEB";
const SURFACE = "#FFFFFF";
const CORAL = "#F26A48";
const TEXT = "#0A0A0A";
const MUTED = "#8A8480";
const WARM = "#F2EFEC";
const WARM_GREY = "#E8E4DF";

type Platform = "Facebook" | "Whatsapp" | "Instagram" | "Websites";
type AvatarTone = "warm" | "warm-grey" | "coral" | "dark";

interface Resource {
  id: string;
  title: string;
  platform: Platform;
  meta: string;
  description: string;
  url: string;
  tone: AvatarTone;
  is_featured: boolean;
  image_url: string | null;
  tag_1: string | null;
  tag_2: string | null;
}

const PLATFORM_ORDER: Platform[] = ["Facebook", "Whatsapp", "Instagram", "Websites"];
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
  const tags = [r.tag_1, r.tag_2].filter((t): t is string => !!t && !!t.trim());

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
        cursor: "pointer",
        position: "relative",
        display: "block",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {r.image_url ? (
          <img
            src={r.image_url}
            alt=""
            style={{ width: 56, height: 56, borderRadius: 999, objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <Avatar tone={r.tone} label={initial} />
        )}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 24 }}>
          <h4 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: 16, lineHeight: "20px", letterSpacing: "-0.32px", color: TEXT, margin: 0, textTransform: "none" }}>{r.title}</h4>
          <div style={{ ...baseText, fontSize: 12, lineHeight: "15.6px", letterSpacing: "0.12px", color: "#5b4632", marginTop: 6 }}>
            {parts1}
            {parts2 && (
              <>
                <span style={{ color: WARM_GREY, margin: "0 6px" }}>·</span>
                {parts2}
              </>
            )}
          </div>
          <p style={{ ...baseText, fontSize: 14, lineHeight: "20.3px", color: "rgb(138, 132, 128)", margin: "10px 0 0" }}>{r.description}</p>
          {tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              {tags.map((t, i) => (
                <span
                  key={i}
                  style={{
                    ...baseText,
                    fontSize: 10,
                    lineHeight: 1,
                    letterSpacing: "0.22px",
                    textTransform: "uppercase",
                    background: WARM,
                    color: TEXT,
                    padding: "6px 10px",
                    borderRadius: 999,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <ArrowUpRight size={16} color={TEXT} strokeWidth={1.75} style={{ position: "absolute", top: 20, right: 20 }} />
    </button>
  );
};

const SuggestSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [resourceName, setResourceName] = useState("");
  const [resourceLink, setResourceLink] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!name.trim() || !email.trim() || !resourceName.trim() || !resourceLink.trim() || !reason.trim()) {
      toast.error("Please fill in all the fields.");
      return;
    }
    setSubmitting(true);
    const composed = `[Local Channels suggestion]\nResource name: ${resourceName.trim()}\nResource link: ${resourceLink.trim()}\nAbout: ${reason.trim()}`;
    const { error } = await supabase.from("contact_submissions").insert({
      name: name.trim(),
      email: email.trim(),
      message: composed,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't send right now. Try again shortly.");
      return;
    }
    toast.success("Thanks — we'll take a look.");
    setName(""); setEmail(""); setResourceName(""); setResourceLink(""); setReason("");
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
          <div style={{ fontFamily: HN, fontWeight: 500, fontSize: 12, lineHeight: "14.4px", letterSpacing: "0.24px", color: MUTED, textTransform: "uppercase" }}>Off The App</div>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}>
            <X size={20} color={TEXT} strokeWidth={1.75} />
          </button>
        </div>
        <h2 style={{ fontFamily: HW, fontWeight: 500, fontSize: 28, lineHeight: "30px", letterSpacing: "-0.84px", color: TEXT, margin: "0 0 8px", textTransform: "none" }}>Suggest a resource</h2>
        <p style={{ ...baseText, fontSize: 14, lineHeight: "20.3px", color: MUTED, margin: "0 0 20px" }}>
          Know a good local channel, group or feed? Drop the details and we'll have a look.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Your email" style={inputStyle} />
          <input value={resourceName} onChange={(e) => setResourceName(e.target.value)} placeholder="Resource name" style={inputStyle} />
          <input value={resourceLink} onChange={(e) => setResourceLink(e.target.value)} placeholder="Resource link" style={inputStyle} />
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell us a little about this resource and why it should be listed" rows={4} style={{ ...inputStyle, resize: "none", paddingTop: 14 }} />
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
          {submitting ? "Sending..." : "Share Resource"}
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
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
    <h2 style={{ fontFamily: HW, fontWeight: 500, fontSize: 28, lineHeight: "30px", letterSpacing: "-0.84px", color: TEXT, margin: 0 }}>{title}</h2>
    <span style={{ ...baseText, fontSize: 28, color: "#5b4632" }}>({count})</span>
  </div>
);

const BushTelegraph = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [active, setActive] = useState<"All" | Platform>("All");
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: resources = [] } = useQuery({
    queryKey: ["bush-telegraph"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bush_telegraph_resources")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        platform: r.platform as Platform,
        meta: r.meta ?? "",
        description: r.description ?? "",
        url: r.url,
        tone: (r.tone as AvatarTone) ?? "warm",
        is_featured: !!r.is_featured,
        image_url: r.image_url ?? null,
        tag_1: r.tag_1 ?? null,
        tag_2: r.tag_2 ?? null,
      })) as Resource[];
    },
  });

  const featured = useMemo(() => resources.find((r) => r.is_featured) ?? null, [resources]);
  const nonFeatured = useMemo(() => resources.filter((r) => !r.is_featured), [resources]);

  const sections = useMemo(() => {
    if (active === "All") {
      return PLATFORM_ORDER.map((p) => ({
        platform: p,
        items: nonFeatured.filter((r) => r.platform === p),
      }));
    }
    return [{
      platform: active as Platform,
      items: resources.filter((r) => r.platform === active),
    }];
  }, [active, nonFeatured, resources]);

  const totalShown = sections.reduce((s, x) => s + x.items.length, 0);

  return (
    <div style={{ minHeight: "100vh", background: "transparent", paddingBottom: 140, paddingLeft: 24, paddingRight: 24, ...baseText }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0 0" }}>
        <IconButton onClick={() => navigate(-1)} ariaLabel="Back">
          <ChevronLeft size={20} color={TEXT} strokeWidth={2} />
        </IconButton>
        <div style={{ display: "flex", gap: 8 }}>
          {isAdmin && (
            <IconButton onClick={() => navigate("/admin/bush-telegraph")} ariaLabel="Edit local channels">
              <Pencil size={18} color={TEXT} strokeWidth={2} />
            </IconButton>
          )}
          <IconButton onClick={() => setSheetOpen(true)} ariaLabel="Suggest a resource">
            <Plus size={20} color={TEXT} strokeWidth={2} />
          </IconButton>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: "24px 0 0" }}>
        <div style={{ fontFamily: HN, fontWeight: 500, fontSize: 12, lineHeight: "14.4px", letterSpacing: "0.24px", color: "#0a0a0a", textTransform: "uppercase" }}>Off The App</div>
        <h1 style={{ fontFamily: HW, fontWeight: 500, fontSize: 40, lineHeight: "40px", letterSpacing: "-1.2px", color: TEXT, margin: "12px 0 0" }}>
          Local Channels
        </h1>
        <p style={{ ...baseText, fontFamily: HN, fontSize: 14, lineHeight: "20.3px", color: "#0a0a0a", margin: "12px 0 0", maxWidth: 320 }}>
          The local channels, groups and feeds worth being on. Curated, not crowdsourced.
        </p>
      </div>

      {/* Chips */}
      <div style={{ marginTop: 32, overflowX: "auto", scrollbarWidth: "none" }}>
        <style>{`.bt-scroll::-webkit-scrollbar { display: none; }`}</style>
        <div className="bt-scroll" style={{ display: "flex", gap: 8, width: "max-content" }}>
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
                  background: isActive ? "#5B4632" : SURFACE,
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
      {featured && active === "All" && (
        <div style={{ padding: "24px 0 0" }}>
          <div style={{ background: SURFACE, borderRadius: 24, padding: 20, position: "relative" }}>
            <div style={{ fontSize: 12, lineHeight: "14.4px", letterSpacing: "0.24px", color: MUTED }}>FEATURED</div>
            <h2 style={{ fontFamily: HW, fontWeight: 500, fontSize: 22, lineHeight: "26px", letterSpacing: "-0.66px", color: TEXT, margin: "16px 0 0", textTransform: "none" }}>
              {featured.title}
            </h2>
            {featured.description && (
              <p style={{ ...baseText, fontSize: 14, lineHeight: "20.3px", color: MUTED, margin: "12px 0 0", paddingRight: 56 }}>
                {featured.description}
              </p>
            )}
            {featured.meta && (
              <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap", paddingRight: 56 }}>
                {featured.meta.split(" · ").map((part, i) => (
                  <span key={i} style={{ ...baseText, display: "inline-flex", alignItems: "center", gap: 8, background: WARM, color: TEXT, fontSize: 12, padding: "6px 12px", borderRadius: 999 }}>
                    {i === 0 && <span style={{ width: 6, height: 6, borderRadius: 999, background: CORAL, display: "inline-block" }} />}
                    {part}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={() => window.open(featured.url, "_blank", "noopener,noreferrer")}
              aria-label="Open featured resource"
              style={{
                position: "absolute",
                right: 20,
                bottom: 20,
                width: 44,
                height: 44,
                borderRadius: 999,
                background: "#5b4632",
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
      )}

      {/* Sections */}
      {totalShown === 0 ? (
        <div style={{ padding: "64px 0 0", textAlign: "center" }}>
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
