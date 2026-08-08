import { useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, QrCode, ExternalLink, Image as ImageIcon, Pencil, Calendar, Clock, Users, Heart, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ImageLightbox from "@/components/ImageLightbox";
import { useAuth } from "@/hooks/useAuth";
import { useIsFavourited, useToggleFavourite } from "@/hooks/useFavourites";
import { useRequireAuth } from "@/hooks/useGuestAuth";
import { useShare } from "@/hooks/useShare";
import Seo from "@/components/Seo";
import { MUTED as TOKEN_MUTED } from "@/lib/type";



const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const PAGE_BG = "#E6E0CC";
const CARD = "#ffffff";
const IVORY = "#f5f0e8";
const INK = "#1A1A1A";
const BODY = "#2b2420";
const MUTED = TOKEN_MUTED;
const LINE = "#E2DAC6";
const BORDER = "#E8E4DF";
const DIVIDER = "#EDE9E3";
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

const InfoRow = ({ icon: Icon, label, value, first }: { icon: any; label: string; value: React.ReactNode; first?: boolean }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 14,
    padding: "14px 0",
    borderTop: first ? "none" : `1px solid ${DIVIDER}`,
  }}>
    <Icon size={18} strokeWidth={1.5} color={PRIMARY} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: HN, fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em", color: MUTED }}>{label}</div>
      <div style={{ fontFamily: HN, fontSize: 14, fontWeight: 400, color: INK, wordBreak: "break-word" }}>{value}</div>
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

  const defaultLabel = isImageType
    ? (type === "qr" ? "Show QR Code" : "View Image")
    : (type === "internal" ? "Open Page" : "Open Channel");
  const primaryLabel = (!isImageType && resource.cta_label && resource.cta_label.trim())
    ? resource.cta_label.trim()
    : defaultLabel;
  const PrimaryIcon = isImageType ? (type === "qr" ? QrCode : ImageIcon) : ExternalLink;

  const metaParts = [resource.meta, resource.meta_2].filter((m: string | null) => m && m.trim());

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, fontFamily: HN, paddingBottom: 140 }}>
      <Seo
        title={`${displayTitle} — Local Channel`}
        description={
          (resource.description ? String(resource.description).replace(/<[^>]*>/g, "").trim() : "") ||
          `${displayTitle} — a local Hoedspruit channel on ${resource.platform}.`
        }
        path={`/local-channels/${resource.slug || resource.id}`}
        image={resource.detail_image_url || resource.image_url || undefined}
        type="article"
      />
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
          <div style={{ display: "flex", gap: 8 }}>
            <CircleBtn onClick={handleToggleFavourite} ariaLabel={isFavourited ? "Remove from saved" : "Save"}>
              <Heart size={18} strokeWidth={2} color={isFavourited ? PRIMARY : INK} fill={isFavourited ? PRIMARY : "none"} />
            </CircleBtn>
            <CircleBtn onClick={handleShare} ariaLabel="Share">
              <Share2 size={18} strokeWidth={2} color={INK} />
            </CircleBtn>

            {isAdmin && (
              <CircleBtn
                onClick={() => navigate(`/admin/local-channels?edit=${resource.id}&returnTo=${encodeURIComponent(location.pathname)}`, { replace: true })}
                ariaLabel="Edit resource"
              >
                <Pencil size={18} color={INK} strokeWidth={2} />
              </CircleBtn>
            )}
          </div>
        </div>
      </div>

      {/* Title block */}
      <div style={{ background: CARD, padding: "24px 20px 20px" }}>

        {(() => {
          const tags = [resource.tag_1, resource.tag_2].filter((t: string | null) => t && t.trim());
          if (!tags.length) return null;
          return (
            <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {tags.map((t: string, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {i > 0 && (
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: PRIMARY, flexShrink: 0 }} />
                  )}
                  <span style={{
                    fontFamily: HN,
                    fontSize: 11,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: i === 0 ? PRIMARY : MUTED,
                    fontWeight: i === 0 ? 700 : 400,
                  }}>
                    {t}
                  </span>
                </div>
              ))}
            </div>
          );
        })()}
        <h1
          data-no-title-case={resource.title_override?.trim() ? "true" : undefined}
          style={{ fontFamily: HEAD, fontWeight: 550, fontSize: 28, lineHeight: 1.15, color: INK, margin: 0, letterSpacing: "0.01em", textTransform: resource.title_override?.trim() ? "none" : undefined }}
        >
          {displayTitle}
        </h1>


        {metaParts.length > 0 && (
          <div style={{
            marginTop: 8, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
            fontFamily: HN, fontSize: 13, color: MUTED, letterSpacing: "0.01em",
          }}>
            {metaParts.map((m: string, i: number) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {i > 0 && (
                  <span style={{ width: 4, height: 4, borderRadius: 999, background: MUTED, display: "inline-block" }} />
                )}
                <span>{m}</span>
              </span>
            ))}
          </div>
        )}




        {/* Primary action */}
        <button
          onClick={handlePrimaryAction}
          style={{
            marginTop: 24, width: "100%", height: 54, borderRadius: 999,
            background: "#423324", color: "#FFFFFF", border: "none", cursor: "pointer",
            fontFamily: HN, fontSize: 14, fontWeight: 600, letterSpacing: "0.04em",
            textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}
        >
          <PrimaryIcon size={16} strokeWidth={2} />
          {primaryLabel}
        </button>
      </div>

      {/* Tabs */}
      {(() => {
        const hasAbout = !!resource.description?.trim();
        const tabs: { key: "details" | "about"; label: string }[] = [
          ...(hasAbout ? [{ key: "about" as const, label: "About" }] : []),
          { key: "details", label: "Details" },
        ];
        const defaultTab: "details" | "about" = hasAbout ? "about" : "details";
        const activeTab = tabs.some((t) => t.key === tab) ? tab : defaultTab;
        if (activeTab !== tab) queueMicrotask(() => setTab(activeTab));


        const TabBtn = ({ k, label }: { k: "details" | "about"; label: string }) => {
          const active = activeTab === k;
          return (
            <button
              onClick={() => setTab(k)}
              style={{
                flex: 1, background: "none", border: "none", cursor: "pointer",
                padding: "14px 4px",
                fontFamily: HN, fontWeight: active ? 700 : 400, fontSize: 12,
                letterSpacing: "0.08em", textTransform: "uppercase",
                color: active ? INK : MUTED,
                borderBottom: `2px solid ${active ? INK : "transparent"}`,
                marginBottom: -1,
              }}
            >
              {label}
            </button>
          );
        };

        return (
          <>
            {tabs.length > 1 && (
              <nav style={{
                position: "sticky", top: 0, zIndex: 30,
                background: CARD, borderBottom: `1px solid ${BORDER}`,
                display: "flex", padding: "0 8px",
              }}>
                {tabs.map((t) => <TabBtn key={t.key} k={t.key} label={t.label} />)}
              </nav>
            )}

            {activeTab === "details" && (
              <div style={{ padding: "24px 20px 0" }}>
                <h2 style={{
                  margin: "0 0 12px",
                  fontFamily: HEAD, fontWeight: 550, fontSize: 22, lineHeight: 1.2,
                  letterSpacing: 0, textTransform: "none", color: INK,
                }}>
                  Details
                </h2>
                {(() => {

                  const admins: { name: string }[] = Array.isArray(resource.admins) && resource.admins.length
                    ? resource.admins.filter((a: any) => a?.name).map((a: any) => ({ name: a.name }))
                    : (resource.admin_name ? resource.admin_name.split("|").map((n: string) => n.trim()).filter(Boolean).map((name: string) => ({ name })) : []);
                  const yearsValue = resource.since_year
                    ? `Since ${resource.since_year}`
                    : (resource.years_running != null
                        ? `${resource.years_running} ${resource.years_running === 1 ? "year" : "years"}`
                        : null);
                  const hasAny = admins.length > 0 || yearsValue || resource.post_frequency;
                  return (
                    <div style={{ background: CARD, borderRadius: 16, padding: "4px 16px", border: `1px solid ${BORDER}` }}>
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
                          padding: "14px 0",
                          borderTop: (yearsValue || resource.post_frequency) ? `1px solid ${DIVIDER}` : "none",
                        }}>
                          <Users size={18} strokeWidth={1.5} color={PRIMARY} style={{ marginTop: 2, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: HN, fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em", color: MUTED, marginBottom: 10 }}>
                              {admins.length === 1 ? "Admin" : "Admins"}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              {admins.map((a, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div style={{
                                    width: 32, height: 32, borderRadius: 999, overflow: "hidden",
                                    background: IVORY, display: "flex", alignItems: "center", justifyContent: "center",
                                    fontFamily: HN, fontSize: 13, fontWeight: 700, color: PRIMARY, flexShrink: 0,
                                  }}>
                                    {(a.name || "?").trim().charAt(0).toUpperCase()}
                                  </div>
                                  <span style={{ fontFamily: HN, fontSize: 14, color: INK }}>{a.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {!hasAny && (
                        <div style={{ padding: "16px 0", color: MUTED, fontFamily: HN, fontSize: 13 }}>
                          No additional details yet.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === "about" && hasAbout && (
              <div style={{ padding: "24px 20px 0" }}>
                <h2 style={{
                  margin: "0 0 12px",
                  fontFamily: HEAD, fontWeight: 550, fontSize: 22, lineHeight: 1.2,
                  letterSpacing: 0, textTransform: "none", color: INK,
                }}>
                  About
                </h2>
                <p style={{ fontFamily: HN, fontSize: 14.5, lineHeight: 1.6, color: BODY, margin: 0, whiteSpace: "pre-wrap" }}>
                  {resource.description}
                </p>
              </div>
            )}
          </>
        );
      })()}


      {/* In-app lightbox for QR/image */}
      {isImageType && resource.qr_image_url && (
        <ImageLightbox
          images={[resource.qr_image_url]}
          initialIndex={0}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          alt={displayTitle}
          title={type === "qr"
            ? "Tip: screenshot this code and send it to another device to scan with your phone."
            : undefined}
        />
      )}
    </div>
  );
};

export default LocalChannelDetail;
