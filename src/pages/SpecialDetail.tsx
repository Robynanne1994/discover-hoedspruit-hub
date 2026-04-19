import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Ticket,
  Heart,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const font = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const pressScale = (scale = "0.97") => ({
  onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = `scale(${scale})`),
  onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
});

const pressOpacity = {
  onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.opacity = "0.6"),
  onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.opacity = "1"),
  onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.opacity = "1"),
};

const overlayBtn: React.CSSProperties = {
  width: 40, height: 40, borderRadius: "50%",
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  border: "none", cursor: "pointer",
  transition: "transform 0.12s ease",
};

const SpecialDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [lightboxOpen, setLightboxOpen] = useState(false);
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
      const { data } = await supabase.from("favourites").select("id").eq("user_id", user.id).eq("item_id", id!).eq("item_type", "special").maybeSingle();
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
      toast.success(isFavourited ? "Removed from saved" : "Saved!");
    },
  });

  const requireAuth = () => {
    if (!user) { toast.info("Sign in to use this feature"); navigate("/auth"); return true; }
    return false;
  };

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

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#EBEBEB", fontFamily: font }}>
        <div style={{ padding: "52px 20px 0" }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
            <ArrowLeft size={20} strokeWidth={1.8} style={{ color: "#2B2420" }} />
            <span style={{ fontSize: 15, fontWeight: 500, color: "#2B2420", fontFamily: font }}>Back</span>
          </button>
        </div>
        <div style={{ padding: "48px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(18,18,20,0.04)" }} />
          <p style={{ fontSize: 13, color: "rgba(18,18,20,0.35)", fontFamily: font }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!special) {
    return (
      <div style={{ minHeight: "100vh", background: "#EBEBEB", fontFamily: font }}>
        <div style={{ padding: "52px 20px 0" }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
            <ArrowLeft size={20} strokeWidth={1.8} style={{ color: "#2B2420" }} />
            <span style={{ fontSize: 15, fontWeight: 500, color: "#2B2420", fontFamily: font }}>Back</span>
          </button>
        </div>
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "rgba(18,18,20,0.4)", marginBottom: 16, fontFamily: font }}>Special not found.</p>
          <Link to="/specials" style={{ fontSize: 13, fontWeight: 600, color: "#2B2420", fontFamily: font }}>Back to Specials</Link>
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

  const detailRows: { icon: React.ReactNode; label: string; value: string }[] = [
    { icon: <Store size={20} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, label: "Business", value: special.business_name },
    { icon: <Tag size={20} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, label: "Deal", value: special.deal_label },
  ];
  if (special.price || special.original_price) {
    detailRows.push({
      icon: <Banknote size={20} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />,
      label: "Price",
      value: [special.price, special.original_price ? `was ${special.original_price}` : null].filter(Boolean).join(" · "),
    });
  }
  if (special.special_type) detailRows.push({ icon: <Ticket size={20} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, label: "Type", value: special.special_type });
  if (special.day_of_week?.length) detailRows.push({ icon: <Clock size={20} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, label: "Days", value: special.day_of_week.join(", ") });
  detailRows.push({ icon: <Calendar size={20} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, label: "Validity", value: validityText });
  if (special.category) detailRows.push({ icon: <Tag size={20} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, label: "Category", value: special.category });

  const contactRows = [
    special.contact_phone && {
      icon: <Phone size={20} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />,
      text: special.contact_phone,
      href: `tel:${special.contact_phone.replace(/\s/g, "")}`,
    },
    special.contact_whatsapp && {
      icon: <MessageCircle size={20} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />,
      text: "WhatsApp",
      href: `https://wa.me/${special.contact_whatsapp.replace(/[^0-9]/g, "")}`,
      external: true,
    },
    special.booking_link && {
      icon: <ExternalLink size={20} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />,
      text: "Book Now",
      href: special.booking_link,
      external: true,
    },
  ].filter(Boolean) as { icon: React.ReactNode; text: string; href: string; external?: boolean }[];

  const description = special.description;
  const descriptionParas = description ? description.split("\n").filter(Boolean) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#EBEBEB", paddingBottom: 84, fontFamily: font }}>
      {/* Hero image */}
      {special.image_url ? (
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            style={{ display: "block", width: "100%", aspectRatio: "4/3", overflow: "hidden", border: "none", padding: 0, background: "transparent", cursor: "pointer" }}
            aria-label="View image"
          >
            <img src={special.image_url} alt={special.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
          </button>
          <button onClick={() => navigate(-1)} style={{ ...overlayBtn, position: "absolute", top: 16, left: 16, zIndex: 10 }} {...pressScale("0.9")}>
            <ArrowLeft size={20} strokeWidth={1.8} color="#2B2420" />
          </button>
          {isAdmin && (
            <button onClick={() => navigate(`/admin/specials`)} style={{ ...overlayBtn, position: "absolute", top: 16, right: 16, zIndex: 10 }} title="Edit special" {...pressScale("0.9")}>
              <Pencil size={20} strokeWidth={1.8} color="#2B2420" />
            </button>
          )}
        </div>
      ) : (
        <div style={{ padding: "48px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => navigate(-1)} style={{ ...overlayBtn, background: "rgba(18,18,20,0.06)" }} {...pressScale("0.9")}>
            <ArrowLeft size={20} strokeWidth={1.8} color="#2B2420" />
          </button>
        </div>
      )}

      {special.image_url && (
        <ImageLightbox
          images={[special.image_url]}
          initialIndex={0}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          alt={special.title}
        />
      )}

      {/* Content area */}
      <div style={{ paddingTop: 20, paddingLeft: 20, paddingRight: 20 }}>
        {/* Deal label overline */}
        <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(18,18,20,0.4)", lineHeight: 1.3, marginBottom: 4, marginTop: 0, fontFamily: font }}>
          {special.deal_label}
        </p>

        {/* Title */}
        <h1 style={{ fontFamily: font, fontSize: 34, fontWeight: 400, lineHeight: 1.1, letterSpacing: "0.01em", color: "#020202", textTransform: "uppercase", marginBottom: 8, marginTop: 0 }}>
          {special.title}
        </h1>

        {/* Meta line */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontFamily: font, fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.55)", margin: 0, lineHeight: 1.4 }}>
            {special.business_name}
          </p>
          <p style={{ fontFamily: font, fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.4)", margin: 0, lineHeight: 1.4 }}>
            {validityText}
          </p>
        </div>

        {/* Action buttons row (Share, Save) */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            onClick={handleShare}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: "transparent", border: "1.5px solid rgba(18,18,20,0.15)", borderRadius: 24,
              padding: "12px", height: 48, cursor: "pointer", transition: "transform 0.12s ease", fontFamily: font,
            }}
            {...pressScale()}
          >
            <Share2 size={14} strokeWidth={1.8} color="#2B2420" />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#2B2420" }}>Share</span>
          </button>
          <button
            onClick={() => { if (!requireAuth()) toggleFavourite.mutate(); }}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: "transparent",
              border: isFavourited ? "1.5px solid #D4654A" : "1.5px solid rgba(18,18,20,0.15)",
              borderRadius: 24, padding: "12px", height: 48, cursor: "pointer", transition: "transform 0.12s ease", fontFamily: font,
            }}
            {...pressScale()}
          >
            <Heart size={14} strokeWidth={1.8} color={isFavourited ? "#D4654A" : "#2B2420"} fill={isFavourited ? "#D4654A" : "none"} />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#2B2420" }}>{isFavourited ? "Saved" : "Save"}</span>
          </button>
        </div>

        {/* Primary action buttons (Call & Book / View Business) */}
        {(special.contact_phone || special.booking_link || special.business_id) && (
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            {special.contact_phone && (
              <a
                href={`tel:${special.contact_phone.replace(/\s/g, "")}`}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: "#020202", color: "#FFFFFF", border: "none", borderRadius: 16,
                  padding: "12px 20px", height: 48, fontSize: 15, fontWeight: 600,
                  textDecoration: "none", cursor: "pointer", transition: "transform 0.12s ease, opacity 0.12s ease",
                  fontFamily: font, textTransform: "capitalize",
                }}
                {...pressScale()}
              >
                <Phone size={20} strokeWidth={1.8} color="#FFFFFF" />
                Call Now
              </a>
            )}
            {special.booking_link ? (
              <a
                href={special.booking_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: "#020202", color: "#FFFFFF", border: "none", borderRadius: 16,
                  padding: "12px 20px", height: 48, fontSize: 15, fontWeight: 600,
                  textDecoration: "none", cursor: "pointer", transition: "transform 0.12s ease, opacity 0.12s ease",
                  fontFamily: font, textTransform: "capitalize",
                }}
                {...pressScale()}
              >
                <ExternalLink size={20} strokeWidth={1.8} color="#FFFFFF" />
                Book Now
              </a>
            ) : special.business_id && (
              <Link
                to={`/listing/${special.business_id}`}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: "#020202", color: "#FFFFFF", border: "none", borderRadius: 16,
                  padding: "12px 20px", height: 48, fontSize: 15, fontWeight: 600,
                  textDecoration: "none", cursor: "pointer", transition: "transform 0.12s ease, opacity 0.12s ease",
                  fontFamily: font, textTransform: "capitalize",
                }}
                {...pressScale()}
              >
                <Store size={20} strokeWidth={1.8} color="#FFFFFF" />
                View Business
              </Link>
            )}
          </div>
        )}

        {/* Contact details card */}
        {contactRows.length > 0 && (
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid rgba(18,18,20,0.06)", padding: "4px 0", overflow: "hidden", marginBottom: 24 }}>
            {contactRows.map((row, i) => (
              <div key={i}>
                {i > 0 && <div style={{ height: 1, background: "rgba(18,18,20,0.08)", marginLeft: 56 }} />}
                <a
                  href={row.href}
                  target={row.external ? "_blank" : undefined}
                  rel={row.external ? "noopener noreferrer" : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "14px 20px",
                    textDecoration: "none", cursor: "pointer",
                    transition: "opacity 0.12s ease",
                  }}
                  {...pressOpacity}
                >
                  {row.icon}
                  <span style={{ fontSize: 15, fontWeight: 400, color: "#2B2420", lineHeight: 1.3, fontFamily: font }}>{row.text}</span>
                </a>
              </div>
            ))}
          </div>
        )}

        {/* About section */}
        {description && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: font, fontWeight: 400, fontSize: 26, color: "#020202", textTransform: "uppercase", letterSpacing: "0.01em", lineHeight: 1.15, marginBottom: 8, marginTop: 0 }}>About This Deal</h2>
            <div style={{
              ...(!aboutExpanded ? { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden" } : {})
            }}>
              {descriptionParas.map((paragraph, i) => (
                <p key={i} style={{ fontSize: 16, fontWeight: 400, color: "rgba(18,18,20,0.55)", lineHeight: 1.45, marginBottom: 12, fontFamily: font }}>{paragraph}</p>
              ))}
            </div>
            {description.length > 150 && (
              <button
                onClick={() => setAboutExpanded(!aboutExpanded)}
                style={{ fontSize: 15, fontWeight: 500, color: "#020202", background: "none", border: "none", padding: 0, cursor: "pointer", marginTop: 4, fontFamily: font, transition: "opacity 0.12s ease" }}
                {...pressOpacity}
              >
                {aboutExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        {/* Details card */}
        {detailRows.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: font, fontWeight: 400, fontSize: 26, color: "#020202", textTransform: "uppercase", letterSpacing: "0.01em", lineHeight: 1.15, marginBottom: 8, marginTop: 0 }}>Details</h2>
            <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid rgba(18,18,20,0.06)", padding: "4px 0", overflow: "hidden" }}>
              {detailRows.map((row, i) => (
                <div key={row.label}>
                  {i > 0 && <div style={{ height: 1, background: "rgba(18,18,20,0.08)", marginLeft: 56 }} />}
                  <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px" }}>
                    {row.icon}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.4)", letterSpacing: "0.02em", margin: 0, marginBottom: 2, fontFamily: font }}>{row.label}</p>
                      <p style={{ fontSize: 15, fontWeight: 400, color: "#2B2420", lineHeight: 1.3, margin: 0, wordBreak: "break-word", fontFamily: font }}>{row.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Promo code */}
        {special.promo_code && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: font, fontWeight: 400, fontSize: 26, color: "#020202", textTransform: "uppercase", letterSpacing: "0.01em", lineHeight: 1.15, marginBottom: 8, marginTop: 0 }}>Promo Code</h2>
            <div
              style={{ background: "#FFFFFF", border: "1px dashed rgba(18,18,20,0.2)", borderRadius: 16, padding: "20px", textAlign: "center", cursor: "pointer" }}
              onClick={() => { navigator.clipboard.writeText(special.promo_code!); toast.success("Promo code copied!"); }}
              {...pressOpacity}
            >
              <p style={{ fontFamily: font, fontWeight: 500, fontSize: 22, letterSpacing: 3, color: "#020202", margin: 0 }}>{special.promo_code}</p>
              <p style={{ fontSize: 12, color: "rgba(18,18,20,0.4)", marginTop: 6, fontFamily: font }}>Tap to copy</p>
            </div>
          </div>
        )}

        {/* Terms */}
        {special.terms && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: font, fontWeight: 400, fontSize: 26, color: "#020202", textTransform: "uppercase", letterSpacing: "0.01em", lineHeight: 1.15, marginBottom: 8, marginTop: 0 }}>Terms & Conditions</h2>
            <div style={{ background: "#FFFFFF", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: 20 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 400, color: "rgba(18,18,20,0.55)", lineHeight: 1.45, fontFamily: font }}>{special.terms}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialDetail;
