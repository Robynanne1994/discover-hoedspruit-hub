import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, QrCode, ExternalLink, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ImageLightbox from "@/components/ImageLightbox";
import ShareButton from "@/components/ShareButton";
import FavouriteButton from "@/components/FavouriteButton";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const PAGE_BG = "#ebebeb";
const CARD = "#ffffff";
const IVORY = "#f5f0e8";
const INK = "#020202";
const BODY = "#2b2420";
const MUTED = "#6B6A5E";
const LINE = "#E2DAC6";
const PRIMARY = "#715a3d";

const CircleBtn = ({ children, onClick, ariaLabel }: { children: React.ReactNode; onClick: () => void; ariaLabel: string }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    style={{
      width: 40, height: 40, borderRadius: 999, background: CARD,
      border: `1px solid ${LINE}`, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}
  >
    {children}
  </button>
);

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 0", borderBottom: `1px solid ${LINE}`, gap: 12,
  }}>
    <span style={{ fontFamily: HN, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED }}>
      {label}
    </span>
    <span style={{ fontFamily: HN, fontSize: 14, color: BODY, textAlign: "right" }}>{value}</span>
  </div>
);

const LocalChannelDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { data: resource, isLoading } = useQuery({
    queryKey: ["local-channel", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bush_telegraph_resources")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!slug,
  });

  const displayTitle = useMemo(() => {
    if (!resource) return "";
    return (resource.title_override?.trim()) || resource.title;
  }, [resource]);

  if (isLoading) {
    return <div style={{ minHeight: "100vh", background: PAGE_BG, padding: 40, fontFamily: HN, color: MUTED }}>Loading…</div>;
  }
  if (!resource) {
    return (
      <div style={{ minHeight: "100vh", background: PAGE_BG, padding: 40, fontFamily: HN }}>
        <CircleBtn onClick={() => navigate(-1)} ariaLabel="Back"><ArrowLeft size={18} color={INK} /></CircleBtn>
        <p style={{ marginTop: 24, color: BODY }}>Channel not found.</p>
      </div>
    );
  }

  const type = resource.resource_type || "link";
  const heroImage = resource.detail_image_url || resource.image_url || resource.qr_image_url;
  const isImageType = type === "qr" || type === "image";

  const handlePrimaryAction = () => {
    if (isImageType) {
      setLightboxOpen(true);
    } else if (type === "internal") {
      navigate(resource.url || "/");
    } else {
      window.open(resource.url, "_blank", "noopener,noreferrer");
    }
  };

  const primaryLabel = isImageType
    ? (type === "qr" ? "Show QR Code" : "View Image")
    : (type === "internal" ? "Open Page" : "Open Channel");
  const PrimaryIcon = isImageType ? (type === "qr" ? QrCode : ImageIcon) : ExternalLink;

  const metaParts = [resource.meta, resource.meta_2].filter((m: string | null) => m && m.trim());

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, fontFamily: HN, paddingBottom: 140 }}>
      {/* Hero */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: IVORY, overflow: "hidden" }}>
        {heroImage ? (
          <img src={heroImage} alt={displayTitle} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED }}>
            {resource.platform}
          </div>
        )}
        <div style={{ position: "absolute", top: 50, left: 20, right: 20, display: "flex", justifyContent: "space-between", gap: 8 }}>
          <CircleBtn onClick={() => navigate(-1)} ariaLabel="Back">
            <ArrowLeft size={18} color={INK} strokeWidth={2} />
          </CircleBtn>
          <div style={{ display: "flex", gap: 8, position: "relative" }}>
            <div style={{ position: "relative", width: 40, height: 40 }}>
              <FavouriteButton itemId={resource.id} itemType="resource" />
            </div>
            <ShareButton
              title={displayTitle}
              text={resource.description || resource.meta || ""}
              url={typeof window !== "undefined" ? window.location.href : ""}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ fontFamily: HN, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED, marginBottom: 8 }}>
          {resource.platform}
        </div>
        <h1
          data-no-title-case={resource.title_override?.trim() ? "true" : undefined}
          style={{ fontFamily: HN, fontWeight: 700, fontSize: 28, lineHeight: 1.1, color: INK, margin: 0, textTransform: resource.title_override?.trim() ? "none" : undefined }}
        >
          {displayTitle}
        </h1>

        {metaParts.length > 0 && (
          <div style={{
            marginTop: 12, display: "flex", alignItems: "center", gap: 8,
            fontFamily: HN, fontSize: 13.5, color: PRIMARY,
          }}>
            {metaParts.map((m: string, i: number) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {i > 0 && (
                  <span style={{ width: 4, height: 4, borderRadius: 999, background: PRIMARY, display: "inline-block" }} />
                )}
                <span>{m}</span>
              </span>
            ))}
          </div>
        )}

        {resource.description && (
          <p style={{ marginTop: 16, fontFamily: HN, fontSize: 15, lineHeight: 1.6, color: BODY }}>
            {resource.description}
          </p>
        )}

        {/* Primary action */}
        <button
          onClick={handlePrimaryAction}
          style={{
            marginTop: 24, width: "100%", height: 54, borderRadius: 999,
            background: PRIMARY, color: "#ffffff", border: "none", cursor: "pointer",
            fontFamily: HN, fontSize: 14, fontWeight: 600, letterSpacing: "0.04em",
            textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}
        >
          <PrimaryIcon size={16} strokeWidth={2} />
          {primaryLabel}
        </button>

        {/* Details */}
        {(() => {
          const admins: { name: string; image_url?: string }[] = Array.isArray(resource.admins) && resource.admins.length
            ? resource.admins.filter((a: any) => a?.name || a?.image_url)
            : (resource.admin_name ? [{ name: resource.admin_name }] : []);
          const yearsValue = resource.since_year
            ? `Since ${resource.since_year}`
            : (resource.years_running != null
                ? `${resource.years_running} ${resource.years_running === 1 ? "year" : "years"}`
                : null);
          const hasAny = admins.length > 0 || yearsValue || resource.post_frequency || resource.tag_1 || resource.tag_2;
          return (
            <div style={{ marginTop: 32, background: CARD, borderRadius: 16, padding: "4px 18px" }}>
              {admins.length > 0 && (
                <div style={{ padding: "14px 0", borderBottom: `1px solid ${LINE}` }}>
                  <div style={{ fontFamily: HN, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED, marginBottom: 10 }}>
                    {admins.length === 1 ? "Admin" : "Admins"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {admins.map((a, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 999, overflow: "hidden",
                          background: IVORY, display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: HN, fontSize: 13, fontWeight: 700, color: PRIMARY, flexShrink: 0,
                        }}>
                          {a.image_url
                            ? <img src={a.image_url} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : (a.name || "?").trim().charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontFamily: HN, fontSize: 14, color: BODY }}>{a.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {yearsValue && <InfoRow label={resource.since_year ? "Running" : "Years Running"} value={yearsValue} />}
              {resource.post_frequency && <InfoRow label="Avg. Posts" value={resource.post_frequency} />}
              {resource.tag_1 && <InfoRow label="Tag" value={resource.tag_1} />}
              {resource.tag_2 && <InfoRow label="Tag" value={resource.tag_2} />}
              {!hasAny && (
                <div style={{ padding: "16px 0", color: MUTED, fontFamily: HN, fontSize: 13 }}>
                  No additional details yet.
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* In-app lightbox for QR/image */}
      {isImageType && resource.qr_image_url && (
        <ImageLightbox
          images={[resource.qr_image_url]}
          initialIndex={0}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          alt={displayTitle}
        />
      )}
    </div>
  );
};

export default LocalChannelDetail;
