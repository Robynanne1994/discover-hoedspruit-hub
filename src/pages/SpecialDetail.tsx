import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Heart, Phone, Share2, Store, Clock, Calendar, ExternalLink, Copy, Pencil,
  ArrowUpRight, Banknote, Tag, Send,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import SpecialEditDialog from "@/components/admin/SpecialEditDialog";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import BottomNav from "@/components/BottomNav";
import { formatSAPhone } from "@/lib/formatPhone";

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// Design tokens (match ListingDetail)
const C = {
  bg: "#E6E0CC",
  surface: "#ffffff",
  ivory: "#f5f0e8",
  border: "#E8E4DF",
  divider: "#EDE9E3",
  heading: "#020202",
  text: "#2b2420",
  muted: "#8A8480",
  primary: "#715a3d",
  accent: "#B8916A",
};

const pressScale = (s = "0.98") => ({
  onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = `scale(${s})`),
  onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
});

const headStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontFamily: FONT, fontWeight: 700, fontSize: 22, lineHeight: 1.2,
  letterSpacing: 0, textTransform: "none",
  color: C.heading,
};
const paraStyle: React.CSSProperties = {
  fontFamily: FONT, fontWeight: 400, fontSize: 14.5, lineHeight: 1.6,
  color: C.text, margin: "0 0 10px",
};
const floatBtn: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 999,
  background: "#FFFFFF", border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
};

const formatPrice = (raw?: string | null) => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const num = parseFloat(trimmed);
    return `R${Number.isInteger(num) ? num : num.toFixed(2)}`;
  }
  return trimmed;
};

type TabKey = "about" | "details" | "contact" | "terms";

const SpecialDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [tab, setTab] = useState<TabKey>("about");

  const { data: special, isLoading } = useQuery({
    queryKey: ["special-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("specials").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: isFavourited } = useQuery({
    queryKey: ["favourite", "special", id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("favourites")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", id!)
        .eq("item_type", "special")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!id,
  });

  const toggleFavourite = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (isFavourited) {
        await supabase.from("favourites").delete().eq("user_id", user.id).eq("item_id", id!).eq("item_type", "special");
      } else {
        await supabase.from("favourites").insert({ user_id: user.id, item_id: id!, item_type: "special" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favourite", "special", id] });
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
    },
  });

  const requireAuth = () => {
    if (!user) { toast.info("Sign in to use this feature"); navigate("/auth"); return true; }
    return false;
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: special?.title, url: shareUrl }); } catch (err) {
        if ((err as Error).name !== "AbortError") {
          try { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); } catch { toast.error("Could not copy link"); }
        }
      }
    } else {
      try { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); } catch { toast.error("Could not copy link"); }
    }
  };

  if (isLoading || !special) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.text }}>
        <div style={{ padding: 20 }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.primary, fontFamily: FONT, fontSize: 15 }}>
            <BackArrowIcon size={20} color={C.primary} />
            <span>Back</span>
          </button>
        </div>
        <div style={{ padding: "80px 20px", textAlign: "center", color: C.muted, fontSize: 14 }}>
          {isLoading ? "Loading..." : "Special not found."}
        </div>
      </div>
    );
  }

  const sp: any = special;
  const fromDate = special.valid_from ? new Date(special.valid_from) : null;
  const untilDate = special.valid_until ? new Date(special.valid_until) : null;
  const phoneClean = special.contact_phone?.replace(/\s/g, "");
  const waClean = special.contact_whatsapp?.replace(/[^0-9]/g, "");
  const priceFmt = formatPrice(special.price);
  const originalFmt = formatPrice(special.original_price);
  const cats = (sp.eyebrow_categories as string[] | null)?.filter((c) => c && c.trim()) ?? [];
  const eyebrowText = cats.length ? cats[0] : special.deal_label;

  // Validity status
  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;
  const fmt = (d: Date) => format(d, "d MMM yyyy");
  let dotColor = "#5C8A4A";
  let statusLabel = "Live now";
  let datesText = "Ongoing";
  if (untilDate && now > untilDate) {
    dotColor = C.muted; statusLabel = "Expired"; datesText = `ended ${fmt(untilDate)}`;
  } else if (fromDate && now < fromDate) {
    statusLabel = `Starts ${fmt(fromDate)}`;
    datesText = untilDate ? `runs to ${fmt(untilDate)}` : "ongoing";
  } else if (untilDate) {
    const daysLeft = Math.ceil((untilDate.getTime() - now.getTime()) / DAY);
    if (daysLeft <= 7) {
      dotColor = "#B05B3F";
      statusLabel = daysLeft <= 0 ? "Ends today" : daysLeft === 1 ? "Ends tomorrow" : `Ends in ${daysLeft} days`;
      datesText = `until ${fmt(untilDate)}`;
    } else {
      datesText = `valid until ${fmt(untilDate)}`;
    }
  } else if (fromDate) {
    datesText = `from ${fmt(fromDate)}`;
  }

  // Action pills
  const actions = [
    phoneClean && { key: "call", label: "Call", href: `tel:${phoneClean}`, Icon: Phone, ext: false },
    waClean && {
      key: "whatsapp", label: "WhatsApp", href: `https://wa.me/${waClean}`, ext: true,
      Icon: ({ size = 18 }: { size?: number }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={C.primary} aria-hidden="true">
          <path d="M19.05 4.91A10 10 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.02Z" />
        </svg>
      ),
    },
    special.booking_link && {
      key: "booking", label: (sp.booking_link_label?.trim() || "Booking"),
      href: special.booking_link, Icon: Send, ext: true,
    },
    special.business_id && {
      key: "business", label: "Business",
      href: `/listing/${special.business_id}`, Icon: Store, ext: false, internal: true,
    },
  ].filter(Boolean) as Array<{ key: string; label: string; href: string; Icon: any; ext: boolean; internal?: boolean }>;

  const PillBtn = ({ a, full }: { a: typeof actions[number]; full?: boolean }) => {
    const baseStyle: React.CSSProperties = {
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
      padding: "14px 18px", borderRadius: 999,
      background: C.surface, border: `1px solid ${C.border}`,
      color: C.heading, textDecoration: "none",
      fontFamily: FONT, fontWeight: 400, fontSize: 14,
      letterSpacing: "0.01em",
      flexShrink: 0,
      width: full ? "100%" : undefined,
      transition: "transform 150ms ease-out",
    };
    const content = (<>
      <a.Icon size={16} strokeWidth={1.75} color={C.heading} />
      <span>{a.label}</span>
    </>);
    if (a.internal) {
      return <Link to={a.href} style={baseStyle} {...pressScale()}>{content}</Link>;
    }
    return (
      <a href={a.href} {...(a.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})} style={baseStyle} {...pressScale()}>
        {content}
      </a>
    );
  };

  const TabBtn = ({ k, label }: { k: TabKey; label: string }) => {
    const active = tab === k;
    return (
      <button
        onClick={() => setTab(k)}
        style={{
          flex: 1, background: "none", border: "none", cursor: "pointer",
          padding: "14px 4px",
          fontFamily: FONT, fontWeight: active ? 700 : 400, fontSize: 12,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: active ? C.heading : C.muted,
          borderBottom: `2px solid ${active ? C.heading : "transparent"}`,
          marginBottom: -1,
        }}
      >
        {label}
      </button>
    );
  };

  // ----- Tab content -----
  const renderAbout = () => {
    const desc = (special.description || "").trim();
    const isLong = desc.length > 180;
    const paragraphs = desc.split("\n").filter(Boolean);
    const offerCols = [
      { icon: Banknote, label: "Price", headline: sp.price, sublabel: sp.price_label },
      { icon: Tag, label: "Offer", headline: sp.offer_headline, sublabel: sp.offer_sublabel },
      { icon: Clock, label: "Duration", headline: sp.duration_headline, sublabel: sp.duration_sublabel },
    ].filter((c) => c.headline || c.sublabel);

    return (
      <div style={{ padding: 20 }}>
        {desc && (
          <>
            <h2 style={headStyle}>About</h2>
            <div style={!aboutExpanded && isLong ? {
              display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
            } : undefined}>
              {paragraphs.map((p, i) => <p key={i} style={paraStyle}>{p}</p>)}
            </div>
            {isLong && (
              <button
                onClick={() => setAboutExpanded(!aboutExpanded)}
                style={{
                  marginTop: 6, background: "none", border: "none", padding: 0, cursor: "pointer",
                  fontFamily: FONT, fontSize: 13, color: C.primary,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                }}
              >
                {aboutExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </>
        )}

        {offerCols.length > 0 && (
          <div style={{ marginTop: desc ? 28 : 0 }}>
            <h2 style={headStyle}>The Offer</h2>
            <div style={{ background: C.surface, borderRadius: 16, padding: "4px 16px", border: `1px solid ${C.border}` }}>
              {offerCols.map((c, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${C.divider}`,
                }}>
                  <c.icon size={18} strokeWidth={1.5} color={C.primary} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted }}>
                      {c.label}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 400, color: C.heading, wordBreak: "break-word" }}>
                      {[c.headline, c.sublabel].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {special.promo_code && (
          <div style={{ marginTop: 28 }}>
            <h2 style={headStyle}>Promo Code</h2>
            <button
              onClick={async () => {
                try { await navigator.clipboard.writeText(special.promo_code!); toast.success("Promo code copied!"); }
                catch { toast.error("Could not copy code"); }
              }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                background: C.surface, border: `1px dashed ${C.primary}`,
                borderRadius: 16, padding: "18px 20px", cursor: "pointer",
                fontFamily: FONT, transition: "transform 150ms ease-out",
              }}
              {...pressScale()}
            >
              <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 20, letterSpacing: "0.08em", color: C.heading, textTransform: "uppercase" }}>
                {special.promo_code}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted }}>
                <Copy size={14} strokeWidth={1.5} color={C.muted} />
                Copy
              </span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const detailRows: { icon: any; label: string; value: React.ReactNode; href?: string; internal?: boolean }[] = [];
  if (special.business_name) {
    detailRows.push({
      icon: Store, label: "Business", value: special.business_name,
      href: special.business_id ? `/listing/${special.business_id}` : undefined,
      internal: true,
    });
  }
  if (priceFmt) {
    detailRows.push({
      icon: Banknote, label: "Price",
      value: originalFmt ? (
        <span>{priceFmt} <span style={{ color: C.muted, textDecoration: "line-through", marginLeft: 6 }}>{originalFmt}</span></span>
      ) : priceFmt,
    });
  }
  if (special.deal_label) detailRows.push({ icon: Tag, label: "Deal", value: special.deal_label });
  if (special.day_of_week?.length) {
    detailRows.push({
      icon: Clock, label: "Days",
      value: special.day_of_week.map((d) => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase()).join(", "),
    });
  }
  if (fromDate || untilDate) {
    detailRows.push({
      icon: Calendar, label: "Validity",
      value: fromDate && untilDate ? `${fmt(fromDate)} – ${fmt(untilDate)}`
        : untilDate ? `Until ${fmt(untilDate)}`
        : `From ${fmt(fromDate!)}`,
    });
  }

  const renderDetails = () => (
    <div style={{ padding: 20 }}>
      {detailRows.length === 0 ? (
        <p style={{ ...paraStyle, color: C.muted, textAlign: "center", marginTop: 40 }}>No additional details yet.</p>
      ) : (
        <div style={{ background: C.surface, borderRadius: 16, padding: "4px 16px", border: `1px solid ${C.border}` }}>
          {detailRows.map((r, i) => {
            const inner = (
              <>
                <r.icon size={18} strokeWidth={1.5} color={C.primary} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted }}>{r.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 400, color: C.heading, wordBreak: "break-word" }}>{r.value}</div>
                </div>
                {r.href && <ArrowUpRight size={16} color={C.muted} />}
              </>
            );
            const rowStyle: React.CSSProperties = {
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 0", textDecoration: "none",
              borderTop: i === 0 ? "none" : `1px solid ${C.divider}`,
            };
            if (r.href && r.internal) {
              return <Link key={i} to={r.href} style={rowStyle}>{inner}</Link>;
            }
            if (r.href) {
              return <a key={i} href={r.href} target="_blank" rel="noopener noreferrer" style={rowStyle}>{inner}</a>;
            }
            return <div key={i} style={rowStyle}>{inner}</div>;
          })}
        </div>
      )}
    </div>
  );

  const renderContact = () => {
    const rows: { Icon: any; label: string; value: string; href: string; external?: boolean }[] = [];
    if (phoneClean) rows.push({ Icon: Phone, label: "Phone", value: formatSAPhone(special.contact_phone!), href: `tel:${phoneClean}` });
    if (waClean) rows.push({ Icon: Phone, label: "WhatsApp", value: formatSAPhone(special.contact_whatsapp!), href: `https://wa.me/${waClean}`, external: true });
    if (special.booking_link) rows.push({
      Icon: ExternalLink, label: "Booking",
      value: sp.booking_link_label?.trim() || special.booking_link,
      href: special.booking_link, external: true,
    });

    return (
      <div style={{ padding: 20 }}>
        {rows.length === 0 ? (
          <p style={{ ...paraStyle, color: C.muted, textAlign: "center", marginTop: 40 }}>No contact info provided.</p>
        ) : (
          <div style={{ background: C.surface, borderRadius: 16, padding: "4px 16px", border: `1px solid ${C.border}` }}>
            {rows.map((r, i) => (
              <a key={i} href={r.href} {...(r.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 0", textDecoration: "none",
                  borderTop: i === 0 ? "none" : `1px solid ${C.divider}`,
                }}>
                <r.Icon size={18} strokeWidth={1.5} color={C.primary} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted }}>{r.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 400, color: C.heading, wordBreak: "break-word" }}>{r.value}</div>
                </div>
                <ArrowUpRight size={16} color={C.muted} />
              </a>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTerms = () => (
    <div style={{ padding: 20 }}>
      {special.terms ? (
        <div style={{ background: C.surface, borderRadius: 16, padding: 18, border: `1px solid ${C.border}` }}>
          <h2 style={headStyle}>Terms & Conditions</h2>
          <p style={{ ...paraStyle, margin: 0, whiteSpace: "pre-line", fontSize: 13.5, color: C.text }}>
            {special.terms}
          </p>
        </div>
      ) : (
        <p style={{ ...paraStyle, color: C.muted, textAlign: "center", marginTop: 40 }}>No terms provided.</p>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 100, fontFamily: FONT, color: C.text }}>
      {/* Hero (4:3) with floating action buttons */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "#DDD6C0", overflow: "hidden" }}>
        {special.image_url && (
          <img src={special.image_url} alt={special.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        )}
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            ...floatBtn,
            position: "absolute",
            top: "calc(env(safe-area-inset-top) + 16px)",
            left: 16,
            zIndex: 2,
          }}
        >
          <BackArrowIcon size={20} color={C.heading} />
        </button>
        <div style={{
          position: "absolute",
          top: "calc(env(safe-area-inset-top) + 16px)",
          right: 16,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <button onClick={() => { if (!requireAuth()) toggleFavourite.mutate(); }} aria-label={isFavourited ? "Unsave" : "Save"} style={floatBtn}>
            <Heart size={20} strokeWidth={1.6} color={isFavourited ? C.primary : C.heading} fill={isFavourited ? C.primary : "none"} />
          </button>
          <button onClick={handleShare} aria-label="Share" style={floatBtn}>
            <Share2 size={20} strokeWidth={1.6} color={C.heading} />
          </button>
          {isAdmin && (
            <button onClick={() => setEditOpen(true)} aria-label="Edit" style={floatBtn}>
              <Pencil size={18} strokeWidth={1.6} color={C.heading} />
            </button>
          )}
        </div>
      </div>

      {/* Title block */}
      <div style={{ background: C.surface, padding: "20px 20px 18px" }}>
        {eyebrowText && (
          <div style={{
            marginBottom: 8, fontSize: 11, color: C.muted,
            letterSpacing: "0.12em", textTransform: "uppercase",
          }}>
            {eyebrowText}
          </div>
        )}
        <h1 style={{
          margin: 0, fontFamily: FONT, fontWeight: 700, fontSize: 28, lineHeight: 1.15,
          color: C.heading, letterSpacing: "0.01em",
        }}>
          {special.title}
        </h1>
        {special.business_name && (
          <div style={{
            marginTop: 6, fontSize: 13, color: C.muted, letterSpacing: "0.01em",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <Store size={12} color={C.muted} strokeWidth={1.6} />
            {special.business_id ? (
              <Link to={`/listing/${special.business_id}`} style={{ color: C.muted, textDecoration: "none" }}>
                {special.business_name}
              </Link>
            ) : <span>{special.business_name}</span>}
          </div>
        )}
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: dotColor, flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, color: C.heading }}>{statusLabel}</span>
          <span style={{ fontSize: 13.5, color: C.muted }}>· {datesText}</span>
        </div>

        {actions.length > 0 && (
          actions.length === 4 ? (
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {actions.map((a) => <PillBtn key={a.key} a={a} full />)}
            </div>
          ) : (
            <div style={{ marginTop: 16, display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }} className="scrollbar-hide">
              {actions.map((a) => <PillBtn key={a.key} a={a} />)}
            </div>
          )
        )}
      </div>

      {/* Sticky tab bar */}
      <nav style={{
        position: "sticky", top: 57, zIndex: 30,
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        display: "flex", padding: "0 8px",
      }}>
        <TabBtn k="about" label="About" />
        <TabBtn k="details" label="Details" />
        <TabBtn k="contact" label="Contact" />
        {special.terms?.trim() && <TabBtn k="terms" label="Terms" />}
      </nav>

      <main>
        {tab === "about" && renderAbout()}
        {tab === "details" && renderDetails()}
        {tab === "contact" && renderContact()}
        {tab === "terms" && special.terms?.trim() && renderTerms()}
      </main>

      {isAdmin && (
        <SpecialEditDialog open={editOpen} onOpenChange={setEditOpen} special={special} />
      )}

      <BottomNav />
    </div>
  );
};

export default SpecialDetail;
