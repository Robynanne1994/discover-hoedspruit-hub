import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessOwner } from "@/hooks/useBusinessOwner";
import BusinessLayout from "@/components/business/BusinessLayout";
import { useAuth } from "@/hooks/useAuth";
import { Tag, Calendar, Pencil, ArrowUpRight, MapPin, Star } from "lucide-react";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const INK = "#020202";
const BODY = "#2B2420";
const MUTED = "rgba(2,2,2,0.55)";
const IVORY = "#f5f0e8";
const DIVIDER = "rgba(2,2,2,0.08)";
const ACCENT = "#5C6446";
const RUST = "#9B5A3C";

const Pill = ({ tone, children }: { tone: "live" | "draft" | "pending"; children: React.ReactNode }) => {
  const map = {
    live: { fg: "#3B7D4F", bg: "rgba(59,125,79,0.12)" },
    draft: { fg: "#2B2420", bg: "rgba(18,18,20,0.06)" },
    pending: { fg: "#D4964A", bg: "rgba(212,150,74,0.12)" },
  }[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: map.bg,
        color: map.fg,
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 11.5,
        fontWeight: 500,
        letterSpacing: "0.02em",
        fontFamily: SANS,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: map.fg }} />
      {children}
    </span>
  );
};

const BusinessDashboard = () => {
  const { user } = useAuth();
  const { account, listing, pendingClaim, loading } = useBusinessOwner();
  const [stats, setStats] = useState({ specials: 0, events: 0, featured: 0 });
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!listing || !user) return;
      const today = new Date().toISOString().slice(0, 10);
      const [{ count: specialsCount }, { count: eventsCount }, { count: featuredCount }, { count: pSp }, { count: pEv }] =
        await Promise.all([
          supabase.from("specials").select("id", { count: "exact", head: true }).eq("business_id", listing.id).eq("is_active", true),
          supabase.from("events").select("id", { count: "exact", head: true }).eq("business_id", listing.id).gte("start_date", today),
          supabase.from("feature_requests").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("status", "approved"),
          supabase.from("specials_pending").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("events_pending").select("id", { count: "exact", head: true }).eq("status", "pending"),
        ]);
      setStats({ specials: specialsCount ?? 0, events: eventsCount ?? 0, featured: featuredCount ?? 0 });
      setPendingCount((pSp ?? 0) + (pEv ?? 0));
    };
    load();
  }, [listing, user]);

  const businessName = account?.business_name || listing?.title || null;

  // Determine the next-best action
  const nextAction = (() => {
    if (!listing && pendingClaim?.status === "pending") {
      return { eyebrow: "Claim under review", title: "We'll be in touch within 48 hours.", cta: null, href: null };
    }
    if (!listing) {
      return { eyebrow: "Get started", title: "Link a business to your account.", cta: "Claim or list", href: "/business/claim" };
    }
    if (stats.specials === 0) {
      return { eyebrow: "Next step", title: "Post your first special.", cta: "Post a special", href: "/business/specials/new" };
    }
    if (stats.events === 0) {
      return { eyebrow: "Tip", title: "Got something on this month?", cta: "Post an event", href: "/business/events/new" };
    }
    return null;
  })();

  return (
    <BusinessLayout businessName={businessName}>
      {loading ? (
        <p style={{ color: MUTED, fontFamily: SANS, fontSize: 14 }}>Loading…</p>
      ) : (
        <>
          {/* Business hero card */}
          {listing && (
            <div
              style={{
                background: IVORY,
                borderRadius: 16,
                overflow: "hidden",
                display: "flex",
                marginBottom: 12,
              }}
            >
              <div style={{ flex: 1, padding: "18px 20px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Pill tone="live">Live</Pill>
                  <span style={{ fontFamily: SANS, fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {account?.subscription_status === "active" ? "Subscribed" : "Free plan"}
                  </span>
                </div>
                <h2
                  style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: 26,
                    lineHeight: 1.05,
                    letterSpacing: "-0.4px",
                    color: INK,
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {listing.title}
                </h2>
                {listing.location && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, color: MUTED }}>
                    <MapPin size={12} strokeWidth={1.5} />
                    <span style={{ fontFamily: SANS, fontSize: 13 }}>{listing.location}</span>
                  </div>
                )}
              </div>
              {listing.image_url && (
                <div
                  style={{
                    width: 110,
                    flexShrink: 0,
                    background: `url(${listing.image_url}) center/cover no-repeat`,
                  }}
                />
              )}
            </div>
          )}

          {/* No-listing state */}
          {!listing && (
            <div
              style={{
                background: IVORY,
                borderRadius: 16,
                padding: "20px",
                marginBottom: 12,
              }}
            >
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: MUTED,
                  margin: 0,
                  marginBottom: 8,
                }}
              >
                {pendingClaim?.status === "pending" ? "Under review" : "No listing yet"}
              </p>
              <h2
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: 24,
                  lineHeight: 1.1,
                  color: INK,
                  margin: 0,
                }}
              >
                {pendingClaim?.status === "pending"
                  ? "Your claim is with our team."
                  : "Link a business to get going."}
              </h2>
            </div>
          )}

          {/* Next action */}
          {nextAction && (
            <Link
              to={nextAction.href ?? "#"}
              onClick={(e) => !nextAction.href && e.preventDefault()}
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "#fff",
                border: `1px solid ${DIVIDER}`,
                borderRadius: 16,
                padding: "16px 18px",
                marginBottom: 16,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: MUTED,
                    margin: 0,
                    marginBottom: 4,
                  }}
                >
                  {nextAction.eyebrow}
                </p>
                <p style={{ fontFamily: SANS, fontSize: 15, color: INK, margin: 0, fontWeight: 400 }}>
                  {nextAction.title}
                </p>
              </div>
              {nextAction.cta && (
                <span
                  style={{
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    background: RUST,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowUpRight size={16} strokeWidth={1.8} color="#EEE8DA" />
                </span>
              )}
            </Link>
          )}

          {/* Stats */}
          {listing && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 16 }}>
              <Stat label="Specials" value={stats.specials} />
              <Stat label="Events" value={stats.events} />
              <Stat label="Featured" value={stats.featured} icon={<Star size={11} strokeWidth={1.5} />} />
            </div>
          )}

          {/* Pending nudge */}
          {pendingCount > 0 && (
            <div
              style={{
                background: "rgba(212,150,74,0.10)",
                border: "1px solid rgba(212,150,74,0.25)",
                borderRadius: 14,
                padding: "12px 16px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <p style={{ fontFamily: SANS, fontSize: 13, color: BODY, margin: 0 }}>
                  {pendingCount} submission{pendingCount === 1 ? "" : "s"} awaiting review
                </p>
              </div>
              <Link
                to="/business/specials"
                style={{ fontFamily: SANS, fontSize: 13, color: ACCENT, textDecoration: "none", fontWeight: 500 }}
              >
                View
              </Link>
            </div>
          )}

          {/* Manage list */}
          {listing && (
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: `1px solid ${DIVIDER}`,
                overflow: "hidden",
              }}
            >
              <ManageRow icon={<Tag size={18} strokeWidth={1.5} />} label="Post a special" to="/business/specials/new" />
              <ManageRow icon={<Calendar size={18} strokeWidth={1.5} />} label="Post an event" to="/business/events/new" />
              <ManageRow icon={<Pencil size={18} strokeWidth={1.5} />} label="Edit listing details" to="/business/listing" last />
            </div>
          )}
        </>
      )}
    </BusinessLayout>
  );
};

const Stat = ({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) => (
  <div style={{ background: "#fff", borderRadius: 14, padding: "16px 12px", textAlign: "center" }}>
    <p
      style={{
        fontFamily: SERIF,
        fontStyle: "italic",
        fontSize: 28,
        color: INK,
        margin: 0,
        fontWeight: 400,
        lineHeight: 1,
      }}
    >
      {value}
    </p>
    <p
      style={{
        fontFamily: SANS,
        fontSize: 11,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: MUTED,
        margin: "8px 0 0",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {icon}
      {label}
    </p>
  </div>
);

const ManageRow = ({
  icon,
  label,
  to,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  to: string;
  last?: boolean;
}) => (
  <Link
    to={to}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "16px 18px",
      borderBottom: last ? "none" : `1px solid ${DIVIDER}`,
      textDecoration: "none",
      color: INK,
    }}
  >
    <span style={{ color: MUTED, display: "inline-flex" }}>{icon}</span>
    <span style={{ flex: 1, fontFamily: SANS, fontSize: 15 }}>{label}</span>
    <ArrowUpRight size={15} strokeWidth={1.5} color={MUTED} />
  </Link>
);

export default BusinessDashboard;
