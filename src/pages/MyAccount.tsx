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
      <div className="min-h-screen pb-20" style={{ background: "#ffffff" }}>
        <div style={{ paddingTop: 44, paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 40, lineHeight: 0.95, letterSpacing: "-0.5px", color: "#121214", textTransform: "uppercase" }}>PROFILE</h1>
        </div>
        <div className="text-center" style={{ paddingTop: 60 }}>
          <UserCircle style={{ width: 48, height: 48, color: "rgba(18,18,20,0.15)", margin: "0 auto" }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#121214", marginTop: 16, marginBottom: 8 }}>Welcome to Hello Hoedspruit</h3>
          <p style={{ fontSize: 14, color: "rgba(18,18,20,0.4)", maxWidth: 260, margin: "0 auto 24px" }}>Sign in to access your profile, saved listings, and events.</p>
          <Link to="/auth"><Button className="rounded-full px-8 text-[13px] font-medium">Sign In / Create Account</Button></Link>
        </div>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen pb-20" style={{ background: "#ffffff" }}>
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
        <div className="px-5 pt-5">
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-[13px] font-medium"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        </div>

        <div className="px-5 pt-6 pb-8">
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
                        <img src={fav.details.image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
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
                        <img src={fav.details.image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
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
                            <div key={item.id} className="flex items-center gap-3 bg-background rounded-lg p-2">
                              {item.listings?.image_url && <img src={item.listings.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
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
                      {bh.listings?.image_url && <img src={bh.listings.image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />}
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

  const quickActions = [
    { icon: Heart, label: "Saved Listings", desc: "Listings you've bookmarked", href: "/saved" },
    { icon: MapPin, label: "Visited Places", desc: "Places you've been to", href: "/visited" },
    { icon: Calendar, label: "My Events", desc: "Your RSVP'd and saved events", href: "/saved?tab=events" },
  ];

  const socialItems = [
    { icon: Users, label: "Find People", href: "/people" },
  ];

  const preferencesItems = [
    { icon: Bell, label: "Notifications", desc: "Choose what you hear from us", href: "/notifications" },
  ];

  const supportItems = [
    { icon: HelpCircle, label: "Help & FAQs", desc: "Answers to common questions", href: "/faqs" },
    { icon: MessageSquare, label: "Give Us Feedback", desc: "Tell us how we can improve", href: "/feedback" },
    { icon: Mail, label: "Contact", desc: "Get in touch with us", href: "/contact" },
  ];

  const infoItems = [
    { icon: Newspaper, label: "The Lowveld Lowdown", href: "/headlines" },
    { icon: Info, label: "About", href: "/about" },
    { icon: Megaphone, label: "Advertise with Us", href: "/advertise" },
    { icon: FileText, label: "Terms & Policies", href: "/terms" },
  ];

  const accountItems = [
    { icon: Settings, label: "Account Settings", desc: "Manage your account details", href: "/account-settings" },
  ];

  const renderRow = (item: any, isLast: boolean) => {
    const Icon = item.icon;
    const content = (
      <div className="flex items-center" style={{ gap: 14, paddingTop: 16, paddingBottom: 16, borderBottom: isLast ? "none" : "1px solid rgba(18,18,20,0.06)" }}>
        <Icon style={{ width: 22, height: 22, strokeWidth: 1.5, color: "rgba(18,18,20,0.3)", flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <span style={{ fontSize: 15, fontWeight: 600, color: "#121214", display: "block" }}>{item.label}</span>
          {item.desc && <span style={{ fontSize: 12, color: "rgba(18,18,20,0.35)", marginTop: 2, display: "block" }}>{item.desc}</span>}
        </div>
        <ChevronRight style={{ width: 16, height: 16, strokeWidth: 2, color: "rgba(18,18,20,0.2)", flexShrink: 0 }} />
      </div>
    );
    if (item.href) return <Link key={item.label} to={item.href}>{content}</Link>;
    return <button key={item.label} onClick={item.action} className="w-full text-left">{content}</button>;
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: "#ffffff" }}>
      {/* Heading */}
      <div style={{ paddingTop: 44, paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 40, lineHeight: 0.95, letterSpacing: "-0.5px", color: "#121214", textTransform: "uppercase" }}>
          PROFILE
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
        <p style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: "italic", fontSize: 14, color: "rgba(18,18,20,0.4)", letterSpacing: "0.2px", lineHeight: 1.4 }}>
          Your account and settings
        </p>
      </div>

      {/* Profile card */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <div style={{ background: "rgba(18,18,20,0.03)", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: 20 }}>
          <div className="flex items-center" style={{ gap: 14 }}>
            <div className="overflow-hidden flex items-center justify-center shrink-0" style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(18,18,20,0.06)" }}>
              {profileLoading ? (
                <Skeleton className="h-full w-full rounded-full" />
              ) : profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <UserCircle style={{ width: 32, height: 32, color: "rgba(18,18,20,0.2)" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="truncate" style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, color: "#121214", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.2 }}>
                {profile?.display_name || user.email?.split("@")[0]}
              </h2>
              <p className="truncate" style={{ fontSize: 13, color: "rgba(18,18,20,0.4)", marginTop: 2 }}>{user.email}</p>
              {profile?.bio && (
                <p style={{ fontSize: 13, color: "rgba(18,18,20,0.5)", marginTop: 8, lineHeight: 1.4, fontStyle: "italic", fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
            <FollowStats userId={user.id} />
            <button
              onClick={() => setActiveSection("profile")}
              className="shrink-0 flex items-center active:scale-95 transition-transform"
              style={{ gap: 4, padding: "4px 10px", border: "none", borderRadius: 8, background: "transparent" }}
            >
              <Pencil style={{ width: 12, height: 12, color: "rgba(18,18,20,0.3)" }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(18,18,20,0.3)" }}>Edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginTop: 24, marginBottom: 32 }}>
        {quickActions.map((item, i) => renderRow(item, i === quickActions.length - 1))}
      </div>

      {/* Social */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 14 }}>
          Social
        </p>
        {socialItems.map((item, i) => renderRow(item, i === socialItems.length - 1))}
      </div>

      {/* Preferences */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 14 }}>
          Preferences
        </p>
        {preferencesItems.map((item, i) => renderRow(item, i === preferencesItems.length - 1))}
      </div>

      {/* Support */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 14 }}>
          Support
        </p>
        {supportItems.map((item, i) => renderRow(item, i === supportItems.length - 1))}
      </div>

      {/* Info */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 14 }}>
          Info
        </p>
        {infoItems.map((item, i) => renderRow(item, i === infoItems.length - 1))}
      </div>

      {/* Account */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 14 }}>
          Account
        </p>
        {accountItems.map((item, i) => renderRow(item, i === accountItems.length - 1))}
      </div>

      {isAdmin && (
        <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 14 }}>
            Admin
          </p>
          <Link to="/admin">
            <div className="flex items-center" style={{ gap: 14, paddingTop: 16, paddingBottom: 16 }}>
              <LayoutDashboard style={{ width: 22, height: 22, strokeWidth: 1.5, color: "rgba(18,18,20,0.3)", flexShrink: 0 }} />
              <span className="flex-1" style={{ fontSize: 15, fontWeight: 600, color: "#121214" }}>Admin Dashboard</span>
              <ChevronRight style={{ width: 16, height: 16, strokeWidth: 2, color: "rgba(18,18,20,0.2)", flexShrink: 0 }} />
            </div>
          </Link>
        </div>
      )}

      {/* Logout */}
      <div className="flex justify-center" style={{ marginTop: 36, marginBottom: 100 }}>
        <button
          onClick={() => { signOut(); navigate("/"); }}
          className="flex items-center"
          style={{ gap: 8, background: "transparent", border: "1px solid rgba(18,18,20,0.12)", borderRadius: 12, padding: "14px 32px" }}
        >
          <LogOut style={{ width: 16, height: 16, strokeWidth: 1.5, color: "rgba(18,18,20,0.4)" }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(18,18,20,0.4)" }}>Log out</span>
        </button>
      </div>
    </div>
  );
};

export default MyAccount;
