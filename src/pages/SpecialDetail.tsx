import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  ChevronLeft,
  Heart,
  Phone,
  Share2,
  Store,
  Tag,
  Banknote,
  Ticket,
  Clock,
  Calendar,
  ExternalLink,
  MessageCircle,
  Copy,
  Pencil,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import SpecialEditDialog from "@/components/admin/SpecialEditDialog";

const FONT = "'Helvetica Neue', 'Helvetica World', Helvetica, Arial, sans-serif";

const PAGE_BG = "#EBEBEB";
const SURFACE = "#FFFFFF";
const TEXT = "#0A0A0A";
const MUTED = "#8A8480";
const DIVIDER = "#E8E4DF";

const press = {
  onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(0.98)"),
  onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
};

const eyebrow: React.CSSProperties = {
  fontFamily: FONT,
  fontWeight: 400,
  fontSize: 12,
  lineHeight: "14.4px",
  letterSpacing: "0.24px",
  textTransform: "capitalize",
  color: MUTED,
  margin: 0,
};

const sectionTitle: React.CSSProperties = {
  fontFamily: FONT,
  fontWeight: 700,
  fontSize: 28,
  lineHeight: "32px",
  letterSpacing: "-0.56px",
  color: TEXT,
  margin: 0,
};

const overlayBtn: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 999,
  background: SURFACE,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  cursor: "pointer",
  transition: "transform 150ms ease-out",
  position: "absolute",
  top: 12,
  zIndex: 10,
};

const formatPrice = (raw?: string | null) => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Pure numeric values get a Rand prefix; anything else (e.g. "20% Off",
  // "R450pp", "Buy 1 Get 1 Free") is treated as free-form text.
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const num = parseFloat(trimmed);
    return `R${Number.isInteger(num) ? num : num.toFixed(2)}`;
  }
  return trimmed;
};

const SpecialDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);

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

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: special?.title, url: shareUrl });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied!");
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied!");
    }
  };

  if (isLoading || !special) {
    return (
      <div style={{ minHeight: "100vh", background: "transparent", fontFamily: FONT }}>
        <button
          onClick={() => navigate(-1)}
          style={{ ...overlayBtn, position: "fixed", left: 24, top: 16 }}
          aria-label="Back"
        >
          <ChevronLeft size={20} strokeWidth={1.5} color={TEXT} />
        </button>
        {!isLoading && (
          <div style={{ padding: "120px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 16 }}>Special not found.</p>
            <Link to="/specials" style={{ fontSize: 14, color: TEXT }}>Back to Specials</Link>
          </div>
        )}
      </div>
    );
  }

  const fromDate = special.valid_from ? new Date(special.valid_from) : null;
  const untilDate = special.valid_until ? new Date(special.valid_until) : null;
  const validFromTxt = fromDate ? format(fromDate, "d MMM yyyy") : null;
  const validUntilTxt = untilDate ? format(untilDate, "d MMM yyyy") : null;
  let validityText: string;
  if (fromDate && untilDate) {
    const sameYear = fromDate.getFullYear() === untilDate.getFullYear();
    const fromShort = sameYear ? format(fromDate, "d MMM") : format(fromDate, "d MMM yyyy");
    validityText = `${fromShort} – ${format(untilDate, "d MMM yyyy")}`;
  } else if (validUntilTxt) {
    validityText = `Valid until ${validUntilTxt}`;
  } else if (validFromTxt) {
    validityText = `From ${validFromTxt}`;
  } else {
    validityText = "Ongoing";
  }

  const phoneClean = special.contact_phone?.replace(/\s/g, "");
  const waClean = special.contact_whatsapp?.replace(/[^0-9]/g, "");

  const detailRows: { icon: React.ReactNode; label: string; value: string; capitalize?: boolean; href?: string }[] = [
    { icon: <Store size={20} strokeWidth={1.5} color={MUTED} />, label: "Business", value: special.business_name, href: special.business_id ? `/listing/${special.business_id}` : undefined },
  ];
  const priceFmt = formatPrice(special.price);
  if (priceFmt) {
    const original = formatPrice(special.original_price);
    detailRows.push({
      icon: <Banknote size={20} strokeWidth={1.5} color={MUTED} />,
      label: "Price",
      value: original ? `${priceFmt} · was ${original}` : priceFmt,
    });
  }
  if (special.day_of_week?.length)
    detailRows.push({
      icon: <Clock size={20} strokeWidth={1.5} color={MUTED} />,
      label: "Days",
      value: special.day_of_week.map((d) => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase()).join(", "),
    });
  detailRows.push({
    icon: <Calendar size={20} strokeWidth={1.5} color={MUTED} />,
    label: "Validity",
    value: validityText,
  });
  if (special.category)
    detailRows.push({
      icon: <Tag size={20} strokeWidth={1.5} color={MUTED} />,
      label: "Category",
      value: special.category,
      capitalize: true,
    });

  const secondaryActions: { label: string; icon: React.ReactNode; onClick?: () => void; href?: string; external?: boolean }[] = [];

  return (
    <div style={{ minHeight: "100vh", background: "transparent", fontFamily: FONT, paddingBottom: 120 }}>
      {/* Hero */}
      <div style={{ position: "relative", width: "100%", height: 360, overflow: "hidden", borderBottomLeftRadius: 24, borderBottomRightRadius: 24, background: "linear-gradient(135deg, #C49B7A 0%, #8B5E3C 100%)" }}>
        {special.image_url && (
          <img
            src={special.image_url}
            alt={special.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        {/* top gradient */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 120,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0))",
            pointerEvents: "none",
          }}
        />
        <button
          onClick={() => navigate(-1)}
          style={{ ...overlayBtn, left: 12 }}
          aria-label="Back"
          {...press}
        >
          <ChevronLeft size={20} strokeWidth={1.5} color={TEXT} />
        </button>
        {(() => {
          const rightIcons: { key: string; onClick: () => void; ariaLabel: string; node: React.ReactNode }[] = [];
          if (isAdmin) {
            rightIcons.push({
              key: "edit",
              onClick: () => setEditOpen(true),
              ariaLabel: "Edit",
              node: <Pencil size={20} strokeWidth={1.5} color={TEXT} />,
            });
          }
          rightIcons.push({
            key: "share",
            onClick: handleShare,
            ariaLabel: "Share",
            node: <Share2 size={20} strokeWidth={1.5} color={TEXT} />,
          });
          rightIcons.push({
            key: "fav",
            onClick: () => {
              if (!user) {
                toast.info("Sign in to save");
                navigate("/auth");
                return;
              }
              toggleFavourite.mutate();
            },
            ariaLabel: isFavourited ? "Unsave" : "Save",
            node: (
              <Heart
                size={20}
                strokeWidth={1.5}
                color={isFavourited ? "#5b4632" : TEXT}
                fill={isFavourited ? "#5b4632" : "none"}
              />
            ),
          });
          return rightIcons.map((b, idx) => {
            const rightOffset = 12 + (rightIcons.length - 1 - idx) * (44 + 8);
            return (
              <button
                key={b.key}
                onClick={b.onClick}
                style={{ ...overlayBtn, right: rightOffset }}
                aria-label={b.ariaLabel}
                {...press}
              >
                {b.node}
              </button>
            );
          });
        })()}
      </div>

      {/* Content */}
      <div style={{ padding: "16px 24px 0 24px" }}>
        <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "14.4px", letterSpacing: "0.24px", color: "#0A0A0A", margin: 0, marginBottom: 4, textTransform: "capitalize" }}>{special.deal_label}</p>

        <h1
          style={{
            fontFamily: "'Helvetica World', 'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 500,
            fontSize: 28,
            lineHeight: "28px",
            letterSpacing: "-0.84px",
            color: "#0A0A0A",
            margin: 0,
            marginBottom: 8,
          }}
        >
          {special.title}
        </h1>

        <div style={{ marginBottom: 14 }}>
          {special.business_id ? (
            <Link
              to={`/listing/${special.business_id}`}
              style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontWeight: 500, fontSize: 14, lineHeight: "20px", letterSpacing: 0, color: "#0A0A0A", margin: 0, marginBottom: 2, textTransform: "none", textDecoration: "none", display: "block" }}
            >
              {special.business_name}
            </Link>
          ) : (
            <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontWeight: 500, fontSize: 14, lineHeight: "20px", letterSpacing: 0, color: "#0A0A0A", margin: 0, marginBottom: 2, textTransform: "none" }}>
              {special.business_name}
            </p>
          )}
          <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0, color: "#0A0A0A", margin: 0, textTransform: "none" }}>
            {validityText}
          </p>
        </div>

        {/* Primary call/whatsapp removed — moved to Contact section below */}

        {/* Secondary actions */}
        {secondaryActions.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 36 }}>
            {secondaryActions.map((a, i) => {
              const baseStyle: React.CSSProperties = {
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                height: 44,
                background: SURFACE,
                color: TEXT,
                border: `1px solid ${DIVIDER}`,
                borderRadius: 999,
                padding: "0 16px",
                fontFamily: FONT,
                fontWeight: 400,
                fontSize: 14,
                lineHeight: "18px",
                cursor: "pointer",
                textDecoration: "none",
                transition: "transform 150ms ease-out",
              };
              if (a.href) {
                return (
                  <a key={i} href={a.href} target={a.external ? "_blank" : undefined} rel={a.external ? "noopener noreferrer" : undefined} style={baseStyle} {...press}>
                    {a.icon}
                    <span>{a.label}</span>
                  </a>
                );
              }
              return (
                <button key={i} onClick={a.onClick} style={baseStyle} {...press}>
                  {a.icon}
                  <span>{a.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* About This Deal */}
        {special.description && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "'Helvetica World', 'Helvetica Neue', Helvetica, sans-serif", fontWeight: 500, fontSize: 22, lineHeight: "22px", letterSpacing: "-0.66px", color: "#0A0A0A", textTransform: "capitalize", margin: 0, marginTop: 18, marginBottom: 10 }}>About</h2>
            <p
              style={{
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontWeight: 400,
                fontSize: 14,
                lineHeight: "20.3px",
                letterSpacing: 0,
                color: "#0A0A0A",
                margin: 0,
                whiteSpace: "pre-line",
                ...(aboutExpanded ? {} : { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }),
              }}
            >
              {special.description}
            </p>
            {special.description.length > 120 && (
              <button
                onClick={() => setAboutExpanded(!aboutExpanded)}
                style={{
                  marginTop: 6,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize: 14,
                  fontWeight: 400,
                  color: "#0A0A0A",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  textTransform: "capitalize",
                }}
              >
                {aboutExpanded ? "Show Less" : "Read More"}
              </button>
            )}
          </section>
        )}

        {/* Promo code */}
        {special.promo_code && (
          <section style={{ marginBottom: 32 }}>
            <p style={{ ...eyebrow, marginBottom: 8 }}>Promo Code</p>
            <h2 style={{ fontFamily: "'Helvetica World', 'Helvetica Neue', Helvetica, sans-serif", fontWeight: 500, fontSize: 22, lineHeight: "22px", letterSpacing: "-0.66px", color: "#0A0A0A", textTransform: "capitalize", margin: 0, marginTop: 18, marginBottom: 10 }}>Promo Code</h2>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(special.promo_code!);
                  toast.success("Promo code copied!");
                } catch {
                  toast.error("Could not copy code");
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                background: SURFACE,
                border: `1px dashed ${TEXT}`,
                borderRadius: 16,
                padding: "18px 20px",
                cursor: "pointer",
                fontFamily: FONT,
                transition: "transform 150ms ease-out",
              }}
              {...press}
            >
              <span
                style={{
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: 22,
                  letterSpacing: "0.04em",
                  color: TEXT,
                  textTransform: "uppercase",
                }}
              >
                {special.promo_code}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: FONT,
                  fontSize: 13,
                  letterSpacing: "0.24px",
                  textTransform: "uppercase",
                  color: MUTED,
                }}
              >
                <Copy size={14} strokeWidth={1.5} color={MUTED} />
                Copy
              </span>
            </button>
          </section>
        )}

        {/* Details */}
        <section style={{ marginBottom: 32 }}>
          
          <h2 style={{ fontFamily: "'Helvetica World', 'Helvetica Neue', Helvetica, sans-serif", fontWeight: 500, fontSize: 22, lineHeight: "22px", letterSpacing: "-0.66px", color: "#0A0A0A", textTransform: "capitalize", margin: 0, marginTop: 18, marginBottom: 10 }}>Details</h2>
          <div
            style={{
              background: SURFACE,
              borderRadius: 24,
              padding: 20,
              border: "none",
              boxShadow: "none",
            }}
          >
            {detailRows.map((row, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: row.href ? "32px 1fr 20px" : "32px 1fr",
                  gap: 12,
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: i < detailRows.length - 1 ? `1px solid ${DIVIDER}` : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>{row.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ ...eyebrow, textTransform: "capitalize", marginBottom: 2 }}>{row.label}</p>
                  {row.href ? (
                    <Link
                      to={row.href}
                      style={{
                        fontFamily: FONT,
                        fontWeight: 400,
                        fontSize: 16,
                        lineHeight: "20px",
                        letterSpacing: 0,
                        color: TEXT,
                        margin: 0,
                        textTransform: row.capitalize ? "capitalize" : "none",
                        textDecoration: "none",
                      }}
                    >
                      {row.value}
                    </Link>
                  ) : (
                    <p
                      style={{
                        fontFamily: FONT,
                        fontWeight: 400,
                        fontSize: 16,
                        lineHeight: "20px",
                        letterSpacing: 0,
                        color: TEXT,
                        margin: 0,
                        textTransform: row.capitalize ? "capitalize" : "none",
                      }}
                    >
                      {row.value}
                    </p>
                  )}
                </div>
                {row.href && (
                  <ArrowUpRight size={20} color="#0A0A0A" strokeWidth={1.5} />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        {(phoneClean || waClean || special.booking_link) && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "'Helvetica World', 'Helvetica Neue', Helvetica, sans-serif", fontWeight: 500, fontSize: 22, lineHeight: "22px", letterSpacing: "-0.66px", color: "#0A0A0A", textTransform: "capitalize", margin: 0, marginTop: 18, marginBottom: 10 }}>Contact</h2>
            <div
              style={{
                background: SURFACE,
                borderRadius: 24,
                padding: "4px 20px",
              }}
            >
              {(() => {
                const contactRows: { icon: React.ReactNode; label: string; value: string; href: string; external?: boolean }[] = [];
                if (phoneClean) {
                  contactRows.push({
                    icon: <Phone size={20} strokeWidth={1.5} color={MUTED} />,
                    label: "Phone",
                    value: special.contact_phone!,
                    href: `tel:${phoneClean}`,
                  });
                }
                if (waClean) {
                  contactRows.push({
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={MUTED} xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.057 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.889-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.887 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.47 3.488"/>
                      </svg>
                    ),
                    label: "WhatsApp",
                    value: (() => {
                      const raw = waClean;
                      // ZA numbers: 27XXXXXXXXX -> 0XX XXX XXXX
                      if (raw.startsWith("27") && raw.length === 11) {
                        const local = "0" + raw.slice(2);
                        return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
                      }
                      return special.contact_whatsapp!;
                    })(),
                    href: `https://wa.me/${waClean}`,
                    external: true,
                  });
                }
                if (special.booking_link) {
                  const label = (special as any).booking_link_label?.trim();
                  contactRows.push({
                    icon: <ExternalLink size={20} strokeWidth={1.5} color={MUTED} />,
                    label: "Booking",
                    value: label || "Booking Link",
                    href: special.booking_link,
                    external: true,
                  });
                }
                return contactRows.map((row, i) => (
                  <a
                    key={i}
                    href={row.href}
                    target={row.external ? "_blank" : undefined}
                    rel={row.external ? "noopener noreferrer" : undefined}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "32px 1fr 20px",
                      gap: 16,
                      alignItems: "center",
                      padding: "16px 0",
                      borderBottom: i < contactRows.length - 1 ? `1px solid ${DIVIDER}` : "none",
                      textDecoration: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>{row.icon}</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 16, lineHeight: "20px", letterSpacing: 0, color: TEXT, margin: 0 }}>
                        {row.value}
                      </p>
                    </div>
                    <ArrowUpRight size={18} color={TEXT} strokeWidth={1.8} />
                  </a>
                ));
              })()}
            </div>
          </section>
        )}

        {/* Terms */}
        {special.terms && (
          <section style={{ marginBottom: 16 }}>
            <p style={{ ...eyebrow, marginBottom: 8 }}>Terms</p>
            <p
              style={{
                fontFamily: FONT,
                fontWeight: 400,
                fontSize: 12,
                lineHeight: "16px",
                letterSpacing: 0,
                color: MUTED,
                margin: 0,
                whiteSpace: "pre-line",
              }}
            >
              {special.terms}
            </p>
          </section>
        )}
      </div>
      {isAdmin && (
        <SpecialEditDialog open={editOpen} onOpenChange={setEditOpen} special={special} />
      )}
    </div>
  );
};

export default SpecialDetail;
