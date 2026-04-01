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
  Shield,
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
import heroBg from "@/assets/hero-homepage.jpg";

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
        .single();
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
      <div className="min-h-screen pb-16 bg-background">
        <div className="relative h-[180px] overflow-hidden">
          <img src={heroBg} alt="Hoedspruit" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, hsla(30, 20%, 20%, 0.1), hsla(30, 20%, 20%, 0.45))" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <h1
              className="text-[32px] font-semibold text-white tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Profile
            </h1>
          </div>
        </div>
        <div className="px-5 pt-12 text-center">
          <h2
            className="text-[22px] font-semibold text-foreground mb-2 tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Welcome to Hello Hoedspruit
          </h2>
          <p className="text-muted-foreground text-[13px] leading-relaxed mb-8 max-w-xs mx-auto">
            Sign in to access your profile, saved listings, and events.
          </p>
          <Link to="/auth">
            <Button className="rounded-full px-8 text-[13px] font-medium">Sign In / Create Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || !user) {
    return (
      <div className="min-h-screen pb-16 bg-background">
        <div className="relative h-[180px] overflow-hidden">
          <img src={heroBg} alt="Hoedspruit" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, hsla(30, 20%, 20%, 0.1), hsla(30, 20%, 20%, 0.45))" }} />
        </div>
        <div className="px-5 -mt-12 relative z-10 flex flex-col items-center">
          <Skeleton className="h-20 w-20 rounded-full mb-3" />
          <Skeleton className="h-5 w-36 mb-2" />
          <Skeleton className="h-4 w-48" />
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

  // Main account page
  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Minimal top bar */}
      <div className="pt-14 pb-1 px-5">
        <h1
          className="text-center text-[13px] font-medium text-muted-foreground uppercase tracking-[0.08em]"
        >
          My Account
        </h1>
      </div>

      {/* Profile identity card */}
      <div className="px-5 pt-4 mb-6">
        <div className="bg-card border border-border/40 rounded-2xl px-5 py-5">
          <div className="flex items-center gap-3.5">
            <div className="h-[56px] w-[56px] rounded-full bg-muted border border-border/30 overflow-hidden flex items-center justify-center shrink-0">
              {profileLoading ? (
                <Skeleton className="h-full w-full rounded-full" />
              ) : profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <UserCircle className="h-8 w-8 text-muted-foreground/25" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {profileLoading ? (
                <>
                  <Skeleton className="h-5 w-28 mb-1.5" />
                  <Skeleton className="h-3 w-36" />
                </>
              ) : (
                <>
                  <h2
                    className="text-[18px] font-semibold text-foreground tracking-tight truncate leading-tight"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {profile?.display_name || user.email?.split("@")[0]}
                  </h2>
                  <p className="text-muted-foreground text-[12px] truncate mt-0.5">{user.email}</p>
                </>
              )}
            </div>
          </div>

          {/* Stats + Edit row */}
          <div className="mt-4 pt-3.5 border-t border-border/30 flex items-center justify-between">
            <FollowStats userId={user.id} />
            <button
              onClick={() => setActiveSection("profile")}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border/40 text-foreground text-[12px] font-medium active:scale-95 transition-transform hover:bg-muted/30"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Quick actions — Saved & My Events */}
      <div className="px-5 mb-6">
        <div className="space-y-2">
          <Link
            to="/saved"
            className="flex items-center gap-3.5 bg-card border border-border/40 rounded-xl px-4 py-3.5 active:scale-[0.98] transition-transform"
          >
            <div className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
              <Heart className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-medium text-foreground block">Saved Listings</span>
              <span className="text-[11px] text-muted-foreground">Listings you've bookmarked</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/25 shrink-0" />
          </Link>
          <button
            onClick={() => setActiveSection("my-events")}
            className="w-full flex items-center gap-3.5 bg-card border border-border/40 rounded-xl px-4 py-3.5 active:scale-[0.98] transition-transform text-left"
          >
            <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-medium text-foreground block">My Events</span>
              <span className="text-[11px] text-muted-foreground">Your RSVP'd and saved events</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/25 shrink-0" />
          </button>
        </div>
      </div>

      {/* Settings & Support */}
      <div className="px-5 mb-5">
        <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.1em] mb-2 px-1">Settings & Support</p>
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
          {[
            { icon: Users, label: "Find People", href: "/people" },
            { icon: Bell, label: "Notifications", action: () => {} },
            { icon: Settings, label: "Account Settings", action: () => setActiveSection("profile") },
            { icon: Shield, label: "Privacy & Security" },
          ].map((item, i, arr) => {
            const Icon = item.icon;
            const content = (
              <div className={`flex items-center gap-3.5 px-4 py-3 ${i < arr.length - 1 ? "border-b border-border/20" : ""}`}>
                <Icon className="h-[16px] w-[16px] text-primary/70" strokeWidth={1.5} />
                <span className="flex-1 text-[13px] text-foreground">{item.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20" />
              </div>
            );
            if ('href' in item && item.href) {
              return <Link key={item.label} to={item.href}>{content}</Link>;
            }
            return (
              <button key={item.label} onClick={item.action} className="w-full text-left hover:bg-muted/20 transition-colors">
                {content}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info & More */}
      <div className="px-5 mb-5">
        <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.1em] mb-2 px-1">Info & More</p>
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
          {[
            { icon: HelpCircle, label: "Help & Support", href: "/contact" },
            { icon: Info, label: "About", href: "/about" },
            { icon: Megaphone, label: "Advertise with Us", href: "/advertise" },
          ].map((item, i, arr) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} to={item.href}>
                <div className={`flex items-center gap-3.5 px-4 py-3 ${i < arr.length - 1 ? "border-b border-border/20" : ""}`}>
                  <Icon className="h-[16px] w-[16px] text-primary/70" strokeWidth={1.5} />
                  <span className="flex-1 text-[13px] text-foreground">{item.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {isAdmin && (
        <div className="px-5 mb-5">
          <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.1em] mb-2 px-1">Admin</p>
          <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
            <Link to="/admin">
              <div className="flex items-center gap-3.5 px-4 py-3">
                <LayoutDashboard className="h-[16px] w-[16px] text-primary/70" strokeWidth={1.5} />
                <span className="flex-1 text-[13px] text-foreground">Admin Dashboard</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20" />
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="px-5 mt-1 mb-8">
        <button
          onClick={() => { signOut(); navigate("/"); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-destructive/80 font-medium text-[13px] active:scale-[0.97] transition-transform hover:bg-destructive/5"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default MyAccount;
