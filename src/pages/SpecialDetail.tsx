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
  textTransform: "uppercase",
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
  background: "rgba(255,255,255,0.95)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  cursor: "pointer",
  transition: "transform 150ms ease-out",
  position: "absolute",
  top: 56,
  zIndex: 10,
};

const formatPrice = (raw?: string | null) => {
  if (!raw) return null;
  const trimmed = raw.trim();
  const num = parseFloat(trimmed.replace(/[^0-9.]/g, ""));
  if (Number.isFinite(num)) return `R${Number.isInteger(num) ? num : num.toFixed(2)}`;
  return trimmed;
};

const SpecialDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

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
      <div style={{ minHeight: "100vh", background: PAGE_BG, fontFamily: FONT }}>
        <button
          onClick={() => navigate(-1)}
          style={{ ...overlayBtn, position: "fixed", left: 24, top: 56 }}
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

  const validFromTxt = special.valid_from ? format(new Date(special.valid_from), "d MMM yyyy") : null;
  const validUntilTxt = special.valid_until ? format(new Date(special.valid_until), "d MMM yyyy") : null;
  const validityText =
    validFromTxt && validUntilTxt
      ? `${validFromTxt} – ${validUntilTxt}`
      : validUntilTxt
        ? `Valid until ${validUntilTxt}`
        : validFromTxt
          ? `From ${validFromTxt}`
          : "Ongoing";

  const phoneClean = special.contact_phone?.replace(/\s/g, "");
  const waClean = special.contact_whatsapp?.replace(/[^0-9]/g, "");

  const detailRows: { icon: React.ReactNode; label: string; value: string; capitalize?: boolean }[] = [
    { icon: <Store size={20} strokeWidth={1.5} color={MUTED} />, label: "Business", value: special.business_name },
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
  if (special.business_id) {
    secondaryActions.push({
      label: "View Business",
      icon: <Store size={16} strokeWidth={1.5} color={TEXT} />,
      onClick: () => navigate(`/listing/${special.business_id}`),
    });
  }
  secondaryActions.push({
    label: "Share",
    icon: <Share2 size={16} strokeWidth={1.5} color={TEXT} />,
    onClick: handleShare,
  });
  if (isAdmin) {
    secondaryActions.push({
      label: "Edit",
      icon: <Pencil size={16} strokeWidth={1.5} color={TEXT} />,
      onClick: () => setEditOpen(true),
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, fontFamily: FONT, paddingBottom: 120 }}>
      {/* Hero */}
      <div style={{ position: "relative", width: "100%", height: 360, overflow: "hidden", background: "linear-gradient(135deg, #C49B7A 0%, #8B5E3C 100%)" }}>
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
          style={{ ...overlayBtn, left: 24 }}
          aria-label="Back"
          {...press}
        >
          <ChevronLeft size={20} strokeWidth={1.5} color={TEXT} />
        </button>
        <button
          onClick={() => {
            if (!user) {
              toast.info("Sign in to save");
              navigate("/auth");
              return;
            }
            toggleFavourite.mutate();
          }}
          style={{ ...overlayBtn, right: 24 }}
          aria-label={isFavourited ? "Unsave" : "Save"}
          {...press}
        >
          <Heart
            size={20}
            strokeWidth={1.5}
            color={TEXT}
            fill={isFavourited ? TEXT : "none"}
          />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "28px 24px 0 24px" }}>
        <p style={{ ...eyebrow, marginBottom: 12 }}>{special.deal_label}</p>

        <h1
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 44,
            lineHeight: "44px",
            letterSpacing: "-1.32px",
            color: TEXT,
            margin: 0,
            marginBottom: 16,
          }}
        >
          {special.title}
        </h1>

        <div style={{ marginBottom: 28 }}>
          <p style={{ fontFamily: FONT, fontSize: 16, lineHeight: "23.2px", color: TEXT, margin: 0 }}>
            {special.business_name}
          </p>
          <p style={{ fontFamily: FONT, fontSize: 16, lineHeight: "23.2px", color: MUTED, margin: 0 }}>
            {validityText}
          </p>
        </div>

        {/* Primary Call Now / WhatsApp */}
        {(phoneClean || waClean) && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {phoneClean && (
              <a
                href={`tel:${phoneClean}`}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  height: 52,
                  background: TEXT,
                  color: "#FFFFFF",
                  borderRadius: 999,
                  padding: "0 16px",
                  textDecoration: "none",
                  fontFamily: FONT,
                  fontWeight: 400,
                  fontSize: 15,
                  lineHeight: "18px",
                  transition: "transform 150ms ease-out",
                }}
                {...press}
              >
                <Phone size={16} strokeWidth={1.5} color="#FFFFFF" />
                <span>Call Now</span>
              </a>
            )}
            {waClean && (
              <a
                href={`https://wa.me/${waClean}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  height: 52,
                  background: TEXT,
                  color: "#FFFFFF",
                  borderRadius: 999,
                  padding: "0 16px",
                  textDecoration: "none",
                  fontFamily: FONT,
                  fontWeight: 400,
                  fontSize: 15,
                  lineHeight: "18px",
                  transition: "transform 150ms ease-out",
                }}
                {...press}
              >
                <MessageCircle size={16} strokeWidth={1.5} color="#FFFFFF" />
                <span>Whatsapp</span>
              </a>
            )}
          </div>
        )}

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
            <p style={{ ...eyebrow, marginBottom: 8 }}>About This Deal</p>
            <h2 style={{ ...sectionTitle, marginBottom: 16, textTransform: "none" }}>What's on offer</h2>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 16,
                lineHeight: "23.2px",
                letterSpacing: 0,
                color: TEXT,
                margin: 0,
                whiteSpace: "pre-line",
              }}
            >
              {special.description}
            </p>
          </section>
        )}

        {/* Promo code */}
        {special.promo_code && (
          <section style={{ marginBottom: 32 }}>
            <p style={{ ...eyebrow, marginBottom: 8 }}>Promo Code</p>
            <h2 style={{ ...sectionTitle, marginBottom: 16 }}>Use At Checkout</h2>
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
          
          <h2 style={{ ...sectionTitle, marginBottom: 16, textTransform: "none" }}>Details</h2>
          <div
            style={{
              background: SURFACE,
              borderRadius: 24,
              padding: "4px 20px",
            }}
          >
            {detailRows.map((row, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "32px 1fr",
                  gap: 16,
                  alignItems: "center",
                  padding: "16px 0",
                  borderBottom: i < detailRows.length - 1 ? `1px solid ${DIVIDER}` : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>{row.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ ...eyebrow, marginBottom: 2 }}>{row.label}</p>
                  <p
                    style={{
                      fontFamily: FONT,
                      fontWeight: 400,
                      fontSize: 16,
                      lineHeight: "23.2px",
                      letterSpacing: 0,
                      color: TEXT,
                      margin: 0,
                      textTransform: row.capitalize ? "capitalize" : "none",
                    }}
                  >
                    {row.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Terms */}
        {special.terms && (
          <section style={{ marginBottom: 16 }}>
            <p style={{ ...eyebrow, marginBottom: 8 }}>Terms</p>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 14,
                lineHeight: "20.3px",
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
