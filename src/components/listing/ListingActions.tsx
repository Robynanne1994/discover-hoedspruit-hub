import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MapPinCheck, Plus, Check, Share2 } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ListingActionsProps {
  listingId: string;
}

const ListingActions = ({ listingId }: ListingActionsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const { data: beenHere } = useQuery({
    queryKey: ["been-here-check", listingId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("been_here")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", listingId)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: collections } = useQuery({
    queryKey: ["collections-for-save", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("collections")
        .select("id, name, collection_items(listing_id)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const toggleBeenHere = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (beenHere) {
        await supabase.from("been_here").delete().eq("id", beenHere.id);
      } else {
        await supabase.from("been_here").insert({ user_id: user.id, listing_id: listingId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["been-here-check", listingId] });
      queryClient.invalidateQueries({ queryKey: ["been-here"] });
      queryClient.invalidateQueries({ queryKey: ["been-here-count", listingId] });
      toast.success(beenHere ? "Removed from visited" : "Marked as visited!");
    },
  });

  const toggleSave = useMutation({
    mutationFn: async (collectionId: string) => {
      if (!user) return;
      const collection = collections?.find((c: any) => c.id === collectionId);
      const alreadySaved = collection?.collection_items?.some((i: any) => i.listing_id === listingId);
      if (alreadySaved) {
        const { data: item } = await supabase
          .from("collection_items")
          .select("id")
          .eq("collection_id", collectionId)
          .eq("listing_id", listingId)
          .single();
        if (item) await supabase.from("collection_items").delete().eq("id", item.id);
      } else {
        await supabase.from("collection_items").insert({ collection_id: collectionId, listing_id: listingId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections-for-save"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  const createAndSave = useMutation({
    mutationFn: async (name: string) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("collections")
        .insert({ name, user_id: user.id })
        .select("id")
        .single();
      if (error) throw error;
      await supabase.from("collection_items").insert({ collection_id: data.id, listing_id: listingId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections-for-save"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      setNewName("");
      setCreateOpen(false);
      toast.success("Saved to new collection!");
    },
  });

  const requireAuth = () => {
    if (!user) {
      toast.info("Sign in to use this feature");
      navigate("/auth");
      return true;
    }
    return false;
  };

  const isSavedAnywhere = collections?.some((c: any) =>
    c.collection_items?.some((i: any) => i.listing_id === listingId)
  );

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = { title: "Check this out!", url: shareUrl };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) {
        if ((err as Error).name !== "AbortError") {
          try { await navigator.clipboard.writeText(shareUrl); sonnerToast.success("Link copied!"); } catch { sonnerToast.error("Could not copy link"); }
        }
      }
    } else {
      try { await navigator.clipboard.writeText(shareUrl); sonnerToast.success("Link copied!"); } catch { sonnerToast.error("Could not copy link"); }
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Save to collection */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isSavedAnywhere ? "default" : "outline"}
            size="sm"
            className="gap-1.5 h-8 px-2.5 text-xs"
            onClick={(e) => { if (requireAuth()) e.preventDefault(); }}
          >
            <Heart className={`h-3.5 w-3.5 ${isSavedAnywhere ? "fill-current" : ""}`} />
            {isSavedAnywhere ? "Saved" : "Save"}
          </Button>
        </DropdownMenuTrigger>
        {user && (
          <DropdownMenuContent align="end" className="w-56">
            {collections?.map((col: any) => {
              const saved = col.collection_items?.some((i: any) => i.listing_id === listingId);
              return (
                <DropdownMenuItem key={col.id} onClick={() => toggleSave.mutate(col.id)} className="gap-2">
                  {saved ? <Check className="h-4 w-4 text-primary" /> : <div className="h-4 w-4" />}
                  {col.name}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> New Collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        )}
      </DropdownMenu>

      {/* Share */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 px-2.5 text-xs"
        onClick={handleShare}
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </Button>

      {/* Been here */}
      <Button
        variant={beenHere ? "default" : "outline"}
        size="sm"
        className="gap-1.5 h-8 px-2.5 text-xs"
        onClick={() => { if (!requireAuth()) toggleBeenHere.mutate(); }}
      >
        <MapPinCheck className={`h-3.5 w-3.5 ${beenHere ? "fill-current" : ""}`} />
        {beenHere ? "Been Here" : "Been Here?"}
      </Button>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Collection & Save</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createAndSave.mutate(newName); }} className="space-y-4">
            <Input placeholder="Collection name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={createAndSave.isPending}>Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListingActions;
