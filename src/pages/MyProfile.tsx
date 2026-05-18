import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollowCounts } from "@/hooks/useFollows";
import { Pencil, Heart, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Design tokens (match SpecialDetail / EventDetail / ListingDetail)
const PAGE_BG = "#ebebeb";
const CREAM = "#f5f0e8"; // ivory card surface
const INK = "#020202";   // heading
const TEXT = "#2b2420";  // body
const MUTED = "#8A8480";
const RUST = "#715a3d";  // primary brown (interactive)
const BORDER = "#E8E4DF";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const titleCase = (s?: string | null) =>
  (s || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const getInitial = (s?: string | null) =>
  (s || "?").trim().charAt(0).toUpperCase() || "?";

const fmtCount = (n: number) => n.toLocaleString("en-US");

type Tab = "listings" | "deals" | "events";

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
              background: active ? RUST : "transparent",
              color: active ? "#ffffff" : MUTED,
              border: `1px solid ${active ? RUST : BORDER}`,
              borderRadius: 999,
              padding: "6px 14px",
              cursor: "pointer",
              fontFamily: SANS,
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
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
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("listings");
  const [eventsSub, setEventsSub] = useState<"upcoming" | "past">("upcoming");
  const [dealsSub, setDealsSub] = useState<"active" | "expired">("active");

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
        .limit(20);
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
    type: "listing" | "event" | "special",
    href: string,
    subtitle: React.ReactNode,
  ) => (
    <Link
      key={it.id}
      to={href}
      style={{
        background: CREAM,
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
            fontWeight: 400,
            fontSize: 15,
            lineHeight: 1.25,
            color: INK,
            marginBottom: 4,
            letterSpacing: "0.01em",
          }}
        >
          {titleCase(it.title)}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED, letterSpacing: "0.01em", fontWeight: 400 }}>
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
        fontWeight: 400,
        color: MUTED,
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
        color: TEXT,
      }}
    >
      {/* Top header bar */}
      <div
        style={{
          padding: "60px 20px 0",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
        }}
      >
        <div />
        <h1
          style={{
            margin: 0,
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: INK,
            justifySelf: "center",
          }}
        >
          Profile
        </h1>
        <Link
          to="/my-account"
          aria-label="Settings"
          style={{
            justifySelf: "end",
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: CREAM,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Settings size={18} strokeWidth={1.6} color={INK} />
        </Link>
      </div>

      <div style={{ height: 1, background: BORDER, marginTop: 20 }} />

      {/* Profile section — avatar + name + stats */}
      <div style={{ padding: "20px 24px 0" }}>
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
              <Skeleton className="h-7 w-40" />
            ) : (
              <>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2
                    style={{
                      fontFamily: SANS,
                      fontWeight: 400,
                      fontSize: 22,
                      lineHeight: 1.2,
                      letterSpacing: "0.01em",
                      color: INK,
                      margin: 0,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
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
                        color: MUTED,
                        marginTop: 4,
                      }}
                    >
                      @{profile.username.toLowerCase()}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => navigate("/account-settings/info")}
                  aria-label="Edit profile"
                  style={{
                    flexShrink: 0,
                    height: 28,
                    padding: "0 12px",
                    borderRadius: 999,
                    background: "transparent",
                    color: INK,
                    border: `1px solid ${BORDER}`,
                    fontFamily: SANS,
                    fontWeight: 400,
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Pencil size={11} strokeWidth={1.8} color={INK} />
                  Edit
                </button>
              </div>
              </>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 18 }}>
          <Link
            to={id ? `/profile/${id}/followers` : "#"}
            style={{ display: "flex", flexDirection: "column", textDecoration: "none" }}
          >
            <span style={{ fontSize: 10, color: MUTED, fontFamily: SANS, fontWeight: 400, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {(counts?.followers ?? 0) === 1 ? "Follower" : "Followers"}
            </span>
            <span style={{ fontSize: 20, fontWeight: 400, color: INK, fontFamily: SANS, marginTop: 4 }}>
              {fmtCount(counts?.followers ?? 0)}
            </span>
          </Link>
          <Link
            to={id ? `/profile/${id}/following` : "#"}
            style={{ display: "flex", flexDirection: "column", textDecoration: "none" }}
          >
            <span style={{ fontSize: 10, color: MUTED, fontFamily: SANS, fontWeight: 400, letterSpacing: "0.08em", textTransform: "uppercase" }}>Following</span>
            <span style={{ fontSize: 20, fontWeight: 400, color: INK, fontFamily: SANS, marginTop: 4 }}>
              {fmtCount(counts?.following ?? 0)}
            </span>
          </Link>
          <Link
            to="/saved"
            style={{ display: "flex", flexDirection: "column", textDecoration: "none" }}
          >
            <span style={{ fontSize: 10, color: MUTED, fontFamily: SANS, fontWeight: 400, letterSpacing: "0.08em", textTransform: "uppercase" }}>Saved</span>
            <span style={{ fontSize: 20, fontWeight: 400, color: INK, fontFamily: SANS, marginTop: 4 }}>
              {fmtCount(savedCount ?? 0)}
            </span>
          </Link>
        </div>
      </div>

      {/* Top tabs */}
      <div
        style={{
          marginTop: 28,
          display: "flex",
          padding: "0 20px",
          gap: 0,
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        {(["listings", "deals", "events"] as Tab[]).map((t) => {
          const active = tab === t;
          const label = t.charAt(0).toUpperCase() + t.slice(1);
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                padding: "14px 4px",
                cursor: "pointer",
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: 400,
                color: active ? INK : MUTED,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                borderBottom: `2px solid ${active ? RUST : "transparent"}`,
                marginBottom: -1,
              }}
            >
              {label}
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
                  <>
                    {it.google_rating && <span>★ {Number(it.google_rating).toFixed(1)}</span>}
                    {it.google_rating && it.location && <span> · </span>}
                    {it.location && <span>{it.location}</span>}
                  </>,
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
      </div>
    </div>
  );
};

export default MyProfile;
