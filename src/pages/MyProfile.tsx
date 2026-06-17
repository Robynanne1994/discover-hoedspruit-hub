import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGuestAuth } from "@/hooks/useGuestAuth";
import { useFollowCounts } from "@/hooks/useFollows";
import { Pencil, Heart, Settings, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import Seo from "@/components/Seo";


const PAGE_BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INNER = "#EFE7D3";
const INK = "#1A1A1A";
const MUTED = "#8A8275";
const SUBTLE = "rgba(26,26,26,0.55)";
const LINE = "rgba(26,26,26,0.10)";
const RUST = "#9B5A3C";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const titleCase = (s?: string | null) =>
  (s || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const getInitial = (s?: string | null) =>
  (s || "?").trim().charAt(0).toUpperCase() || "?";

const fmtCount = (n: number) => n.toLocaleString("en-US");

type Tab = "listings" | "deals" | "events" | "resources";

// Maps a favourite's item_type to the query key of the saved list that renders it.
const SAVED_LIST_KEY: Record<string, string> = {
  listing: "my-saved-listings",
  event: "my-saved-events",
  special: "my-saved-specials",
  resource: "my-saved-resources",
};

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

const MyProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { isGuest } = useGuestAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("listings");
  const [eventsSub, setEventsSub] = useState<"upcoming" | "past">("upcoming");
  const [dealsSub, setDealsSub] = useState<"active" | "expired">("active");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      if (isGuest) navigate("/my-account", { replace: true });
      else navigate("/welcome");
    }
  }, [authLoading, user, isGuest, navigate]);

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
    // Optimistically drop just the unsaved item from the relevant saved list,
    // the total count, and the shared favourites cache. This makes the card
    // disappear instantly without a list-wide refetch — the cascading
    // invalidations were what made the whole grid flash/reflow on every unsave.
    onMutate: async ({ item_id, item_type }) => {
      const listKey = [SAVED_LIST_KEY[item_type] ?? "my-saved-listings", id];
      const countKey = ["my-saved-count", id];
      const setKey = ["favourites-set", id];
      await Promise.all([
        queryClient.cancelQueries({ queryKey: listKey }),
        queryClient.cancelQueries({ queryKey: countKey }),
        queryClient.cancelQueries({ queryKey: setKey }),
      ]);
      const prevList = queryClient.getQueryData<any[]>(listKey);
      const prevCount = queryClient.getQueryData<number>(countKey);
      const prevSet = queryClient.getQueryData<Set<string>>(setKey);
      if (prevList) queryClient.setQueryData(listKey, prevList.filter((it) => it.id !== item_id));
      if (typeof prevCount === "number") queryClient.setQueryData(countKey, Math.max(0, prevCount - 1));
      if (prevSet) {
        const next = new Set(prevSet);
        next.delete(`${item_type}:${item_id}`);
        queryClient.setQueryData(setKey, next);
      }
      return { listKey, countKey, setKey, prevList, prevCount, prevSet };
    },
    onError: (_e, _v, ctx) => {
      if (!ctx) return;
      if (ctx.prevList !== undefined) queryClient.setQueryData(ctx.listKey, ctx.prevList);
      if (ctx.prevCount !== undefined) queryClient.setQueryData(ctx.countKey, ctx.prevCount);
      if (ctx.prevSet !== undefined) queryClient.setQueryData(ctx.setKey, ctx.prevSet);
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
        ;
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
        ;
      if (!favs?.length) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: events } = await supabase
        .from("events")
        .select("id, title, image_url, location, start_date, end_date")
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
        ;
      if (!favs?.length) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: specials } = await supabase
        .from("specials")
        .select("id, title, image_url, business_name, valid_until")
        .in("id", ids);
      const map = Object.fromEntries((specials || []).map((s: any) => [s.id, s]));
      return favs.map((f) => ({ ...map[f.item_id], created_at: f.created_at })).filter((s) => s.id);
    },
    enabled: !!id,
  });

  const { data: savedResources } = useQuery({
    queryKey: ["my-saved-resources", id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("item_id, created_at")
        .eq("user_id", id!)
        .eq("item_type", "resource")
        .order("created_at", { ascending: false })
        ;
      if (!favs?.length) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: resources } = await supabase
        .from("bush_telegraph_resources")
        .select("id, title, title_override, image_url, platform, meta, meta_2, slug")
        .in("id", ids);
      const map = Object.fromEntries((resources || []).map((r: any) => [r.id, r]));
      return favs.map((f) => ({ ...map[f.item_id], created_at: f.created_at })).filter((r) => r.id);
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

  const renderCard = (
    it: any,
    type: "listing" | "event" | "special" | "resource",
    href: string,
    subtitle: React.ReactNode,
  ) => (
    <Link
      key={it.id}
      to={href}
      style={{
        background: CARD,
        borderRadius: 16,
        overflow: "hidden",
        textDecoration: "none",
        display: "block",
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "#d6d6d6" }}>
        {it.image_url && (
          <img
            src={it.image_url}
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
        <button
          type="button"
          onClick={(e) => handleUnsave(e, it.id, type)}
          aria-label="Remove from saved"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: PAGE_BG,
        paddingBottom: 100,
        fontFamily: SANS,
        color: INK,
      }}
    >
      <Seo
        title="My Profile — Hello Hoedspruit"
        description="View your Hello Hoedspruit profile, saved listings, events, specials and resources."
        path="/my-profile"
        noIndex
      />
      {/* Top header bar */}

      <PageHeader
        title="Profile"
        showBack={false}
        right={
          <Link
            to="/my-account"
            aria-label="Settings"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: CARD,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings size={18} strokeWidth={1.8} color={INK} />
          </Link>
        }
      />

      {/* Profile card */}
      <div style={{ padding: "16px 20px 0" }}>
        <section style={{ background: CARD, borderRadius: 18, padding: "16px 16px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 64,
                height: 64,
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
                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 26, color: "#fff" }}>
                  {getInitial(profile?.display_name || profile?.username)}
                </span>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {isLoading ? (
                <Skeleton className="h-7 w-40" />
              ) : (
                <>
                  <h2
                    style={{
                      fontFamily: SANS,
                      fontWeight: 700,
                      fontSize: 15,
                      lineHeight: 1.2,
                      letterSpacing: "-0.3px",
                      color: INK,
                      margin: 0,
                    }}
                  >
                    {titleCase(profile?.display_name) || "You"}
                  </h2>
                  {profile?.username && (
                    <div
                      style={{
                        fontFamily: SANS,
                        fontWeight: 400,
                        fontSize: 13,
                        color: SUBTLE,
                        marginTop: 2,
                      }}
                    >
                      @{profile.username.toLowerCase()}
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              onClick={() => navigate("/account-settings/info")}
              aria-label="Edit profile"
              style={{
                flexShrink: 0,
                height: 32,
                padding: "0 14px",
                borderRadius: 999,
                background: "#F2EFE5",
                color: INK,
                border: `1px solid ${INK}`,
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: "0.02em",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Pencil size={12} strokeWidth={2} color={INK} />
              Edit
            </button>
          </div>

          {/* Stats inner card */}
          <div
            style={{
              marginTop: 14,
              background: "#F2EFE5",
              borderRadius: 14,
              padding: "12px 6px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
            }}
          >
            {[
              { label: counts?.followers === 1 ? "FOLLOWER" : "FOLLOWERS", value: counts?.followers ?? 0, to: id ? `/profile/${id}/followers` : "#", clickable: true },
              { label: "FOLLOWING", value: counts?.following ?? 0, to: id ? `/profile/${id}/following` : "#", clickable: true },
              { label: "SAVED", value: savedCount ?? 0, to: "#", clickable: false },
            ].map((s, i) => {
              const inner = (
                <>
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 20, color: INK, lineHeight: 1 }}>
                    {fmtCount(s.value)}
                  </span>
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      color: "rgba(26,26,26,0.75)",
                      marginTop: 6,
                    }}
                  >
                    {s.label}
                  </span>
                </>
              );
              const sharedStyle: React.CSSProperties = {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textDecoration: "none",
                borderLeft: i === 0 ? "none" : `1px solid ${INK}`,
              };
              return s.clickable ? (
                <Link key={s.label} to={s.to} style={sharedStyle}>{inner}</Link>
              ) : (
                <div key={s.label} style={sharedStyle}>{inner}</div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Top tabs */}
      <div
        style={{
          marginTop: 22,
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
        {tab === "listings" && (
          saved?.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {saved.map((it: any) =>
                renderCard(
                  it,
                  "listing",
                  `/listing/${it.id}`,
                  null

                ),
              )}
            </div>
          ) : (
            <EmptyTab text="No saved listings yet." />
          )
        )}

        {tab === "deals" && (() => {
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

        {tab === "events" && (() => {
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

        {tab === "resources" && (
          savedResources?.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {savedResources.map((it: any) => {
                const displayTitle = (it.title_override?.trim()) || it.title;
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
            <EmptyTab text="No saved resources yet." />
          )
        )}
      </div>
    </div>
  );
};

export default MyProfile;
