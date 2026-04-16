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
} from "lucide-react";
import ProfileForm from "@/components/profile/ProfileForm";
import FollowStats from "@/components/social/FollowStats";
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
      <div className="min-h-screen pb-20" style={{ background: "#d2d2d2", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
        <div style={{ paddingTop: 44, paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 400, fontSize: 40, lineHeight: 0.95, letterSpacing: "0.01em", color: "#020202", textTransform: "uppercase" }}>PROFILE</h1>
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
      <div className="min-h-screen pb-20" style={{ background: "#d2d2d2", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
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

  const getInTouchItems = [
    { icon: Mail, label: "Contact", href: "/contact" },
    { icon: Megaphone, label: "Advertise", href: "/advertise" },
    { icon: MessageSquare, label: "Feedback", href: "/feedback" },
  ];

  const moreItems = [
    { icon: Settings, label: "Account Settings", href: "/account-settings" },
    { icon: Info, label: "About", href: "/about" },
    { icon: Newspaper, label: "The Lowveld Lowdown", href: "/headlines" },
    { icon: HelpCircle, label: "Help & FAQs", href: "/faqs" },
    { icon: FileText, label: "Terms & Policies", href: "/terms" },
  ];

  const renderRow = (item: any, isLast: boolean) => {
    const Icon = item.icon;
    const content = (
      <div
        className="flex items-center"
        style={{
          height: 48,
          padding: "0 24px",
          transition: "transform 0.15s ease",
        }}
        onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
        onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <Icon style={{ width: 24, height: 24, strokeWidth: 1.8, color: "rgba(18,18,20,0.3)", flexShrink: 0, marginRight: 12 }} />
        <span style={{ flex: 1, fontSize: 16, fontWeight: 400, color: "#2B2420", lineHeight: 1.2 }}>{item.label}</span>
        <ChevronRight style={{ width: 20, height: 20, strokeWidth: 1.8, color: "rgba(18,18,20,0.3)", flexShrink: 0 }} />
      </div>
    );

    const divider = !isLast ? (
      <div style={{ marginLeft: 24, marginRight: 24, height: 1, background: "rgba(18,18,20,0.08)" }} />
    ) : null;

    if (item.href) return <div key={item.label}><Link to={item.href}>{content}</Link>{divider}</div>;
    return <div key={item.label}><button onClick={item.action} className="w-full text-left">{content}</button>{divider}</div>;
  };

  const sectionHeader = (text: string) => (
    <p style={{
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: "0.06em",
      textTransform: "uppercase" as const,
      color: "#020202",
      lineHeight: 1.3,
      marginTop: 24,
      marginBottom: 8,
      paddingLeft: 24,
    }}>
      {text}
    </p>
  );

  return (
    <div className="min-h-screen" style={{ background: "#EBEBEB", paddingBottom: 84, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      {/* Page title */}
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24 }}>
        <h1 style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontWeight: 400,
          fontSize: 53,
          lineHeight: 1,
          letterSpacing: "0.01em",
          color: "#020202",
          textTransform: "none",
          margin: 0,
          marginBottom: 4,
        }}>
          Profile
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <p style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: 15,
          fontWeight: 400,
          lineHeight: 1.35,
          color: "rgba(18,18,20,0.55)",
          margin: 0,
        }}>
          Your account and settings
        </p>
      </div>

      {/* Profile card */}
      <div style={{ paddingLeft: 4, paddingRight: 4, marginBottom: 36 }}>
        <div style={{ background: "#FFFFFF", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: 20 }}>
          <div className="flex items-center" style={{ gap: 14 }}>
            <div className="overflow-hidden flex items-center justify-center shrink-0" style={{ width: 64, height: 64, borderRadius: "50%", background: "#EBEBEB" }}>
              {profileLoading ? (
                <Skeleton className="h-full w-full rounded-full" />
              ) : profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span style={{ fontSize: 20, fontWeight: 500, color: "rgba(18,18,20,0.4)", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                  {(profile?.display_name || user.email?.split("@")[0] || "U").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="truncate" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 16, fontWeight: 500, color: "#020202", lineHeight: 1.2, margin: 0, textTransform: "none" }}>
                {profile?.display_name || user.email?.split("@")[0]}
              </h2>
              {profile?.bio && (
                <p style={{ fontSize: 14, fontWeight: 400, color: "rgba(18,18,20,0.55)", marginTop: 4, lineHeight: 1.4, margin: 0, marginBlockStart: 4 }}>
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
            <FollowStats userId={user.id} />
            <button
              onClick={() => setActiveSection("profile")}
              className="shrink-0 flex items-center"
              style={{
                gap: 4,
                padding: "4px 8px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                transition: "transform 0.12s ease",
              }}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <span style={{ fontSize: 15, fontWeight: 500, color: "#2B2420", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>Edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* My Hoedspruit */}
      {sectionHeader("My Hoedspruit")}
      {renderRow({ icon: Heart, label: "My Hoedspruit", desc: "Your saved content & visited places", href: "/my-hoedspruit" }, true)}

      {/* Get in Touch */}
      {sectionHeader("Get in Touch")}
      {getInTouchItems.map((item, i) => renderRow(item, i === getInTouchItems.length - 1))}

      {/* Help & Settings */}
      {sectionHeader("Help & Settings")}
      {moreItems.map((item, i) => renderRow(item, i === moreItems.length - 1))}

      {isAdmin && (
        <>
          {sectionHeader("Admin")}
          {renderRow({ icon: LayoutDashboard, label: "Admin Dashboard", href: "/admin" }, true)}
        </>
      )}

      {/* Logout */}
      <div className="flex justify-center" style={{ marginTop: 36, marginBottom: 48 }}>
        <button
          onClick={() => { signOut(); navigate("/"); }}
          className="flex items-center justify-center"
          style={{
            gap: 8,
            background: "#020202",
            borderRadius: 24,
            padding: "12px 24px",
            minHeight: 48,
            border: "none",
            cursor: "pointer",
            transition: "transform 0.12s ease, opacity 0.12s ease",
          }}
          onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; e.currentTarget.style.opacity = "0.85"; }}
          onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = "1"; }}
          onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = "1"; }}
        >
          <LogOut style={{ width: 20, height: 20, strokeWidth: 1.8, color: "#FFFFFF" }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#FFFFFF" }}>Log out</span>
        </button>
      </div>
    </div>
  );
};

export default MyAccount;
