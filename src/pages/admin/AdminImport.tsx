import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getCSVHeadersForCategory, isRestaurantCategory, isShoppingCategory, isAccommodationCategory, RESTAURANT_ONLY_FIELDS, SHOPPING_ONLY_FIELDS, ACCOMMODATION_ONLY_FIELDS } from "@/lib/categoryFields";

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const normalizedText = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText[i];
    const nextChar = normalizedText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentValue.trim());
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      currentRow.push(currentValue.trim());
      if (currentRow.some((value) => value.length > 0)) rows.push(currentRow);
      currentRow = [];
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  currentRow.push(currentValue.trim());
  if (currentRow.some((value) => value.length > 0)) rows.push(currentRow);
  if (rows.length === 0) return { headers: [], rows: [] };

  const headers = rows[0].map((header) => header.toLowerCase().replace(/["\s]/g, "").replace(/ /g, "_"));
  const dataRows = rows.slice(1).map((values) => {
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });

  return { headers, rows: dataRows };
}

const restaurantFieldSet = new Set<string>(RESTAURANT_ONLY_FIELDS);
const shoppingFieldSet = new Set<string>(SHOPPING_ONLY_FIELDS);
const accommodationFieldSet = new Set<string>(ACCOMMODATION_ONLY_FIELDS);

const AdminImport = () => {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [fileName, setFileName] = useState("");
  const [importResult, setImportResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const { data: categories } = useQuery({
    queryKey: ["admin-categories-for-import"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, title").order("sort_order");
      return data ?? [];
    },
  });

  const { data: subcategories } = useQuery({
    queryKey: ["admin-subcategories-for-import"],
    queryFn: async () => {
      const { data } = await supabase.from("subcategories").select("id, title, category_id").order("sort_order");
      return data ?? [];
    },
  });

  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);
  const selectedCategoryTitle = selectedCategory?.title ?? null;
  const csvHeaders = getCSVHeadersForCategory(selectedCategoryTitle);
  const isRestaurant = selectedCategoryTitle ? isRestaurantCategory(selectedCategoryTitle) : false;
  const isShopping = selectedCategoryTitle ? isShoppingCategory(selectedCategoryTitle) : false;
  const isAccommodation = selectedCategoryTitle ? isAccommodationCategory(selectedCategoryTitle) : false;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedCategoryId) {
      toast.error("Please select a category first");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setFileName(file.name);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseCSV(text);
      if (result.rows.length === 0) {
        toast.error("CSV file is empty or has no data rows");
        return;
      }
      if (!result.headers.includes("title")) {
        toast.error("CSV must have a 'title' column");
        return;
      }
      // Warn if restaurant columns found in non-restaurant import
      if (!isRestaurant) {
        const extraCols = result.headers.filter((h) => restaurantFieldSet.has(h));
        if (extraCols.length > 0) {
          toast.warning(`Restaurant-only columns found and will be ignored: ${extraCols.join(", ")}`);
        }
      }
      // Warn if shopping columns found in non-shopping import
      if (!isShopping) {
        const extraCols = result.headers.filter((h) => shoppingFieldSet.has(h));
        if (extraCols.length > 0) {
          toast.warning(`Shopping-only columns found and will be ignored: ${extraCols.join(", ")}`);
        }
      }
      if (!isAccommodation) {
        const extraCols = result.headers.filter((h) => accommodationFieldSet.has(h));
        if (extraCols.length > 0) {
          toast.warning(`Accommodation-only columns found and will be ignored: ${extraCols.join(", ")}`);
        }
      }
      setParsed(result);
    };
    reader.readAsText(file);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!parsed || !categories || !selectedCategoryId) throw new Error("No data or category selected");

      const catMap = new Map(categories.map((c) => [c.title.toLowerCase(), c.id]));
      const subMap = new Map((subcategories ?? []).map((s) => [
        `${s.category_id}::${s.title.toLowerCase()}`, s.id
      ]));

      const results = { created: 0, updated: 0, errors: [] as string[] };

      // Only match against listings in this category
      const { data: catJunctions } = await supabase
        .from("listing_categories")
        .select("listing_id")
        .eq("category_id", selectedCategoryId);
      const categoryListingIds = new Set((catJunctions ?? []).map((j) => j.listing_id));

      const { data: existing } = await supabase.from("listings").select("id, title");
      const existingInCategory = (existing ?? []).filter((l) => categoryListingIds.has(l.id));
      const existingMap = new Map(existingInCategory.map((l) => [l.title.toLowerCase(), l.id]));

      for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i];
        const title = row.title?.trim();
        if (!title) {
          results.errors.push(`Row ${i + 2}: Missing title, skipped`);
          continue;
        }

        // Resolve additional categories from CSV (pipe-separated), always include selected category
        const catField = row.categories?.trim() || "";
        const catNames = catField ? catField.split("|").map((s) => s.trim()).filter(Boolean) : [];
        const resolvedCatIds: string[] = [selectedCategoryId];

        for (const catName of catNames) {
          let catId = catMap.get(catName.toLowerCase()) ?? null;
          if (catId && catId !== selectedCategoryId) {
            resolvedCatIds.push(catId);
          } else if (!catId) {
            const { data: newCat, error: catErr } = await supabase
              .from("categories").insert({ title: catName }).select("id").single();
            if (!catErr && newCat) {
              catMap.set(catName.toLowerCase(), newCat.id);
              resolvedCatIds.push(newCat.id);
            }
          }
        }

        // Resolve subcategories
        const subNames = row.subcategories ? row.subcategories.split("|").map((s) => s.trim()).filter(Boolean) : [];
        const resolvedSubIds: string[] = [];
        for (const subName of subNames) {
          let found = false;
          for (const cId of resolvedCatIds) {
            const key = `${cId}::${subName.toLowerCase()}`;
            const subId = subMap.get(key);
            if (subId) { resolvedSubIds.push(subId); found = true; break; }
          }
          if (!found) {
            const { data: newSub, error: subErr } = await supabase
              .from("subcategories").insert({ title: subName, category_id: resolvedCatIds[0] }).select("id").single();
            if (!subErr && newSub) {
              resolvedSubIds.push(newSub.id);
              subMap.set(`${resolvedCatIds[0]}::${subName.toLowerCase()}`, newSub.id);
            }
          }
        }

        const parseBool = (val: string | undefined) => {
          if (!val || val === "") return null;
          return val.toLowerCase() === "true" || val === "1";
        };

        const parseArray = (val: string | undefined): string[] | null => {
          if (!val || val === "") return null;
          return val.split("|").map(s => s.trim()).filter(Boolean);
        };

        let openingHours = null;
        if (row.opening_hours) {
          try { openingHours = JSON.parse(row.opening_hours); } catch { openingHours = null; }
        }

        let galleryImages: string[] | null = null;
        if (row.gallery_images) {
          try { galleryImages = JSON.parse(row.gallery_images); } catch {
            galleryImages = row.gallery_images.split("|").map(s => s.trim()).filter(Boolean);
          }
        }

        const payload: Record<string, any> = {
          title,
          description: row.description || null,
          image_url: row.image_url || null,
          location: row.location || null,
          phone: row.phone || null,
          email: row.email || null,
          website: row.website || null,
          whatsapp: row.whatsapp || null,
          google_maps_link: row.google_maps_link || null,
          google_rating: row.google_rating ? parseFloat(row.google_rating) || null : null,
          google_reviews_count: row.google_reviews_count ? parseInt(row.google_reviews_count, 10) || null : null,
          google_reviews_url: row.google_reviews_url || null,
          category_id: resolvedCatIds[0] || null,
          is_featured: row.is_featured?.toLowerCase() === "true" || row.is_featured === "1",
          long_description: row.long_description || null,
          gallery_images: galleryImages,
          opening_hours: openingHours,
        };

        // Only include restaurant fields if importing for a restaurant category
        if (isRestaurant) {
          payload.good_for_kids = parseBool(row.good_for_kids);
          payload.pets_allowed = parseBool(row.pets_allowed);
          payload.wheelchair_friendly = parseBool(row.wheelchair_friendly);
          payload.price_level = row.price_level ? parseInt(row.price_level, 10) || null : null;
          payload.show_attributes = row.show_attributes?.toLowerCase() === "true" || row.show_attributes === "1";
          payload.meal = parseArray(row.meal) ?? [];
          payload.vibe = parseArray(row.vibe) ?? [];
          payload.cuisine = parseArray(row.cuisine) ?? [];
          payload.seating = parseArray(row.seating) ?? [];
          payload.kids_playground = parseBool(row.kids_playground);
          payload.smoking_allowed = parseBool(row.smoking_allowed);
          payload.service_type = parseArray(row.service_type) ?? [];
          payload.kids_menu = parseBool(row.kids_menu);
          payload.high_chairs = parseBool(row.high_chairs);
          payload.wheelchair_car_park = parseBool(row.wheelchair_car_park);
          payload.wheelchair_entrance = parseBool(row.wheelchair_entrance);
          payload.wheelchair_seating = parseBool(row.wheelchair_seating);
          payload.wheelchair_toilet = parseBool(row.wheelchair_toilet);
          payload.has_toilet = parseBool(row.has_toilet);
          payload.has_wifi = parseBool(row.has_wifi);
          payload.has_free_wifi = parseBool(row.has_free_wifi);
        }

        // Only include shopping fields if importing for a shopping category
        if (isShopping) {
          payload.air_conditioned = parseBool(row.air_conditioned);
          payload.payment_methods = parseArray(row.payment_methods) ?? [];
          payload.delivery_available = parseBool(row.delivery_available);
          payload.click_and_collect = parseBool(row.click_and_collect);
          payload.order_online = parseBool(row.order_online);
          payload.parking_available = parseBool(row.parking_available);
          payload.wheelchair_friendly = parseBool(row.wheelchair_friendly);
          payload.local_products = parseBool(row.local_products);
          payload.shop_type = row.shop_type || null;
          payload.curio_or_gifts = parseBool(row.curio_or_gifts);
          payload.product_categories = parseArray(row.product_categories) ?? [];
          payload.price_range = row.price_range || null;
        }

        // Only include accommodation fields if importing for an accommodation category
        if (isAccommodation) {
          payload.pets_allowed = parseBool(row.pets_allowed);
          payload.amenities = parseArray(row.amenities) ?? [];
          payload.sleeps = row.sleeps ? parseInt(row.sleeps, 10) || null : null;
          payload.price_range = row.price_range || null;
          payload.km_from_town = row.km_from_town || null;
        }

        const existingId = existingMap.get(title.toLowerCase());
        let listingId: string | null = null;

        if (existingId) {
          const { error } = await supabase.from("listings").update(payload as any).eq("id", existingId);
          if (error) results.errors.push(`Row ${i + 2}: Update failed - ${error.message}`);
          else { results.updated++; listingId = existingId; }
        } else {
          const { data: inserted, error } = await supabase.from("listings").insert(payload as any).select("id").single();
          if (error) results.errors.push(`Row ${i + 2}: Insert failed - ${error.message}`);
          else { results.created++; listingId = inserted?.id ?? null; }
        }

        if (listingId) {
          await supabase.from("listing_categories").delete().eq("listing_id", listingId);
          if (resolvedCatIds.length > 0) {
            const catRows = resolvedCatIds.map((catId) => ({ listing_id: listingId!, category_id: catId }));
            await supabase.from("listing_categories").insert(catRows);
          }

          await supabase.from("listing_subcategories").delete().eq("listing_id", listingId);
          if (resolvedSubIds.length > 0) {
            const junctionRows = resolvedSubIds.map((subId) => ({ listing_id: listingId!, subcategory_id: subId }));
            await supabase.from("listing_subcategories").insert(junctionRows);
          }
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setImportResult(results);
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success(`Import complete: ${results.created} created, ${results.updated} updated`);
    },
    onError: (e) => toast.error(e.message),
  });

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    if (!selectedCategoryId) {
      toast.error("Please select a category first");
      return;
    }
    const headers = csvHeaders;
    const csv = headers.join(",") + "\n";
    const safeName = (selectedCategoryTitle ?? "listings").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    downloadCSV(csv, `${safeName}_template.csv`);
    toast.success("Template downloaded");
  };

  const downloadListings = async () => {
    if (!selectedCategoryId) {
      toast.error("Please select a category first");
      return;
    }

    // Get listings in selected category
    const { data: catJunctions } = await supabase
      .from("listing_categories").select("listing_id").eq("category_id", selectedCategoryId);
    const listingIds = (catJunctions ?? []).map((j) => j.listing_id);
    if (listingIds.length === 0) {
      toast.error("No listings in this category");
      return;
    }

    const { data: listings } = await supabase.from("listings").select("*").in("id", listingIds);
    if (!listings?.length) { toast.error("No listings to export"); return; }

    // Fetch junctions
    const { data: allCatJunction } = await supabase.from("listing_categories").select("listing_id, category_id");
    const catNameMap = new Map((categories ?? []).map((c) => [c.id, c.title]));
    const listingCatMap = new Map<string, string[]>();
    (allCatJunction ?? []).forEach((j) => {
      const name = catNameMap.get(j.category_id);
      if (name) {
        const arr = listingCatMap.get(j.listing_id) ?? [];
        arr.push(name);
        listingCatMap.set(j.listing_id, arr);
      }
    });

    const { data: subJunction } = await supabase.from("listing_subcategories").select("listing_id, subcategory_id");
    const subNameMap = new Map((subcategories ?? []).map((s) => [s.id, s.title]));
    const listingSubMap = new Map<string, string[]>();
    (subJunction ?? []).forEach((j) => {
      const name = subNameMap.get(j.subcategory_id);
      if (name) {
        const arr = listingSubMap.get(j.listing_id) ?? [];
        arr.push(name);
        listingSubMap.set(j.listing_id, arr);
      }
    });

    const headers = csvHeaders;
    const escapeCSV = (val: string) => val.includes(",") || val.includes('"') || val.includes("\n") ? `"${val.replace(/"/g, '""')}"` : val;

    const rows = listings.map((l: any) => {
      const fieldMap: Record<string, string> = {
        title: l.title ?? "",
        description: l.description ?? "",
        image_url: l.image_url ?? "",
        location: l.location ?? "",
        phone: l.phone ?? "",
        email: l.email ?? "",
        website: l.website ?? "",
        whatsapp: l.whatsapp ?? "",
        google_maps_link: l.google_maps_link ?? "",
        google_rating: l.google_rating == null ? "" : String(l.google_rating),
        google_reviews_count: l.google_reviews_count == null ? "" : String(l.google_reviews_count),
        google_reviews_url: l.google_reviews_url ?? "",
        categories: (listingCatMap.get(l.id) ?? []).join("|"),
        subcategories: (listingSubMap.get(l.id) ?? []).join("|"),
        is_featured: String(l.is_featured),
        long_description: l.long_description ?? "",
        gallery_images: l.gallery_images ? JSON.stringify(l.gallery_images) : "",
        opening_hours: l.opening_hours ? JSON.stringify(l.opening_hours) : "",
        // Restaurant fields
        good_for_kids: l.good_for_kids == null ? "" : String(l.good_for_kids),
        pets_allowed: l.pets_allowed == null ? "" : String(l.pets_allowed),
        wheelchair_friendly: l.wheelchair_friendly == null ? "" : String(l.wheelchair_friendly),
        price_level: l.price_level == null ? "" : String(l.price_level),
        show_attributes: String(l.show_attributes ?? false),
        meal: (l.meal ?? []).join("|"),
        vibe: (l.vibe ?? []).join("|"),
        cuisine: (l.cuisine ?? []).join("|"),
        seating: (l.seating ?? []).join("|"),
        kids_playground: l.kids_playground == null ? "" : String(l.kids_playground),
        smoking_allowed: l.smoking_allowed == null ? "" : String(l.smoking_allowed),
        service_type: (l.service_type ?? []).join("|"),
        kids_menu: l.kids_menu == null ? "" : String(l.kids_menu),
        high_chairs: l.high_chairs == null ? "" : String(l.high_chairs),
        wheelchair_car_park: l.wheelchair_car_park == null ? "" : String(l.wheelchair_car_park),
        wheelchair_entrance: l.wheelchair_entrance == null ? "" : String(l.wheelchair_entrance),
        wheelchair_seating: l.wheelchair_seating == null ? "" : String(l.wheelchair_seating),
        wheelchair_toilet: l.wheelchair_toilet == null ? "" : String(l.wheelchair_toilet),
        has_toilet: l.has_toilet == null ? "" : String(l.has_toilet),
        has_wifi: l.has_wifi == null ? "" : String(l.has_wifi),
        has_free_wifi: l.has_free_wifi == null ? "" : String(l.has_free_wifi),
        // Shopping fields
        air_conditioned: l.air_conditioned == null ? "" : String(l.air_conditioned),
        payment_methods: (l.payment_methods ?? []).join("|"),
        delivery_available: l.delivery_available == null ? "" : String(l.delivery_available),
        click_and_collect: l.click_and_collect == null ? "" : String(l.click_and_collect),
        order_online: l.order_online == null ? "" : String(l.order_online),
        parking_available: l.parking_available == null ? "" : String(l.parking_available),
        local_products: l.local_products == null ? "" : String(l.local_products),
        shop_type: l.shop_type ?? "",
        curio_or_gifts: l.curio_or_gifts == null ? "" : String(l.curio_or_gifts),
        product_categories: (l.product_categories ?? []).join("|"),
        price_range: l.price_range ?? "",
        // Accommodation fields
        amenities: (l.amenities ?? []).join("|"),
        sleeps: l.sleeps == null ? "" : String(l.sleeps),
        km_from_town: l.km_from_town ?? "",
      };

      return headers.map((h) => escapeCSV(fieldMap[h] ?? "")).join(",");
    });

    const safeName = (selectedCategoryTitle ?? "listings").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    downloadCSV(headers.join(",") + "\n" + rows.join("\n") + "\n", `${safeName}_export.csv`);
    toast.success(`Exported ${listings.length} listings`);
  };

  const resetUpload = () => {
    setParsed(null);
    setFileName("");
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 className="font-heading text-3xl font-bold text-foreground">Import / Export Listings</h1>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-6">
        {/* Category selector */}
        <div className="max-w-sm">
          <Label className="mb-2 block">Select Category</Label>
          <Select value={selectedCategoryId} onValueChange={(v) => { setSelectedCategoryId(v); resetUpload(); }}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a category..." />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCategoryId && (
            <p className="text-xs text-muted-foreground mt-2">
              {isRestaurant
                ? "This export/import will include universal + restaurant-specific fields."
                : isShopping
                ? "This export/import will include universal + shopping-specific fields."
                : isAccommodation
                ? "This export/import will include universal + accommodation-specific fields."
                : "This export/import will include universal fields only."}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {selectedCategoryId && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={downloadListings} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Export {selectedCategoryTitle} Listings
            </Button>
            <Button variant="outline" onClick={downloadTemplate} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Download Template
            </Button>
          </div>
        )}

        {/* Upload area */}
        {selectedCategoryId && (
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 sm:p-12 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium">{fileName || "Click to upload CSV file"}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Expected columns: {csvHeaders.join(", ")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Matching listings by title will be updated, new ones created. No deletions.
            </p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>
        )}

        {/* Preview */}
        {parsed && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{parsed.rows.length}</strong> rows found for <strong className="text-foreground">{selectedCategoryTitle}</strong>.
              </p>
              <Button onClick={() => importMutation.mutate()} disabled={importMutation.isPending} className="gap-2">
                {importMutation.isPending ? "Importing..." : "Import All"}
              </Button>
            </div>

            <div className="overflow-x-auto max-h-80 overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left text-muted-foreground font-medium">#</th>
                    {parsed.headers.map((h) => (
                      <th key={h} className={`p-2 text-left font-medium whitespace-nowrap ${(restaurantFieldSet.has(h) && !isRestaurant) || (shoppingFieldSet.has(h) && !isShopping) || (accommodationFieldSet.has(h) && !isAccommodation) ? "text-muted-foreground/40 line-through" : "text-muted-foreground"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      {parsed.headers.map((h) => (
                        <td key={h} className={`p-2 max-w-[200px] truncate ${(restaurantFieldSet.has(h) && !isRestaurant) || (shoppingFieldSet.has(h) && !isShopping) || (accommodationFieldSet.has(h) && !isAccommodation) ? "text-muted-foreground/40" : "text-foreground"}`}>{row[h] || "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsed.rows.length > 50 && (
              <p className="text-xs text-muted-foreground">Showing first 50 of {parsed.rows.length} rows</p>
            )}
          </div>
        )}

        {/* Results */}
        {importResult && (
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-foreground"><strong>{importResult.created}</strong> created</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-foreground"><strong>{importResult.updated}</strong> updated</span>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-1">
                <p className="text-sm font-medium text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> {importResult.errors.length} warning(s)
                </p>
                {importResult.errors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive/80">{err}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminImport;
