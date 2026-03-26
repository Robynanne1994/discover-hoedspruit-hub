import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";

const EXPECTED_HEADERS = ["title", "description", "image_url", "location", "phone", "email", "website", "google_maps_link", "google_rating", "google_reviews_count", "google_reviews_url", "categories", "subcategories", "is_featured", "long_description", "gallery_images", "opening_hours", "good_for_kids", "pets_allowed", "wheelchair_friendly", "price_level", "show_attributes", "meal", "vibe", "cuisine", "seating", "kids_playground", "smoking_allowed", "service_type"];

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

const AdminImport = () => {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [fileName, setFileName] = useState("");
  const [importResult, setImportResult] = useState<{ created: number; updated: number; deleted: number; errors: string[] } | null>(null);

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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      setParsed(result);
    };
    reader.readAsText(file);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!parsed || !categories) throw new Error("No data");

      // Build mutable maps for categories and subcategories
      const catMap = new Map(categories.map((c) => [c.title.toLowerCase(), c.id]));
      const subMap = new Map((subcategories ?? []).map((s) => [
        `${s.category_id}::${s.title.toLowerCase()}`, s.id
      ]));

      const results = { created: 0, updated: 0, deleted: 0, errors: [] as string[] };

      const { data: existing } = await supabase.from("listings").select("id, title");
      const existingMap = new Map((existing ?? []).map((l) => [l.title.toLowerCase(), l.id]));
      const csvTitles = new Set<string>();

      for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i];
        const title = row.title?.trim();
        if (!title) {
          results.errors.push(`Row ${i + 2}: Missing title, skipped`);
          continue;
        }

        csvTitles.add(title.toLowerCase());

        // --- Resolve or create categories (pipe-separated) ---
        const catField = row.categories?.trim() || row.category?.trim() || "";
        const catNames = catField ? catField.split("|").map((s) => s.trim()).filter(Boolean) : [];
        const resolvedCatIds: string[] = [];

        for (const catName of catNames) {
          let catId = catMap.get(catName.toLowerCase()) ?? null;
          if (!catId) {
            const { data: newCat, error: catErr } = await supabase
              .from("categories")
              .insert({ title: catName })
              .select("id")
              .single();
            if (catErr || !newCat) {
              results.errors.push(`Row ${i + 2}: Failed to create category "${catName}"`);
            } else {
              catId = newCat.id;
              catMap.set(catName.toLowerCase(), newCat.id);
            }
          }
          if (catId) resolvedCatIds.push(catId);
        }

        // --- Resolve or create subcategories ---
        const subNames = row.subcategories
          ? row.subcategories.split("|").map((s) => s.trim()).filter(Boolean)
          : [];
        const resolvedSubIds: string[] = [];

        if (resolvedCatIds.length > 0 && subNames.length > 0) {
          for (const subName of subNames) {
            // Try matching against all resolved categories
            let found = false;
            for (const cId of resolvedCatIds) {
              const key = `${cId}::${subName.toLowerCase()}`;
              let subId = subMap.get(key) ?? null;
              if (subId) {
                resolvedSubIds.push(subId);
                found = true;
                break;
              }
            }
            if (!found) {
              // Create under the first category
              const { data: newSub, error: subErr } = await supabase
                .from("subcategories")
                .insert({ title: subName, category_id: resolvedCatIds[0] })
                .select("id")
                .single();
              if (subErr || !newSub) {
                results.errors.push(`Row ${i + 2}: Failed to create subcategory "${subName}"`);
              } else {
                resolvedSubIds.push(newSub.id);
                subMap.set(`${resolvedCatIds[0]}::${subName.toLowerCase()}`, newSub.id);
              }
            }
          }
        }

        const parseBool = (val: string | undefined) => {
          if (!val || val === "") return null;
          return val.toLowerCase() === "true" || val === "1";
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

        const parseArray = (val: string | undefined): string[] | null => {
          if (!val || val === "") return null;
          return val.split("|").map(s => s.trim()).filter(Boolean);
        };

        const payload = {
          title,
          description: row.description || null,
          image_url: row.image_url || null,
          location: row.location || null,
          phone: row.phone || null,
          email: row.email || null,
          website: row.website || null,
          google_maps_link: row.google_maps_link || null,
          google_rating: row.google_rating ? parseFloat(row.google_rating) || null : null,
          google_reviews_count: row.google_reviews_count ? parseInt(row.google_reviews_count, 10) || null : null,
          category_id: resolvedCatIds[0] || null,
          is_featured: row.is_featured?.toLowerCase() === "true" || row.is_featured === "1",
          long_description: row.long_description || null,
          gallery_images: galleryImages,
          opening_hours: openingHours,
          good_for_kids: parseBool(row.good_for_kids),
          pets_allowed: parseBool(row.pets_allowed),
          wheelchair_friendly: parseBool(row.wheelchair_friendly),
          price_level: row.price_level ? parseInt(row.price_level, 10) || null : null,
          show_attributes: row.show_attributes?.toLowerCase() === "true" || row.show_attributes === "1",
          meal: parseArray(row.meal) ?? [],
          vibe: parseArray(row.vibe) ?? [],
          cuisine: parseArray(row.cuisine) ?? [],
          seating: parseArray(row.seating) ?? [],
          kids_playground: parseBool(row.kids_playground),
          smoking_allowed: parseBool(row.smoking_allowed),
          service_type: parseArray(row.service_type) ?? [],
        };

        const existingId = existingMap.get(title.toLowerCase());
        let listingId: string | null = null;

        if (existingId) {
          const { error } = await supabase.from("listings").update(payload).eq("id", existingId);
          if (error) results.errors.push(`Row ${i + 2}: Update failed - ${error.message}`);
          else { results.updated++; listingId = existingId; }
        } else {
          const { data: inserted, error } = await supabase.from("listings").insert(payload).select("id").single();
          if (error) results.errors.push(`Row ${i + 2}: Insert failed - ${error.message}`);
          else { results.created++; listingId = inserted?.id ?? null; }
        }

        // --- Sync listing_categories junction ---
        if (listingId) {
          await supabase.from("listing_categories").delete().eq("listing_id", listingId);
          if (resolvedCatIds.length > 0) {
            const catRows = resolvedCatIds.map((catId) => ({ listing_id: listingId!, category_id: catId }));
            const { error: catJErr } = await supabase.from("listing_categories").insert(catRows);
            if (catJErr) results.errors.push(`Row ${i + 2}: Failed to assign categories`);
          }

          // Sync listing_subcategories
          await supabase.from("listing_subcategories").delete().eq("listing_id", listingId);
          if (resolvedSubIds.length > 0) {
            const junctionRows = resolvedSubIds.map((subId) => ({ listing_id: listingId!, subcategory_id: subId }));
            const { error: jErr } = await supabase.from("listing_subcategories").insert(junctionRows);
            if (jErr) results.errors.push(`Row ${i + 2}: Failed to assign subcategories`);
          }
        }
      }

      // Delete listings not present in the CSV
      for (const [existingTitle, existingId] of existingMap) {
        if (!csvTitles.has(existingTitle)) {
          const { error } = await supabase.from("listings").delete().eq("id", existingId);
          if (error) results.errors.push(`Delete failed for "${existingTitle}": ${error.message}`);
          else results.deleted++;
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setImportResult(results);
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["admin-subcategories"] });
      toast.success(`Import complete: ${results.created} created, ${results.updated} updated, ${results.deleted} deleted`);
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
    const csv = EXPECTED_HEADERS.join(",") + "\n" + 'Example Lodge,"A beautiful lodge in the bush",https://example.com/image.jpg,"Main Road, Hoedspruit",012-345-6789,info@example.com,https://example.com,Accommodation|Activities,Restaurant|Bar,false,"A longer description about the lodge","[""img1.jpg"",""img2.jpg""]","{""monday"":{""open"":""08:00"",""close"":""17:00""}}",true,false,true,2,true,Breakfast|Lunch,Casual|Scenic,Burgers|Grill,Indoor|Outdoor,true,false,Sit Down|Take Away\n';
    downloadCSV(csv, "listings_template.csv");
  };

  const downloadListings = async () => {
    const { data: listings } = await supabase.from("listings").select("id, title, description, image_url, location, phone, email, website, google_maps_link, google_rating, google_reviews_count, is_featured, long_description, gallery_images, opening_hours, good_for_kids, pets_allowed, wheelchair_friendly, price_level, show_attributes, meal, vibe, cuisine, seating, kids_playground, smoking_allowed, service_type");
    if (!listings?.length) { toast.error("No listings to export"); return; }

    // Fetch listing_categories junction
    const { data: catJunction } = await supabase.from("listing_categories").select("listing_id, category_id");
    const catMap = new Map((categories ?? []).map((c) => [c.id, c.title]));
    const listingCatMap = new Map<string, string[]>();
    (catJunction ?? []).forEach((j) => {
      const name = catMap.get(j.category_id);
      if (name) {
        const arr = listingCatMap.get(j.listing_id) ?? [];
        arr.push(name);
        listingCatMap.set(j.listing_id, arr);
      }
    });

    // Fetch listing_subcategories junction
    const { data: junctionData } = await supabase.from("listing_subcategories").select("listing_id, subcategory_id");
    const subMap = new Map((subcategories ?? []).map((s) => [s.id, s.title]));
    const listingSubMap = new Map<string, string[]>();
    (junctionData ?? []).forEach((j) => {
      const name = subMap.get(j.subcategory_id);
      if (name) {
        const arr = listingSubMap.get(j.listing_id) ?? [];
        arr.push(name);
        listingSubMap.set(j.listing_id, arr);
      }
    });

    const escapeCSV = (val: string) => val.includes(",") || val.includes('"') || val.includes("\n") ? `"${val.replace(/"/g, '""')}"` : val;
    const rows = listings.map((l) => [
      l.title, l.description ?? "", l.image_url ?? "", l.location ?? "",
      l.phone ?? "", l.email ?? "", l.website ?? "",
      l.google_maps_link ?? "",
      (l as any).google_rating === null ? "" : String((l as any).google_rating),
      (l as any).google_reviews_count === null ? "" : String((l as any).google_reviews_count),
      (listingCatMap.get(l.id) ?? []).join("|"),
      (listingSubMap.get(l.id) ?? []).join("|"),
      String(l.is_featured),
      l.long_description ?? "",
      l.gallery_images ? JSON.stringify(l.gallery_images) : "",
      l.opening_hours ? JSON.stringify(l.opening_hours) : "",
      l.good_for_kids === null ? "" : String(l.good_for_kids),
      l.pets_allowed === null ? "" : String(l.pets_allowed),
      l.wheelchair_friendly === null ? "" : String(l.wheelchair_friendly),
      l.price_level === null ? "" : String(l.price_level),
      String(l.show_attributes),
      (l.meal ?? []).join("|"),
      (l.vibe ?? []).join("|"),
      (l.cuisine ?? []).join("|"),
      (l.seating ?? []).join("|"),
      l.kids_playground === null ? "" : String(l.kids_playground),
      l.smoking_allowed === null ? "" : String(l.smoking_allowed),
      (l.service_type ?? []).join("|"),
    ].map(escapeCSV).join(","));
    downloadCSV(EXPECTED_HEADERS.join(",") + "\n" + rows.join("\n") + "\n", "listings_export.csv");
    toast.success(`Exported ${listings.length} listings`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Import Listings</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadListings} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Download Listings
          </Button>
          <Button variant="outline" onClick={downloadTemplate} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Download Template
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 space-y-6">
        {/* Upload area */}
        <div
          className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-foreground font-medium">{fileName || "Click to upload CSV file"}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Columns: {EXPECTED_HEADERS.join(", ")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Categories: use pipe-separated values for multiple (e.g. Accommodation|Activities). Subcategories: also pipe-separated. New categories & subcategories are auto-created.
          </p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </div>

        {/* Preview */}
        {parsed && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{parsed.rows.length}</strong> rows found. Matching listings by title will be updated, new ones created.
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
                      <th key={h} className="p-2 text-left text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      {parsed.headers.map((h) => (
                        <td key={h} className="p-2 text-foreground max-w-[200px] truncate">{row[h] || "—"}</td>
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
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-destructive" />
                <span className="text-foreground"><strong>{importResult.deleted}</strong> deleted</span>
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
