import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, X, Pencil, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PLAYFAIR = "'Playfair Display', Georgia, serif";
const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const OLIVE = "#5C6446";
const CREAM = "#EEE8DA";
const SOFT_CREAM = "#F4EFE3";
const DEEP_INK = "#2A2A24";
const MUTED_INK = "#6B6A5E";
const RUST = "#9B5A3C";
const DEEP_RUST = "#7E4530";

type Platform = "Facebook" | "WhatsApp" | "Instagram" | "Websites";
...
const PLATFORM_ORDER: Platform[] = ["Facebook", "WhatsApp", "Instagram"];
const CHIPS: ("All" | Platform)[] = ["All", "Facebook", "WhatsApp", "Instagram"];

const PLATFORM_NOUN: Record<Platform, { singular: string; plural: string }> = {
  Facebook: { singular: "Group", plural: "Groups" },
  WhatsApp: { singular: "Group", plural: "Groups" },
  Instagram: { singular: "Account", plural: "Accounts" },
  Websites: { singular: "Site", plural: "Sites" },
};

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

const IconButton = ({ children, onClick, ariaLabel }: { children: React.ReactNode; onClick: () => void; ariaLabel: string }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    style={{
      width: 44, height: 44, borderRadius: 999, background: CREAM, border: "none",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      transition: "transform 120ms ease",
    }}
    {...press}
  >
    {children}
  </button>
);

const ChannelCard = ({ r }: { r: Resource }) => {
  const tags = [r.tag_1, r.tag_2].filter((t): t is string => !!t && !!t.trim());
  const open = () => window.open(r.url, "_blank", "noopener,noreferrer");

  return (
    <button
      onClick={open}
      style={{
        textAlign: "left", background: CREAM, border: "none",
        borderRadius: 20, padding: "18px 22px 20px", cursor: "pointer",
        position: "relative", display: "block", width: "100%",
        fontFamily: HN, transition: "transform 120ms ease",
      }}
      {...press}
    >
      <div
        aria-hidden
        style={{
          position: "absolute", top: 14, right: 14, width: 30, height: 30,
          borderRadius: 999, background: "rgba(106, 106, 94, 0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, color: DEEP_INK, lineHeight: 1,
        }}
      >
        ↗
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div
          style={{
            width: 60, height: 60, borderRadius: "50%", flexShrink: 0,
            background: r.image_url ? `center/cover no-repeat url(${r.image_url})` : gradientFor(r.id),
          }}
        />
        <div style={{ flex: 1, minWidth: 0, paddingRight: 22 }}>
          <h4 style={{
            fontFamily: HN, fontWeight: 400, fontSize: 16.5, lineHeight: 1.25,
            letterSpacing: "-0.2px", color: DEEP_INK, margin: 0,
          }}>{r.title}</h4>
          <div style={{
            fontFamily: HN, fontWeight: 400, fontSize: 13, color: RUST,
            margin: "6px 0 10px",
          }}>
            {r.meta}
          </div>
          {r.description && (
            <p style={{
              fontFamily: HN, fontWeight: 400, fontSize: 13.5, lineHeight: 1.5,
              color: DEEP_INK, opacity: 0.8, margin: "0 0 12px",
            }}>{r.description}</p>
          )}
          {tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {tags.map((t, i) => (
                <span key={i} style={{
                  fontFamily: HN, fontWeight: 400, fontSize: 10.5, lineHeight: 1,
                  letterSpacing: "1.6px", textTransform: "uppercase",
                  background: SOFT_CREAM, color: MUTED_INK,
                  padding: "5px 12px", borderRadius: 999,
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
  fontFamily: HN, fontWeight: 400, fontSize: 14, color: DEEP_INK,
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
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(42,42,36,0.55)", display: "flex", alignItems: "flex-end" }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", background: CREAM, borderRadius: "24px 24px 0 0",
        padding: "20px 24px 32px", fontFamily: HN,
        animation: "bt-slide-up 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}>
        <style>{`@keyframes bt-slide-up { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: HN, fontSize: 11.5, letterSpacing: "2.4px", color: MUTED_INK, textTransform: "uppercase" }}>Off The App</div>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}>
            <X size={20} color={DEEP_INK} strokeWidth={1.75} />
          </button>
        </div>
        <h2 style={{ fontFamily: PLAYFAIR, fontWeight: 300, fontStyle: "italic", fontSize: 32, lineHeight: 1.0, letterSpacing: "-0.5px", color: DEEP_INK, margin: "0 0 10px" }}>
          suggest a channel
        </h2>
        <p style={{ fontFamily: HN, fontSize: 14, lineHeight: 1.55, color: MUTED_INK, margin: "0 0 20px" }}>
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
          background: DEEP_INK, color: CREAM, border: "none", fontSize: 14,
          cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.6 : 1,
        }}>
          {submitting ? "Sending..." : "Share Resource"}
        </button>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, count, noun }: { title: string; count: number; noun: { singular: string; plural: string } }) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 24px", marginBottom: 16 }}>
    <h2 style={{
      fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 400, fontSize: 32,
      lineHeight: 1.0, letterSpacing: "-0.5px", color: CREAM, margin: 0,
      textTransform: "none",
    }}>{title}</h2>
    <span style={{
      fontFamily: HN, fontWeight: 400, fontSize: 11, letterSpacing: "1.8px",
      textTransform: "uppercase", color: "rgba(238, 232, 218, 0.75)",
    }}>{count} {count === 1 ? noun.singular : noun.plural}</span>
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
    <div style={{ minHeight: "100vh", background: OLIVE, paddingBottom: 140, fontFamily: HN }}>
      {/* Top bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "32px 24px 0",
      }}>
        <IconButton onClick={() => navigate(-1)} ariaLabel="Back">
          <ArrowLeft size={18} color={DEEP_INK} strokeWidth={1.6} />
        </IconButton>
        <div style={{ display: "flex", gap: 10 }}>
          {isAdmin && (
            <IconButton onClick={() => navigate("/admin/bush-telegraph")} ariaLabel="Edit local channels">
              <Pencil size={18} color={DEEP_INK} strokeWidth={1.6} />
            </IconButton>
          )}
          <IconButton onClick={() => setSheetOpen(true)} ariaLabel="Suggest a resource">
            <Plus size={18} color={DEEP_INK} strokeWidth={1.6} />
          </IconButton>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: "18px 24px 0" }}>
        <div style={{
          fontFamily: HN, fontWeight: 400, fontSize: 12, letterSpacing: "2.4px",
          textTransform: "uppercase", color: "rgba(238, 232, 218, 0.7)",
          marginBottom: 14,
        }}>Off The App</div>
        <h1 style={{
          fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 300, fontSize: 56,
          lineHeight: 0.95, letterSpacing: "-1.8px", color: CREAM, margin: "0 0 16px",
          textTransform: "none",
        }}>
          local channels.
        </h1>
        <p style={{
          fontFamily: HN, fontWeight: 400, fontSize: 15, lineHeight: 1.65,
          color: "rgba(238, 232, 218, 0.9)", margin: "0 0 24px", maxWidth: 330,
        }}>
          The groups and feeds worth being on. Curated, not crowdsourced.
        </p>
      </div>

      {/* Filter pills */}
      <div style={{ marginBottom: 32, padding: "0 24px", overflowX: "auto", scrollbarWidth: "none" }}>
        <style>{`.bt-scroll::-webkit-scrollbar { display: none; }`}</style>
        <div className="bt-scroll" style={{ display: "flex", gap: 8, width: "max-content" }}>
          {CHIPS.map((c) => {
            const isActive = c === active;
            return (
              <button
                key={c}
                onClick={() => setActive(c)}
                style={{
                  fontFamily: HN, fontWeight: 400, fontSize: 13.5,
                  height: 38, padding: "0 20px", borderRadius: 999, border: "none",
                  cursor: "pointer", whiteSpace: "nowrap",
                  background: isActive ? DEEP_INK : CREAM,
                  color: isActive ? CREAM : DEEP_INK,
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
        <div style={{ padding: "0 24px", marginBottom: 32 }}>
          <div
            onClick={() => window.open(featured.url, "_blank", "noopener,noreferrer")}
            style={{
              background: RUST, borderRadius: 28,
              padding: "32px 28px 28px", position: "relative", overflow: "hidden",
              cursor: "pointer", transition: "transform 120ms ease",
            }}
            {...press}
          >
            {/* Blob 1 - dark accent bottom-right */}
            <div aria-hidden style={{
              position: "absolute", right: -80, bottom: -100,
              width: 240, height: 260, background: DEEP_RUST, opacity: 0.6,
              borderRadius: "50% 45% 55% 50% / 55% 50% 60% 45%", zIndex: 1,
            }} />
            {/* Blob 2 - cream highlight top-right */}
            <div aria-hidden style={{
              position: "absolute", right: -30, top: -60,
              width: 160, height: 170, background: CREAM, opacity: 0.08,
              borderRadius: "55% 45% 50% 55% / 50% 60% 45% 55%", zIndex: 1,
            }} />
            <div style={{
              position: "absolute", top: 22, right: 22, zIndex: 3,
              width: 38, height: 38, borderRadius: 999,
              background: "rgba(238, 232, 218, 0.25)", backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: CREAM, lineHeight: 1,
            }}>↗</div>
            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{
                fontFamily: HN, fontWeight: 400, fontSize: 11.5, letterSpacing: "2.4px",
                textTransform: "uppercase", color: "rgba(238, 232, 218, 0.8)",
                marginBottom: 18,
              }}>Featured</div>
              <h2 style={{
                fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 300, fontSize: 36,
                lineHeight: 1.02, letterSpacing: "-0.9px", color: CREAM, margin: "0 0 14px",
                textTransform: "none",
              }}>{featured.title}</h2>
              {featured.description && (
                <p style={{
                  fontFamily: HN, fontWeight: 400, fontSize: 14.5, lineHeight: 1.55,
                  color: "rgba(238, 232, 218, 0.9)", margin: "0 0 22px", maxWidth: 280,
                }}>{featured.description}</p>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {featuredChips.map((c, i) => (
                  <span key={i} style={{
                    fontFamily: HN, fontWeight: 400, fontSize: 12.5, color: DEEP_INK,
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
            fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 300, fontSize: 28,
            color: CREAM, margin: 0,
          }}>nothing here yet</h4>
          <p style={{ fontFamily: HN, fontSize: 14, lineHeight: 1.55, color: "rgba(238, 232, 218, 0.75)", margin: "8px auto 0", maxWidth: 280 }}>
            We're still scouting good ones for this category. Check back soon.
          </p>
        </div>
      ) : (
        sections.map((section, idx) => {
          if (section.items.length === 0) return null;
          return (
            <div key={section.platform} style={{ marginTop: idx === 0 ? 0 : 32 }}>
              <SectionHeader
                title={section.platform.toLowerCase()}
                count={section.items.length}
                noun={PLATFORM_NOUN[section.platform]}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "0 24px" }}>
                {section.items.map((r) => <ChannelCard key={r.id} r={r} />)}
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
