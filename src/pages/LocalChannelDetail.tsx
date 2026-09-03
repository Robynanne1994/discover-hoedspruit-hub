import { useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight, QrCode, ExternalLink, Image as ImageIcon, Pencil, Calendar, Clock, Users,
  Heart, Share2, Megaphone, Facebook, Instagram,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { channelImage } from "@/lib/imageFallback";
import ImageLightbox from "@/components/ImageLightbox";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import { useAuth } from "@/hooks/useAuth";
import { useIsFavourited, useToggleFavourite } from "@/hooks/useFavourites";
import { useRequireAuth } from "@/hooks/useGuestAuth";
import { useShare } from "@/hooks/useShare";
import Seo from "@/components/Seo";
import { MUTED, type, metaRow, metaIcon, tab as tabStyle } from "@/lib/type";

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// Design tokens (match ListingDetail / SpecialDetail / EventDetail)
const C = {
  bg: "#E6E0CC",
  surface: "#ffffff",
  ivory: "#f5f0e8",
  divider: "#EDE9E3",
  heading: "#1A1A1A",
  text: "#2b2420",
  muted: MUTED,
  primary: "#715a3d",
  accent: "#B8916A",
  dark: "#423324",
};

const pressScale = (s = "0.98") => ({
  onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = `scale(${s})`),
  onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
});

const floatBtn: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 999,
  background: "#FFFFFF", border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
};

const headStyle: React.CSSProperties = {
  margin: "0 0 12px",
  ...type.sectionTitle, textTransform: "none",
};
const cardStyle: React.CSSProperties = {
  background: C.surface,
  borderRadius: 20,
  border: "none",
};
const categoryLineStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 8,
  ...type.label,
  lineHeight: 1.4,
  color: "#715A3D",
};

const PLATFORM_LABEL: Record<string, string> = {
  Facebook: "Facebook Group",
  WhatsApp: "WhatsApp Channel",
  Instagram: "Instagram",
};
const WhatsAppIcon = ({ size = 24, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} style={style} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const platformLabel = (p?: string | null) => (p ? PLATFORM_LABEL[p] || p : "");

const platformIcon = (p?: string | null) => {
  if (p === "Facebook") return Facebook;
  if (p === "Instagram") return Instagram;
  if (p === "WhatsApp") return WhatsAppIcon;
  return Megaphone;
};

const InfoRow = ({ icon: Icon, label, value, first }: { icon: any; label: string; value: React.ReactNode; first?: boolean }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 14,
    padding: "16px 0",
    borderTop: first ? "none" : `1px solid ${C.divider}`,
  }}>
    <Icon size={18} strokeWidth={1.5} color={C.primary} style={{ flexShrink: 0 }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={type.label}>{label}</div>
      <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 400, color: C.heading, wordBreak: "break-word", marginTop: 2 }}>{value}</div>
    </div>
  </div>
);

const LocalChannelDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const { isAdmin, user } = useAuth();
  const requireAuth = useRequireAuth();
  const share = useShare();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [tab, setTab] = useState<"details" | "about">("about");

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

  const isFavourited = useIsFavourited(resource?.id ?? "", "resource");
  const toggleFavourite = useToggleFavourite();

  const handleToggleFavourite = () => {
    if (!resource) return;
    if (!requireAuth("save favourites")) return;
    if (!user) return;
    toggleFavourite.mutate({ itemId: resource.id, itemType: "resource", currentlyFavourited: isFavourited });
  };

  // Opens the phone's own share sheet (copy link + the user's apps); falls back
  // to the in-app sheet on desktop browsers that have none.
  const handleShare = () => {
    if (!resource) return;
    share({
      title: displayTitle,
      text: resource.description || resource.meta || undefined,
      url: `/local-channels/${slug}`,
    });
  };

  const displayTitle = useMemo(() => {
    if (!resource) return "";
    return (resource.title_override?.trim()) || resource.title;
  }, [resource]);

  if (isLoading || !resource) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.text }}>
        <div style={{ padding: "var(--header-top) 16px 0" }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            style={{ ...floatBtn, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
          >
            <BackArrowIcon size={18} color={C.heading} />
          </button>
        </div>
        <div style={{ padding: "80px 20px", textAlign: "center", color: C.muted, fontSize: 14 }}>
          {isLoading ? "Loading..." : "Channel not found."}
        </div>
      </div>
    );
  }

  const type_ = resource.resource_type || "link";
  const heroImage = channelImage(resource, "detail");
  const isImageType = type_ === "qr" || type_ === "image";

  const handlePrimaryAction = () => {
    if (isImageType) {
      setLightboxOpen(true);
    } else if (type_ === "internal") {
      navigate(resource.url || "/");
    } else {
      window.open(resource.url, "_blank", "noopener,noreferrer");
    }
  };

  const defaultLabel = isImageType
    ? (type_ === "qr" ? "Show QR Code" : "View Image")
    : (type_ === "internal" ? "Open Page" : "Open Channel");
  const primaryLabel = (!isImageType && resource.cta_label && resource.cta_label.trim())
    ? resource.cta_label.trim()
    : defaultLabel;
  const PrimaryIcon = isImageType ? (type_ === "qr" ? QrCode : ImageIcon) : ExternalLink;

  const memberLine = (resource.meta_2 || "").trim();
  const tags = [resource.tag_1, resource.tag_2].filter((t: string | null) => t && t.trim());
  const ChannelIcon = platformIcon(resource.platform);
  const channelLine = platformLabel(resource.platform);

  const admins: { name: string }[] = Array.isArray(resource.admins) && resource.admins.length
    ? resource.admins.filter((a: any) => a?.name).map((a: any) => ({ name: a.name }))
    : (resource.admin_name
        ? resource.admin_name.split("|").map((n: string) => n.trim()).filter(Boolean).map((name: string) => ({ name }))
        : []);
  const yearsValue = resource.since_year
    ? `Since ${resource.since_year}`
    : (resource.years_running != null
        ? `${resource.years_running} ${resource.years_running === 1 ? "year" : "years"}`
        : null);
  const hasAnyDetails = admins.length > 0 || !!yearsValue || !!resource.post_frequency;

  const TabBtn = ({ k, label }: { k: "details" | "about"; label: string }) => {
    const active = tab === k;
    return (
      <button
        onClick={() => setTab(k)}
        style={{
          flex: 1, background: "none", border: "none", cursor: "pointer",
          padding: "14px 4px",
          ...tabStyle(active),
          color: active ? C.heading : MUTED,
          borderBottom: `2px solid ${active ? C.heading : "transparent"}`,
          marginBottom: -1,
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.text, paddingBottom: 190 }}>
      <Seo
        title={`${displayTitle} — Local Channel`}
        description={
          (resource.description ? String(resource.description).replace(/<[^>]*>/g, "").trim() : "") ||
          `${displayTitle} — a local Hoedspruit channel on ${resource.platform}.`
        }
        path={`/local-channels/${resource.slug || resource.id}`}
        image={channelImage(resource, "detail") || undefined}
        type="article"
      />

      {/* Hero (4:3) with floating action buttons */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "#DDD6C0", overflow: "hidden" }}>
        {heroImage ? (
          <img src={heroImage} alt={displayTitle} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>
            {resource.platform}
          </div>
        )}
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{ ...floatBtn, position: "absolute", top: "var(--overlay-top)", left: 16, zIndex: 2 }}
        >
          <BackArrowIcon size={20} color={C.heading} />
        </button>
        <div style={{
          position: "absolute", top: "var(--overlay-top)", right: 16, zIndex: 2,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <button onClick={handleShare} aria-label="Share" style={floatBtn}>
            <Share2 size={20} strokeWidth={1.6} color={C.heading} />
          </button>
          <button onClick={handleToggleFavourite} aria-label={isFavourited ? "Unsave" : "Save"} style={floatBtn}>
            <Heart size={20} strokeWidth={2} color={C.primary} fill={isFavourited ? C.primary : "none"} />
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate(`/admin/local-channels?edit=${resource.id}&returnTo=${encodeURIComponent(location.pathname)}`, { replace: true })}
              aria-label="Edit"
              style={floatBtn}
            >
              <Pencil size={18} strokeWidth={1.6} color={C.heading} />
            </button>
          )}
        </div>
      </div>

      {/* Title sheet — overlaps the hero with a rounded top edge */}
      <div style={{
        position: "relative", zIndex: 3,
        background: C.surface,
        borderRadius: "28px 28px 0 0",
        marginTop: -28,
        padding: "22px 20px 0",
      }}>
        {tags.length > 0 && (
          <div style={categoryLineStyle}>
            {tags.map((t: string, i: number) => (
              <span key={i}>
                {i > 0 && <span style={{ color: C.accent, margin: "0 6px" }}>·</span>}
                {t}
              </span>
            ))}
          </div>
        )}

        <h1
          data-no-title-case={resource.title_override?.trim() ? "true" : undefined}
          style={{ ...type.pageTitle, margin: 0 }}
        >
          {displayTitle}
        </h1>

        {channelLine && (
          <div style={{ marginTop: 10, ...metaRow, ...type.meta }}>
            <ChannelIcon size={14} color={MUTED} strokeWidth={1.75} style={metaIcon()} />
            <span>{channelLine}</span>
          </div>
        )}

        {memberLine && (
          <div style={{
            marginTop: 6, display: "flex", alignItems: "center", gap: 6,
            ...type.meta,
          }}>
            <Users size={13} color={MUTED} strokeWidth={1.75} />
            <span>{memberLine}</span>
          </div>
        )}
      </div>

      {/* Sticky tab bar */}
      {(() => {
        const hasAbout = !!resource.description?.trim();
        const hasDetails = hasAnyDetails;
        const availableTabs: ("details" | "about")[] = [
          ...(hasAbout ? ["about" as const] : []),
          ...(hasDetails ? ["details" as const] : []),
        ];
        if (availableTabs.length === 0) return null;
        const activeTab = availableTabs.includes(tab) ? tab : availableTabs[0];
        if (activeTab !== tab) queueMicrotask(() => setTab(activeTab));

        return (
          <>
            <nav style={{
              position: "sticky", top: 0, zIndex: 30,
              background: C.surface, borderBottom: "1px solid rgba(112,90,61,0.14)",
              display: "flex", padding: "12px 12px 0",
            }}>
              {hasAbout && <TabBtn k="about" label="About" />}
              {hasDetails && <TabBtn k="details" label="Details" />}
            </nav>

            <section style={{ background: C.bg }}>
              {activeTab === "about" && hasAbout && (
                <div style={{ padding: "16px 20px 20px" }}>
                  <div style={{ ...cardStyle, padding: "18px 20px" }}>
                    <p style={{ ...type.body, margin: 0, whiteSpace: "pre-wrap" }}>
                      {resource.description}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "details" && hasDetails && (
                <div style={{ padding: "16px 20px 20px" }}>
                  <h2 style={headStyle}>Details</h2>
                  <div style={{ ...cardStyle, padding: "4px 20px" }}>
                    {yearsValue && (
                      <InfoRow
                        first
                        icon={Calendar}
                        label={resource.since_year ? "Running" : "Years Running"}
                        value={yearsValue}
                      />
                    )}
                    {resource.post_frequency && (
                      <InfoRow
                        first={!yearsValue}
                        icon={Clock}
                        label="Avg. Posts"
                        value={resource.post_frequency}
                      />
                    )}
                    {admins.length > 0 && (
                      <div style={{
                        display: "flex", alignItems: "flex-start", gap: 14,
                        padding: "16px 0",
                        borderTop: (yearsValue || resource.post_frequency) ? `1px solid ${C.divider}` : "none",
                      }}>
                        <Users size={18} strokeWidth={1.5} color={C.primary} style={{ marginTop: 2, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ ...type.label, marginBottom: 10 }}>
                            {admins.length === 1 ? "Admin" : "Admins"}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {admins.map((a, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{
                                  width: 32, height: 32, borderRadius: 999, overflow: "hidden",
                                  background: C.ivory, display: "flex", alignItems: "center", justifyContent: "center",
                                  fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.primary, flexShrink: 0,
                                }}>
                                  {(a.name || "?").trim().charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontFamily: FONT, fontSize: 15, color: C.heading }}>{a.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </>
        );
      })()}

      {/* Fixed action bar, parked just above the bottom nav. BottomNav grows
          by var(--safe-bottom) for the home-indicator inset, so this has to
          clear that too or a taller inset pushes the nav up into it. */}
      <div style={{
        position: "fixed", bottom: "calc(74px + var(--safe-bottom) + 10px)", left: "50%", transform: "translateX(-50%)",
        zIndex: 40, width: "100%", maxWidth: 480,
        padding: "0 14px", boxSizing: "border-box",
        display: "flex", gap: 8,
      }}>
        <button
          onClick={handlePrimaryAction}
          style={{
            flex: 1, minWidth: 0,
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "16px 6px", borderRadius: 18,
            background: C.dark, border: "none", cursor: "pointer",
            color: "#FFFFFF", ...type.tabActive,
            boxShadow: "0 6px 16px rgba(66,51,36,0.28)",
            transition: "transform 150ms ease-out",
          }}
          {...pressScale()}
        >
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{primaryLabel}</span>
          {!isImageType && type_ !== "internal" && <ArrowUpRight size={16} strokeWidth={2} color="#FFFFFF" />}
        </button>
      </div>

      {/* In-app lightbox for QR/image */}
      {isImageType && resource.qr_image_url && (
        <ImageLightbox
          images={[resource.qr_image_url]}
          initialIndex={0}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          alt={displayTitle}
          title={type_ === "qr"
            ? "Tip: screenshot this code and send it to another device to scan with your phone."
            : undefined}
        />
      )}
    </div>
  );
};

export default LocalChannelDetail;
