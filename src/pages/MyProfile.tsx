import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollowCounts } from "@/hooks/useFollows";
import { ArrowLeft, MoreVertical, Pencil, Share2, Heart, MapPin, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

const PAGE_BG = "#5C6446";
const CREAM = "#EEE8DA";
const SOFT_CREAM = "#F4EFE3";
const INK = "#2A2A24";
const MUTED = "#6B6A5E";
const LINE = "#D9D2C0";
const RUST = "#9B5A3C";
const GOLD = "#D9C36B";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const titleCase = (s?: string | null) =>
  (s || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const getInitial = (s?: string | null) =>
  (s || "?").trim().charAt(0).toUpperCase() || "?";

const fmtCount = (n: number) => n.toLocaleString("en-US");

const timeAgo = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) {
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "JUST NOW";
    return `${hours} ${hours === 1 ? "HOUR" : "HOURS"} AGO`;
  }
  if (days < 30) return `${days} ${days === 1 ? "DAY" : "DAYS"} AGO`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
};

const SunRays = () => {
  const cx = 66;
  const cy = 66;
  const inner = 60;
  const outer = 66;
  const rays = Array.from({ length: 16 }, (_, i) => {
    const angle = (i * 22.5 * Math.PI) / 180;
    const x1 = cx + Math.cos(angle) * inner;
    const y1 = cy + Math.sin(angle) * inner;
    const x2 = cx + Math.cos(angle) * outer;
    const y2 = cy + Math.sin(angle) * outer;
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={GOLD} strokeWidth={2.5} strokeLinecap="round" />;
  });
  return (
    <svg
      width={132}
      height={132}
      viewBox="0 0 132 132"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {rays}
    </svg>
  );
};

const CircleBtn = ({ onClick, label, children }: { onClick?: () => void; label: string; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    aria-label={label}
    style={{
      width: 40,
      height: 40,
      borderRadius: "50%",
      background: CREAM,
      border: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      padding: 0,
    }}
  >
    {children}
  </button>
);

const MyProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/welcome");
  }, [authLoading, user, navigate]);

  const id = user?.id;
  const queryClient = useQueryClient();

  const removeFavourite = useMutation({
    mutationFn: async ({ item_id, item_type }: { item_id: string; item_type: string }) => {
      if (!id) return;
      await supabase
        .from("favourites")
        .delete()
        .eq("user_id", id)
        .eq("item_id", item_id)
        .eq("item_type", item_type);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-saved-listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-saved-events"] });
      queryClient.invalidateQueries({ queryKey: ["my-saved-specials"] });
      queryClient.invalidateQueries({ queryKey: ["my-saved-count"] });
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      queryClient.invalidateQueries({ queryKey: ["favourite"] });
      queryClient.invalidateQueries({ queryKey: ["saved-listings-page"] });
      queryClient.invalidateQueries({ queryKey: ["saved-events-page"] });
      queryClient.invalidateQueries({ queryKey: ["saved-specials-page"] });
    },
  });

  const handleUnsave = (e: React.MouseEvent, item_id: string, item_type: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeFavourite.mutate({ item_id, item_type });
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile", id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: counts } = useFollowCounts(id);

  const { data: saved } = useQuery({
    queryKey: ["my-saved-listings", id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("item_id, created_at")
        .eq("user_id", id!)
        .eq("item_type", "listing")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!favs?.length) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, image_url, location, google_rating")
        .in("id", ids);
      const map = Object.fromEntries((listings || []).map((l: any) => [l.id, l]));
      return favs.map((f) => ({ ...map[f.item_id], created_at: f.created_at })).filter((l) => l.id);
    },
    enabled: !!id,
  });

  const { data: savedEvents } = useQuery({
    queryKey: ["my-saved-events", id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("item_id, created_at")
        .eq("user_id", id!)
        .eq("item_type", "event")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!favs?.length) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: events } = await supabase
        .from("events")
        .select("id, title, image_url, location, start_date")
        .in("id", ids);
      const map = Object.fromEntries((events || []).map((e: any) => [e.id, e]));
      return favs.map((f) => ({ ...map[f.item_id], created_at: f.created_at })).filter((e) => e.id);
    },
    enabled: !!id,
  });

  const { data: savedSpecials } = useQuery({
    queryKey: ["my-saved-specials", id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("item_id, created_at")
        .eq("user_id", id!)
        .eq("item_type", "special")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!favs?.length) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: specials } = await supabase
        .from("specials")
        .select("id, title, image_url, business_name")
        .in("id", ids);
      const map = Object.fromEntries((specials || []).map((s: any) => [s.id, s]));
      return favs.map((f) => ({ ...map[f.item_id], created_at: f.created_at })).filter((s) => s.id);
    },
    enabled: !!id,
  });
  const { data: savedCount } = useQuery({
    queryKey: ["my-saved-count", id],
    queryFn: async () => {
      const { count } = await supabase
        .from("favourites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", id!);
      return count ?? 0;
    },
    enabled: !!id,
  });

  // Activity timeline: merge recent favourites + been_here
  const { data: activity } = useQuery({
    queryKey: ["my-activity", id],
    queryFn: async () => {
      const [{ data: favs }, { data: visits }] = await Promise.all([
        supabase
          .from("favourites")
          .select("item_id, item_type, created_at")
          .eq("user_id", id!)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("been_here")
          .select("listing_id, created_at")
          .eq("user_id", id!)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      const listingIds = new Set<string>();
      const eventIds = new Set<string>();
      const specialIds = new Set<string>();
      (favs || []).forEach((f) => {
        if (f.item_type === "listing") listingIds.add(f.item_id);
        if (f.item_type === "event") eventIds.add(f.item_id);
        if (f.item_type === "special") specialIds.add(f.item_id);
      });
      (visits || []).forEach((v) => listingIds.add(v.listing_id));

      const [listingsRes, eventsRes, specialsRes] = await Promise.all([
        listingIds.size
          ? supabase.from("listings").select("id, title").in("id", Array.from(listingIds))
          : Promise.resolve({ data: [] as any[] }),
        eventIds.size
          ? supabase.from("events").select("id, title").in("id", Array.from(eventIds))
          : Promise.resolve({ data: [] as any[] }),
        specialIds.size
          ? supabase.from("specials").select("id, title").in("id", Array.from(specialIds))
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const lMap = Object.fromEntries((listingsRes.data || []).map((x: any) => [x.id, x]));
      const eMap = Object.fromEntries((eventsRes.data || []).map((x: any) => [x.id, x]));
      const sMap = Object.fromEntries((specialsRes.data || []).map((x: any) => [x.id, x]));

      type Row = { kind: "save" | "visit"; verb: string; name: string; href: string; created_at: string; itemType?: string };
      const rows: Row[] = [];

      (favs || []).forEach((f) => {
        if (f.item_type === "listing" && lMap[f.item_id]) {
          rows.push({
            kind: "save",
            verb: "you saved",
            name: titleCase(lMap[f.item_id].title),
            href: `/listing/${f.item_id}`,
            created_at: f.created_at,
            itemType: "listing",
          });
        } else if (f.item_type === "event" && eMap[f.item_id]) {
          rows.push({
            kind: "save",
            verb: "you're going to",
            name: titleCase(eMap[f.item_id].title),
            href: `/event/${f.item_id}`,
            created_at: f.created_at,
            itemType: "event",
          });
        } else if (f.item_type === "special" && sMap[f.item_id]) {
          rows.push({
            kind: "save",
            verb: "you saved",
            name: titleCase(sMap[f.item_id].title),
            href: `/special/${f.item_id}`,
            created_at: f.created_at,
            itemType: "special",
          });
        }
      });

      (visits || []).forEach((v) => {
        if (lMap[v.listing_id]) {
          rows.push({
            kind: "visit",
            verb: "you've been to",
            name: titleCase(lMap[v.listing_id].title),
            href: `/listing/${v.listing_id}`,
            created_at: v.created_at,
          });
        }
      });

      rows.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      return rows;
    },
    enabled: !!id,
  });

  const handleShare = async () => {
    setMenuOpen(false);
    const url = id ? `${window.location.origin}/profile/${id}` : window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: profile?.display_name || "My Profile", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast("Link copied");
      }
    } catch {
      /* cancelled */
    }
  };

  const handleCopyLink = async () => {
    setMenuOpen(false);
    const url = id ? `${window.location.origin}/profile/${id}` : window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied");
    } catch {
      toast("Could not copy link");
    }
  };

  const coverUrl = (profile as any)?.cover_url || (profile as any)?.cover_photo_url;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: PAGE_BG,
        paddingBottom: 100,
        fontFamily: SANS,
        color: CREAM,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: "60px 20px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <CircleBtn label="Back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} strokeWidth={1.6} color={INK} />
        </CircleBtn>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/my-account" aria-label="Settings" style={{
            width: 40, height: 40, borderRadius: "50%", background: CREAM,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Settings size={18} strokeWidth={1.6} color={INK} />
          </Link>
        </div>
      </div>


      {/* Masthead — avatar left, name right */}
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #E8B999 0%, #C18866 50%, #8B5C3E 100%)",
            }}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 32, color: CREAM }}>
                {getInitial(profile?.display_name || profile?.username)}
              </span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {isLoading ? (
              <Skeleton className="h-7 w-40 bg-white/10" />
            ) : (
              <>
                <h1
                  style={{
                    fontFamily: SANS,
                    fontWeight: 700,
                    fontSize: 24,
                    lineHeight: 1.15,
                    letterSpacing: "-0.4px",
                    color: CREAM,
                    margin: 0,
                  }}
                >
                  {titleCase(profile?.display_name) || "You"}
                </h1>
                {profile?.username && (
                  <div
                    style={{
                      fontFamily: SANS,
                      fontWeight: 400,
                      fontSize: 13,
                      color: CREAM,
                      opacity: 0.7,
                      marginTop: 4,
                    }}
                  >
                    @{profile.username.toLowerCase()}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats row + Edit */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 18 }}>
          <Link
            to={id ? `/profile/${id}/followers` : "#"}
            style={{ display: "flex", flexDirection: "column", textDecoration: "none" }}
          >
            <span style={{ fontSize: 12, color: CREAM, opacity: 0.7, fontFamily: SANS }}>
              {(counts?.followers ?? 0) === 1 ? "Follower" : "Followers"}
            </span>
            <span style={{ fontSize: 20, fontWeight: 700, color: CREAM, fontFamily: SANS, marginTop: 2 }}>
              {fmtCount(counts?.followers ?? 0)}
            </span>
          </Link>
          <Link
            to={id ? `/profile/${id}/following` : "#"}
            style={{ display: "flex", flexDirection: "column", textDecoration: "none" }}
          >
            <span style={{ fontSize: 12, color: CREAM, opacity: 0.7, fontFamily: SANS }}>Following</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: CREAM, fontFamily: SANS, marginTop: 2 }}>
              {fmtCount(counts?.following ?? 0)}
            </span>
          </Link>
          <Link
            to="/saved"
            style={{ display: "flex", flexDirection: "column", textDecoration: "none" }}
          >
            <span style={{ fontSize: 12, color: CREAM, opacity: 0.7, fontFamily: SANS }}>Saved</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: CREAM, fontFamily: SANS, marginTop: 2 }}>
              {fmtCount(savedCount ?? 0)}
            </span>
          </Link>
          <button
            onClick={() => navigate("/account/info")}
            style={{
              marginLeft: "auto",
              height: 36,
              padding: "0 18px",
              borderRadius: 999,
              background: CREAM,
              color: INK,
              border: "none",
              fontFamily: SANS,
              fontWeight: 500,
              fontSize: 13,
              letterSpacing: "0.02em",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Pencil size={13} strokeWidth={1.8} color={INK} />
            Edit
          </button>
        </div>

        {profile?.bio && (
          <p
            style={{
              fontFamily: SANS,
              fontWeight: 400,
              fontSize: 14,
              lineHeight: 1.5,
              color: CREAM,
              opacity: 0.85,
              margin: "16px 0 0",
            }}
          >
            {profile.bio}
          </p>
        )}
      </div>



      {/* Your finds */}
      {!!saved?.length && (
        <section style={{ marginBottom: 32 }}>
          <div
            style={{
              padding: "0 24px",
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <h2
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 28,
                lineHeight: 1,
                letterSpacing: "-0.5px",
                color: CREAM,
                margin: 0,
                textTransform: "lowercase",
              }}
            >
              finds
            </h2>
            <Link
              to="/saved"
              style={{
                fontFamily: SANS,
                fontSize: 11,
                letterSpacing: "1.8px",
                textTransform: "uppercase",
                color: CREAM,
                opacity: 0.75,
                textDecoration: "none",
              }}
            >
              See All
            </Link>
          </div>

          <div
            style={{
              display: "flex",
              gap: 14,
              overflowX: "auto",
              paddingLeft: 24,
              paddingRight: 24,
              scrollbarWidth: "none",
            }}
            className="no-scrollbar"
          >
            {saved.map((it: any) => (
              <Link
                key={it.id}
                to={`/listing/${it.id}`}
                style={{
                  flex: "0 0 auto",
                  width: 240,
                  background: CREAM,
                  borderRadius: 20,
                  overflow: "hidden",
                  textDecoration: "none",
                }}
              >
                <div style={{ position: "relative", width: "100%", height: 180, background: "#d6d6d6" }}>
                  {it.image_url && (
                    <img
                      src={it.image_url}
                      alt=""
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleUnsave(e, it.id, "listing")}
                    aria-label="Remove from saved"
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.92)",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <Heart size={16} strokeWidth={1.6} color={RUST} fill={RUST} />
                  </button>
                </div>
                <div style={{ padding: "16px 18px 18px" }}>
                  <div
                    style={{
                      fontFamily: SANS,
                      fontWeight: 400,
                      fontSize: 17,
                      lineHeight: 1.2,
                      letterSpacing: "-0.2px",
                      color: INK,
                      marginBottom: 6,
                    }}
                  >
                    {titleCase(it.title)}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: SANS,
                      fontSize: 12.5,
                      color: MUTED,
                    }}
                  >
                    {it.google_rating && <span>★ {Number(it.google_rating).toFixed(1)}</span>}
                    {it.google_rating && it.location && (
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: MUTED, opacity: 0.6 }} />
                    )}
                    {it.location && <span>{it.location}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Saved events */}
      {!!savedEvents?.length && (
        <section style={{ marginBottom: 32 }}>
          <div style={{ padding: "0 24px", display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 28, lineHeight: 1, letterSpacing: "-0.5px", color: CREAM, margin: 0, textTransform: "lowercase" }}>
              events
            </h2>
            <Link to="/saved?tab=events" style={{ fontFamily: SANS, fontSize: 11, letterSpacing: "1.8px", textTransform: "uppercase", color: CREAM, opacity: 0.75, textDecoration: "none" }}>
              See All
            </Link>
          </div>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingLeft: 24, paddingRight: 24, scrollbarWidth: "none" }} className="no-scrollbar">
            {savedEvents.map((it: any) => (
              <Link key={it.id} to={`/events/${it.id}`} style={{ flex: "0 0 auto", width: 240, background: CREAM, borderRadius: 20, overflow: "hidden", textDecoration: "none" }}>
                <div style={{ position: "relative", width: "100%", height: 180, background: "#d6d6d6" }}>
                  {it.image_url && (
                    <img src={it.image_url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  )}
                  <button type="button" onClick={(e) => handleUnsave(e, it.id, "event")} aria-label="Remove from saved" style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.92)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
                    <Heart size={16} strokeWidth={1.6} color={RUST} fill={RUST} />
                  </button>
                </div>
                <div style={{ padding: "16px 18px 18px" }}>
                  <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 17, lineHeight: 1.2, letterSpacing: "-0.2px", color: INK, marginBottom: 6 }}>
                    {titleCase(it.title)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: SANS, fontSize: 12.5, color: MUTED }}>
                    {it.start_date && <span>{new Date(it.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
                    {it.start_date && it.location && <span style={{ width: 3, height: 3, borderRadius: "50%", background: MUTED, opacity: 0.6 }} />}
                    {it.location && <span>{it.location}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Deals */}
      {!!savedSpecials?.length && (
        <section style={{ marginBottom: 32 }}>
          <div style={{ padding: "0 24px", display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 28, lineHeight: 1, letterSpacing: "-0.5px", color: CREAM, margin: 0, textTransform: "lowercase" }}>
              deals
            </h2>
            <Link to="/saved?tab=specials" style={{ fontFamily: SANS, fontSize: 11, letterSpacing: "1.8px", textTransform: "uppercase", color: CREAM, opacity: 0.75, textDecoration: "none" }}>
              See All
            </Link>
          </div>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingLeft: 24, paddingRight: 24, scrollbarWidth: "none" }} className="no-scrollbar">
            {savedSpecials.map((it: any) => (
              <Link key={it.id} to={`/specials/${it.id}`} style={{ flex: "0 0 auto", width: 240, background: CREAM, borderRadius: 20, overflow: "hidden", textDecoration: "none" }}>
                <div style={{ position: "relative", width: "100%", height: 180, background: "#d6d6d6" }}>
                  {it.image_url && (
                    <img src={it.image_url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  )}
                  <button type="button" onClick={(e) => handleUnsave(e, it.id, "special")} aria-label="Remove from saved" style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.92)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
                    <Heart size={16} strokeWidth={1.6} color={RUST} fill={RUST} />
                  </button>
                </div>
                <div style={{ padding: "16px 18px 18px" }}>
                  <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 17, lineHeight: 1.2, letterSpacing: "-0.2px", color: INK, marginBottom: 6 }}>
                    {titleCase(it.title)}
                  </div>
                  {it.business_name && (
                    <div style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED }}>
                      {titleCase(it.business_name)}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Your activity */}
      <section style={{ marginBottom: 8 }}>
        <div
          style={{
            padding: "0 24px",
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <h2
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 28,
              lineHeight: 1,
              letterSpacing: "-0.5px",
              color: CREAM,
              margin: 0,
              textTransform: "lowercase",
            }}
          >
            activity
          </h2>
          <button
            onClick={async () => {
              const next = !profile?.activity_private;
              const { error } = await supabase
                .from("profiles")
                .update({ activity_private: next })
                .eq("id", id!);
              if (error) {
                toast.error("Could not update privacy");
                return;
              }
              queryClient.invalidateQueries({ queryKey: ["my-profile", id] });
              toast.success(next ? "Activity is now private" : "Activity is now visible to followers");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: "1.8px",
              textTransform: "uppercase",
              color: CREAM,
              opacity: 0.85,
            }}
            aria-pressed={!!profile?.activity_private}
          >
            <span
              aria-hidden
              style={{
                width: 30,
                height: 16,
                borderRadius: 999,
                background: profile?.activity_private ? RUST : "rgba(238,232,218,0.25)",
                position: "relative",
                transition: "background 150ms ease-out",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: profile?.activity_private ? 16 : 2,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: CREAM,
                  transition: "left 150ms ease-out",
                }}
              />
            </span>
            {profile?.activity_private ? "Private" : "Make Private"}
          </button>
        </div>

        <div style={{ padding: "0 24px" }}>
          <div style={{ background: CREAM, borderRadius: 20, padding: "4px 22px" }}>
            {!activity?.length ? (
              <div
                style={{
                  padding: "22px 0",
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 14,
                  color: INK,
                  opacity: 0.7,
                  textAlign: "center",
                }}
              >
                No activity yet. Save a place, save an event, or follow someone to start your story.
              </div>
            ) : (
              activity.map((row, i) => {
                const isSave = row.kind === "save";
                return (
                  <Link
                    key={i}
                    to={row.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 0",
                      borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: isSave ? RUST : SOFT_CREAM,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isSave ? (
                        <Heart size={14} strokeWidth={1.6} color={CREAM} fill={CREAM} />
                      ) : (
                        <MapPin size={14} strokeWidth={1.6} color={MUTED} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: SERIF,
                          fontStyle: "italic",
                          fontSize: 13,
                          lineHeight: 1.4,
                          color: INK,
                        }}
                      >
                        {row.verb}{" "}
                        <span
                          style={{
                            fontFamily: SANS,
                            fontStyle: "normal",
                            fontWeight: 400,
                            color: INK,
                          }}
                        >
                          {row.name}
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: SANS,
                          fontSize: 10.5,
                          letterSpacing: "1.8px",
                          textTransform: "uppercase",
                          color: MUTED,
                          marginTop: 3,
                        }}
                      >
                        {timeAgo(row.created_at)}
                      </div>
                    </div>
                    <span style={{ fontSize: 13, color: MUTED, fontFamily: SANS }}>↗</span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Privacy hint */}
      <div
        style={{
          paddingLeft: 28,
          paddingRight: 26,
          marginBottom: 24,
          marginTop: 16,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: RUST,
            flexShrink: 0,
            marginTop: 7,
            display: "inline-block",
          }}
        />
        <p
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 13.5,
            lineHeight: 1.55,
            color: CREAM,
            opacity: 0.65,
            margin: 0,
          }}
        >
          {profile?.activity_private
            ? "Your activity is hidden from other people. Toggle above to share it with followers."
            : "Your activity is visible on your public profile. Toggle above to make it private."}
        </p>
      </div>

      {/* Action sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="bottom"
          style={{ background: CREAM, borderTopLeftRadius: 20, borderTopRightRadius: 20, border: "none" }}
        >
          <SheetHeader>
            <SheetTitle
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                color: INK,
                textTransform: "lowercase",
              }}
            >
              options
            </SheetTitle>
          </SheetHeader>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 12 }}>
            {[
              { label: "Edit Profile", onClick: () => { setMenuOpen(false); navigate("/account-settings/info"); } },
              { label: "View As Someone Else", onClick: () => { setMenuOpen(false); if (id) navigate(`/profile/${id}`); } },
              { label: "Copy Profile Link", onClick: handleCopyLink },
              { label: "Report A Bug", onClick: () => { setMenuOpen(false); navigate("/feedback"); } },
            ].map((o) => (
              <button
                key={o.label}
                onClick={o.onClick}
                style={{
                  textAlign: "left",
                  padding: "16px 0",
                  borderTop: `1px solid ${LINE}`,
                  background: "transparent",
                  border: "none",
                  borderBottom: 0,
                  borderLeft: 0,
                  borderRight: 0,
                  fontFamily: SANS,
                  fontSize: 15,
                  color: INK,
                  cursor: "pointer",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MyProfile;
