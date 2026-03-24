import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MapPinCheck, Star, Plus, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const MyAccount = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newCollectionName, setNewCollectionName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#f9f6f0]">
      <Navbar />
      <section className="pt-24 pb-16 section-padding">
        <div className="container-wide max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-sans text-3xl font-bold text-foreground">
                Hi, {profile?.display_name || user.email?.split("@")[0]} 👋
              </h1>
              <p className="text-muted-foreground mt-1">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { signOut(); navigate("/"); }}>
              Sign Out
            </Button>
          </div>

          <Tabs defaultValue="collections" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-6">
              <TabsTrigger value="collections" className="gap-2">
                <Heart className="h-4 w-4" /> Collections
              </TabsTrigger>
              <TabsTrigger value="been-here" className="gap-2">
                <MapPinCheck className="h-4 w-4" /> Been Here
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-2">
                <Star className="h-4 w-4" /> My Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="collections">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-sans text-xl font-semibold">My Collections</h2>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> New Collection</Button>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                          onClick={() => deleteCollection.mutate(col.id)}
                        >
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
            </TabsContent>

            <TabsContent value="been-here">
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
            </TabsContent>

            <TabsContent value="reviews">
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
            </TabsContent>
          </Tabs>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default MyAccount;
