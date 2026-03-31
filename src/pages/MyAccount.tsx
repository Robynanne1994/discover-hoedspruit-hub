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
      <div className="min-h-screen pb-20 bg-background">
        <section className="relative">
          <div className="relative h-[200px] overflow-hidden">
            <img src={heroBg} alt="Hoedspruit" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <h1 className="text-3xl font-bold tracking-tight leading-tight text-center" style={{ fontFamily: "var(--font-heading)" }}>
                Hello<br />Hoedspruit
              </h1>
            </div>
          </div>
        </section>
        <div className="px-4 pt-8 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Welcome to Hello Hoedspruit
          </h2>
          <p className="text-muted-foreground text-sm mb-6">Sign in to access your profile, saved listings, and events.</p>
          <Link to="/auth">
            <Button className="rounded-full px-8">Sign In / Create Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || !user) {
    return (
      <div className="min-h-screen pb-20 bg-background">
        <div className="relative h-[200px] overflow-hidden">
          <img src={heroBg} alt="Hoedspruit" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
        </div>
        <div className="px-4 -mt-12 relative z-10 flex flex-col items-center">
          <Skeleton className="h-24 w-24 rounded-full mb-3" />
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-52" />
        </div>
      </div>
    );
  }

  // Detail section view
  if (activeSection === "profile") {
    return (
      <ProfileForm profile={profile as any} />
    );
  }

  if (activeSection) {
    return (
      <div className="min-h-screen pb-20 bg-background">
        <section className="relative">
          <div className="relative h-[140px] overflow-hidden">
            <img src={heroBg} alt="Hoedspruit" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
            <div className="absolute inset-0 flex items-end justify-center pb-4">
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                {activeSection === "favourites" && "Saved Listings"}
                {activeSection === "my-events" && "My Events"}
                {activeSection === "collections" && "Collections"}
                {activeSection === "been-here" && "Been Here"}
                {activeSection === "reviews" && "My Reviews"}
              </h1>
            </div>
          </div>
        </section>

        <div className="px-4 pt-4 pb-8">
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4 text-sm font-medium"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {activeSection === "favourites" && (
            <>
              {!favourites?.filter((f: any) => f.item_type === "listing").length ? (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">No saved listings yet</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">Tap the heart on listings you love!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favourites.filter((f: any) => f.item_type === "listing").map((fav: any) => (
                    <div key={fav.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                      {fav.details?.image_url && (
                        <img src={fav.details.image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <Link to={`/listing/${fav.item_id}`} className="font-medium text-sm hover:text-primary truncate block">
                          {fav.details?.title || "Unknown"}
                        </Link>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeFavourite.mutate({ item_id: fav.item_id, item_type: fav.item_type })}>
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
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">No saved events yet</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">Save events you're interested in!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedEvents.map((fav: any) => (
                    <div key={fav.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                      {fav.details?.image_url && (
                        <img src={fav.details.image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <Link to="/events" className="font-medium text-sm hover:text-primary truncate block">
                          {fav.details?.title || "Unknown"}
                        </Link>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeFavourite.mutate({ item_id: fav.item_id, item_type: fav.item_type })}>
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
              <div className="flex items-center justify-between mb-4">
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2 rounded-full"><Plus className="h-4 w-4" /> New Collection</Button>
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
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">No collections yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {collections.map((col: any) => (
                    <div key={col.id} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground text-sm">{col.name}</h3>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteCollection.mutate(col.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {!col.collection_items?.length ? (
                        <p className="text-xs text-muted-foreground">No listings saved yet</p>
                      ) : (
                        <div className="space-y-2">
                          {col.collection_items.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-3 bg-background rounded-lg p-2">
                              {item.listings?.image_url && <img src={item.listings.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                              <Link to={`/listing/${item.listings?.id}`} className="text-xs font-medium hover:text-primary truncate flex-1">{item.listings?.title}</Link>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeFromCollection.mutate(item.id)}>
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
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <MapPinCheck className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">No places visited yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {beenHere.map((bh: any) => (
                    <div key={bh.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                      {bh.listings?.image_url && <img src={bh.listings.image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />}
                      <Link to={`/listing/${bh.listings?.id}`} className="font-medium text-sm hover:text-primary truncate flex-1">{bh.listings?.title}</Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeBeenHere.mutate(bh.id)}>
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
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <Star className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Link to={`/listing/${review.listings?.id}`} className="font-medium text-sm hover:text-primary">{review.listings?.title}</Link>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "text-accent fill-accent" : "text-muted-foreground/30"}`} />
                          ))}
                        </div>
                      </div>
                      {review.comment && <p className="text-xs text-muted-foreground">{review.comment}</p>}
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
      {/* Hero */}
      <section className="relative">
        <div className="relative h-[200px] overflow-hidden">
          <img src={heroBg} alt="Hoedspruit" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h1 className="text-2xl font-bold tracking-tight leading-tight text-center mb-1" style={{ fontFamily: "var(--font-heading)" }}>
              Hello<br />Hoedspruit
            </h1>
            <p className="text-lg font-semibold mt-1" style={{ fontFamily: "var(--font-heading)" }}>
              My Account
            </p>
          </div>
        </div>
      </section>

      {/* Profile summary */}
      <div className="px-4 -mt-12 relative z-10 flex flex-col items-center">
        <div className="h-24 w-24 rounded-full bg-card border-4 border-card overflow-hidden flex items-center justify-center shadow-card mb-3">
          {profileLoading ? (
            <Skeleton className="h-full w-full rounded-full" />
          ) : profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <UserCircle className="h-16 w-16 text-muted-foreground/40" />
          )}
        </div>

        {profileLoading ? (
          <>
            <Skeleton className="h-5 w-36 mb-1" />
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-5 w-40 mb-4" />
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              {profile?.display_name || user.email?.split("@")[0]}
            </h2>
            <p className="text-muted-foreground text-sm mb-2">{user.email}</p>
            <FollowStats userId={user.id} />
          </>
        )}

        {/* Edit Profile button */}
        <button
          onClick={() => setActiveSection("profile")}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-card border border-border shadow-card text-sm font-medium text-foreground active:scale-95 transition-transform mt-3 mb-6"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Profile
        </button>
      </div>

      {/* Quick access */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/saved"
            className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5 active:scale-[0.97] transition-transform"
          >
            <Heart className="h-4.5 w-4.5 text-primary fill-primary" />
            <span className="text-sm font-medium text-foreground">Saved Listings</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 ml-auto" />
          </Link>
          <button
            onClick={() => setActiveSection("my-events")}
            className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5 active:scale-[0.97] transition-transform"
          >
            <Calendar className="h-4.5 w-4.5 text-accent" />
            <span className="text-sm font-medium text-foreground">My Events</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 ml-auto" />
          </button>
        </div>
      </div>

      {/* Find People */}
      <div className="px-4 mb-4">
        <Link
          to="/people"
          className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5 active:scale-[0.97] transition-transform w-full"
        >
          <Users className="h-5 w-5 text-secondary" />
          <span className="flex-1 text-sm font-medium text-foreground">Find People</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        </Link>
      </div>

      {/* Settings menu */}
      <div className="px-4 mb-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {[
            { icon: Bell, label: "Notifications", action: () => {} },
            { icon: Settings, label: "Account Settings", action: () => setActiveSection("profile") },
            { icon: Shield, label: "Privacy & Security" },
            { icon: HelpCircle, label: "Help & Support", href: "/contact" },
            { icon: Info, label: "About & Info", href: "/about" },
            { icon: Megaphone, label: "Advertise", href: "/advertise" },
          ].map((item, i, arr) => {
            const Icon = item.icon;
            const content = (
              <div className={`flex items-center gap-4 px-5 py-5 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
                <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                <span className="flex-1 text-base font-medium text-foreground">{item.label}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
              </div>
            );
            if (item.href) {
              return <Link key={item.label} to={item.href}>{content}</Link>;
            }
            return (
              <button key={item.label} onClick={item.action} className="w-full text-left hover:bg-accent/30 transition-colors">
                {content}
              </button>
            );
          })}
        </div>
      </div>

      {isAdmin && (
        <div className="px-4 mb-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Link to="/admin">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <LayoutDashboard className="h-4.5 w-4.5 text-primary" />
                <span className="flex-1 text-sm font-medium text-foreground">Admin Dashboard</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              </div>
            </Link>
          </div>
        </div>
      )}


      {/* Logout */}
      <div className="px-4 mb-8">
        <button
          onClick={() => { signOut(); navigate("/"); }}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-card border border-border text-destructive font-medium text-sm active:scale-[0.97] transition-transform"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default MyAccount;
