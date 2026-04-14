import { Search, ChevronRight, ArrowLeft, Tag } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type FilterType = "all" | "food-drink" | "activities" | "accommodation" | "shopping";

const filters: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Food & Drink", value: "food-drink" },
  { label: "Activities", value: "activities" },
  { label: "Accommodation", value: "accommodation" },
  { label: "Shopping", value: "shopping" },
];

const Specials = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const { data: specials, isLoading } = useQuery({
    queryKey: ["all-specials"],
    queryFn: async () => {
      const { data } = await supabase
        .from("specials")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      return data || [];
    },
  });

  const filteredSpecials = useMemo(() => {
    if (!specials) return [];
    let filtered = specials;

    if (activeFilter !== "all") {
      filtered = filtered.filter((s) => {
        const cat = (s.category || "").toLowerCase();
        switch (activeFilter) {
          case "food-drink":
            return cat.includes("food") || cat.includes("drink") || cat.includes("restaurant") || cat.includes("cafe");
          case "activities":
            return cat.includes("activit") || cat.includes("adventure") || cat.includes("tour");
          case "accommodation":
            return cat.includes("accommod") || cat.includes("stay") || cat.includes("lodge") || cat.includes("hotel");
          case "shopping":
            return cat.includes("shop") || cat.includes("retail");
          default:
            return true;
        }
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.business_name.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [specials, activeFilter, search]);

  const featuredSpecials = useMemo(
    () => filteredSpecials.filter((s) => s.image_url).slice(0, 4),
    [filteredSpecials]
  );

  const remainingSpecials = useMemo(() => {
    const featuredIds = new Set(featuredSpecials.map((s) => s.id));
    return filteredSpecials.filter((s) => !featuredIds.has(s.id));
  }, [filteredSpecials, featuredSpecials]);

  return (
    <div className="min-h-screen pb-20" style={{ background: "#ffffff" }}>
      {/* Back button */}
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center"
          style={{ gap: 6 }}
        >
          <ArrowLeft style={{ width: 18, height: 18, strokeWidth: 2, color: "rgba(18,18,20,0.4)" }} />
          <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(18,18,20,0.4)", letterSpacing: "0.2px" }}>
            Back
          </span>
        </button>
      </div>

      {/* Heading */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 900,
            fontSize: 40,
            lineHeight: 0.95,
            letterSpacing: "-0.5px",
            color: "#2b2420",
            textTransform: "uppercase",
          }}
        >
          HOTTEST<br />DEALS
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <p
          style={{
            fontFamily: "var(--font-editorial)",
            fontStyle: "italic",
            fontSize: 14,
            color: "rgba(18,18,20,0.4)",
            letterSpacing: "0.2px",
            lineHeight: 1.4,
          }}
        >
          Specials, promotions and deals around Hoedspruit
        </p>
      </div>

      {/* Search bar */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 20 }}>
        <div
          className="flex items-center"
          style={{
            background: "rgba(18,18,20,0.04)",
            border: "1px solid rgba(18,18,20,0.08)",
            borderRadius: 9999,
            padding: "14px 16px",
            gap: 10,
          }}
        >
          <Search style={{ width: 18, height: 18, strokeWidth: 2, color: "rgba(18,18,20,0.3)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search specials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{
              fontSize: 14,
              color: "#2b2420",
              letterSpacing: "0.2px",
            }}
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className="overflow-x-auto scrollbar-hide" style={{ paddingLeft: 24, marginBottom: 32 }}>
        <div className="flex" style={{ gap: 8, paddingRight: 24 }}>
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className="whitespace-nowrap"
              style={{
                background: activeFilter === filter.value ? "#121214" : "rgba(18,18,20,0.05)",
                border: "none",
                borderRadius: 9999,
                padding: "7px 16px",
                fontSize: 12,
                fontWeight: 600,
                color: activeFilter === filter.value ? "#ffffff" : "rgba(18,18,20,0.55)",
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="px-6 space-y-4">
          <Skeleton className="h-3 w-12 rounded" />
          <Skeleton className="h-5 w-24 rounded" />
          <div className="flex gap-3">
            <Skeleton className="w-[280px] h-[320px] rounded-2xl flex-shrink-0" />
            <Skeleton className="w-[280px] h-[320px] rounded-2xl flex-shrink-0" />
          </div>
          <Skeleton className="h-3 w-12 rounded mt-10" />
          <Skeleton className="h-5 w-24 rounded" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[76px] w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredSpecials.length === 0 ? (
        <div className="px-6 py-24 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(18,18,20,0.04)" }}
          >
            <Tag style={{ width: 28, height: 28, color: "rgba(18,18,20,0.2)" }} />
          </div>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 900,
              fontSize: 24,
              color: "#2b2420",
              marginBottom: 10,
              letterSpacing: "-0.5px",
            }}
          >
            {search ? "No matching specials" : "No specials right now"}
          </p>
          <p
            style={{
              fontSize: 13,
              color: "rgba(18,18,20,0.4)",
              lineHeight: 1.5,
              maxWidth: 240,
              margin: "0 auto",
            }}
          >
            {search
              ? "Try another search or browse all specials"
              : "Check back soon for the latest deals in Hoedspruit"}
          </p>
        </div>
      ) : (
        <>
          {/* Featured Specials */}
          {featuredSpecials.length > 0 && (
            <section style={{ marginBottom: 0 }}>
              <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 18 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(18,18,20,0.3)",
                    textTransform: "uppercase",
                    letterSpacing: 3,
                    marginBottom: 6,
                  }}
                >
                  Don't miss
                </p>
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 900,
                    fontSize: 22,
                    color: "#2b2420",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Featured
                </h2>
              </div>
              <div className="overflow-x-auto scrollbar-hide">
                <div className="inline-flex snap-x snap-mandatory" style={{ paddingLeft: 24, gap: 14, paddingBottom: 8, paddingRight: 24 }}>
                  {featuredSpecials.map((special) => (
                    <Link
                      key={special.id}
                      to={`/specials/${special.id}`}
                      className="snap-start flex-shrink-0 relative overflow-hidden active:scale-[0.98] transition-transform duration-200"
                      style={{ width: 280, height: 320, borderRadius: 16 }}
                    >
                      <img
                        src={special.image_url!}
                        alt={special.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 40%, transparent 65%)",
                        }}
                      />
                      <div
                        className="absolute"
                        style={{ top: 14, left: 14 }}
                      >
                        <span
                          style={{
                            background: "rgba(255,255,255,0.9)",
                            borderRadius: 16,
                            padding: "5px 12px",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#2b2420",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {special.deal_label}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0" style={{ padding: 16 }}>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "rgba(255,255,255,0.7)",
                            textTransform: "uppercase",
                            letterSpacing: 1,
                            marginBottom: 4,
                          }}
                        >
                          {special.business_name}
                        </p>
                        <h3
                          className="line-clamp-2"
                          style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#ffffff",
                            lineHeight: 1.2,
                            marginBottom: 4,
                          }}
                        >
                          {special.title}
                        </h3>
                        <p
                          style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}
                        >
                          {special.valid_until
                            ? `Valid until ${format(new Date(special.valid_until), "d MMM yyyy")}`
                            : "Ongoing"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* All Specials list */}
          {remainingSpecials.length > 0 && (
            <section style={{ paddingTop: 36, paddingLeft: 24, paddingRight: 24, paddingBottom: 40 }}>
              <div style={{ marginBottom: 18 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(18,18,20,0.3)",
                    textTransform: "uppercase",
                    letterSpacing: 3,
                    marginBottom: 6,
                  }}
                >
                  Browse
                </p>
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 900,
                    fontSize: 22,
                    color: "#2b2420",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  All Specials
                </h2>
              </div>
              <div>
                {remainingSpecials.map((special) => (
                  <Link
                    key={special.id}
                    to={`/specials/${special.id}`}
                    className="flex items-center active:scale-[0.98] transition-transform duration-200"
                    style={{
                      gap: 14,
                      paddingTop: 14,
                      paddingBottom: 14,
                      borderBottom: "1px solid rgba(18,18,20,0.06)",
                    }}
                  >
                    <div
                      className="flex-shrink-0 overflow-hidden"
                      style={{ width: 60, height: 60, borderRadius: 16, background: "#f0f0f0" }}
                    >
                      {special.image_url ? (
                        <img
                          src={special.image_url}
                          alt={special.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tag style={{ width: 20, height: 20, color: "rgba(18,18,20,0.2)" }} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "rgba(18,18,20,0.35)",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          marginBottom: 4,
                        }}
                      >
                        {special.business_name}
                      </p>
                      <h4
                        style={{
                          fontSize: 15,
                          fontFamily: "var(--font-heading)",
                          fontWeight: 700,
                          color: "#2b2420",
                          lineHeight: 1.2,
                          marginBottom: 3,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {special.title}
                      </h4>
                      <p
                        style={{ fontSize: 12, color: "rgba(18,18,20,0.4)" }}
                      >
                        {special.valid_until
                          ? `Valid until ${format(new Date(special.valid_until), "d MMM yyyy")}`
                          : "Ongoing"}
                      </p>
                    </div>

                    <div className="flex items-center flex-shrink-0" style={{ gap: 8 }}>
                      <span
                        style={{
                          background: "rgba(18,18,20,0.05)",
                          borderRadius: 8,
                          padding: "3px 8px",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "rgba(18,18,20,0.5)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {special.deal_label}
                      </span>
                      <ChevronRight style={{ width: 16, height: 16, strokeWidth: 2, color: "rgba(18,18,20,0.2)", flexShrink: 0 }} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Specials;
