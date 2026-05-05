import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  ChevronLeft,
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newCollectionName, setNewCollectionName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

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
      <div className="min-h-screen pb-16 bg-background">
        <div className="px-6 pt-5">
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-[13px] font-medium"
          >
            <ChevronLeft className="h-4 w-4" /> Back
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

  const FONT_STACK = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
  const SERIF = "'Playfair Display', Georgia, serif";
  const TEXT = "#0A0A0A";
  const MUTED = "#8A8480";
  const IVORY = "#F2EFEC";

  const myHoedspruitItems = [
    { label: "My Hoedspruit", href: "/saved", heart: true },
  ];
  const getInTouchItems = [
    { label: "Contact", href: "/contact", icon: Phone },
    { label: "Advertise", href: "/advertise", icon: Megaphone },
    { label: "Feedback", href: "/feedback", icon: MessageSquare },
  ];
  const resourcesItems = [
    { label: "Local Channels", href: "/bush-telegraph", icon: Users },
    { label: "The Lowveld Lowdown", href: "/headlines", icon: Newspaper },
  ];
  const helpItems = [
    { label: "Settings", href: "/account-settings", icon: Settings },
    { label: "About", href: "/about", icon: Info },
    { label: "Help", href: "/faqs", icon: HelpCircle },
    { label: "Terms & Policies", href: "/terms", icon: FileText },
  ];
  const adminItems = [{ label: "Admin", href: "/admin", icon: LayoutDashboard }];

  const baseTextStyle: React.CSSProperties = {
    fontFamily: FONT_STACK,
    fontStretch: "normal",
    fontSynthesis: "none",
    transform: "none",
  };

  const renderCard = (items: { label: string; href: string; heart?: boolean; icon?: any }[]) => (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      {items.map((item, i) => (
        <div key={item.label}>
          <Link
            to={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "18px 20px",
              textDecoration: "none",
              transition: "transform 0.15s ease",
            }}
            onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.995)")}
            onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {item.heart ? (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#241F1A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Heart size={14} strokeWidth={1.8} color="#FFFFFF" fill="#FFFFFF" />
              </div>
            ) : item.icon ? (
              <div style={{ width: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <item.icon size={18} strokeWidth={1.5} color="#898480" />
              </div>
            ) : null}
            <span
              style={{
                ...baseTextStyle,
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                flex: 1,
                fontSize: 16,
                fontWeight: 400,
                lineHeight: 1.25,
                color: TEXT,
              }}
            >
              {item.label}
            </span>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: IVORY,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ChevronRight size={14} strokeWidth={2} color={TEXT} />
            </div>
          </Link>
          {i < items.length - 1 && (
            <div
              style={{
                height: 1,
                background: IVORY,
                marginLeft: 20,
                marginRight: 20,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );

  const sectionLabel = (text: string) => (
    <p
      style={{
        ...baseTextStyle,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "#0a0a0a",
        margin: 0,
        marginBottom: 10,
        paddingLeft: 4,
      }}
    >
      {text}
    </p>
  );

  const firstName = (profile?.display_name?.trim() || user.email?.split("@")[0] || "You").split(" ")[0];
  const username = user.email ? `@${user.email.split("@")[0]}` : "";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "transparent",
        paddingBottom: 120,
        ...baseTextStyle,
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "calc(env(safe-area-inset-top) + 16px) 20px 0",
        }}
      >
        <span />
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Menu"
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              background: "#FFFFFF",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Menu size={20} strokeWidth={1.8} color={TEXT} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-60">
            <DropdownMenuLabel>Quick links</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/saved")}>
              <Heart className="mr-2 h-4 w-4" /> Saved
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/saved?tab=events")}>
              <Calendar className="mr-2 h-4 w-4" /> Saved events
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/saved?tab=specials")}>
              <Tag className="mr-2 h-4 w-4" /> Saved specials
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/visited")}>
              <MapPinCheck className="mr-2 h-4 w-4" /> Been here
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/my-hoedspruit")}>
              <Bookmark className="mr-2 h-4 w-4" /> My Hoedspruit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/notifications")}>
              <Bell className="mr-2 h-4 w-4" /> Notifications
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/account-settings")}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/account-settings/info")}>
              <UserCircle className="mr-2 h-4 w-4" /> Account info
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/privacy-security")}>
              <Shield className="mr-2 h-4 w-4" /> Privacy & security
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/faqs")}>
              <HelpCircle className="mr-2 h-4 w-4" /> FAQs
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/feedback")}>
              <MessageSquare className="mr-2 h-4 w-4" /> Feedback
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/contact")}>
              <Phone className="mr-2 h-4 w-4" /> Contact us
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/about")}>
              <Info className="mr-2 h-4 w-4" /> About
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/advertise")}>
              <Megaphone className="mr-2 h-4 w-4" /> Advertise
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Hero */}
      <div style={{ padding: "28px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ position: "relative", width: 132, height: 132, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg
              width="132"
              height="132"
              viewBox="0 0 132 132"
              style={{ position: "absolute", inset: 0, pointerEvents: "none", filter: "url(#rusticRough)" }}
              aria-hidden="true"
            >
              <defs>
                <filter id="rusticRough" x="-10%" y="-10%" width="120%" height="120%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
                  <feDisplacementMap in="SourceGraphic" scale="1.4" />
                </filter>
              </defs>
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i * 360) / 24;
                const long = i % 2 === 0;
                const inner = 50;
                const outer = long ? 64 : 60;
                return (
                  <line
                    key={i}
                    x1="66"
                    y1={66 - outer}
                    x2="66"
                    y2={66 - inner}
                    stroke="#5b4632"
                    strokeWidth={long ? 3 : 2.2}
                    strokeLinecap="round"
                    transform={`rotate(${angle} 66 66)`}
                    opacity={0.9}
                  />
                );
              })}
            </svg>
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: "50%",
                background: "#E2C9B4",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                zIndex: 1,
              }}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ ...baseTextStyle, fontSize: 28, fontWeight: 500, color: "#FFFFFF" }}>
                  {firstName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <h1
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontWeight: 500,
              fontSize: 35,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: "#5b4632",
              margin: 0,
              flex: 1,
              minWidth: 0,
              wordBreak: "break-word",
            }}
          >
            {firstName}
          </h1>
        </div>

        {username && (
          <p style={{ ...baseTextStyle, fontSize: 14, color: "#5b4632", margin: "16px 0 0" }}>{username}</p>
        )}

        {profile?.bio && (
          <p
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 18,
              lineHeight: 1.4,
              color: "#5b4632",
              maxWidth: 300,
              margin: "10px 0 0",
            }}
          >
            {profile.bio}
          </p>
        )}
      </div>

      {/* Stats card */}
      <div style={{ padding: "24px 24px 0" }}>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 20,
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: 32,
          }}
        >
          <FollowStat userId={user.id} />
          <button
            onClick={() => setActiveSection("profile")}
            style={{
              marginLeft: "auto",
              background: TEXT,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 999,
              padding: "8px 16px",
              fontSize: 13,
              fontFamily: FONT_STACK,
              cursor: "pointer",
            }}
          >
            Edit
          </button>
        </div>
      </div>

      {/* My Hoedspruit */}
      <div style={{ padding: "28px 24px 0" }}>
        {sectionLabel("Saved")}
        {renderCard(myHoedspruitItems)}
      </div>

      {/* Get in touch */}
      <div style={{ padding: "24px 24px 0" }}>
        {sectionLabel("Get in touch")}
        {renderCard(getInTouchItems)}
      </div>

      {/* Help and settings */}
      <div style={{ padding: "24px 24px 0" }}>
        {sectionLabel("Help & settings")}
        {renderCard(helpItems)}
      </div>

      {/* Admin */}
      {isAdmin && (
        <div style={{ padding: "24px 24px 0" }}>
          {sectionLabel("Admin")}
          {renderCard(adminItems)}
        </div>
      )}

      {/* Log out */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
        <button
          onClick={() => {
            signOut();
            navigate("/");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: TEXT,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 999,
            padding: "14px 28px 14px 24px",
            fontFamily: FONT_STACK,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <LogOut size={16} strokeWidth={1.8} color="#FFFFFF" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
};

// Inline editorial follow stats (followers / following stacked)
const FollowStat = ({ userId }: { userId: string }) => {
  const { data: counts } = useFollowCounts(userId);
  const TEXT = "#0A0A0A";
  const MUTED = "#8A8480";
  const FONT_STACK = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
  const Stat = ({ to, count, label }: { to: string; count: number; label: string }) => (
    <Link to={to} style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontFamily: FONT_STACK, fontSize: 18, fontWeight: 500, color: TEXT, lineHeight: 1 }}>{count}</span>
      <span
        style={{
          fontFamily: FONT_STACK,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: MUTED,
          lineHeight: 1,
        }}
      >
        {label}
      </span>
    </Link>
  );
  return (
    <div style={{ display: "flex", gap: 32 }}>
      <Stat to={`/profile/${userId}/followers`} count={counts?.followers ?? 0} label={counts?.followers === 1 ? "Follower" : "Followers"} />
      <Stat to={`/profile/${userId}/following`} count={counts?.following ?? 0} label="Following" />
    </div>
  );
};

export default MyAccount;
