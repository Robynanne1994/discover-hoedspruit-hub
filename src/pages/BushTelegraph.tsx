import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, X, Pencil, ArrowLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const PAGE_BG = "#ECE3CF";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED = "#7A6E5C";
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

const press = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(0.985)"; },
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
  const metaParts = [r.meta, r.meta_2].filter((m) => m && m.trim());
  const displayTitle = (r.title_override?.trim()) || r.title;
  const hasOverride = !!r.title_override?.trim();

  return (
    <button
      onClick={() => onOpen(r)}
      style={{
        textAlign: "left", background: CARD, border: "none",
        borderRadius: 18, padding: "16px 18px 18px", cursor: "pointer",
        position: "relative", display: "block", width: "100%",
        fontFamily: HN, transition: "transform 120ms ease",
      }}
      {...press}
    >
      <div
        aria-hidden
        style={{
          position: "absolute", top: 14, right: 14, width: 30, height: 30,
          borderRadius: 999, background: SOFT_CREAM,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: INK,
        }}
      >
        <ArrowUpRight size={14} strokeWidth={2} />
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div
          style={{
            width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
            background: r.image_url ? `center/cover no-repeat url(${r.image_url})` : gradientFor(r.id),
          }}
        />
        <div style={{ flex: 1, minWidth: 0, paddingRight: 28 }}>
          <h4
            data-no-title-case={hasOverride ? "true" : undefined}
            style={{
              fontFamily: HN, fontWeight: 700, fontSize: 16, lineHeight: 1.25,
              letterSpacing: "-0.2px", color: INK, margin: 0,
              textTransform: hasOverride ? "none" : undefined,
            }}
          >{displayTitle}</h4>
          {metaParts.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: HN, fontWeight: 500, fontSize: 12.5, color: RUST,
              margin: "4px 0 10px", flexWrap: "wrap",
            }}>
              {metaParts.map((m, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {i > 0 && (
                    <span style={{ width: 3, height: 3, borderRadius: 999, background: RUST, display: "inline-block" }} />
                  )}
                  <span>{m}</span>
                </span>
              ))}
            </div>
          )}
          {r.description && (
            <p style={{
              fontFamily: HN, fontWeight: 400, fontSize: 13.5, lineHeight: 1.5,
              color: MUTED, margin: "0 0 12px",
            }}>{r.description}</p>
          )}
          {tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {tags.map((t, i) => (
                <span key={i} style={{
                  fontFamily: HN, fontWeight: 600, fontSize: 10.5, lineHeight: 1,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  background: TAG_BG, color: MUTED,
                  padding: "6px 11px", borderRadius: 6,
                }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

const inputStyle: React.CSSProperties = {
  fontFamily: HN, fontWeight: 400, fontSize: 14, color: INK,
  background: SOFT_CREAM, border: "none", borderRadius: 14,
  padding: "14px 16px", outline: "none", width: "100%",
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
      name: name.trim(), email: email.trim(), message: composed,
    });
    setSubmitting(false);
    if (error) { toast.error("Couldn't send right now. Try again shortly."); return; }
    toast.success("Thanks — we'll take a look.");
    setName(""); setEmail(""); setResourceName(""); setResourceLink(""); setReason("");
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(26,26,26,0.55)", display: "flex", alignItems: "flex-end" }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", background: CARD, borderRadius: "24px 24px 0 0",
        padding: "20px 24px 32px", fontFamily: HN,
        animation: "bt-slide-up 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}>
        <style>{`@keyframes bt-slide-up { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: HN, fontWeight: 600, fontSize: 11.5, letterSpacing: "0.18em", color: MUTED, textTransform: "uppercase" }}>Off The App</div>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}>
            <X size={20} color={INK} strokeWidth={1.75} />
          </button>
        </div>
        <h2 style={{ fontFamily: HN, fontWeight: 800, fontSize: 28, lineHeight: 1.1, letterSpacing: "-0.5px", color: INK, margin: "0 0 10px" }}>
          Suggest a channel
        </h2>
        <p style={{ fontFamily: HN, fontSize: 14, lineHeight: 1.55, color: MUTED, margin: "0 0 20px" }}>
          Know a good local channel, group or feed? Drop the details and we'll have a look.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Your email" style={inputStyle} />
          <input value={resourceName} onChange={(e) => setResourceName(e.target.value)} placeholder="Resource name" style={inputStyle} />
          <input value={resourceLink} onChange={(e) => setResourceLink(e.target.value)} placeholder="Resource link" style={inputStyle} />
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell us a little about this resource and why it should be listed" rows={4} style={{ ...inputStyle, resize: "none", paddingTop: 14 }} />
        </div>
        <button onClick={submit} disabled={submitting} style={{
          fontFamily: HN, marginTop: 16, width: "100%", height: 52, borderRadius: 999,
          background: DARK, color: CARD, border: "none", fontSize: 14, fontWeight: 700,
          cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.6 : 1,
        }}>
          {submitting ? "Sending..." : "Share Resource"}
        </button>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, count }: { title: string; count: number }) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 20px", marginBottom: 14 }}>
    <h2 style={{
      fontFamily: HN, fontWeight: 800, fontSize: 24,
      lineHeight: 1.0, letterSpacing: "-0.4px", color: INK, margin: 0,
    }}>{title}</h2>
    <span style={{
      fontFamily: HN, fontWeight: 500, fontSize: 14, color: MUTED,
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
  const featuredChips = featured?.meta ? featured.meta.split(" · ").filter(Boolean) : [];

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, paddingBottom: 140, fontFamily: HN }}>
      {/* Top bar */}
      <div style={{ paddingTop: 60, paddingLeft: 20, paddingRight: 20, display: "flex", alignItems: "center", gap: 12, minHeight: 40 }}>
        <CircleBtn onClick={() => navigate(-1)} ariaLabel="Back">
          <ArrowLeft size={18} color={INK} strokeWidth={2} />
        </CircleBtn>
        <div style={{ flex: 1, textAlign: "center", fontFamily: HN, fontWeight: 700, fontSize: 18, color: INK, lineHeight: 1, letterSpacing: "-0.2px" }}>
          Local Channels
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {isAdmin && (
            <CircleBtn onClick={() => navigate("/admin/bush-telegraph")} ariaLabel="Edit local channels">
              <Pencil size={16} color={INK} strokeWidth={2} />
            </CircleBtn>
          )}
          <CircleBtn onClick={() => setSheetOpen(true)} ariaLabel="Suggest a resource">
            <Plus size={18} color={INK} strokeWidth={2} />
          </CircleBtn>
        </div>
      </div>

      <div style={{ height: 1, background: LINE, margin: "20px 20px 16px 20px" }} />

      {/* Subtitle */}
      <div style={{ padding: "0 20px" }}>
        <p style={{
          fontFamily: HN, fontWeight: 400, fontSize: 14, lineHeight: 1.55,
          color: MUTED, margin: "0 0 18px", maxWidth: 340,
        }}>
          The groups and feeds worth being on. Curated, not crowdsourced.
        </p>
      </div>

      {/* Filter pills */}
      <div style={{ marginBottom: 22, padding: "0 20px", overflowX: "auto", scrollbarWidth: "none" }}>
        <style>{`.bt-scroll::-webkit-scrollbar { display: none; }`}</style>
        <div className="bt-scroll" style={{ display: "flex", gap: 8, width: "max-content" }}>
          {CHIPS.map((c) => {
            const isActive = c === active;
            return (
              <button
                key={c}
                onClick={() => setActive(c)}
                style={{
                  fontFamily: HN, fontWeight: isActive ? 700 : 500, fontSize: 13.5,
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

      {/* Featured */}
      {featured && active === "All" && (
        <div style={{ padding: "0 20px", marginBottom: 28 }}>
          <div
            onClick={() => openResource(featured)}
            style={{
              background: DARK, borderRadius: 22,
              padding: "22px 22px 22px", position: "relative", overflow: "hidden",
              cursor: "pointer", transition: "transform 120ms ease",
            }}
            {...press}
          >
            <div style={{
              position: "absolute", top: 18, right: 18, zIndex: 3,
              width: 34, height: 34, borderRadius: 999,
              background: "rgba(238, 232, 218, 0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: CREAM,
            }}>
              <ArrowUpRight size={16} strokeWidth={2} />
            </div>
            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{
                fontFamily: HN, fontWeight: 600, fontSize: 11, letterSpacing: "0.18em",
                textTransform: "uppercase", color: "rgba(238, 232, 218, 0.7)",
                marginBottom: 14,
              }}>Featured</div>
              <h2 style={{
                fontFamily: HN, fontWeight: 800, fontSize: 28,
                lineHeight: 1.1, letterSpacing: "-0.5px", color: CREAM, margin: "0 0 12px",
              }}>{featured.title}</h2>
              {featured.description && (
                <p style={{
                  fontFamily: HN, fontWeight: 400, fontSize: 14, lineHeight: 1.55,
                  color: "rgba(238, 232, 218, 0.85)", margin: "0 0 20px", maxWidth: 300,
                }}>{featured.description}</p>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {featuredChips.map((c, i) => (
                  <span key={i} style={{
                    fontFamily: HN, fontWeight: 600, fontSize: 12, color: INK,
                    background: CREAM, padding: "8px 14px", borderRadius: 999,
                  }}>{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sections */}
      {totalShown === 0 ? (
        <div style={{ padding: "64px 24px 0", textAlign: "center" }}>
          <h4 style={{
            fontFamily: HN, fontWeight: 700, fontSize: 22,
            color: INK, margin: 0,
          }}>Nothing here yet</h4>
          <p style={{ fontFamily: HN, fontSize: 14, lineHeight: 1.55, color: MUTED, margin: "8px auto 0", maxWidth: 280 }}>
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
                {section.items.map((r) => <ChannelCard key={r.id} r={r} onOpen={openResource} />)}
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
