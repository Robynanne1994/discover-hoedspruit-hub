import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  ChevronLeft,
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
    <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24, marginBottom: 18 }}>
      <button onClick={() => navigate(-1)} className="flex items-center" style={{ gap: 6 }}>
        <ChevronLeft style={{ width: 18, height: 18, strokeWidth: 2, color: "rgba(18,18,20,0.45)" }} />
        <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(18,18,20,0.45)", letterSpacing: "0.2px" }}>Back</span>
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: "#ebebeb" }}>
        <BackButton />
        <div className="flex flex-col items-center justify-center" style={{ paddingTop: 80, paddingLeft: 24, paddingRight: 24 }}>
          <div className="animate-pulse" style={{ width: 48, height: 48, borderRadius: 9999, background: "rgba(18,18,20,0.06)", marginBottom: 14 }} />
          <p style={{ fontSize: 13, color: "rgba(18,18,20,0.4)" }}>Loading special...</p>
        </div>
      </div>
    );
  }

  if (!special) {
    return (
      <div className="min-h-screen pb-24" style={{ background: "#ebebeb" }}>
        <BackButton />
        <div style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 80, textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, color: "#2b2420", marginBottom: 8 }}>Special not found</p>
          <p style={{ fontSize: 13, color: "rgba(18,18,20,0.45)", lineHeight: 1.5 }}>This special may have ended or been removed.</p>
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
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 2.2, marginBottom: 6 }}>{eyebrow}</p>
      <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 400, fontSize: 20, lineHeight: 1, letterSpacing: "0.01em", color: "#020202", textTransform: "uppercase", margin: 0 }}>{title}</h2>
    </div>
  );

  const InfoRow = ({ icon: Icon, label, value, isLast, href }: { icon: any; label: string; value: string; isLast?: boolean; href?: string }) => {
    const Wrapper = href ? "a" : "div";
    const wrapperProps = href ? { href, target: "_blank" as const, rel: "noopener noreferrer" } : {};
    return (
      <Wrapper
        {...wrapperProps}
        className={href ? "transition-colors hover:bg-[rgba(18,18,20,0.02)]" : ""}
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 18px", borderBottom: isLast ? "none" : "1px solid rgba(18,18,20,0.06)", textDecoration: "none" }}
      >
        <div style={{ width: 34, height: 34, borderRadius: 16, background: "rgba(18,18,20,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon style={{ width: 16, height: 16, color: "rgba(18,18,20,0.42)" }} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, color: "rgba(18,18,20,0.38)", margin: 0, marginBottom: 4, lineHeight: 1.2 }}>{label}</p>
          <p style={{ fontSize: 15, fontWeight: 500, color: "#2b2420", lineHeight: 1.4, margin: 0, wordBreak: "break-word" }}>{value}</p>
        </div>
      </Wrapper>
    );
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: "#ebebeb" }}>
      <BackButton />

      {/* Hero Image */}
      {special.image_url && (
        <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 22 }}>
          <div style={{ width: "100%", overflow: "hidden", borderRadius: 16, background: "#f0f0f0", aspectRatio: "4 / 3" }}>
            <img src={special.image_url} alt={special.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Title */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 1.5, background: "#121214", borderRadius: 8, padding: "3px 10px" }}>
            {special.deal_label}
          </span>
        </div>

        <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 400, fontSize: 34, lineHeight: 0.98, letterSpacing: "0.01em", color: "#2b2420", margin: 0, textTransform: "uppercase" }}>
          {special.title}
        </h1>

        <p style={{ marginTop: 14, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontStyle: "italic", fontSize: 14, color: "rgba(18,18,20,0.42)", lineHeight: 1.45, letterSpacing: "0.15px" }}>
          {special.business_name} · {validityText}
        </p>
      </div>

      {/* Action buttons */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 28, display: "flex", gap: 10 }}>
        <button
          onClick={handleShare}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", border: "1px solid rgba(18,18,20,0.1)", borderRadius: 9999, background: "transparent", cursor: "pointer" }}
        >
          <Share2 style={{ width: 16, height: 16, color: "rgba(18,18,20,0.5)" }} strokeWidth={1.8} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#2b2420" }}>Share</span>
        </button>
        {special.business_id && (
          <Link
            to={`/listing/${special.business_id}`}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", background: "#121214", borderRadius: 9999, textDecoration: "none" }}
          >
            <Store style={{ width: 16, height: 16, color: "#FFFFFF" }} strokeWidth={1.8} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>View Business</span>
          </Link>
        )}
      </div>

      {/* Description */}
      {special.description && (
        <section style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 34 }}>
          <SectionLabel eyebrow="Overview" title="About this deal" />
          <div style={{ background: "rgba(18,18,20,0.03)", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: 16, boxShadow: "var(--card-shadow)" }}>
            <p style={{ margin: 0, fontSize: 15, color: "rgba(18,18,20,0.58)", lineHeight: 1.85, letterSpacing: "0.1px" }}>{special.description}</p>
          </div>
        </section>
      )}

      {/* Details */}
      {detailRows.length > 0 && (
        <section style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 34 }}>
          <SectionLabel eyebrow="Deal info" title="Details" />
          <div style={{ background: "#ebebeb", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, overflow: "hidden" }}>
            {detailRows.map((row, idx) => (
              <InfoRow key={row.label} icon={row.icon} label={row.label} value={row.value} isLast={idx === detailRows.length - 1} />
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      {contactRows.length > 0 && (
        <section style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 34 }}>
          <SectionLabel eyebrow="Reach out" title="Contact" />
          <div style={{ background: "#ebebeb", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, overflow: "hidden" }}>
            {contactRows.map((row, idx) => (
              <InfoRow key={row.label} icon={row.icon} label={row.label} value={row.value} isLast={idx === contactRows.length - 1} href={row.href} />
            ))}
          </div>
        </section>
      )}

      {/* Promo code */}
      {special.promo_code && (
        <section style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 34 }}>
          <SectionLabel eyebrow="Redeem" title="Promo Code" />
          <div
            style={{ background: "rgba(18,18,20,0.03)", border: "1px dashed rgba(18,18,20,0.15)", borderRadius: 16, padding: "16px 16px", textAlign: "center", cursor: "pointer" }}
            onClick={() => { navigator.clipboard.writeText(special.promo_code!); toast.success("Promo code copied!"); }}
          >
            <p style={{ fontFamily: "var(--font-heading)", fontWeight: 400, fontSize: 22, letterSpacing: 3, color: "#2b2420", margin: 0 }}>{special.promo_code}</p>
            <p style={{ fontSize: 12, color: "rgba(18,18,20,0.4)", marginTop: 6 }}>Tap to copy</p>
          </div>
        </section>
      )}

      {/* Terms */}
      {special.terms && (
        <section style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 34 }}>
          <SectionLabel eyebrow="Fine print" title="Terms & Conditions" />
          <div style={{ background: "rgba(18,18,20,0.03)", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: 16, boxShadow: "var(--card-shadow)" }}>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(18,18,20,0.5)", lineHeight: 1.7 }}>{special.terms}</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default SpecialDetail;
