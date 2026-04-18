import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ImageLightbox from "@/components/ImageLightbox";
import { format } from "date-fns";
import {
  ArrowLeft,
  Store,
  Calendar,
  Tag,
  Banknote,
  Phone,
  MessageCircle,
  ExternalLink,
  Share2,
  Clock,
  FileText,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";

const font = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const SpecialDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: special, isLoading } = useQuery({
    queryKey: ["special-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("specials").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
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

  const BackButton = () => (
    <div style={{ paddingTop: 16, paddingLeft: 20, paddingRight: 20, marginBottom: 16 }}>
      <button onClick={() => navigate(-1)} className="flex items-center" style={{ gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <ArrowLeft size={20} strokeWidth={1.8} style={{ color: "#2B2420" }} />
        <span style={{ fontSize: 15, fontWeight: 500, color: "#2B2420", fontFamily: font }}>Back</span>
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div style={{ background: "#EBEBEB", minHeight: "100dvh", display: "flex", flexDirection: "column", paddingBottom: 84, fontFamily: font }}>
        <BackButton />
        <div className="flex flex-col items-center justify-center" style={{ paddingTop: 80, paddingLeft: 20, paddingRight: 20 }}>
          <div className="animate-pulse" style={{ width: 48, height: 48, borderRadius: 9999, background: "rgba(18,18,20,0.06)", marginBottom: 14 }} />
          <p style={{ fontSize: 13, color: "rgba(18,18,20,0.4)", fontFamily: font }}>Loading special...</p>
        </div>
      </div>
    );
  }

  if (!special) {
    return (
      <div style={{ background: "#EBEBEB", minHeight: "100dvh", display: "flex", flexDirection: "column", paddingBottom: 84, fontFamily: font }}>
        <BackButton />
        <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 80, textAlign: "center" }}>
          <p style={{ fontFamily: font, fontWeight: 400, fontSize: 20, color: "#020202", textTransform: "uppercase", marginBottom: 8 }}>Special not found</p>
          <p style={{ fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.45)", lineHeight: 1.5, fontFamily: font }}>This special may have ended or been removed.</p>
        </div>
      </div>
    );
  }

  const validFrom = special.valid_from ? format(new Date(special.valid_from), "d MMM yyyy") : null;
  const validUntil = special.valid_until ? format(new Date(special.valid_until), "d MMM yyyy") : null;
  const validityText = validFrom && validUntil
    ? `${validFrom} – ${validUntil}`
    : validUntil
      ? `Until ${validUntil}`
      : validFrom
        ? `From ${validFrom}`
        : "Ongoing";

  const detailRows = [
    { label: "Business", value: special.business_name, icon: Store },
    { label: "Deal", value: special.deal_label, icon: Tag },
    special.price || special.original_price
      ? { label: "Price", value: [special.price, special.original_price ? `was ${special.original_price}` : null].filter(Boolean).join(" · "), icon: Banknote }
      : null,
    special.special_type ? { label: "Type", value: special.special_type, icon: Ticket } : null,
    special.day_of_week?.length ? { label: "Days", value: special.day_of_week.join(", "), icon: Clock } : null,
    { label: "Validity", value: validityText, icon: Calendar },
    special.category ? { label: "Category", value: special.category, icon: Tag } : null,
  ].filter(Boolean) as { label: string; value: string; icon: any }[];

  const contactRows = [
    special.contact_phone ? { label: "Phone", value: special.contact_phone, icon: Phone, href: `tel:${special.contact_phone.replace(/\s/g, "")}` } : null,
    special.contact_whatsapp ? { label: "WhatsApp", value: special.contact_whatsapp, icon: MessageCircle, href: `https://wa.me/${special.contact_whatsapp.replace(/[^0-9]/g, "")}` } : null,
    special.booking_link ? { label: "Booking", value: "Book Now", icon: ExternalLink, href: special.booking_link } : null,
  ].filter(Boolean) as { label: string; value: string; icon: any; href: string }[];

  const SectionLabel = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
    <div>
      <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(18,18,20,0.4)", lineHeight: 1.3, margin: 0, marginBottom: 4, paddingLeft: 20, fontFamily: font }}>{eyebrow}</p>
      <h2 style={{ fontFamily: font, fontWeight: 400, fontSize: 26, lineHeight: 1.15, letterSpacing: "0.01em", color: "#020202", textTransform: "uppercase", margin: 0, marginBottom: 12, paddingLeft: 20 }}>{title}</h2>
    </div>
  );

  const InfoRow = ({ icon: Icon, label, value, isLast, href }: { icon: any; label: string; value: string; isLast?: boolean; href?: string }) => {
    const content = (
      <>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(18,18,20,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 16 }}>
          <Icon size={24} strokeWidth={1.8} style={{ color: "rgba(18,18,20,0.3)" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.4)", letterSpacing: "0.02em", margin: 0, marginBottom: 2, fontFamily: font }}>{label}</p>
          <p style={{ fontSize: 16, fontWeight: 500, color: "#2B2420", lineHeight: 1.3, margin: 0, wordBreak: "break-word", fontFamily: font }}>{value}</p>
        </div>
      </>
    );

    const rowStyle: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      padding: "14px 20px",
      textDecoration: "none",
    };

    const dividerStyle: React.CSSProperties = isLast ? {} : {
      borderBottom: "1px solid rgba(18,18,20,0.08)",
      marginLeft: 60,
    };

    if (href) {
      return (
        <div>
          <a
            href={href}
            target={href.startsWith("tel:") ? undefined : "_blank"}
            rel="noopener noreferrer"
            className="active:opacity-60"
            style={{ ...rowStyle, transition: "opacity 0.12s ease" }}
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </a>
          {!isLast && <div style={dividerStyle} />}
        </div>
      );
    }

    return (
      <div>
        <div style={rowStyle}>{content}</div>
        {!isLast && <div style={dividerStyle} />}
      </div>
    );
  };

  return (
    <div style={{ background: "#EBEBEB", minHeight: "100dvh", display: "flex", flexDirection: "column", overflow: "auto", paddingBottom: 84, fontFamily: font }}>
      <BackButton />

      {/* Hero Image */}
      {special.image_url && (
        <div style={{ marginLeft: 4, marginRight: 4, marginBottom: 12, borderRadius: 16, overflow: "hidden" }}>
          <img src={special.image_url} alt={special.title} style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", objectPosition: "center", display: "block" }} />
        </div>
      )}

      {/* Offer tag */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 8 }}>
        <span style={{ display: "inline-block", background: "#020202", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 500, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: font }}>
          {special.deal_label}
        </span>
      </div>

      {/* Title */}
      <h1 style={{ fontFamily: font, fontWeight: 400, fontSize: 34, lineHeight: 1.1, letterSpacing: "0.01em", color: "#020202", textTransform: "uppercase", margin: 0, marginBottom: 6, paddingLeft: 20, paddingRight: 20 }}>
        {special.title}
      </h1>

      {/* Meta line */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 20 }}>
        <p style={{ fontFamily: font, fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.55)", margin: 0 }}>
          {special.business_name}
        </p>
        <p style={{ fontFamily: font, fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.55)", margin: 0 }}>
          {validityText}
        </p>
      </div>

      {/* Action buttons */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 28, display: "flex", gap: 12 }}>
        <button
          onClick={handleShare}
          className="active:scale-[0.97] active:opacity-85"
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48, border: "1.5px solid rgba(18,18,20,0.15)", borderRadius: 24, background: "transparent", cursor: "pointer", transition: "transform 0.12s ease, opacity 0.12s ease" }}
        >
          <Share2 size={20} strokeWidth={1.8} style={{ color: "#2B2420" }} />
          <span style={{ fontSize: 15, fontWeight: 500, color: "#2B2420", fontFamily: font }}>Share</span>
        </button>
        {special.business_id && (
          <Link
            to={`/listing/${special.business_id}`}
            className="active:scale-[0.97] active:opacity-85"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, padding: "12px 20px", background: "#020202", borderRadius: 16, textDecoration: "none", border: "none", transition: "transform 0.12s ease, opacity 0.12s ease" }}
          >
            <Store size={20} strokeWidth={1.8} style={{ color: "#FFFFFF" }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#FFFFFF", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", textTransform: "capitalize" }}>View Business</span>
          </Link>
        )}
      </div>

      {/* Description */}
      {special.description && (
        <section style={{ marginBottom: 28 }}>
          <SectionLabel eyebrow="Overview" title="About This Deal" />
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: 20, margin: "0 4px" }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 400, color: "#2B2420", lineHeight: 1.45, fontFamily: font }}>{special.description}</p>
          </div>
        </section>
      )}

      {/* Details */}
      {detailRows.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionLabel eyebrow="Deal Info" title="Details" />
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, overflow: "hidden", padding: "4px 0", margin: "0 4px" }}>
            {detailRows.map((row, idx) => (
              <InfoRow key={row.label} icon={row.icon} label={row.label} value={row.value} isLast={idx === detailRows.length - 1} />
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      {contactRows.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionLabel eyebrow="Reach Out" title="Contact" />
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, overflow: "hidden", padding: "4px 0", margin: "0 4px" }}>
            {contactRows.map((row, idx) => (
              <InfoRow key={row.label} icon={row.icon} label={row.label} value={row.value} isLast={idx === contactRows.length - 1} href={row.href} />
            ))}
          </div>
        </section>
      )}

      {/* Promo code */}
      {special.promo_code && (
        <section style={{ marginBottom: 28 }}>
          <SectionLabel eyebrow="Redeem" title="Promo Code" />
          <div
            style={{ background: "#FFFFFF", border: "1px dashed rgba(18,18,20,0.15)", borderRadius: 16, padding: "16px 20px", textAlign: "center", cursor: "pointer", margin: "0 4px" }}
            onClick={() => { navigator.clipboard.writeText(special.promo_code!); toast.success("Promo code copied!"); }}
          >
            <p style={{ fontFamily: font, fontWeight: 400, fontSize: 22, letterSpacing: 3, color: "#2B2420", margin: 0 }}>{special.promo_code}</p>
            <p style={{ fontSize: 12, color: "rgba(18,18,20,0.4)", marginTop: 6, fontFamily: font }}>Tap to copy</p>
          </div>
        </section>
      )}

      {/* Terms */}
      {special.terms && (
        <section style={{ marginBottom: 28 }}>
          <SectionLabel eyebrow="Fine Print" title="Terms & Conditions" />
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: 20, margin: "0 4px" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 400, color: "rgba(18,18,20,0.55)", lineHeight: 1.45, fontFamily: font }}>{special.terms}</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default SpecialDetail;
