import BackButton from "@/components/BackButton";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Star, ArrowLeft, Search, Calendar, ChevronRight, Tag } from "lucide-react";
import { format, parseISO, isFuture, isPast } from "date-fns";

type PrimaryTab = "listings" | "events" | "specials";

const fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const SavedListings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>(() => {
    const tab = searchParams.get("tab");
    if (tab === "events") return "events";
    if (tab === "specials") return "specials";
    return "listings";
  });
  const [listingFilter, setListingFilter] = useState("All");
  const [eventFilter, setEventFilter] = useState("All");
  const [specialFilter, setSpecialFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Fetch saved listings
  const { data: favourites, isLoading } = useQuery({
    queryKey: ["saved-listings-page", user?.id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("*")
        .eq("user_id", user!.id)
        .eq("item_type", "listing")
        .order("created_at", { ascending: false });
      if (!favs || favs.length === 0) return [];

      const listingIds = favs.map((f) => f.item_id);

      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, image_url, location, google_rating, category_id, categories(title)")
        .in("id", listingIds);

      const { data: junctions } = await supabase
        .from("listing_categories")
        .select("listing_id, categories(id, title)")
        .in("listing_id", listingIds);

      const junctionMap: Record<string, string[]> = {};
      (junctions || []).forEach((j: any) => {
        if (!junctionMap[j.listing_id]) junctionMap[j.listing_id] = [];
        if (j.categories?.title) junctionMap[j.listing_id].push(j.categories.title);
      });

      const listingsMap = Object.fromEntries((listings || []).map((l: any) => [l.id, {
        ...l,
        categoryNames: [
          ...(l.categories?.title ? [l.categories.title] : []),
          ...(junctionMap[l.id] || []),
        ].filter((v, i, a) => a.indexOf(v) === i),
      }]));

      return favs.map((f) => ({
        ...f,
        details: listingsMap[f.item_id],
      })).filter((f) => f.details);
    },
    enabled: !!user,
  });

  // Fetch saved events
  const { data: savedEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["saved-events-page", user?.id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("*")
        .eq("user_id", user!.id)
        .eq("item_type", "event")
        .order("created_at", { ascending: false });
      if (!favs || favs.length === 0) return [];

      const eventIds = favs.map((f) => f.item_id);
      const { data: events } = await supabase
        .from("events")
        .select("*")
        .in("id", eventIds);

      const eventsMap = Object.fromEntries((events || []).map((e: any) => [e.id, e]));

      return favs.map((f) => ({
        ...f,
        details: eventsMap[f.item_id],
      })).filter((f) => f.details);
    },
    enabled: !!user,
  });

  // Fetch saved specials
  const { data: savedSpecials, isLoading: specialsLoading } = useQuery({
    queryKey: ["saved-specials-page", user?.id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("*")
        .eq("user_id", user!.id)
        .eq("item_type", "special")
        .order("created_at", { ascending: false });
      if (!favs || favs.length === 0) return [];

      const specialIds = favs.map((f) => f.item_id);
      const { data: specials } = await supabase
        .from("specials")
        .select("*")
        .in("id", specialIds);

      const specialsMap = Object.fromEntries((specials || []).map((s: any) => [s.id, s]));

      return favs.map((f) => ({
        ...f,
        details: specialsMap[f.item_id],
      })).filter((f) => f.details);
    },
    enabled: !!user,
  });

  const removeFavourite = useMutation({
    mutationFn: async (fav: { item_id: string; item_type: string }) => {
      await supabase
        .from("favourites")
        .delete()
        .eq("user_id", user!.id)
        .eq("item_id", fav.item_id)
        .eq("item_type", fav.item_type);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-listings-page"] });
      queryClient.invalidateQueries({ queryKey: ["saved-events-page"] });
      queryClient.invalidateQueries({ queryKey: ["saved-specials-page"] });
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      queryClient.invalidateQueries({ queryKey: ["favourite"] });
    },
  });

  // Listing category filters
  const listingCategories = (() => {
    if (!favourites || favourites.length === 0) return [];
    const cats = new Set<string>();
    favourites.forEach((f: any) => {
      (f.details?.categoryNames || []).forEach((c: string) => cats.add(c));
    });
    return Array.from(cats).sort();
  })();

  // Event tag filters
  const eventTags = (() => {
    if (!savedEvents || savedEvents.length === 0) return [];
    const tags = new Set<string>();
    savedEvents.forEach((f: any) => {
      if (f.details?.tag) tags.add(f.details.tag);
    });
    return Array.from(tags).sort();
  })();

  // Special type filters
  const specialTypes = (() => {
    if (!savedSpecials || savedSpecials.length === 0) return [];
    const types = new Set<string>();
    savedSpecials.forEach((f: any) => {
      if (f.details?.special_type) types.add(f.details.special_type);
    });
    return Array.from(types).sort();
  })();

  // Filter listings
  const filteredListings = (favourites?.filter((f: any) => {
    if (listingFilter !== "All") {
      if (!(f.details?.categoryNames || []).some((c: string) => c.toLowerCase() === listingFilter.toLowerCase())) return false;
    }
    if (search.trim()) {
      if (!f.details?.title?.toLowerCase().includes(search.toLowerCase())) return false;
    }
    return true;
  }) || []);

  // Filter events
  const filteredEvents = (savedEvents?.filter((f: any) => {
    const d = f.details;
    if (!d) return false;
    if (eventFilter === "Upcoming") {
      try { if (!isFuture(parseISO(d.date))) return false; } catch { return false; }
    } else if (eventFilter === "Past") {
      try { if (!isPast(parseISO(d.date))) return false; } catch { return false; }
    } else if (eventFilter !== "All") {
      if (d.tag !== eventFilter) return false;
    }
    if (search.trim()) {
      if (!d.title?.toLowerCase().includes(search.toLowerCase())) return false;
    }
    return true;
  }) || []);

  // Filter specials
  const filteredSpecials = (savedSpecials?.filter((f: any) => {
    const d = f.details;
    if (!d) return false;
    if (specialFilter !== "All") {
      if (d.special_type !== specialFilter) return false;
    }
    if (search.trim()) {
      if (!d.title?.toLowerCase().includes(search.toLowerCase())) return false;
    }
    return true;
  }) || []);

  // Counts & subtitle
  const activeCount = primaryTab === "listings"
    ? filteredListings.length
    : primaryTab === "events"
      ? filteredEvents.length
      : filteredSpecials.length;

  const subtitleText = primaryTab === "listings"
    ? `${activeCount} ${activeCount === 1 ? "place" : "places"} saved for later`
    : primaryTab === "events"
      ? `${activeCount} ${activeCount === 1 ? "event" : "events"} saved`
      : `${activeCount} ${activeCount === 1 ? "special" : "specials"} saved`;

  const backButton = (
    <div style={{ paddingTop: 16, paddingLeft: 20, paddingRight: 20, marginBottom: 12 }}>
      <BackButton />
    </div>
  );

  if (!loading && !user) {
    return (
      <div className="min-h-screen" style={{ background: "#EBEBEB", paddingBottom: 84, fontFamily }}>
        {backButton}
        <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 4 }}>
          <h1 style={{ fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif", fontWeight: 400, fontSize: 40, lineHeight: 0.95, letterSpacing: "-0.01em", color: "#020202", textTransform: "capitalize", margin: 0 }}>Saved</h1>
        </div>
        <div className="text-center" style={{ paddingTop: 60 }}>
          <Heart style={{ width: 48, height: 48, strokeWidth: 1.5, color: "rgba(18,18,20,0.2)", margin: "0 auto" }} />
          <h3 style={{ fontFamily, fontSize: 20, fontWeight: 400, color: "#020202", marginTop: 16, textTransform: "uppercase" }}>Nothing saved yet</h3>
          <p style={{ fontFamily, fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.45)", marginTop: 4, textAlign: "center" }}>Sign in to see your saved items</p>
          <Link to="/auth"><Button className="rounded-full px-8 text-[13px] font-medium mt-6">Sign In / Create Account</Button></Link>
        </div>
      </div>
    );
  }

  if (loading || isLoading || eventsLoading || specialsLoading) {
    return (
      <div className="min-h-screen" style={{ background: "#EBEBEB", paddingBottom: 84, fontFamily }}>
        {backButton}
        <div style={{ paddingLeft: 20, paddingRight: 20 }}>
          <Skeleton className="h-14 w-48 mb-2" />
          <Skeleton className="h-4 w-40 mb-6" />
          <Skeleton className="h-12 w-full rounded-[14px] mb-4" />
          <div className="flex gap-2 mb-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-20 rounded-[20px]" />)}</div>
          <div className="flex gap-2 mb-5">{[1, 2].map((i) => <Skeleton key={i} className="h-9 w-24 rounded-[20px]" />)}</div>
          <div className="flex flex-col gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-[200px] w-full rounded-[16px]" />)}</div>
        </div>
      </div>
    );
  }

  const chipStyle = (active: boolean) => ({
    background: active ? "#020202" : "rgba(18,18,20,0.06)",
    border: "none",
    borderRadius: 20,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 500,
    color: active ? "#FFFFFF" : "#2B2420",
    fontFamily,
  } as const);

  const listingFilterOptions = ["All", ...listingCategories];
  const eventFilterOptions = ["All", "Upcoming", "Past", ...eventTags];
  const specialFilterOptions = ["All", ...specialTypes];

  const searchPlaceholder = primaryTab === "listings"
    ? "Search saved places..."
    : primaryTab === "events"
      ? "Search saved events..."
      : "Search saved specials...";

  const currentFilterOptions = primaryTab === "listings"
    ? listingFilterOptions
    : primaryTab === "events"
      ? eventFilterOptions
      : specialFilterOptions;

  const activeFilter = primaryTab === "listings"
    ? listingFilter
    : primaryTab === "events"
      ? eventFilter
      : specialFilter;

  const setActiveFilter = (filter: string) => {
    if (primaryTab === "listings") setListingFilter(filter);
    else if (primaryTab === "events") setEventFilter(filter);
    else setSpecialFilter(filter);
  };

  return (
    <div className="min-h-screen" style={{ background: "#EBEBEB", paddingBottom: 84, fontFamily }}>
      {backButton}

      {/* Title */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 4 }}>
        <h1 style={{ fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif", fontWeight: 400, fontSize: 40, lineHeight: 0.95, letterSpacing: "-0.01em", color: "#020202", textTransform: "capitalize", margin: 0 }}>Saved</h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 24 }}>
        <p style={{ fontFamily, fontStyle: "italic", fontSize: 15, fontWeight: 400, lineHeight: 1.35, color: "rgba(18,18,20,0.55)" }}>{subtitleText}</p>
      </div>

      {/* Search */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 16 }}>
        <div className="flex items-center" style={{ background: "#FFFFFF", border: "1px solid rgba(18,18,20,0.1)", borderRadius: 14, padding: "12px 16px", gap: 10 }}>
          <Search style={{ width: 20, height: 20, strokeWidth: 1.8, color: "rgba(18,18,20,0.35)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{ fontFamily, fontSize: 15, fontWeight: 400, color: "#2B2420" }}
          />
        </div>
      </div>

      {/* Primary type chips */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 8 }}>
        <div className="flex flex-wrap" style={{ gap: 8 }}>
          {(["listings", "events", "specials"] as const).map((tab) => {
            const active = primaryTab === tab;
            const label = tab === "listings" ? "Listings" : tab === "events" ? "Events" : "Specials";
            return (
              <button
                key={tab}
                onClick={() => { setPrimaryTab(tab); setSearch(""); }}
                style={chipStyle(active)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary category chips */}
      {currentFilterOptions.length > 1 && (
        <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 20 }}>
          <div className="flex flex-wrap" style={{ gap: 8 }}>
            {currentFilterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className="whitespace-nowrap"
                style={chipStyle(activeFilter === filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Listings view */}
      {primaryTab === "listings" && (
        <>
          {filteredListings.length === 0 && (
            <div className="text-center" style={{ paddingTop: 60, paddingLeft: 20, paddingRight: 20 }}>
              <Heart style={{ width: 48, height: 48, strokeWidth: 1.5, color: "rgba(18,18,20,0.2)", margin: "0 auto" }} />
              <h3 style={{ fontFamily, fontSize: 20, fontWeight: 400, color: "#020202", marginTop: 16, textTransform: "uppercase" }}>Nothing saved yet</h3>
              <p style={{ fontFamily, fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.45)", marginTop: 4, textAlign: "center" }}>Tap the heart on any listing to save it here</p>
            </div>
          )}
          {filteredListings.length > 0 && (
            <div className="flex flex-col">
              {filteredListings.map((fav: any) => {
                const detail = fav.details;
                if (!detail) return null;
                const rating = detail.google_rating ? Number(detail.google_rating) : null;
                const location = detail.location;
                return (
                  <Link key={fav.id} to={`/listing/${fav.item_id}`} className="block">
                    <div
                      className="relative overflow-hidden active:scale-[0.98]"
                      style={{
                        borderRadius: 16,
                        marginLeft: 24,
                        marginRight: 24,
                        marginBottom: 16,
                        transition: "transform 0.15s ease",
                      }}
                    >
                      <div style={{ width: "100%", aspectRatio: "16/10", background: "#f0f0f0", position: "relative" }}>
                        {detail.image_url ? (
                          <img src={detail.image_url} alt={detail.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} loading="lazy" />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: "#f0f0f0" }} />
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.02) 100%)" }} />
                        {/* Heart button */}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFavourite.mutate({ item_id: fav.item_id, item_type: fav.item_type }); }}
                          className="absolute flex items-center justify-center active:scale-[0.85]"
                          style={{ top: 12, right: 12, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", transition: "transform 0.12s ease" }}
                          aria-label="Remove from saved"
                        >
                          <Heart style={{ width: 18, height: 18, color: "#FFFFFF", fill: "#FFFFFF" }} />
                        </button>
                        {/* Card text */}
                        <div className="absolute bottom-0 left-0 right-0" style={{ padding: 16 }}>
                          <h3 style={{ fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif", fontSize: 18, fontWeight: 600, color: "#FFFFFF", textTransform: "capitalize", lineHeight: 1.2, letterSpacing: "0.01em", marginBottom: 4 }}>{detail.title?.toLowerCase()}</h3>
                          <div className="flex items-center" style={{ gap: 6 }}>
                            {rating && (
                              <>
                                <Star style={{ width: 14, height: 14, color: "#D4964A", fill: "#D4964A", flexShrink: 0 }} />
                                <span style={{ fontFamily, fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>{rating.toFixed(1)}</span>
                              </>
                            )}
                            {rating && location && <span style={{ fontFamily, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>·</span>}
                            {location && <span style={{ fontFamily, fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{location}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Events view */}
      {primaryTab === "events" && (
        <>
          {filteredEvents.length === 0 && (
            <div className="text-center" style={{ paddingTop: 60, paddingLeft: 20, paddingRight: 20 }}>
              <Heart style={{ width: 48, height: 48, strokeWidth: 1.5, color: "rgba(18,18,20,0.2)", margin: "0 auto" }} />
              <h3 style={{ fontFamily, fontSize: 20, fontWeight: 400, color: "#020202", marginTop: 16, textTransform: "uppercase" }}>Nothing saved yet</h3>
              <p style={{ fontFamily, fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.45)", marginTop: 4, textAlign: "center" }}>Save events from the events page to keep track of them here</p>
            </div>
          )}
          {filteredEvents.length > 0 && (
            <div className="flex flex-col" style={{ paddingLeft: 20, paddingRight: 20 }}>
              {filteredEvents.map((fav: any, idx: number) => {
                const evt = fav.details;
                if (!evt) return null;
                let dateLabel = "";
                let timeLabel = "";
                try {
                  const d = parseISO(evt.date);
                  dateLabel = format(d, "d MMM yyyy").toUpperCase();
                } catch { dateLabel = evt.date || ""; }
                if (evt.start_time) timeLabel = ` · ${evt.start_time}`;

                return (
                  <Link
                    key={fav.id}
                    to={`/event/${fav.item_id}`}
                    className="flex items-center active:scale-[0.98]"
                    style={{
                      gap: 14,
                      paddingTop: 14,
                      paddingBottom: 14,
                      borderBottom: idx < filteredEvents.length - 1 ? "1px solid rgba(18,18,20,0.06)" : "none",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    <div style={{ width: 60, height: 60, borderRadius: 16, overflow: "hidden", background: "#f0f0f0", flexShrink: 0 }}>
                      {evt.image_url ? (
                        <img src={evt.image_url} alt={evt.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <Calendar style={{ width: 22, height: 22, strokeWidth: 1.8, color: "rgba(18,18,20,0.2)" }} />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily, fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.35)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                        {dateLabel}{timeLabel}
                      </p>
                      <p style={{ fontFamily, fontSize: 15, fontWeight: 500, color: "#2B2420", lineHeight: 1.2, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {evt.title}
                      </p>
                      {evt.location && <p style={{ fontFamily, fontSize: 12, color: "rgba(18,18,20,0.4)" }}>{evt.location}</p>}
                    </div>
                    <ChevronRight style={{ width: 16, height: 16, strokeWidth: 1.8, color: "rgba(18,18,20,0.2)", flexShrink: 0 }} />
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Specials view */}
      {primaryTab === "specials" && (
        <>
          {filteredSpecials.length === 0 && (
            <div className="text-center" style={{ paddingTop: 60, paddingLeft: 20, paddingRight: 20 }}>
              <Heart style={{ width: 48, height: 48, strokeWidth: 1.5, color: "rgba(18,18,20,0.2)", margin: "0 auto" }} />
              <h3 style={{ fontFamily, fontSize: 20, fontWeight: 400, color: "#020202", marginTop: 16, textTransform: "uppercase" }}>Nothing saved yet</h3>
              <p style={{ fontFamily, fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.45)", marginTop: 4, textAlign: "center" }}>Save specials from the specials page to keep track of them here</p>
            </div>
          )}
          {filteredSpecials.length > 0 && (
            <div className="flex flex-col" style={{ paddingLeft: 20, paddingRight: 20 }}>
              {filteredSpecials.map((fav: any, idx: number) => {
                const sp = fav.details;
                if (!sp) return null;
                let validLabel = "Ongoing";
                if (sp.valid_until) {
                  try {
                    validLabel = `Valid until ${format(new Date(sp.valid_until), "d MMM yyyy")}`;
                  } catch { validLabel = "Ongoing"; }
                }

                return (
                  <Link
                    key={fav.id}
                    to={`/specials/${fav.item_id}`}
                    className="flex items-center active:scale-[0.98]"
                    style={{
                      gap: 14,
                      paddingTop: 14,
                      paddingBottom: 14,
                      borderBottom: idx < filteredSpecials.length - 1 ? "1px solid rgba(18,18,20,0.06)" : "none",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    <div style={{ width: 60, height: 60, borderRadius: 16, overflow: "hidden", background: "#f0f0f0", flexShrink: 0, position: "relative" }}>
                      {sp.image_url ? (
                        <img src={sp.image_url} alt={sp.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <Tag style={{ width: 22, height: 22, strokeWidth: 1.8, color: "rgba(18,18,20,0.2)" }} />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily, fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.35)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                        {sp.deal_label} · {sp.business_name}
                      </p>
                      <p style={{ fontFamily, fontSize: 15, fontWeight: 500, color: "#2B2420", lineHeight: 1.2, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {sp.title}
                      </p>
                      <p style={{ fontFamily, fontSize: 12, color: "rgba(18,18,20,0.4)" }}>{validLabel}</p>
                    </div>
                    <ChevronRight style={{ width: 16, height: 16, strokeWidth: 1.8, color: "rgba(18,18,20,0.2)", flexShrink: 0 }} />
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SavedListings;
