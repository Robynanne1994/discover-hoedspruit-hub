import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessOwner } from "@/hooks/useBusinessOwner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import {
  Heart,
  MapPinCheck,
  Star,
  Plus,
  Trash2,
  FolderOpen,
  Calendar,
  Bell,
  Settings,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  Pencil,
  UserCircle,
  LayoutDashboard,
  Megaphone,
  Users,
  MessageSquare,
  Mail,
  FileText,
  MapPin,
  Newspaper,
  Tag,
  Menu,
  Bookmark,
  MapPinned,
  Phone,
  Shield,
  Briefcase,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProfileForm from "@/components/profile/ProfileForm";
import GlobalMenu, { GlobalMenuTrigger } from "@/components/GlobalMenu";
import NotificationsBell from "@/components/NotificationsDropdown";
import FollowStats from "@/components/social/FollowStats";
import { useFollowCounts } from "@/hooks/useFollows";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";

type ActiveSection = null | "profile" | "favourites" | "collections" | "been-here" | "reviews" | "my-events";

const MyAccount = () => {
  const { user, signOut, loading, isAdmin } = useAuth();
  const { isOwner: isBusinessOwner, listing: ownedListing } = useBusinessOwner();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newCollectionName, setNewCollectionName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    let cancelled = false;
    const load = async () => {
      const { count } = await supabase
        .from("business_notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (!cancelled) setUnreadCount(count ?? 0);
    };
    load();
    const channel = supabase
      .channel("myaccount-biz-notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "business_notifications", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: collections } = useQuery({
    queryKey: ["collections", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("collections")
        .select("*, collection_items(id, listing_id, listings(id, title, image_url, description))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data;
    },
    enabled: !!user,
  });

  const { data: beenHere } = useQuery({
    queryKey: ["been-here", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("been_here")
        .select("*, listings(id, title, image_url, description)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data;
    },
    enabled: !!user,
  });

  const { data: reviews } = useQuery({
    queryKey: ["my-reviews", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*, listings(id, title)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data;
    },
    enabled: !!user,
  });

  const { data: favourites } = useQuery({
    queryKey: ["favourites", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("favourites" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (!data || data.length === 0) return [];

      const listingIds = data.filter((f: any) => f.item_type === "listing").map((f: any) => f.item_id);
      const eventIds = data.filter((f: any) => f.item_type === "event").map((f: any) => f.item_id);

      const [listingsRes, eventsRes] = await Promise.all([
        listingIds.length > 0
          ? supabase.from("listings").select("id, title, image_url").in("id", listingIds)
          : { data: [] },
        eventIds.length > 0
          ? supabase.from("events").select("id, title, image_url").in("id", eventIds)
          : { data: [] },
      ]);

      const listingsMap = Object.fromEntries((listingsRes.data || []).map((l: any) => [l.id, l]));
      const eventsMap = Object.fromEntries((eventsRes.data || []).map((e: any) => [e.id, e]));

      return data.map((f: any) => ({
        ...f,
        details: f.item_type === "listing" ? listingsMap[f.item_id] : eventsMap[f.item_id],
      }));
    },
    enabled: !!user,
  });

  const savedEvents = favourites?.filter((f: any) => f.item_type === "event") || [];

  const createCollection = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("collections").insert({ name, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      setNewCollectionName("");
      setCreateOpen(false);
      toast.success("Collection created!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCollection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection deleted");
    },
  });

  const removeFromCollection = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("collection_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collections"] }),
  });

  const removeBeenHere = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("been_here").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["been-here"] }),
  });

  const removeFavourite = useMutation({
    mutationFn: async (fav: { item_id: string; item_type: string }) => {
      const { error } = await supabase
        .from("favourites" as any)
        .delete()
        .eq("user_id", user!.id)
        .eq("item_id", fav.item_id)
        .eq("item_type", fav.item_type);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      queryClient.invalidateQueries({ queryKey: ["favourite"] });
    },
  });

  // Not signed in
  if (!loading && !user) {
    return (
      <div className="min-h-screen pb-20" style={{ background: "transparent", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
        <div style={{ paddingTop: 44, paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
          <h1 style={{ fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif", fontWeight: 400, fontSize: 40, lineHeight: 0.95, letterSpacing: "-0.01em", color: "#020202", textTransform: "none", margin: 0 }}>Profile</h1>
        </div>
        <div className="text-center" style={{ paddingTop: 60 }}>
          <UserCircle style={{ width: 48, height: 48, color: "rgba(18,18,20,0.15)", margin: "0 auto" }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#020202", marginTop: 16, marginBottom: 8 }}>Welcome to Hello Hoedspruit</h3>
          <p style={{ fontSize: 14, color: "rgba(18,18,20,0.4)", maxWidth: 260, margin: "0 auto 24px" }}>Sign in to access your profile, saved listings, and events.</p>
          <Link to="/auth"><Button className="rounded-full px-8 text-[13px] font-medium">Sign In / Create Account</Button></Link>
        </div>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen pb-20" style={{ background: "transparent", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
        <div style={{ paddingTop: 44, paddingLeft: 24, paddingRight: 24 }}>
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-4 w-40 mb-7" />
          <Skeleton className="h-28 w-full rounded-[16px] mb-6" />
        </div>
      </div>
    );
  }

  // Detail section view
  if (activeSection === "profile") {
    return <ProfileForm profile={profile as any} />;
  }

  if (activeSection) {
    return (
      <div className="min-h-screen pb-16" style={{ background: "#5C6446" }}>
        <div className="px-6 pt-5">
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-[13px] font-medium"
          >
            <BackArrowIcon size={16} /> Back
          </button>
        </div>

        <div className="px-6 pt-6 pb-8">
          <h1
            className="text-[26px] font-semibold text-foreground tracking-tight mb-6"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {activeSection === "favourites" && "Saved Listings"}
            {activeSection === "my-events" && "My Events"}
            {activeSection === "collections" && "Collections"}
            {activeSection === "been-here" && "Been Here"}
            {activeSection === "reviews" && "My Reviews"}
          </h1>

          {activeSection === "favourites" && (
            <>
              {!favourites?.filter((f: any) => f.item_type === "listing").length ? (
                <div className="text-center py-16">
                  <Heart className="h-10 w-10 mx-auto text-primary/15 mb-5" />
                  <p className="text-muted-foreground text-[13px]">No saved listings yet</p>
                  <p className="text-muted-foreground/60 text-[12px] mt-1">Tap the heart on listings you love!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {favourites.filter((f: any) => f.item_type === "listing").map((fav: any) => (
                    <div key={fav.id} className="flex items-center gap-3.5 bg-card border border-border/60 rounded-xl p-3">
                      {fav.details?.image_url && (
                        <img src={fav.details.image_url} alt="" className="w-14 h-14 rounded-2xl object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <Link to={`/listing/${fav.item_id}`} className="font-medium text-[14px] hover:text-primary truncate block">
                          {fav.details?.title || "Unknown"}
                        </Link>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={() => removeFavourite.mutate({ item_id: fav.item_id, item_type: fav.item_type })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeSection === "my-events" && (
            <>
              {!savedEvents.length ? (
                <div className="text-center py-16">
                  <Calendar className="h-10 w-10 mx-auto text-primary/15 mb-5" />
                  <p className="text-muted-foreground text-[13px]">No saved events yet</p>
                  <p className="text-muted-foreground/60 text-[12px] mt-1">Save events you're interested in!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedEvents.map((fav: any) => (
                    <div key={fav.id} className="flex items-center gap-3.5 bg-card border border-border/60 rounded-xl p-3">
                      {fav.details?.image_url && (
                        <img src={fav.details.image_url} alt="" className="w-14 h-14 rounded-2xl object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <Link to="/events" className="font-medium text-[14px] hover:text-primary truncate block">
                          {fav.details?.title || "Unknown"}
                        </Link>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={() => removeFavourite.mutate({ item_id: fav.item_id, item_type: fav.item_type })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeSection === "collections" && (
            <>
              <div className="flex items-center justify-between mb-5">
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2 rounded-full text-[13px]"><Plus className="h-4 w-4" /> New Collection</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Create Collection</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); createCollection.mutate(newCollectionName); }} className="space-y-4">
                      <Input placeholder="e.g. Date Night, Weekend Plans" value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} required />
                      <Button type="submit" className="w-full" disabled={createCollection.isPending}>Create</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              {!collections?.length ? (
                <div className="text-center py-16">
                  <FolderOpen className="h-10 w-10 mx-auto text-primary/15 mb-5" />
                  <p className="text-muted-foreground text-[13px]">No collections yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {collections.map((col: any) => (
                    <div key={col.id} className="bg-card border border-border/60 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-foreground text-[14px]">{col.name}</h3>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => deleteCollection.mutate(col.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {!col.collection_items?.length ? (
                        <p className="text-[12px] text-muted-foreground">No listings saved yet</p>
                      ) : (
                        <div className="space-y-2">
                          {col.collection_items.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-3 bg-background rounded-2xl p-2">
                              {item.listings?.image_url && <img src={item.listings.image_url} alt="" className="w-10 h-10 rounded-2xl object-cover" />}
                              <Link to={`/listing/${item.listings?.id}`} className="text-[12px] font-medium hover:text-primary truncate flex-1">{item.listings?.title}</Link>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground" onClick={() => removeFromCollection.mutate(item.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeSection === "been-here" && (
            <>
              {!beenHere?.length ? (
                <div className="text-center py-16">
                  <MapPinCheck className="h-10 w-10 mx-auto text-primary/15 mb-5" />
                  <p className="text-muted-foreground text-[13px]">No places visited yet</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {beenHere.map((bh: any) => (
                    <div key={bh.id} className="flex items-center gap-3.5 bg-card border border-border/60 rounded-xl p-3">
                      {bh.listings?.image_url && <img src={bh.listings.image_url} alt="" className="w-14 h-14 rounded-2xl object-cover" />}
                      <Link to={`/listing/${bh.listings?.id}`} className="font-medium text-[14px] hover:text-primary truncate flex-1">{bh.listings?.title}</Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={() => removeBeenHere.mutate(bh.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeSection === "reviews" && (
            <>
              {!reviews?.length ? (
                <div className="text-center py-16">
                  <Star className="h-10 w-10 mx-auto text-primary/15 mb-5" />
                  <p className="text-muted-foreground text-[13px]">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="bg-card border border-border/60 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Link to={`/listing/${review.listings?.id}`} className="font-medium text-[14px] hover:text-primary">{review.listings?.title}</Link>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "text-accent fill-accent" : "text-muted-foreground/20"}`} />
                          ))}
                        </div>
                      </div>
                      {review.comment && <p className="text-[12px] text-muted-foreground leading-relaxed">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // === Editorial design tokens ===
  const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  const SERIF = "'Playfair Display', Georgia, serif";
  const OLIVE = "#5C6446";
  const CREAM = "#EEE8DA";
  const INK = "#2A2A24";
  const MUTED_INK = "#6B6A5E";
  const LINE = "#D9D2C0";
  const RUST = "#9B5A3C";
  const GOLD = "#D9C36B";

  const resourcesItems = [
    { label: "Local Channels", href: "/bush-telegraph", icon: Users },
    { label: "The Lowveld Lowdown", href: "/headlines", icon: Newspaper },
    isBusinessOwner || ownedListing
      ? { label: "Business Hub", href: "/business/dashboard", icon: Briefcase }
      : { label: "List Your Business", href: "/for-business", icon: Briefcase },
  ];
  const getInTouchItems = [
    { label: "Contact", href: "/contact", icon: Phone },
    { label: "Advertise", href: "/advertise", icon: Megaphone },
    { label: "Feedback", href: "/feedback", icon: MessageSquare },
  ];
  const helpItems = [
    { label: "Settings", href: "/account-settings", icon: Settings },
    { label: "Help Centre", href: "/help-centre", icon: HelpCircle },
  ];
  const adminItems = [{ label: "Admin", href: "/admin", icon: LayoutDashboard }];

  const Eyebrow = ({ children }: { children: React.ReactNode }) => (
    <p
      style={{
        fontFamily: SANS,
        fontSize: 11,
        fontWeight: 400,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: "rgba(238,232,218,0.7)",
        margin: "0 0 10px 0",
        padding: "0 24px",
      }}
    >
      {children}
    </p>
  );

  const Row = ({
    item,
    isFirst,
    heart = false,
  }: {
    item: { label: string; href: string; icon?: any };
    isFirst: boolean;
    heart?: boolean;
  }) => (
    <Link
      to={item.href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "18px 0",
        textDecoration: "none",
        borderTop: isFirst ? "none" : `1px solid ${LINE}`,
      }}
    >
      {heart ? (
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: RUST,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Heart size={16} strokeWidth={2} color={CREAM} fill={CREAM} />
        </div>
      ) : item.icon ? (
        <div style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <item.icon size={20} strokeWidth={1.5} color={MUTED_INK} />
        </div>
      ) : null}
      <span
        style={{
          flex: 1,
          fontFamily: SANS,
          fontSize: 16,
          fontWeight: 400,
          letterSpacing: "-0.1px",
          color: INK,
          lineHeight: 1.25,
        }}
      >
        {item.label}
      </span>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "rgba(106,106,94,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: 12,
          color: INK,
          lineHeight: 1,
        }}
      >
        ↗
      </div>
    </Link>
  );

  const Card = ({
    items,
    heartFirst = false,
  }: {
    items: { label: string; href: string; icon?: any }[];
    heartFirst?: boolean;
  }) => (
    <div
      style={{
        background: CREAM,
        borderRadius: 20,
        margin: "0 24px",
        padding: "4px 22px",
      }}
    >
      {items.map((item, i) => (
        <Row key={item.label} item={item} isFirst={i === 0} heart={heartFirst && i === 0} />
      ))}
    </div>
  );

  const displayName = (profile?.display_name?.trim() || user.email?.split("@")[0] || "You");
  const handle = user.email ? `@${user.email.split("@")[0].toLowerCase()}` : "";
  const initial = displayName.charAt(0).toUpperCase();
  const bioText = profile?.bio?.trim()
    ? /[.!?]$/.test(profile.bio.trim())
      ? profile.bio.trim()
      : `${profile.bio.trim()}.`
    : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: OLIVE,
        paddingBottom: 120,
        fontFamily: SANS,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          padding: "calc(env(safe-area-inset-top) + 32px) 24px 0",
        }}
      >
        <NotificationsBell />
        <GlobalMenuTrigger open={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
        <GlobalMenu open={menuOpen} onOpenChange={setMenuOpen} />
      </div>

      {/* Hero: avatar + name */}
      <div style={{ padding: "8px 24px 0", display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            aria-hidden="true"
          >
            {Array.from({ length: 16 }).map((_, i) => {
              const angle = (i * 360) / 16;
              const rad = (angle * Math.PI) / 180;
              const inner = 54;
              const outer = 60 + ((i % 3) - 1) * 1.2; // tiny variance, primitive feel
              const cx = 60;
              const cy = 60;
              const x1 = cx + Math.sin(rad) * inner;
              const y1 = cy - Math.cos(rad) * inner;
              const x2 = cx + Math.sin(rad) * outer;
              const y2 = cy - Math.cos(rad) * outer;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={GOLD}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              width: 80,
              height: 80,
              borderRadius: "50%",
              overflow: "hidden",
              background: profile?.avatar_url
                ? "transparent"
                : "linear-gradient(135deg, #E8B999 0%, #C18866 50%, #8B5C3E 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: 34,
                  color: CREAM,
                  lineHeight: 1,
                }}
              >
                {initial}
              </span>
            )}
          </div>
        </div>
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: 54,
            lineHeight: 0.95,
            letterSpacing: "-1.6px",
            color: CREAM,
            margin: 0,
            flex: 1,
            minWidth: 0,
            wordBreak: "break-word",
          }}
        >
          {displayName.charAt(0).toUpperCase() + displayName.slice(1)}
        </h1>
      </div>

      {/* Handle + bio */}
      <div style={{ padding: "16px 24px 0" }}>
        {handle && (
          <p
            style={{
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 400,
              color: "rgba(238,232,218,0.65)",
              margin: "0 0 8px 0",
            }}
          >
            {handle}
          </p>
        )}
        {bioText && (
          <p
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 18,
              lineHeight: 1.4,
              color: "rgba(238,232,218,0.85)",
              margin: 0,
            }}
          >
            {bioText}
          </p>
        )}
      </div>

      {/* Stats card */}
      <div style={{ padding: "24px 24px 0", marginBottom: 32 }}>
        <div
          style={{
            background: "#EEE8DA",
            borderRadius: 20,
            padding: "20px 22px",
          }}
        >
          <div
            style={{
              paddingBottom: 16,
              marginBottom: 16,
              borderBottom: "1px solid #D9D2C0",
            }}
          >
            <FollowStat userId={user.id} />
          </div>
          <button
            onClick={() => navigate("/my-profile")}
            onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
            onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            style={{
              width: "100%",
              height: 42,
              background: "#2A2A24",
              color: "#EEE8DA",
              border: "none",
              borderRadius: 999,
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 14,
              fontWeight: 400,
              letterSpacing: "0.1px",
              cursor: "pointer",
              transition: "transform 150ms ease-out",
            }}
          >
            View My Profile
          </button>
        </div>
      </div>

      {/* Saved */}
      <Eyebrow>Saved</Eyebrow>
      <Card items={[{ label: "My Hoedspruit", href: "/saved" }]} heartFirst />

      <div style={{ height: 28 }} />
      <Eyebrow>Help & Settings</Eyebrow>
      <Card items={helpItems} />

      <div style={{ height: 28 }} />
      <Eyebrow>Resources</Eyebrow>
      <Card items={resourcesItems} />

      <div style={{ height: 28 }} />
      <Eyebrow>Get In Touch</Eyebrow>
      <Card items={getInTouchItems} />

      {isAdmin && (
        <>
          <div style={{ height: 28 }} />
          <Eyebrow>Admin</Eyebrow>
          <Card items={adminItems} />
        </>
      )}

      {/* Log out */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 8, marginBottom: 24 }}>
        <button
          onClick={() => {
            signOut();
            navigate("/");
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "transparent",
            color: CREAM,
            border: "1px solid rgba(238,232,218,0.35)",
            borderRadius: 999,
            padding: "14px 26px",
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 400,
            cursor: "pointer",
          }}
        >
          <LogOut size={14} strokeWidth={1.6} color={CREAM} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

// Editorial follow stats — Playfair number, tracked uppercase label
const FollowStat = ({ userId }: { userId: string }) => {
  const { data: counts } = useFollowCounts(userId);
  const INK = "#2A2A24";
  const MUTED_INK = "#6B6A5E";
  const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  const SERIF = "'Playfair Display', Georgia, serif";
  const fmt = (n: number) => n.toLocaleString("en-US");
  const Stat = ({ to, count, label }: { to: string; count: number; label: string }) => (
    <Link to={to} style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: 2 }}>
      <span
        style={{
          fontFamily: SERIF,
          fontWeight: 400,
          fontSize: 26,
          lineHeight: 1,
          letterSpacing: "-0.5px",
          color: INK,
        }}
      >
        {fmt(count)}
      </span>
      <span
        style={{
          fontFamily: SANS,
          fontSize: 10.5,
          fontWeight: 400,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: MUTED_INK,
          lineHeight: 1,
        }}
      >
        {label}
      </span>
    </Link>
  );
  const followers = counts?.followers ?? 0;
  const following = counts?.following ?? 0;
  return (
    <div style={{ display: "flex", gap: 48 }}>
      <Stat to={`/profile/${userId}/followers`} count={followers} label={followers === 1 ? "Follower" : "Followers"} />
      <Stat to={`/profile/${userId}/following`} count={following} label={following === 1 ? "Following" : "Following"} />
    </div>
  );
};

export default MyAccount;
