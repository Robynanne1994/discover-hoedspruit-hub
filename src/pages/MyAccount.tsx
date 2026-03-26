import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Heart,
  MapPinCheck,
  Star,
  Plus,
  Trash2,
  FolderOpen,
  UserCircle,
  Settings,
  Megaphone,
  Mail,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import ProfileForm from "@/components/profile/ProfileForm";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ActiveSection = null | "profile" | "favourites" | "collections" | "been-here" | "reviews";

const MyAccount = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newCollectionName, setNewCollectionName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const { data: profile } = useQuery({
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

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 section-padding">
          <div className="container-wide text-center py-16">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const sectionCards = [
    { key: "profile" as const, label: "Profile", icon: UserCircle, color: "text-primary" },
    { key: "collections" as const, label: "Collections", icon: Heart, color: "text-rose-500" },
    { key: "been-here" as const, label: "Been Here", icon: MapPinCheck, color: "text-emerald-500" },
    { key: "reviews" as const, label: "Reviews", icon: Star, color: "text-amber-500" },
  ];

  const quickActions = [
    { label: "Account Settings", icon: Settings, action: () => setActiveSection("profile") },
    { label: "Advertise", icon: Megaphone, href: "/about" },
    { label: "Contact Us", icon: Mail, href: "/contact" },
    { label: "Help & FAQ", icon: HelpCircle, href: "/about" },
    { label: "Sign Out", icon: LogOut, action: () => { signOut(); navigate("/"); }, destructive: true },
  ];

  // Mobile detail view for a section
  if (activeSection) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pt-24 pb-16 section-padding">
          <div className="container-wide max-w-4xl mx-auto">
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-6 text-sm font-medium"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>

            {activeSection === "profile" && (
              <>
                <h2 className="font-sans text-xl font-semibold mb-4">My Profile</h2>
                <ProfileForm profile={profile as any} />
              </>
            )}

            {activeSection === "collections" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-sans text-xl font-semibold">My Collections</h2>
                  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> New</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Collection</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={(e) => { e.preventDefault(); createCollection.mutate(newCollectionName); }} className="space-y-4">
                        <Input
                          placeholder="e.g. Date Night, Weekend Plans"
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          required
                        />
                        <Button type="submit" className="w-full" disabled={createCollection.isPending}>
                          Create
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                {!collections?.length ? (
                  <div className="text-center py-12 bg-card border border-border rounded-xl">
                    <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground">No collections yet. Save listings you love!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {collections.map((col: any) => (
                      <div key={col.id} className="bg-card border border-border rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-foreground">{col.name}</h3>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={() => deleteCollection.mutate(col.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {!col.collection_items?.length ? (
                          <p className="text-sm text-muted-foreground">No listings saved yet</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {col.collection_items.map((item: any) => (
                              <div key={item.id} className="flex items-center gap-3 bg-background rounded-lg p-3">
                                {item.listings?.image_url && (
                                  <img src={item.listings.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <Link to={`/listing/${item.listings?.id}`} className="text-sm font-medium hover:text-primary truncate block">
                                    {item.listings?.title}
                                  </Link>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeFromCollection.mutate(item.id)}>
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
                <h2 className="font-sans text-xl font-semibold mb-4">Been Here</h2>
                {!beenHere?.length ? (
                  <div className="text-center py-12 bg-card border border-border rounded-xl">
                    <MapPinCheck className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground">You haven't marked any places as visited yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {beenHere.map((bh: any) => (
                      <div key={bh.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-4">
                        {bh.listings?.image_url && (
                          <img src={bh.listings.image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <Link to={`/listing/${bh.listings?.id}`} className="font-medium hover:text-primary truncate block">
                            {bh.listings?.title}
                          </Link>
                        </div>
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
                <h2 className="font-sans text-xl font-semibold mb-4">My Reviews</h2>
                {!reviews?.length ? (
                  <div className="text-center py-12 bg-card border border-border rounded-xl">
                    <Star className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground">You haven't left any reviews yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Link to={`/listing/${review.listings?.id}`} className="font-medium hover:text-primary">
                            {review.listings?.title}
                          </Link>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-4 w-4 ${s <= review.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-32 section-padding">
        <div className="container-wide max-w-4xl mx-auto">
          <BackButton />
          {/* Header: avatar + name */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-14 w-14 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">
                  {(profile?.display_name || user.email || "?")[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-sans text-lg sm:text-2xl font-bold text-foreground truncate">
                {profile?.display_name || user.email?.split("@")[0]}
              </h1>
              <p className="text-muted-foreground text-sm truncate">{user.email}</p>
            </div>
          </div>

          {/* Section cards - 2x2 grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {sectionCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.key}
                  onClick={() => setActiveSection(card.key)}
                  className="flex flex-col items-center justify-center gap-3 p-6 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-md transition-all duration-200 text-center"
                >
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{card.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick action buttons */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              const content = (
                <div className={`flex items-center gap-4 px-5 py-4 ${i !== quickActions.length - 1 ? "border-b border-border" : ""} hover:bg-accent/50 transition-colors`}>
                  <Icon className={`h-5 w-5 ${action.destructive ? "text-destructive" : "text-muted-foreground"}`} />
                  <span className={`flex-1 text-sm font-medium ${action.destructive ? "text-destructive" : "text-foreground"}`}>
                    {action.label}
                  </span>
                  {!action.destructive && <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
                </div>
              );

              if (action.href) {
                return (
                  <Link key={action.label} to={action.href}>
                    {content}
                  </Link>
                );
              }
              return (
                <button key={action.label} onClick={action.action} className="w-full text-left">
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MyAccount;
