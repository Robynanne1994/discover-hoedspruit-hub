import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const COLOR = {
  pageBg: "#ebebeb",
  ink: "#020202",
  mutedInk: "rgba(2,2,2,0.55)",
  cardBg: "#5C6446",
  cardFg: "#EEE8DA",
  cardMuted: "rgba(238,232,218,0.75)",
  divider: "rgba(2,2,2,0.12)",
};

const formatValidTill = (s: any): string => {
  if (s.valid_until) return `VALID TILL ${format(new Date(s.valid_until), "d MMM").toUpperCase()}`;
  if (s.day_of_week && s.day_of_week.length > 0) return s.day_of_week.join(", ").toUpperCase();
  return "ONGOING";
};

const useSaved = (id: string) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: saved } = useQuery({
    queryKey: ["favourite", "special", id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("favourites")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", id)
        .eq("item_type", "special")
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
      if (saved) {
        await supabase.from("favourites").delete().eq("user_id", user.id).eq("item_id", id).eq("item_type", "special");
      } else {
        await supabase.from("favourites").insert({ user_id: user.id, item_id: id, item_type: "special" });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favourite", "special", id] }),
  });
  return { saved, toggle };
};

const Specials = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("All");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const { data: specials, isLoading } = useQuery({
    queryKey: ["all-specials"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("specials")
        .select("*")
        .eq("is_active", true)
        .or(`valid_until.is.null,valid_until.gte.${today}`)
        .order("sort_order", { ascending: true });
      return data || [];
    },
  });

  const categoryTabs = useMemo(() => {
    if (!specials) return ["All"];
    const set = new Set<string>();
    for (const s of specials as any[]) {
      if (s.category && typeof s.category === "string") set.add(s.category.trim());
      if (Array.isArray(s.eyebrow_categories)) {
        for (const c of s.eyebrow_categories) if (c && typeof c === "string") set.add(c.trim());
      }
    }
    return ["All", ...Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b))];
  }, [specials]);

  const filteredSpecials = useMemo(() => {
    if (!specials) return [];
    let result = [...specials];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s: any) =>
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.business_name && s.business_name.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    }
    if (activeTab !== "All") {
      const t = activeTab.toLowerCase();
      result = result.filter((s: any) => {
        const cats: string[] = [];
        if (s.category) cats.push(String(s.category));
        if (Array.isArray(s.eyebrow_categories)) cats.push(...s.eyebrow_categories.map((c: any) => String(c)));
        return cats.map((c) => c.toLowerCase()).includes(t);
      });
    }
    return result;
  }, [specials, activeTab, search]);

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingBottom: 120,
        background: COLOR.pageBg,
        fontFamily: SANS,
        color: COLOR.ink,
      }}
    >
      {/* Header */}
      <div
        style={{
          paddingTop: 56,
          paddingLeft: 20,
          paddingRight: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1
          style={{
            fontFamily: SANS,
            fontSize: 30,
            fontWeight: 700,
            color: COLOR.ink,
            margin: 0,
            letterSpacing: "-0.5px",
          }}
        >
          Specials
        </h1>
        <button
          aria-label={searchOpen ? "Close search" : "Search"}
          onClick={() => {
            if (searchOpen) {
              setSearch("");
              setSearchOpen(false);
            } else {
              setSearchOpen(true);
            }
          }}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "transparent",
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: COLOR.ink,
          }}
        >
          {searchOpen ? <X size={22} strokeWidth={2} /> : <Search size={22} strokeWidth={2} />}
        </button>
      </div>

      {/* Inline search input */}
      {searchOpen && (
        <div style={{ padding: "12px 20px 0 20px" }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search any local deals"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              height: 40,
              borderRadius: 999,
              border: `1px solid ${COLOR.divider}`,
              padding: "0 16px",
              fontFamily: SANS,
              fontSize: 14,
              color: COLOR.ink,
              background: "transparent",
              outline: "none",
            }}
          />
        </div>
      )}

      {/* Category tabs */}
      <div
        style={{
          marginTop: 18,
          paddingLeft: 20,
          paddingRight: 20,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
        className="scrollbar-hide"
      >
        <div style={{ display: "flex", gap: 22, alignItems: "center", borderBottom: `1px solid ${COLOR.divider}` }}>
          {categoryTabs.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "10px 0 12px 0",
                  cursor: "pointer",
                  fontFamily: SANS,
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? COLOR.ink : COLOR.mutedInk,
                  borderBottom: isActive ? `2px solid ${COLOR.ink}` : "2px solid transparent",
                  marginBottom: -1,
                  whiteSpace: "nowrap",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Card stack */}
      <div style={{ padding: "18px 20px 0 20px" }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-full" style={{ height: 130, borderRadius: 18, background: "rgba(0,0,0,0.06)" }} />
            ))}
          </div>
        ) : filteredSpecials.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredSpecials.map((s) => (
              <SpecialCard key={s.id} special={s} onClick={() => navigate(`/specials/${s.id}`)} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 12,
                letterSpacing: "2.4px",
                textTransform: "uppercase",
                color: COLOR.mutedInk,
                margin: 0,
                marginBottom: 8,
              }}
            >
              No deals match
            </p>
            <p style={{ fontFamily: SANS, fontSize: 14, color: COLOR.ink, opacity: 0.7, margin: 0, maxWidth: 280, marginInline: "auto" }}>
              Try a different category. New deals are added all the time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const SpecialCard = ({ special, onClick }: { special: any; onClick: () => void }) => {
  const validText = formatValidTill(special);
  return (
    <article
      onClick={onClick}
      style={{
        position: "relative",
        background: COLOR.cardBg,
        borderRadius: 18,
        overflow: "hidden",
        cursor: "pointer",
        height: 140,
        display: "flex",
      }}
    >
      {/* Text side */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          flex: "1 1 60%",
          padding: "18px 18px 16px 20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          color: COLOR.cardFg,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.2px",
              color: COLOR.cardFg,
              marginBottom: 6,
            }}
          >
            {special.deal_label}
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 15,
              fontWeight: 400,
              lineHeight: 1.25,
              color: COLOR.cardFg,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {special.title}
            {special.business_name ? (
              <>
                <br />
                <span style={{ color: COLOR.cardMuted }}>{special.business_name}</span>
              </>
            ) : null}
          </div>
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: "1.2px",
            fontWeight: 500,
            color: COLOR.cardMuted,
            textTransform: "uppercase",
          }}
        >
          {validText}
        </div>
      </div>

      {/* Image side with gradient fade */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "55%",
          zIndex: 1,
        }}
      >
        {special.image_url && (
          <img
            src={special.image_url}
            alt={special.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to right, ${COLOR.cardBg} 0%, ${COLOR.cardBg} 18%, rgba(92,100,70,0.85) 38%, rgba(92,100,70,0.35) 70%, rgba(92,100,70,0.15) 100%)`,
          }}
        />
      </div>
    </article>
  );
};

export default Specials;
