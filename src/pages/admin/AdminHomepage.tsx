import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Search, GripVertical, Pencil, Check } from "lucide-react";
import MyHoedspruitCardEditor from "@/components/admin/MyHoedspruitCardEditor";

const SECTIONS = [
  { key: "homepage-eat", label: "Eat in Hoedspruit", categorySearch: "%restaurant%" },
  { key: "homepage-stay", label: "Places to Stay", categorySearch: "%accommodation%" },
  { key: "homepage-shop", label: "Where to Shop", categorySearch: "%shop%" },
  { key: "homepage-do", label: "What to Do", categorySearch: "%activit%" },
];

interface Listing {
  id: string;
  title: string;
  image_url: string | null;
  location: string | null;
}

const SectionTitleEditor = ({ sectionKey, defaultLabel }: { sectionKey: string; defaultLabel: string }) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const titleKey = `${sectionKey}-title`;

  const { data: customTitle } = useQuery({
    queryKey: ["site-content", titleKey],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", titleKey)
        .maybeSingle();
      if (data?.content && typeof data.content === "string" && data.content.trim()) {
        return data.content;
      }
      return null;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      const { data: existing } = await supabase
        .from("site_content")
        .select("id")
        .eq("section", titleKey)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("site_content")
          .update({ content: newTitle as any })
          .eq("section", titleKey);
      } else {
        await supabase
          .from("site_content")
          .insert([{ section: titleKey, content: newTitle as any }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-content", titleKey] });
      // Also invalidate the frontend hook cache
      const shortKey = sectionKey.replace("homepage-", "");
      queryClient.invalidateQueries({ queryKey: [`homepage-${shortKey}-title`] });
      toast.success("Section title updated");
      setIsEditing(false);
    },
  });

  const displayTitle = customTitle || defaultLabel;

  const startEditing = () => {
    setEditValue(displayTitle);
    setIsEditing(true);
  };

  const saveTitle = () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === defaultLabel) {
      // Reset to default
      saveMutation.mutate(defaultLabel);
    } else {
      saveMutation.mutate(trimmed);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="text-lg font-bold h-9 w-64"
          onKeyDown={(e) => e.key === "Enter" && saveTitle()}
          autoFocus
        />
        <Button size="icon" variant="ghost" onClick={saveTitle} disabled={saveMutation.isPending}>
          <Check className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <h3 className="font-bold text-lg">{displayTitle}</h3>
      <Button size="icon" variant="ghost" onClick={startEditing} className="h-7 w-7">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

const SectionEditor = ({ sectionKey, label, categorySearch }: { sectionKey: string; label: string; categorySearch: string }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: curatedIds = [] } = useQuery({
    queryKey: ["site-content", sectionKey],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", sectionKey)
        .maybeSingle();
      if (data?.content && Array.isArray(data.content)) {
        return data.content as string[];
      }
      return [];
    },
  });

  const { data: curatedListings = [] } = useQuery({
    queryKey: ["curated-listings", sectionKey, curatedIds],
    queryFn: async () => {
      if (!curatedIds.length) return [];
      const { data } = await supabase
        .from("listings")
        .select("id, title, image_url, location")
        .in("id", curatedIds);
      const map = new Map((data || []).map((l) => [l.id, l]));
      return curatedIds.map((id) => map.get(id)).filter(Boolean) as Listing[];
    },
    enabled: curatedIds.length > 0,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["listing-search", sectionKey, search],
    queryFn: async () => {
      const { data: categories } = await supabase
        .from("categories")
        .select("id")
        .ilike("title", categorySearch)
        .limit(1);

      if (!categories?.length) return [];
      const categoryId = categories[0].id;

      const { data: linkedIds } = await supabase
        .from("listing_categories")
        .select("listing_id")
        .eq("category_id", categoryId);
      const ids = linkedIds?.map((l) => l.listing_id) || [];

      let query = supabase
        .from("listings")
        .select("id, title, image_url, location")
        .or(`category_id.eq.${categoryId}${ids.length ? `,id.in.(${ids.join(",")})` : ""}`);

      if (search.trim()) {
        query = query.ilike("title", `%${search.trim()}%`);
      }

      const { data } = await query.limit(20);
      return (data || []) as Listing[];
    },
    enabled: true,
  });

  const saveMutation = useMutation({
    mutationFn: async (newIds: string[]) => {
      const { data: existing } = await supabase
        .from("site_content")
        .select("id")
        .eq("section", sectionKey)
        .maybeSingle();

      const contentValue = JSON.parse(JSON.stringify(newIds));

      if (existing) {
        await supabase
          .from("site_content")
          .update({ content: contentValue })
          .eq("section", sectionKey);
      } else {
        await supabase
          .from("site_content")
          .insert([{ section: sectionKey, content: contentValue }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-content", sectionKey] });
      queryClient.invalidateQueries({ queryKey: ["curated-listings", sectionKey] });
      toast.success("Homepage updated");
    },
  });

  const addListing = (id: string) => {
    if (curatedIds.includes(id)) return;
    if (curatedIds.length >= 4) {
      toast.error("Maximum 4 listings per section");
      return;
    }
    saveMutation.mutate([...curatedIds, id]);
  };

  const removeListing = (id: string) => {
    saveMutation.mutate(curatedIds.filter((cid) => cid !== id));
  };

  const availableResults = searchResults.filter((l) => !curatedIds.includes(l.id));

  return (
    <div className="border border-border rounded-lg p-4 space-y-4">
      <SectionTitleEditor sectionKey={sectionKey} defaultLabel={label} />

      <div>
        <p className="text-sm text-muted-foreground mb-2">
          Selected ({curatedIds.length}/4) — {curatedIds.length === 0 ? "showing auto-picks" : "showing curated picks"}
        </p>
        <div className="space-y-2">
          {curatedListings.map((listing) => (
            <div key={listing.id} className="flex items-center gap-3 bg-muted rounded-lg p-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              {listing.image_url && (
                <img src={listing.image_url} alt="" className="w-10 h-10 rounded object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{listing.title}</p>
                <p className="text-xs text-muted-foreground truncate">{listing.location}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => removeListing(listing.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {curatedIds.length < 4 && (
        <div>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search listings to add..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {availableResults.map((listing) => (
              <button
                key={listing.id}
                onClick={() => addListing(listing.id)}
                className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-muted transition-colors"
              >
                {listing.image_url && (
                  <img src={listing.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{listing.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{listing.location}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {curatedIds.length > 0 && (
        <Button variant="outline" size="sm" onClick={() => saveMutation.mutate([])}>
          Clear all (use auto-picks)
        </Button>
      )}
    </div>
  );
};

const AdminHomepage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Homepage Sections</h1>
        <p className="text-muted-foreground">Choose which 4 listings appear in each homepage section. Leave empty to auto-pick.</p>
      </div>
      {SECTIONS.map((section) => (
        <SectionEditor key={section.key} sectionKey={section.key} label={section.label} categorySearch={section.categorySearch} />
      ))}
      
      <div>
        <h2 className="text-xl font-bold mt-8 mb-4">My Hoedspruit Page</h2>
        <p className="text-muted-foreground mb-4">Set background images and text colour for each card.</p>
        <MyHoedspruitCardEditor />
      </div>
    </div>
  );
};

export default AdminHomepage;
