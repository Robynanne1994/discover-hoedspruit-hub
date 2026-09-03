import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { specialImage } from "@/lib/specialCard";
import { format } from "date-fns";
import {
  Heart, Phone, Share2, Store, Clock, Calendar, ExternalLink, Copy, Pencil,
  ArrowUpRight, Banknote, Tag, Send, Mail, MapPin, Navigation,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useGuestAuth";
import { useShare } from "@/hooks/useShare";
import { copyToClipboard, sharePlainText } from "@/lib/share";
import { useIsFavourited, useToggleFavourite } from "@/hooks/useFavourites";
import { useState, useEffect } from "react";
import SpecialEditDialog from "@/components/admin/SpecialEditDialog";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import BottomNav from "@/components/BottomNav";
import { formatSAPhone } from "@/lib/formatPhone";
import { getSpecialBadge } from "@/lib/specialBadge";
import { formatDays, parseDays } from "@/lib/specialDays";
import { collectContacts } from "@/lib/contacts";
import { renderListingRichText } from "@/lib/listingRichText";
import Seo from "@/components/Seo";
import LocationMap from "@/components/LocationMap";
import { MUTED, tab as tabStyle, type, metaRow, metaIcon } from "@/lib/type";
import {
  resolveLocation,
  HOEDSPRUIT_CENTRE,
  type MappableRow,
  type ResolvedLocation,
} from "@/lib/tileMap";


const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";

// Design tokens (match ListingDetail)
const C = {
  bg: "#E6E0CC",
  surface: "#ffffff",
  ivory: "#f5f0e8",
  border: "#E8E4DF",
  divider: "#EDE9E3",
  heading: "#1A1A1A",
  text: "#2b2420",
  muted: MUTED,
  primary: "#715a3d",
  accent: "#B8916A",
  dark: "#423324",
  // Soft panel that sits on the beige sheet (icon circles)
  soft: "#EEE9DA",
};

const WhatsAppIcon = ({ size = 18, color = C.primary, ...props }: { size?: number; color?: string } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z" />
  </svg>
);


const pressScale = (s = "0.98") => ({
  onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = `scale(${s})`),
  onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
});

const headStyle: React.CSSProperties = {
  margin: "0 0 12px",
  ...type.sectionTitle, textTransform: "none",
};
const paraStyle: React.CSSProperties = {
  ...type.body, margin: "0 0 10px",
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

type TabKey = "about" | "details" | "contact" | "terms" | "location";

const SpecialDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  
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

  const [mapPlace, setMapPlace] = useState<ResolvedLocation | null>(null);

  // The special itself has no address; the location tab mirrors the linked listing.
  const { data: business } = useQuery({
    queryKey: ["special-business", (special as any)?.business_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id,title,location,google_maps_link,latitude,longitude,km_from_town,phone,whatsapp,email")
        .eq("id", (special as any).business_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!(special as any)?.business_id,
  });

  // Geocode for Location tab
  useEffect(() => {
    if (!business) return;
    setMapPlace(null);
    let cancelled = false;
    const row = business as unknown as MappableRow;
    resolveLocation({
      latitude: row.latitude,
      longitude: row.longitude,
      googleMapsLink: row.google_maps_link,
      location: (business as any).location,
      title: (business as any).title,
    })
      .then((place) => { if (!cancelled) setMapPlace(place); })
      .catch(() => { if (!cancelled) setMapPlace({ coords: HOEDSPRUIT_CENTRE, precise: false }); });
    return () => { cancelled = true; };
  }, [business]);

  const isFavourited = useIsFavourited(id!, "special");
  const toggleFavourite = useToggleFavourite();

  const requireAuth = useRequireAuth();
  const share = useShare();

  const handleToggleFavourite = () => {
    // Guests get a dismissable bottom sheet, not a full-screen redirect.
    if (!requireAuth("save favourites")) return;
    toggleFavourite.mutate({ itemId: id!, itemType: "special", currentlyFavourited: isFavourited });
  };

  // Opens the phone's own share sheet (copy link + the user's apps); falls back
  // to the in-app sheet on desktop browsers that have none.
  const handleShare = () => {
    share({
      title: special?.title || "Hello Hoedspruit",
      text: (special as any)?.description || undefined,
      url: `/specials/${id}`,
    });
  };

  if (isLoading || !special) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.text }}>
        <div style={{ padding: "var(--header-top) 16px 0" }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "#FFFFFF", border: "none", padding: 0, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <BackArrowIcon size={18} color="#1A1A1A" />
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
  // Contact inheritance: a special's own details always win, but where they are
  // blank we fall back to the linked business listing so the CTA still works.
  const biz: any = business || null;
  const contactPhone = (sp.contact_phone || "").trim() || (biz?.phone || "").trim() || "";
  const contactWhatsapp = (sp.contact_whatsapp || "").trim() || (biz?.whatsapp || "").trim() || "";
  const contactEmail = (sp.contact_email || "").trim() || (biz?.email || "").trim() || "";
  const phoneClean = contactPhone.replace(/\s/g, "");
  const waClean = contactWhatsapp.replace(/[^0-9]/g, "");
  const priceFmt = formatPrice(special.price);
  const originalFmt = formatPrice(special.original_price);
  const priceLabel = (sp.price_label || "").trim() || null;
  const subTag1 = (sp.sub_tag_1 || "").trim() || null;
  const subTag2 = (sp.sub_tag_2 || "").trim() || null;
  const mainTag = (sp.tag || "").trim() || null;
  const allTags = [
    { text: mainTag, type: "main" as const },
    { text: subTag1, type: "sub" as const },
    { text: subTag2, type: "sub" as const },
  ].filter((t) => t.text && String(t.text).trim() !== "");


  // Validity status
  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;
  const fmt = (d: Date) => format(d, "d MMM yyyy");
  const sameDay = fromDate && untilDate &&
    fromDate.getFullYear() === untilDate.getFullYear() &&
    fromDate.getMonth() === untilDate.getMonth() &&
    fromDate.getDate() === untilDate.getDate();
  let dotColor = "#2b7f3f";
  let statusLabel = "Live Now";
  let datesText = "Ongoing";
  if (untilDate && now > untilDate) {
    dotColor = C.muted; statusLabel = "Expired"; datesText = `ended ${fmt(untilDate)}`;
  } else if (fromDate && now < fromDate) {
    statusLabel = `Starts ${fmt(fromDate)}`;
    datesText = untilDate ? (sameDay ? `Valid for ${fmt(untilDate)}` : `runs to ${fmt(untilDate)}`) : "ongoing";
  } else if (untilDate) {
    const daysLeft = Math.ceil((untilDate.getTime() - now.getTime()) / DAY);
    if (daysLeft <= 7) {
      dotColor = "#B05B3F";
      statusLabel = daysLeft <= 0 ? "Ends today" : daysLeft === 1 ? "Ends tomorrow" : `Ends in ${daysLeft} days`;
      datesText = sameDay ? `Valid for ${fmt(untilDate)}` : `until ${fmt(untilDate)}`;
    } else {
      datesText = sameDay ? `Valid for ${fmt(untilDate)}` : `Valid until ${fmt(untilDate)}`;
    }
  } else if (fromDate) {
    datesText = "Ongoing";
  }

  // Action pills. Matching the events page: only the FIRST pill is filled
  // brown (the primary action) and it is Booking when a booking link exists,
  // falling back to WhatsApp / Call when it doesn't.
  const emailClean = contactEmail;
  const hasBooking = !!special.booking_link;
  const primaryKey = hasBooking ? "booking" : waClean ? "whatsapp" : phoneClean ? "call" : null;
  const actions = [
    hasBooking && {
      key: "booking", label: "Book",
      href: special.booking_link, Icon: Send, ext: true,
    },
    waClean && {
      key: "whatsapp", label: "WhatsApp", href: `https://wa.me/${waClean}`, ext: true,
      Icon: WhatsAppIcon,
    },
    phoneClean && { key: "call", label: "Call", href: `tel:${phoneClean}`, Icon: Phone, ext: false },
    special.business_id && {
      key: "business", label: "Business",
      href: `/listing/${special.business_id}`, Icon: Store, ext: false, internal: true,
    },
  ].filter(Boolean) as Array<{ key: string; label: string; href: string; Icon: any; ext: boolean; internal?: boolean }>;

  // Fill up to 4 pills by adding email when available
  if (actions.length < 4 && emailClean && !actions.some((a) => a.key === "email")) {
    actions.push({ key: "email", label: "Email", href: `mailto:${emailClean}`, Icon: Mail, ext: false });
  }


  const ActionBtn = ({ a }: { a: typeof actions[number] }) => {
    const filled = a.key === primaryKey;
    const fg = filled ? "#FFFFFF" : C.heading;
    const baseStyle: React.CSSProperties = {
      flex: 1, minWidth: 0,
      display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
      padding: "12px 6px", borderRadius: 18,
      background: filled ? C.dark : C.surface,
      border: "none",
      color: fg, textDecoration: "none",
      ...type.tabActive,
      boxShadow: filled ? "0 6px 16px rgba(66,51,36,0.28)" : "0 4px 14px rgba(43,36,32,0.10)",
      transition: "transform 150ms ease-out",
    };
    const content = (
      <>
        <a.Icon size={20} strokeWidth={1.75} color={fg} />
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{a.label}</span>
      </>
    );
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

  const detailRows: { icon: any; label: string; value: React.ReactNode; href?: string; internal?: boolean }[] = [];
  if (special.business_name) {
    detailRows.push({
      icon: Store, label: "Business", value: special.business_name,
      href: special.business_id ? `/listing/${special.business_id}` : undefined,
      internal: true,
    });
  }
  const savingsText = ((sp.savings || "") as string).trim() || null;
  if (priceFmt) {
    detailRows.push({
      icon: Banknote, label: "Price",
      value: (
        <span>
          {priceFmt}
          {priceLabel && <span style={{ color: C.muted, marginLeft: 6 }}>{priceLabel}</span>}
          {originalFmt && <span style={{ color: C.muted, textDecoration: "line-through", marginLeft: 6 }}>{originalFmt}</span>}
        </span>
      ),
    });
  } else if (savingsText) {
    detailRows.push({
      icon: Banknote, label: "Savings",
      value: <span>{savingsText}</span>,
    });
  }
  detailRows.push({ icon: Tag, label: "Deal", value: getSpecialBadge(sp) });
  const redemptionNote = (sp.redemption_note || "").trim() || null;
  if (redemptionNote) detailRows.push({ icon: Tag, label: "How To Redeem", value: redemptionNote });

  // The cards abbreviate a multi-day schedule to fit; the detail page has the
  // room to spell it out.
  const dayLine = formatDays(parseDays(sp.day_of_week), "long");
  if (dayLine) {
    detailRows.push({
      icon: Clock,
      label: "Runs On",
      value: dayLine === "Every day" ? "Every day" : `Every ${dayLine}`,
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

  // ----- Tab content -----
  const renderAbout = () => {
    const desc = (special.description || "").trim();

    return (
      <div style={{ padding: "16px 20px 20px" }}>
        {desc && (
          <>
            <div style={{ ...cardStyle, padding: "18px 20px" }}>{renderListingRichText(desc)}</div>
          </>
        )}

        {detailRows.length > 0 && (
          <div style={{ marginTop: desc ? 28 : 0 }}>
            <h2 style={headStyle}>Details</h2>
            <div style={{ ...cardStyle, padding: "4px 20px" }}>
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
                if (r.href && r.internal) return <Link key={i} to={r.href} style={rowStyle}>{inner}</Link>;
                if (r.href) return <a key={i} href={r.href} target="_blank" rel="noopener noreferrer" style={rowStyle}>{inner}</a>;
                return <div key={i} style={rowStyle}>{inner}</div>;
              })}
            </div>
          </div>
        )}

        {special.promo_code && (
          <div style={{ marginTop: 28 }}>
            <h2 style={headStyle}>Promo Code</h2>
            <button
              onClick={async () => {
                // copyToClipboard falls back to a selection copy, which is what
                // makes this work inside the app's webview too.
                const ok = await copyToClipboard(special.promo_code!);
                if (ok) toast.success("Promo code copied!");
                else toast.error("Could not copy code");
              }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                background: C.surface, border: `1px dashed ${C.primary}`,
                borderRadius: 20, padding: "18px 20px", cursor: "pointer",
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

  const renderContact = () => {
    const rows: { Icon: any; label: string; value: string; href: string; external?: boolean; internal?: boolean }[] = [];
    const phones = collectContacts(contactPhone, (special as any).additional_phones);
    const whatsapps = collectContacts(contactWhatsapp, (special as any).additional_whatsapps);
    phones.forEach((p, i) => {
      const clean = p.replace(/\s/g, "");
      rows.push({ Icon: Phone, label: i === 0 ? "Phone" : `Phone ${i + 1}`, value: formatSAPhone(p), href: `tel:${clean}` });
    });
    whatsapps.forEach((w, i) => {
      const clean = w.replace(/[^0-9]/g, "");
      rows.push({ Icon: WhatsAppIcon, label: i === 0 ? "WhatsApp" : `WhatsApp ${i + 1}`, value: "Chat on WhatsApp", href: `https://wa.me/${clean}`, external: true });
    });
    const email = contactEmail;
    if (email) rows.push({ Icon: Mail, label: "Email", value: email, href: `mailto:${email}` });
    if (special.business_id && special.business_name) rows.push({
      Icon: Store, label: "Business", value: special.business_name,
      href: `/listing/${special.business_id}`, internal: true,
    });
    if (special.booking_link) rows.push({
      Icon: ExternalLink, label: "Booking",
      value: sp.booking_link_label?.trim() || special.booking_link,
      href: special.booking_link, external: true,
    });

    return (
      <div style={{ padding: "16px 20px 20px" }}>
        {rows.length === 0 ? (
          <p style={{ ...paraStyle, color: C.muted, textAlign: "center", marginTop: 40 }}>No contact info provided.</p>
        ) : (
          <>
            <h2 style={{ ...headStyle, margin: "0 0 14px" }}>Contact</h2>
            <div style={{ ...cardStyle, padding: "4px 20px" }}>
              {rows.map((r, i) => {
                const rowStyle: React.CSSProperties = {
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 0", textDecoration: "none",
                  borderTop: i === 0 ? "none" : `1px solid ${C.divider}`,
                };
                const inner = (
                  <>
                    <r.Icon size={18} strokeWidth={1.5} color={C.primary} />
                    <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 400, color: C.heading, wordBreak: "break-word" }}>
                      {r.value}
                    </div>
                    <ArrowUpRight size={16} color={C.muted} />
                  </>
                );
                if (r.internal) return <Link key={i} to={r.href} style={rowStyle}>{inner}</Link>;
                return (
                  <a key={i} href={r.href} {...(r.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} style={rowStyle}>
                    {inner}
                  </a>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };


  const renderLocation = () => {
    const b: any = business || {};
    const locText = (b.location as string | null) || null;
    const isSurrounds = (locText || "").trim().toLowerCase() === "hoedspruit & surrounds";
    const addressText = locText || b.title || special.business_name || special.title;
    const mapHref = b.google_maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;
    const kmFromTown = (() => {
      if (!b.km_from_town) return null;
      const n = parseFloat(String(b.km_from_town).replace(",", ".").replace(/[^0-9.]/g, ""));
      const value = Number.isFinite(n) ? (Math.round(n * 100) / 100).toString() : String(b.km_from_town);
      return `${value}km from Town`;
    })();

    const copyAddress = async () => {
      const outcome = await sharePlainText(addressText);
      if (outcome === "copied") toast.success("Address copied");
      if (outcome === "failed") toast.error("Couldn't copy the address");
    };

    // One row of the directions / address card: circled icon, label + value, arrow.
    const LocationRow = ({
      Icon, label, value, onClick, href, first,
    }: {
      Icon: any; label: string; value: string; onClick?: () => void; href?: string; first?: boolean;
    }) => {
      const inner = (
        <>
          <span style={{
            width: 40, height: 40, borderRadius: "50%", background: C.soft,
            display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon size={17} strokeWidth={1.75} color={C.primary} />
          </span>
          <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <span style={{
              ...type.label, display: "block", marginBottom: 3,
            }}>
              {label}
            </span>
            <span style={{ display: "block", fontFamily: FONT, fontSize: 15, color: C.heading, wordBreak: "break-word" }}>
              {value}
            </span>
          </span>
          {href && <ArrowUpRight size={16} color={C.muted} style={{ flexShrink: 0 }} />}
        </>
      );
      const rowStyle: React.CSSProperties = {
        display: "flex", alignItems: "center", gap: 14, width: "100%",
        padding: "16px 0", textDecoration: "none",
        background: "none", border: "none", cursor: "pointer",
        borderTop: first ? "none" : `1px solid ${C.divider}`,
      };
      return href
        ? <a href={href} target="_blank" rel="noopener noreferrer" style={rowStyle}>{inner}</a>
        : <button type="button" onClick={onClick} style={rowStyle}>{inner}</button>;
    };

    return (
      <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ ...cardStyle, padding: isSurrounds ? "20px 22px" : 0, overflow: "hidden" }}>
          {isSurrounds ? (
            <div style={{ fontFamily: FONT, fontSize: 15, color: C.heading }}>
              Hoedspruit &amp; Surrounds
            </div>
          ) : (
            <>
              <div style={{ borderRadius: "16px 16px 0 0", overflow: "hidden" }}>
                <LocationMap
                  coords={mapPlace?.coords ?? null}
                  precise={mapPlace?.precise ?? true}
                  href={mapHref}
                  label={b.title || special.title}
                  pinColor={C.primary}
                />
              </div>
              <div style={{ padding: "14px 20px 16px" }}>
                {locText && (
                  <div style={type.cardTitleL}>
                    {locText}
                  </div>
                )}
                {kmFromTown && (
                  <div style={{ fontFamily: FONT, fontSize: 14, color: C.muted, marginTop: 4 }}>
                    {kmFromTown}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {!isSurrounds && (
          <div style={{ ...cardStyle, padding: "0 20px" }}>
            <LocationRow first Icon={Navigation} label="Directions" value="Open in Google Maps" href={mapHref} />
            <LocationRow Icon={Copy} label="COPY ADDRESS" value={addressText} onClick={copyAddress} />
          </div>
        )}
      </div>
    );
  };


  const renderTerms = () => {
    const termsList: string[] = (special.terms || "")
      .split("\n")
      .map((s: string) => s.trim())
      .filter(Boolean);
    return (
      <div style={{ padding: "16px 20px 20px" }}>
        {termsList.length > 0 ? (
          <>
            <h2 style={headStyle}>Terms & Conditions</h2>
            <div style={{ ...cardStyle, padding: "14px 20px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {termsList.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 0" }}>
                    <span style={{
                      flexShrink: 0, width: 6, height: 6, borderRadius: 999,
                      background: C.primary, marginTop: 8,
                    }} />
                    <span style={{ ...paraStyle, margin: 0, whiteSpace: "pre-line", fontSize: 13, color: C.text, flex: 1, minWidth: 0 }}>
                      {t}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p style={{ ...paraStyle, color: C.muted, textAlign: "center", marginTop: 40 }}>No terms provided.</p>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: actions.length > 0 ? 190 : 100, fontFamily: FONT, color: C.text }}>
      <Seo
        title={`${special.title} — Hoedspruit Special`}
        description={
          ((special as any).description ? String((special as any).description).replace(/<[^>]*>/g, "").trim() : "") ||
          `${special.title} — a current special in Hoedspruit. See the deal and how to redeem on Hello Hoedspruit.`
        }
        path={`/specials/${special.id}`}
        image={specialImage(special, "detail") || undefined}
        type="article"
      />
      {/* Hero (4:3) with floating action buttons */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "#DDD6C0", overflow: "hidden" }}>
        {specialImage(special, "detail") && (
          <img src={specialImage(special, "detail")!} alt={special.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        )}
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            ...floatBtn,
            position: "absolute",
            top: "var(--overlay-top)",
            left: 16,
            zIndex: 2,
          }}
        >
          <BackArrowIcon size={20} color={C.heading} />
        </button>
        <div style={{
          position: "absolute",
          top: "var(--overlay-top)",
          right: 16,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <button onClick={handleShare} aria-label="Share" style={floatBtn}>
            <Share2 size={20} strokeWidth={1.6} color={C.heading} />
          </button>
          <button onClick={handleToggleFavourite} aria-label={isFavourited ? "Unsave" : "Save"} style={floatBtn}>
            <Heart size={20} strokeWidth={2} color={isFavourited ? "#715a3d" : C.primary} fill={isFavourited ? "#715a3d" : "none"} />
          </button>
          {isAdmin && (
            <button onClick={() => setEditOpen(true)} aria-label="Edit" style={floatBtn}>
              <Pencil size={18} strokeWidth={1.6} color={C.heading} />
            </button>
          )}
        </div>
      </div>

      {/* Title sheet — overlaps the hero with a rounded top edge */}
      <div style={{
        position: "relative",
        zIndex: 3,
        background: C.surface,
        borderRadius: "28px 28px 0 0",
        marginTop: -28,
        padding: "22px 20px 0",
      }}>
        {allTags.length > 0 && (
          <div style={categoryLineStyle}>
            {allTags.map((t, i) => (
              <span key={i}>
                {i > 0 && <span style={{ color: C.accent, margin: "0 6px" }}>·</span>}
                {t.text}
              </span>
            ))}
          </div>
        )}

        <h1
          data-no-title-case={(special as any).title_override?.trim() ? "true" : undefined}
          style={{
            ...type.pageTitle, margin: 0,
          }}
        >
          {(special as any).title_override?.trim()
            ? <span data-no-title-case="true">{(special as any).title_override}</span>
            : special.title}
        </h1>

        <div style={{ marginTop: 10, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          <span style={{ width: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: dotColor }} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.01em", color: dotColor }}>{statusLabel}</span>
          <span style={{ fontSize: 13, color: MUTED }}>· {datesText}</span>
        </div>

        {special.business_name && (
          <div style={{ marginTop: 12, ...metaRow, ...type.meta }}>
            <Store size={14} color={MUTED} strokeWidth={1.75} style={metaIcon()} />
            {special.business_id ? (
              // `a { font-medium }` in index.css would otherwise weight this line
              // heavier than the same row on the listing and event pages.
              <Link to={`/listing/${special.business_id}`} style={{ ...type.meta, textDecoration: "none" }}>
                {special.business_name}
              </Link>
            ) : <span>{special.business_name}</span>}
          </div>
        )}

      </div>


      {/* Sticky tab bar */}
      {(() => {
        const hasAbout = !!(special.description?.trim()) ||
          detailRows.length > 0 ||
          !!special.promo_code;
        const phones = collectContacts(contactPhone, (special as any).additional_phones);
        const whatsapps = collectContacts(contactWhatsapp, (special as any).additional_whatsapps);
        const hasContact = phones.length > 0 || whatsapps.length > 0 || !!special.booking_link || !!contactEmail || !!special.business_id;
        const hasTerms = !!special.terms?.trim();
        const hasLocation = !!(business && ((business as any).location || mapPlace));

        const availableTabs: TabKey[] = [
          ...(hasAbout ? ["about" as TabKey] : []),
          ...(hasContact ? ["contact" as TabKey] : []),
          ...(hasLocation ? ["location" as TabKey] : []),
          ...(hasTerms ? ["terms" as TabKey] : []),
        ];
        const activeTab: TabKey | null = availableTabs.includes(tab) ? tab : (availableTabs[0] ?? null);
        if (activeTab && activeTab !== tab && availableTabs.length > 0 && !availableTabs.includes(tab)) {
          // Defer state update to next tick to avoid render-time setState
          queueMicrotask(() => setTab(activeTab));
        }
        if (availableTabs.length === 0) return null;

        return (
          <>
            <nav style={{
              position: "sticky", top: 0, zIndex: 30,
              background: C.surface, borderBottom: "1px solid rgba(112,90,61,0.14)",
              display: "flex", padding: "12px 12px 0",
            }}>
              {hasAbout && <TabBtn k="about" label="Details" />}
              {hasContact && <TabBtn k="contact" label="Contact" />}
              {hasLocation && <TabBtn k="location" label="Location" />}
              {hasTerms && <TabBtn k="terms" label="Terms" />}
            </nav>

            <section style={{ background: C.bg }}>
              {activeTab === "about" && renderAbout()}
              {activeTab === "contact" && renderContact()}
              {activeTab === "location" && renderLocation()}
              {activeTab === "terms" && renderTerms()}
            </section>
          </>
        );
      })()}

      {/* Fixed action bar, parked just above the bottom nav. BottomNav grows
          by var(--safe-bottom) for the home-indicator inset, so this has to
          clear that too or a taller inset pushes the nav up into it. */}
      {actions.length > 0 && (
        <div style={{
          position: "fixed", bottom: "calc(74px + var(--safe-bottom) + 10px)", left: "50%", transform: "translateX(-50%)",
          zIndex: 40, width: "100%", maxWidth: 480,
          padding: "0 14px", boxSizing: "border-box",
          display: "flex", gap: 8,
        }}>
          {actions.map((a) => <ActionBtn key={a.key} a={a} />)}
        </div>
      )}

      {isAdmin && (
        <SpecialEditDialog open={editOpen} onOpenChange={setEditOpen} special={special} />
      )}

      <BottomNav />
    </div>
  );
};

export default SpecialDetail;
