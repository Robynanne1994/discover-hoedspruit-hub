import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search as SearchIcon, Users, FolderOpen, Calendar, Tag, UserPlus, UserCheck, Heart, UserCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BackButton from "@/components/BackButton";
import { useIsFollowing, useFollowMutation } from "@/hooks/useFollows";
import { toast } from "sonner";

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const PRIMARY = "#715a3d";
const INK = "#020202";
const BODY = "#2b2420";
const PAGE_BG = "#ebebeb";
const IVORY = "#f5f0e8";
const DIVIDER = "rgba(18,18,20,0.08)";

type TopTab = "users" | "businesses";
type UserSub = "suggested" | "followers" | "following";
type BizSub = "listings" | "events" | "specials";

const Search = () => {
  const { user } = useAuth();
  const [topTab, setTopTab] = useState<TopTab>("users");
  const [userSub, setUserSub] = useState<UserSub>("suggested");
  const [bizSub, setBizSub] = useState<BizSub>("listings");
  const [query, setQuery] = useState("");

  const placeholder = useMemo(() => {
    if (topTab === "users") return "Search for people";
    if (bizSub === "listings") return "Search listings";
    if (bizSub === "events") return "Search events";
    return "Search specials";
  }, [topTab, bizSub]);

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, paddingBottom: 100 }}>
      {/* Header */}
      <div
        style={{
          padding: "60px 20px 12px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          background: PAGE_BG,
        }}
      >
        <div style={{ justifySelf: "start" }}>
          <BackButton to="/" />
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: 20,
            letterSpacing: "0.01em",
            color: INK,
            justifySelf: "center",
          }}
        >
          Search
        </h1>
        <div />
      </div>

      {/* Top tabs: Users / Businesses */}
      <div style={{ display: "flex", padding: "4px 20px 0", gap: 0, borderBottom: `1px solid ${DIVIDER}` }}>
        {(["users", "businesses"] as TopTab[]).map((t) => {
          const active = topTab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTopTab(t)}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                padding: "14px 0 12px",
                cursor: "pointer",
                fontFamily: FONT,
                fontSize: 16,
                fontWeight: active ? 700 : 400,
                color: active ? INK : "rgba(18,18,20,0.5)",
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
                  background: active ? PRIMARY : "transparent",
                  borderRadius: 2,
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Search input */}
      <div style={{ padding: "16px 20px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: IVORY,
            borderRadius: 999,
            padding: "12px 16px",
          }}
        >
          <SearchIcon size={18} color={PRIMARY} strokeWidth={1.8} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              outline: "none",
              fontFamily: FONT,
              fontSize: 15,
              fontWeight: 400,
              color: INK,
              letterSpacing: "0.01em",
            }}
          />
        </div>
      </div>

      {/* Sub pills */}
      <div style={{ padding: "16px 20px 4px" }}>
        {topTab === "users" ? (
          <SubPills<UserSub>
            value={userSub}
            onChange={setUserSub}
            options={[
              { id: "suggested", label: "Suggested", icon: Users },
              { id: "followers", label: "Followers", icon: UserCircle },
              { id: "following", label: "Following", icon: UserCheck },
            ]}
          />
        ) : (
          <SubPills<BizSub>
            value={bizSub}
            onChange={setBizSub}
            options={[
              { id: "listings", label: "Listings", icon: FolderOpen },
              { id: "events", label: "Events", icon: Calendar },
              { id: "specials", label: "Specials", icon: Tag },
            ]}
          />
        )}
      </div>

      {/* Results */}
      <div style={{ padding: "16px 0 0" }}>
        {topTab === "users" && (
          <UsersResults sub={userSub} query={query} currentUserId={user?.id} />
        )}
        {topTab === "businesses" && bizSub === "listings" && <ListingsResults query={query} />}
        {topTab === "businesses" && bizSub === "events" && <EventsResults query={query} />}
        {topTab === "businesses" && bizSub === "specials" && <SpecialsResults query={query} />}
      </div>
    </div>
  );
};

/* -------------------- Sub pills -------------------- */

interface SubPillsProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string; icon: React.ComponentType<any> }[];
}
function SubPills<T extends string>({ value, onChange, options }: SubPillsProps<T>) {
  return (
    <div
      style={{
        display: "flex",
        background: IVORY,
        borderRadius: 14,
        padding: 6,
        gap: 4,
      }}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            style={{
              flex: 1,
              background: active ? "#fff" : "transparent",
              border: "none",
              borderRadius: 10,
              padding: "10px 4px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            }}
          >
            <Icon size={20} color={active ? PRIMARY : "rgba(18,18,20,0.55)"} strokeWidth={1.8} />
            <span
              style={{
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: active ? 700 : 400,
                color: active ? INK : "rgba(18,18,20,0.55)",
                letterSpacing: "0.02em",
              }}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------- Section header -------------------- */

const SectionHeader = ({ label, count }: { label: string; count?: number }) => (
  <div
    style={{
      padding: "12px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <span
      style={{
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "rgba(18,18,20,0.55)",
      }}
    >
      {count !== undefined ? `${count} ${label}` : label}
    </span>
  </div>
);

const EmptyRow = ({ text }: { text: string }) => (
  <div
    style={{
      padding: "32px 20px",
      textAlign: "center",
      fontFamily: FONT,
      fontSize: 14,
      color: "rgba(18,18,20,0.5)",
    }}
  >
    {text}
  </div>
);

/* -------------------- Row -------------------- */

interface RowProps {
  to: string;
  image?: string | null;
  title: string;
  subtitle?: string | null;
  thumb?: "round" | "square";
  action?: React.ReactNode;
}
const ResultRow = ({ to, image, title, subtitle, thumb = "square", action }: RowProps) => (
  <Link
    to={to}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "12px 20px",
      borderBottom: `1px solid ${DIVIDER}`,
      textDecoration: "none",
    }}
  >
    <div
      style={{
        width: thumb === "round" ? 48 : 56,
        height: thumb === "round" ? 48 : 56,
        borderRadius: thumb === "round" ? 999 : 12,
        background: IVORY,
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {image ? (
        <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <UserCircle size={28} color="rgba(18,18,20,0.25)" />
      )}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p
        style={{
          margin: 0,
          fontFamily: FONT,
          fontSize: 16,
          fontWeight: 700,
          color: INK,
          letterSpacing: "-0.1px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </p>
      {subtitle && (
        <p
          style={{
            margin: "2px 0 0",
            fontFamily: FONT,
            fontSize: 13,
            color: "rgba(18,18,20,0.5)",
            letterSpacing: "0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
    {action && <div style={{ flexShrink: 0 }}>{action}</div>}
  </Link>
);

/* -------------------- Outline buttons -------------------- */

const InlineFollowButton = ({ targetUserId }: { targetUserId: string }) => {
  const { user } = useAuth();
  const { data: isFollowing } = useIsFollowing(targetUserId);
  const { follow, unfollow } = useFollowMutation(targetUserId);
  if (!user || user.id === targetUserId) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isFollowing) unfollow.mutate();
        else follow.mutate();
      }}
      style={{
        background: "transparent",
        border: `1.5px solid ${PRIMARY}`,
        borderRadius: 999,
        padding: "8px 18px",
        fontFamily: FONT,
        fontSize: 13,
        fontWeight: 700,
        color: PRIMARY,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        letterSpacing: "0.02em",
      }}
    >
      {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
};

const InlineSaveButton = ({ itemId, itemType }: { itemId: string; itemType: "listing" | "event" | "special" }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: isFav } = useQuery({
    queryKey: ["favourite", itemType, itemId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("favourites")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .eq("item_type", itemType)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });
  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error("Please sign in to save");
        return;
      }
      if (isFav) {
        await supabase
          .from("favourites")
          .delete()
          .eq("user_id", user.id)
          .eq("item_id", itemId)
          .eq("item_type", itemType);
      } else {
        await supabase.from("favourites").insert({ user_id: user.id, item_id: itemId, item_type: itemType });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favourite", itemType, itemId] });
      qc.invalidateQueries({ queryKey: ["favourites"] });
    },
  });
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle.mutate();
      }}
      style={{
        background: "transparent",
        border: `1.5px solid ${PRIMARY}`,
        borderRadius: 999,
        width: 38,
        height: 38,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label={isFav ? "Remove from saved" : "Save"}
    >
      <Heart
        size={16}
        color={PRIMARY}
        fill={isFav ? PRIMARY : "none"}
        strokeWidth={1.8}
      />
    </button>
  );
};

/* -------------------- Results: Users -------------------- */

const UsersResults = ({
  sub,
  query,
  currentUserId,
}: {
  sub: UserSub;
  query: string;
  currentUserId?: string;
}) => {
  const term = query.trim();

  const { data: rows, isLoading } = useQuery({
    queryKey: ["search-users", sub, term, currentUserId],
    queryFn: async () => {
      if (sub === "suggested") {
        let followingIds: string[] = [];
        if (currentUserId) {
          const { data: f } = await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", currentUserId);
          followingIds = (f || []).map((r: any) => r.following_id);
        }
        let q = supabase
          .from("profiles")
          .select("id, display_name, avatar_url, location, username")
          .order("created_at", { ascending: false })
          .limit(50);
        if (term) q = q.or(`display_name.ilike.%${term}%,username.ilike.%${term}%`);
        const { data } = await q;
        const excluded = new Set<string>(followingIds);
        if (currentUserId) excluded.add(currentUserId);
        return (data || []).filter((p) => !excluded.has(p.id));
      }
      if (!currentUserId) return [];
      const col = sub === "followers" ? "follower_id" : "following_id";
      const matchCol = sub === "followers" ? "following_id" : "follower_id";
      const { data: links } = await supabase.from("follows").select(col).eq(matchCol, currentUserId);
      const ids = (links || []).map((d: any) => d[col]);
      if (!ids.length) return [];
      let q = supabase
        .from("profiles")
        .select("id, display_name, avatar_url, location, username")
        .in("id", ids);
      if (term) q = q.or(`display_name.ilike.%${term}%,username.ilike.%${term}%`);
      const { data } = await q;
      return data || [];
    },
    enabled: !!currentUserId || sub === "suggested",
  });

  const headerLabel = sub === "suggested" ? "People to follow" : sub === "followers" ? "Followers" : "Following";

  if (isLoading) return <EmptyRow text="Loading…" />;
  if (!rows || rows.length === 0) {
    const emptyText = term
      ? "No people found"
      : sub === "suggested"
      ? "No new users — you're following everyone!"
      : "No results";
    return <EmptyRow text={emptyText} />;
  }

  return (
    <>
      <SectionHeader label={headerLabel} count={rows.length} />
      {rows.map((u: any) => (
        <ResultRow
          key={u.id}
          to={`/profile/${u.id}`}
          image={u.avatar_url}
          title={u.display_name || u.username || "User"}
          subtitle={u.location || (u.username ? `@${u.username}` : null)}
          thumb="round"
          action={<InlineFollowButton targetUserId={u.id} />}
        />
      ))}
    </>
  );
};

/* -------------------- Results: Listings -------------------- */

const ListingsResults = ({ query }: { query: string }) => {
  const term = query.trim();
  const { data, isLoading } = useQuery({
    queryKey: ["search-listings", term],
    queryFn: async () => {
      let q = supabase
        .from("listings")
        .select("id, title, location, image_url, is_featured")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);
      if (term) q = q.ilike("title", `%${term}%`);
      const { data } = await q;
      return data || [];
    },
  });
  if (isLoading) return <EmptyRow text="Loading…" />;
  if (!data || data.length === 0) return <EmptyRow text={term ? "No listings found" : "No listings"} />;
  return (
    <>
      <SectionHeader label={term ? "Listings" : "Suggested listings"} count={data.length} />
      {data.map((l) => (
        <ResultRow
          key={l.id}
          to={`/listing/${l.id}`}
          image={l.image_url}
          title={l.title}
          subtitle={l.location}
          action={<InlineSaveButton itemId={l.id} itemType="listing" />}
        />
      ))}
    </>
  );
};

/* -------------------- Results: Events -------------------- */

const EventsResults = ({ query }: { query: string }) => {
  const term = query.trim();
  const { data, isLoading } = useQuery({
    queryKey: ["search-events", term],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      let q = supabase
        .from("events")
        .select("id, title, location, image_url, date, start_date")
        .order("start_date", { ascending: true, nullsFirst: false })
        .limit(50);
      if (term) q = q.ilike("title", `%${term}%`);
      const { data } = await q;
      return (data || []).filter((e) => !e.start_date || e.start_date >= today);
    },
  });
  if (isLoading) return <EmptyRow text="Loading…" />;
  if (!data || data.length === 0) return <EmptyRow text={term ? "No events found" : "No upcoming events"} />;
  return (
    <>
      <SectionHeader label={term ? "Events" : "Upcoming events"} count={data.length} />
      {data.map((e) => (
        <ResultRow
          key={e.id}
          to={`/events/${e.id}`}
          image={e.image_url}
          title={e.title}
          subtitle={[e.date, e.location].filter(Boolean).join(" · ")}
          action={<InlineSaveButton itemId={e.id} itemType="event" />}
        />
      ))}
    </>
  );
};

/* -------------------- Results: Specials -------------------- */

const SpecialsResults = ({ query }: { query: string }) => {
  const term = query.trim();
  const { data, isLoading } = useQuery({
    queryKey: ["search-specials", term],
    queryFn: async () => {
      let q = supabase
        .from("specials")
        .select("id, title, business_name, image_url, deal_label")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(50);
      if (term) q = q.ilike("title", `%${term}%`);
      const { data } = await q;
      return data || [];
    },
  });
  if (isLoading) return <EmptyRow text="Loading…" />;
  if (!data || data.length === 0) return <EmptyRow text={term ? "No specials found" : "No active specials"} />;
  return (
    <>
      <SectionHeader label={term ? "Specials" : "Active specials"} count={data.length} />
      {data.map((s) => (
        <ResultRow
          key={s.id}
          to={`/specials/${s.id}`}
          image={s.image_url}
          title={s.title}
          subtitle={[s.deal_label, s.business_name].filter(Boolean).join(" · ")}
          action={<InlineSaveButton itemId={s.id} itemType="special" />}
        />
      ))}
    </>
  );
};

export default Search;
