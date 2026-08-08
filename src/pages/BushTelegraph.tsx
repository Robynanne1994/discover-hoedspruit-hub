import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, X, Pencil, ArrowLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import Seo from "@/components/Seo";
import { MUTED as TOKEN_MUTED, tab as tabStyle, type } from "@/lib/type";


const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const PAGE_BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED = TOKEN_MUTED;
const LINE = "#E2DAC6";
const DARK = "#2E2418";
const RUST = "#C0392B";
const TAG_BG = "#EFE7D3";
const SOFT_CREAM = "#F4EFE3";
const CREAM = "#EEE8DA";

type Platform = string;

interface Resource {
  id: string;
  slug: string | null;
  title: string;
  title_override: string | null;
  platform: Platform;
  meta: string;
  meta_2: string;
  description: string;
  url: string;
  resource_type: string;
  is_featured: boolean;
  image_url: string | null;
  tag_1: string | null;
  tag_2: string | null;
}

const PLATFORM_ORDER: Platform[] = ["Facebook", "WhatsApp", "Instagram"];
const CHIPS: string[] = ["All", "Facebook", "WhatsApp", "Instagram"];

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #C9A87C 0%, #8E6F4A 100%)",
  "linear-gradient(135deg, #A8B58A 0%, #6E7A56 100%)",
  "linear-gradient(135deg, #D9B4A0 0%, #9B6F5A 100%)",
  "linear-gradient(135deg, #B8A89A 0%, #7A6A5C 100%)",
  "linear-gradient(135deg, #E5C9A4 0%, #B0895C 100%)",
  "linear-gradient(135deg, #9CAE92 0%, #5F7256 100%)",
];
const gradientFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
};

const PLATFORM_LABEL: Record<string, string> = {
  Facebook: "Facebook Group",
  WhatsApp: "WhatsApp Channel",
  Instagram: "Instagram",
};
const platformLabel = (p: string) => PLATFORM_LABEL[p] || p;

const press = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(0.98)"; },
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
};

const CircleBtn = ({ children, onClick, ariaLabel }: { children: React.ReactNode; onClick: () => void; ariaLabel: string }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    style={{
      width: 40, height: 40, borderRadius: 999, background: CARD,
      border: `1px solid ${LINE}`, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "transform 120ms ease",
    }}
    {...press}
  >
    {children}
  </button>
);

const ChannelCard = ({ r, onOpen }: { r: Resource; onOpen: (r: Resource) => void }) => {
  const tags = [r.tag_1, r.tag_2].filter((t): t is string => !!t && !!t.trim());
  const displayTitle = (r.title_override?.trim()) || r.title;
  const memberCount = r.meta_2?.trim();
  const image = r.image_url;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(r)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(r); } }}
      style={{
        position: "relative",
        width: "100%", height: 128,
        background: CARD, borderRadius: 16,
        boxShadow: "0 1px 4px -1px rgba(0,0,0,0.04)",
        display: "flex", alignItems: "center",
        overflow: "hidden",
        cursor: "pointer",
        fontFamily: HN,
        transition: "transform 150ms ease-out",
      }}
      {...press}
    >
      <div style={{ width: 90, height: 128, flexShrink: 0, alignSelf: "stretch", background: "#F4EFE3" }}>
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: gradientFor(r.id) }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
        <div style={{ fontFamily: HN, fontSize: 12, fontWeight: 500, color: "#6B6A5E" }}>
          {platformLabel(r.platform)}
        </div>
        <div
          data-no-title-case={r.title_override?.trim() ? "true" : undefined}
          style={{
            fontFamily: HN, fontSize: 15, fontWeight: 500, color: "#1A1A1A",
            lineHeight: 1.25, marginTop: 4,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textTransform: r.title_override?.trim() ? "none" : undefined,
          }}
        >{displayTitle}</div>
        {memberCount && (
          <div style={{ fontFamily: HN, fontSize: 12, fontWeight: 500, color: "#6B6A5E", marginTop: 4 }}>
            {memberCount}
          </div>
        )}
        {tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {tags.map((t, i) => (
              <span
                key={i}
                style={{
                  fontFamily: HN, fontSize: 10, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  color: "#715A3D", background: "#EEE8DA",
                  borderRadius: 999, padding: "5px 9px",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <ArrowUpRight
        size={16}
        strokeWidth={1.8}
        color="#715A3D"
        style={{ position: "absolute", top: 14, right: 14 }}
      />
    </div>
  );
};

const suggestInputStyle: React.CSSProperties = {
  ...type.input,
  background: "#fff", border: `2px solid #C5C0BA`, borderRadius: 12,
  padding: "13px 14px", outline: "none", width: "100%", boxSizing: "border-box",
  lineHeight: 1.4,
};

const suggestLabelStyle: React.CSSProperties = {
  ...type.eyebrow,
  textTransform: "uppercase", color: "#715a3d", marginBottom: 6, display: "block",
};

const SuggestSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const isGuest = !user;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [resourceName, setResourceName] = useState("");
  const [resourceLink, setResourceLink] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    const effectiveName = isGuest ? name.trim() : ((user?.user_metadata as any)?.full_name || user?.email || "Member");
    const effectiveEmail = isGuest ? email.trim() : (user?.email || "");
    if ((isGuest && (!name.trim() || !email.trim())) || !resourceName.trim() || !resourceLink.trim() || !reason.trim()) {
      toast.error("Please fill in all the fields.");
      return;
    }
    setSubmitting(true);
    const composed = `[Local Channels suggestion]\nResource name: ${resourceName.trim()}\nResource link: ${resourceLink.trim()}\nAbout: ${reason.trim()}`;
    const { error } = await supabase.from("contact_submissions").insert({
      name: effectiveName, email: effectiveEmail, message: composed,
    });
    setSubmitting(false);
    if (error) { toast.error("Couldn't send right now. Try again shortly."); return; }
    toast.success("Thanks — we'll take a look.");
    setName(""); setEmail(""); setResourceName(""); setResourceLink(""); setReason("");
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(10,10,10,0.4)", display: "flex", alignItems: "flex-end" }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        fontFamily: HN, width: "100%", background: "#ffffff",
        borderRadius: "20px 20px 0 0", padding: "20px 20px 32px",
        animation: "bt-slide-up 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <style>{`@keyframes bt-slide-up { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: HN, fontSize: 11, letterSpacing: "0.08em", color: MUTED, textTransform: "uppercase" }}>{"\n"}</div>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}>
            <X size={20} color={INK} strokeWidth={1.75} />
          </button>
        </div>
        <h2 style={{ ...type.sectionTitle, margin: "0 0 8px" }}>Suggest a Channel</h2>
        <p style={{ ...type.body, color: MUTED, margin: "0 0 20px" }}>
          Know a good local channel, group or feed? Share the details below and we will review and add it if it meets our criteria.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {isGuest && (
            <>
              <div>
                <label style={suggestLabelStyle}>Your name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Smith" style={suggestInputStyle} />
              </div>
              <div>
                <label style={suggestLabelStyle}>Your email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" style={suggestInputStyle} />
              </div>
            </>
          )}
          <div>
            <label style={suggestLabelStyle}>Resource name</label>
            <input value={resourceName} onChange={(e) => setResourceName(e.target.value)} placeholder="e.g. Hoedspruit Community Group" style={suggestInputStyle} />
          </div>
          <div>
            <label style={suggestLabelStyle}>Resource link</label>
            <input value={resourceLink} onChange={(e) => setResourceLink(e.target.value)} placeholder="https://..." style={suggestInputStyle} />
          </div>
          <div>
            <label style={suggestLabelStyle}>About</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell us a little about this resource and why it should be listed." rows={5} style={{ ...suggestInputStyle, resize: "none" }} />
          </div>
        </div>
        <button onClick={submit} disabled={submitting} style={{
          fontFamily: HN, marginTop: 20, width: "100%", height: 48, borderRadius: 999,
          background: "#423324", color: "#FFFFFF", border: "none", ...type.button,
          cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.6 : 1,
        }}>
          {submitting ? "Sending..." : "Send Suggestion"}
        </button>
      </div>
    </div>
  );
};


const SectionHeader = ({ title, count }: { title: string; count: number }) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 20px", marginBottom: 14 }}>
    <h2 style={{
      ...type.sectionTitle, margin: 0,
    }}>{title}</h2>
    <span style={{
      ...type.meta,
    }}>({count})</span>
  </div>
);

const BushTelegraph = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [active, setActive] = useState<string>("All");
  const [sheetOpen, setSheetOpen] = useState(false);

  const openResource = (r: Resource) => {
    if (r.slug) navigate(`/local-channels/${r.slug}`);
    else if (r.url) window.open(r.url, "_blank", "noopener,noreferrer");
  };


  const { data: resources = [] } = useQuery({
    queryKey: ["bush-telegraph"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bush_telegraph_resources")
        .select("*")
        // Featured channels head up their platform section, then the admin's
        // own sort order fills in behind them.
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        slug: r.slug ?? null,
        title: r.title,
        title_override: r.title_override ?? null,
        platform: r.platform as Platform,
        meta: r.meta ?? "",
        meta_2: r.meta_2 ?? "",
        description: r.description ?? "",
        url: r.url ?? "",
        resource_type: r.resource_type ?? "link",
        is_featured: !!r.is_featured,
        image_url: r.image_url ?? null,
        tag_1: r.tag_1 ?? null,
        tag_2: r.tag_2 ?? null,
      })) as Resource[];
    },
  });

  const sections = useMemo(() => {
    if (active === "All") {
      return PLATFORM_ORDER.map((p) => ({
        platform: p,
        items: resources.filter((r) => r.platform === p),
      }));
    }
    return [{
      platform: active as Platform,
      items: resources.filter((r) => r.platform === active),
    }];
  }, [active, resources]);


  const totalShown = sections.reduce((s, x) => s + x.items.length, 0);


  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, paddingBottom: 140, fontFamily: HN }}>
      <Seo
        title="Local Channels — Hello Hoedspruit"
        description="Discover community WhatsApp groups, newsletters, podcasts and other local channels keeping Hoedspruit connected."
        path="/local-channels"
      />
      {/* Top bar */}
      <PageHeader
        title="Local Channels"
        left={
          <CircleBtn onClick={() => navigate(-1)} ariaLabel="Back">
            <ArrowLeft size={18} color={INK} strokeWidth={2} />
          </CircleBtn>
        }
        right={
          <>
            {isAdmin && (
              <CircleBtn onClick={() => navigate("/admin/local-channels")} ariaLabel="Edit local channels">
                <Pencil size={16} color={INK} strokeWidth={2} />
              </CircleBtn>
            )}
            <CircleBtn onClick={() => setSheetOpen(true)} ariaLabel="Suggest a resource">
              <Plus size={18} color={INK} strokeWidth={2} />
            </CircleBtn>
          </>
        }
      />


      {/* Filter pills */}
      <div style={{ marginTop: 12, marginBottom: 36, padding: "0 20px", overflowX: "auto", scrollbarWidth: "none" }}>
        <style>{`.bt-scroll::-webkit-scrollbar { display: none; }`}</style>
        <div className="bt-scroll" style={{ display: "flex", gap: 8, width: "max-content" }}>
          {CHIPS.map((c) => {
            const isActive = c === active;
            return (
              <button
                key={c}
                onClick={() => setActive(c)}
                style={{
                  ...tabStyle(isActive),
                  height: 36, padding: "0 18px", borderRadius: 999,
                  border: `1px solid ${isActive ? DARK : LINE}`,
                  cursor: "pointer", whiteSpace: "nowrap",
                  background: isActive ? DARK : CARD,
                  color: isActive ? CARD : INK,
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>




      {/* Sections */}
      {totalShown === 0 ? (
        <div style={{ padding: "64px 24px 0", textAlign: "center" }}>
          <h4 style={{
            ...type.sectionTitle,
            color: INK, margin: 0,
          }}>Nothing here yet</h4>
          <p style={{ ...type.body, color: MUTED, margin: "8px auto 0", maxWidth: 280 }}>
            We're still scouting good ones for this category. Check back soon.
          </p>
        </div>
      ) : (
        sections.map((section, idx) => {
          if (section.items.length === 0) return null;
          return (
            <div key={section.platform} style={{ marginTop: idx === 0 ? 0 : 28 }}>
              <SectionHeader
                title={section.platform}
                count={section.items.length}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 20px" }}>
                {section.items.map((r) => (
                  <ChannelCard
                    key={r.id}
                    r={r}
                    onOpen={openResource}
                  />
                ))}
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
