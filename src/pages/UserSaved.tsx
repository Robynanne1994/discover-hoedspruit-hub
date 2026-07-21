import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Star } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Seo from "@/components/Seo";

const PAGE_BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED = "#8A8275";
const SUBTLE = "rgba(26,26,26,0.55)";
const LINE = "rgba(26,26,26,0.10)";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const titleCase = (s?: string | null) =>
  (s || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

type Tab = "listings" | "deals" | "events" | "resources";

function SubTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            style={{
              background: active ? "#423324" : "transparent",
              color: active ? "#fff" : INK,
              border: `1px solid ${active ? "#423324" : LINE}`,
              borderRadius: 999,
              padding: "6px 14px",
              cursor: "pointer",
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              letterSpacing: "0.02em",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const UserSaved = () => {
  const { id } = useParams<{ id: string }>();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("listings");
  const [eventsSub, setEventsSub] = useState<"upcoming" | "past">("upcoming");
  const [dealsSub, setDealsSub] = useState<"active" | "expired">("active");

  // If viewing own profile, redirect to the personal saved view
  useEffect(() => {
    if (authUser && id && authUser.id === id) {
      navigate("/my-profile", { replace: true });
    }
  }, [authUser, id, navigate]);

  // Reset pill filters to their first option whenever the main saved tab changes
  useEffect(() => {
    setEventsSub("upcoming");
    setDealsSub("active");
  }, [tab]);

  const { data: profile } = useQuery({
    queryKey: ["user-saved-profile", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_profiles", { _ids: [id!] });
      return (data && data[0]) || null;
    },
  });

  const displayName =
    titleCase(profile?.display_name) ||
    (profile?.username ? `@${profile.username}` : "User");

  const { data: saved } = useQuery({
    queryKey: ["user-saved-listings-full", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("item_id, created_at")
        .eq("user_id", id!)
        .eq("item_type", "listing")
        .order("created_at", { ascending: false });
      if (!favs?.length) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, image_url, saved_image_url, location, google_rating")
        .in("id", ids);
      const map = Object.fromEntries((listings || []).map((l: any) => [l.id, l]));
      return favs.map((f) => ({ ...map[f.item_id], created_at: f.created_at })).filter((l) => l.id);
    },
  });

  const { data: savedEvents } = useQuery({
    queryKey: ["user-saved-events-full", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("item_id, created_at")
        .eq("user_id", id!)
        .eq("item_type", "event")
        .order("created_at", { ascending: false });
      if (!favs?.length) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: events } = await supabase
        .from("events")
        .select("id, title, image_url, saved_image_url, location, start_date, end_date")
        .in("id", ids);
      const map = Object.fromEntries((events || []).map((e: any) => [e.id, e]));
      return favs.map((f) => ({ ...map[f.item_id], created_at: f.created_at })).filter((e) => e.id);
    },
  });

  const { data: savedSpecials } = useQuery({
    queryKey: ["user-saved-specials-full", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("item_id, created_at")
        .eq("user_id", id!)
        .eq("item_type", "special")
        .order("created_at", { ascending: false });
      if (!favs?.length) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: specials } = await supabase
        .from("specials")
        .select("id, title, image_url, saved_image_url, business_name, valid_until")
        .in("id", ids);
      const map = Object.fromEntries((specials || []).map((s: any) => [s.id, s]));
      return favs.map((f) => ({ ...map[f.item_id], created_at: f.created_at })).filter((s) => s.id);
    },
  });

  const { data: savedResources } = useQuery({
    queryKey: ["user-saved-resources-full", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("item_id, created_at")
        .eq("user_id", id!)
        .eq("item_type", "resource")
        .order("created_at", { ascending: false });
      if (!favs?.length) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: resources } = await supabase
        .from("bush_telegraph_resources")
        .select("id, title, title_override, image_url, saved_image_url, platform, meta, meta_2, slug")
        .in("id", ids);
      const map = Object.fromEntries((resources || []).map((r: any) => [r.id, r]));
      return favs.map((f) => ({ ...map[f.item_id], created_at: f.created_at })).filter((r) => r.id);
    },
  });

  const renderCard = (
    it: any,
    type: "listing" | "event" | "special" | "resource",
    href: string,
    subtitle: React.ReactNode,
  ) => (
    <Link
      key={it.id}
      to={href}
      style={{ background: CARD, borderRadius: 16, overflow: "hidden", textDecoration: "none", display: "block" }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "#d6d6d6" }}>
        {(it.saved_image_url || it.image_url) && (
          <img
            src={it.saved_image_url || it.image_url}
            alt=""
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        {type === "listing" && it.google_rating && (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              background: "rgba(255,255,255,0.92)",
              borderRadius: 999,
              padding: "3px 9px 3px 7px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 600,
              color: INK,
            }}
          >
            <Star size={11} strokeWidth={1.8} color={INK} />
            {Number(it.google_rating).toFixed(1).replace(/\.0$/, "")}
          </div>
        )}
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 15,
            lineHeight: 1.25,
            color: INK,
            marginBottom: 4,
            letterSpacing: "-0.1px",
          }}
        >
          {titleCase(it.title)}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED, letterSpacing: "0.01em" }}>
          {subtitle}
        </div>
      </div>
    </Link>
  );

  const EmptyTab = ({ text }: { text: string }) => (
    <div
      style={{
        padding: "60px 24px",
        textAlign: "center",
        fontFamily: SANS,
        fontSize: 14,
        color: SUBTLE,
        letterSpacing: "0.01em",
      }}
    >
      {text}
    </div>
  );

  // Privacy gate — only show saved when the profile owner allows public activity
  const isPrivate = profile?.activity_private !== false;

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, paddingBottom: 100, fontFamily: SANS, color: INK }}>
      <Seo title={`${displayName}'s Saved — Hello Hoedspruit`} description={`See what ${displayName} has saved on Hello Hoedspruit.`} path={`/profile/${id}/saved`} noIndex />
      <PageHeader title="Saved" />

      {/* Whose saved this is */}
      <div style={{ padding: "12px 20px 0" }}>
        <p
          style={{
            margin: 0,
            fontFamily: SANS,
            fontSize: 13,
            color: SUBTLE,
            letterSpacing: "0.02em",
          }}
        >
          {displayName}'s saved
        </p>
      </div>

      {isPrivate ? (
        <EmptyTab text={`${displayName} keeps their saved private.`} />
      ) : (
        <>
          {/* Top tabs (mirrors MyProfile) */}
          <div
            style={{
              marginTop: 14,
              display: "flex",
              padding: "0 20px",
              gap: 0,
              borderBottom: `1px solid ${LINE}`,
            }}
          >
            {(["listings", "deals", "events", "resources"] as Tab[]).map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    padding: "14px 0 12px",
                    cursor: "pointer",
                    fontFamily: SANS,
                    fontSize: 16,
                    fontWeight: active ? 700 : 400,
                    color: active ? INK : SUBTLE,
                    letterSpacing: "0.02em",
                    position: "relative",
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                  <span
                    style={{
                      position: "absolute",
                      left: "20%",
                      right: "20%",
                      bottom: -1,
                      height: 2,
                      background: active ? INK : "transparent",
                      borderRadius: 2,
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div style={{ padding: "20px 20px 0" }}>
            {tab === "listings" &&
              (saved?.length ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {saved.map((it: any) => renderCard(it, "listing", `/listing/${it.id}`, null))}
                </div>
              ) : (
                <EmptyTab text={`${displayName} hasn't saved any listings yet.`} />
              ))}

            {tab === "deals" &&
              (() => {
                const now = Date.now();
                const filtered = (savedSpecials ?? []).filter((it: any) => {
                  const expired = it.valid_until && new Date(it.valid_until).getTime() < now;
                  return dealsSub === "active" ? !expired : expired;
                });
                return (
                  <>
                    <SubTabs<"active" | "expired">
                      value={dealsSub}
                      onChange={setDealsSub}
                      options={[
                        { id: "active", label: "Active" },
                        { id: "expired", label: "Expired" },
                      ]}
                    />
                    {filtered.length ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {filtered.map((it: any) =>
                          renderCard(
                            it,
                            "special",
                            `/specials/${it.id}`,
                            it.business_name ? titleCase(it.business_name) : null,
                          ),
                        )}
                      </div>
                    ) : (
                      <EmptyTab text={dealsSub === "active" ? "No active deals saved." : "No expired deals."} />
                    )}
                  </>
                );
              })()}

            {tab === "events" &&
              (() => {
                const now = Date.now();
                const filtered = (savedEvents ?? []).filter((it: any) => {
                  const ref = it.end_date || it.start_date;
                  if (!ref) return eventsSub === "upcoming";
                  const past = new Date(ref).getTime() < now;
                  return eventsSub === "upcoming" ? !past : past;
                });
                return (
                  <>
                    <SubTabs<"upcoming" | "past">
                      value={eventsSub}
                      onChange={setEventsSub}
                      options={[
                        { id: "upcoming", label: "Upcoming" },
                        { id: "past", label: "Past" },
                      ]}
                    />
                    {filtered.length ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {filtered.map((it: any) =>
                          renderCard(
                            it,
                            "event",
                            `/events/${it.id}`,
                            <>
                              {it.start_date && (
                                <span>
                                  {new Date(it.start_date).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </span>
                              )}
                              {it.start_date && it.location && <span> · </span>}
                              {it.location && <span>{it.location}</span>}
                            </>,
                          ),
                        )}
                      </div>
                    ) : (
                      <EmptyTab text={eventsSub === "upcoming" ? "No upcoming saved events." : "No past saved events."} />
                    )}
                  </>
                );
              })()}

            {tab === "resources" &&
              (savedResources?.length ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {savedResources.map((it: any) => {
                    const displayTitle = it.title_override?.trim() || it.title;
                    const metaParts = [it.meta, it.meta_2].filter((m: string | null) => m && m.trim());
                    const href = it.slug ? `/local-channels/${it.slug}` : `/local-channels`;
                    return renderCard(
                      { ...it, title: displayTitle },
                      "resource",
                      href,
                      <>
                        {metaParts.length > 1 && <span>{metaParts.join(" · ")}</span>}
                        {metaParts.length === 1 && <span>{metaParts[0]}</span>}
                      </>,
                    );
                  })}
                </div>
              ) : (
                <EmptyTab text={`${displayName} hasn't saved any resources yet.`} />
              ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UserSaved;
