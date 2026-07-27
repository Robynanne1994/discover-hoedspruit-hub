import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  getCSVHeadersForCategory, isRestaurantCategory, isShoppingCategory, isAccommodationCategory,
  isNGOCategory, isTradesCategory, isHomeGardenCategory, isWeddingsEventsCategory,
  UNIVERSAL_FIELDS, RESTAURANT_ONLY_FIELDS, SHOPPING_ONLY_FIELDS, ACCOMMODATION_ONLY_FIELDS,
  NGO_ONLY_FIELDS, TRADES_ONLY_FIELDS, HOME_GARDEN_ONLY_FIELDS, WEDDINGS_EVENTS_ONLY_FIELDS,
  LISTING_FIELD_SPECS, getCategorySpecificFields, getUniversalDbFields, type FieldType,
} from "@/lib/categoryFields";
import { buildReferenceRow } from "@/lib/listingFieldOptions";

const ALL_CATEGORIES_VALUE = "__all__";
type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
type ListingPayload = Database["public"]["Tables"]["listings"]["Insert"];

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
  const dataRows = rows.slice(1)
    .map((values) => {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        const v = values[index] ?? "";
        row[header] = v.trim() === "-" ? "" : v;
      });
      return row;
    })
    // Skip the reference/template row (title cell begins with "#"). Lets exports
    // ship an inline "options & format" cheat-sheet without breaking imports.
    .filter((row) => !(row.title ?? "").trim().startsWith("#"));

  return { headers, rows: dataRows };
}

const restaurantFieldSet = new Set<string>(RESTAURANT_ONLY_FIELDS);
const shoppingFieldSet = new Set<string>(SHOPPING_ONLY_FIELDS);
const accommodationFieldSet = new Set<string>(ACCOMMODATION_ONLY_FIELDS);
const ngoFieldSet = new Set<string>(NGO_ONLY_FIELDS);
const tradesFieldSet = new Set<string>(TRADES_ONLY_FIELDS);
const homeGardenFieldSet = new Set<string>(HOME_GARDEN_ONLY_FIELDS);
const weddingsEventsFieldSet = new Set<string>(WEDDINGS_EVENTS_ONLY_FIELDS);

// ---- Schema-driven CSV (de)serialization ----

function serializeField(value: unknown, type: FieldType): string {
  if (value === null || value === undefined) return "";
  switch (type) {
    case "str": return String(value);
    case "int":
    case "float": return String(value);
    case "bool": return String(value);
    case "bool_default_false": return String(Boolean(value));
    case "str_array": return Array.isArray(value) ? (value as unknown[]).map(String).join("|") : "";
    case "json": {
      if (typeof value === "object") {
        try { return JSON.stringify(value); } catch { return ""; }
      }
      return String(value);
    }
  }
}

// Parse a CSV cell to a DB value. Returns:
//   - { skip: true } when the cell is empty AND we're updating (preserve existing value)
//   - { value: parsed } otherwise (parsed may be null for blank-on-create or "-")
function parseField(raw: string | undefined, type: FieldType, isUpdate: boolean):
  { skip: true } | { skip: false; value: unknown } {
  const cell = typeof raw === "string" ? raw : "";
  const trimmed = cell.trim();
  // Empty cell on update → preserve existing value
  if (trimmed === "" && isUpdate) return { skip: true };
  // Empty cell on create → null (or default for bool_default_false)
  // "-" explicitly clears to null
  if (trimmed === "" || trimmed === "-") {
    switch (type) {
      case "bool_default_false": return { skip: false, value: false };
      case "str_array": return { skip: false, value: [] };
      default: return { skip: false, value: null };
    }
  }
  switch (type) {
    case "str": return { skip: false, value: cell };
    case "int": {
      const n = parseInt(cell, 10);
      return { skip: false, value: Number.isFinite(n) ? n : null };
    }
    case "float": {
      const n = parseFloat(cell);
      return { skip: false, value: Number.isFinite(n) ? n : null };
    }
    case "bool": {
      const v = trimmed.toLowerCase();
      if (v === "true" || v === "1") return { skip: false, value: true };
      if (v === "false" || v === "0") return { skip: false, value: false };
      return { skip: false, value: null };
    }
    case "bool_default_false": {
      const v = trimmed.toLowerCase();
      return { skip: false, value: v === "true" || v === "1" };
    }
    case "str_array": {
      const NORMALIZE: Record<string, string> = { "sit down": "Sit Down", "take away": "Takeaway", "takeaway": "Takeaway", "take-away": "Takeaway" };
      const parts = cell.split("|").map((s) => s.trim()).filter(Boolean).map((s) => NORMALIZE[s.toLowerCase()] ?? s);
      return { skip: false, value: parts };
    }
    case "json": {
      try { return { skip: false, value: JSON.parse(cell) }; }
      catch { return { skip: false, value: null }; }
    }
  }
}

const AdminImport = () => {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [fileName, setFileName] = useState("");
  const [importResult, setImportResult] = useState<{ created: number; updated: number; deleted: number; removed_from_category: number; errors: string[] } | null>(null);
  const [importStatus, setImportStatus] = useState("");
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

  const isAllCategories = selectedCategoryId === ALL_CATEGORIES_VALUE;
  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);
  const selectedCategoryTitle = isAllCategories ? null : (selectedCategory?.title ?? null);
  const csvHeaders = isAllCategories ? [...UNIVERSAL_FIELDS] : getCSVHeadersForCategory(selectedCategoryTitle);
  const isRestaurant = selectedCategoryTitle ? isRestaurantCategory(selectedCategoryTitle) : false;
  const isShopping = selectedCategoryTitle ? isShoppingCategory(selectedCategoryTitle) : false;
  const isAccommodation = selectedCategoryTitle ? isAccommodationCategory(selectedCategoryTitle) : false;
  const isNGO = selectedCategoryTitle ? isNGOCategory(selectedCategoryTitle) : false;
  const isTrades = selectedCategoryTitle ? isTradesCategory(selectedCategoryTitle) : false;
  const isHomeGarden = selectedCategoryTitle ? isHomeGardenCategory(selectedCategoryTitle) : false;
  const isWeddingsEvents = selectedCategoryTitle ? isWeddingsEventsCategory(selectedCategoryTitle) : false;

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
      if (!isAllCategories) {
        // Fields valid for the selected category (some fields are shared across
        // categories, e.g. price_range on both Shopping and Accommodation).
        const allowed = new Set<string>(csvHeaders);
        const warn = (label: string, set: Set<string>, active: boolean) => {
          if (active) return;
          const extras = result.headers.filter((h) => set.has(h) && !allowed.has(h));
          if (extras.length > 0) toast.warning(`${label}-only columns found and will be ignored: ${extras.join(", ")}`);
        };
        warn("Restaurant", restaurantFieldSet, isRestaurant);
        warn("Shopping", shoppingFieldSet, isShopping);
        warn("Accommodation", accommodationFieldSet, isAccommodation);
        warn("NGO", ngoFieldSet, isNGO);
        warn("Trades", tradesFieldSet, isTrades);
        warn("Home & Garden", homeGardenFieldSet, isHomeGarden);
        warn("Weddings & Events", weddingsEventsFieldSet, isWeddingsEvents);
      }

      setParsed(result);
    };
    reader.readAsText(file);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!parsed || !categories) throw new Error("No data");

      const catMap = new Map(categories.map((c) => [c.title.toLowerCase(), c.id]));
      const subMap = new Map((subcategories ?? []).map((s) => [
        `${s.category_id}::${s.title.toLowerCase()}`, s.id
      ]));

      const results = { created: 0, updated: 0, deleted: 0, removed_from_category: 0, errors: [] as string[] };
      const csvTitles = new Set<string>();

      // Paginated fetch helper to bypass Supabase's 1000-row default cap
      const fetchAllListings = async () => {
        const all: ListingRow[] = [];
        const pageSize = 1000;
        let from = 0;
        while (true) {
          const { data, error } = await supabase
            .from("listings")
            .select("*")
            .range(from, from + pageSize - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          all.push(...data);
          if (data.length < pageSize) break;
          from += pageSize;
        }
        return all;
      };

      const fetchAllCategoryJunctions = async (categoryId: string) => {
        const all: { listing_id: string }[] = [];
        const pageSize = 1000;
        let from = 0;
        while (true) {
          const { data, error } = await supabase
            .from("listing_categories")
            .select("listing_id")
            .eq("category_id", categoryId)
            .range(from, from + pageSize - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          all.push(...data);
          if (data.length < pageSize) break;
          from += pageSize;
        }
        return all;
      };

      // Build existing listings map
      let existingMap: Map<string, ListingRow>;
      if (isAllCategories) {
        const existing = await fetchAllListings();
        existingMap = new Map(existing.map((l) => [l.title.toLowerCase(), l]));
      } else {
        const catJunctions = await fetchAllCategoryJunctions(selectedCategoryId);
        const categoryListingIds = new Set(catJunctions.map((j) => j.listing_id));
        const existing = await fetchAllListings();
        const existingInCategory = existing.filter((l) => categoryListingIds.has(l.id));
        existingMap = new Map(existingInCategory.map((l) => [l.title.toLowerCase(), l]));
      }

      const chunkArray = <T,>(items: T[], size: number) => {
        const chunks: T[][] = [];
        for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
        return chunks;
      };

      const importItems: {
        rowNumber: number;
        listingId: string;
        payload: ListingPayload;
        resolvedCatIds: string[];
        resolvedSubIds: string[];
        isUpdate: boolean;
      }[] = [];

      // Detect duplicate titles in CSV (title-based matching is risky otherwise)
      const titleSeen = new Map<string, number>();
      for (const r of parsed.rows) {
        const t = (r.title || "").trim().toLowerCase();
        if (!t) continue;
        titleSeen.set(t, (titleSeen.get(t) || 0) + 1);
      }
      for (const [t, n] of titleSeen.entries()) {
        if (n > 1) results.errors.push(`Duplicate title in CSV: "${t}" appears ${n} times — only one row will win.`);
      }

      for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i];
        const title = row.title?.trim();
        if (!title) {
          results.errors.push(`Row ${i + 2}: Missing title, skipped`);
          continue;
        }
        csvTitles.add(title.toLowerCase());

        // Resolve categories from CSV (pipe-separated, case/whitespace insensitive)
        const catField = row.categories?.trim() || "";
        const catNames = catField ? catField.split("|").map((s) => s.trim()).filter(Boolean) : [];
        const resolvedCatIds: string[] = [];

        if (!isAllCategories) {
          resolvedCatIds.push(selectedCategoryId);
        }

        for (const catName of catNames) {
          const key = catName.toLowerCase();
          const catId = catMap.get(key) ?? null;
          if (catId) {
            if (!resolvedCatIds.includes(catId)) resolvedCatIds.push(catId);
          } else {
            const { data: newCat, error: catErr } = await supabase
              .from("categories").insert({ title: catName }).select("id").single();
            if (!catErr && newCat) {
              catMap.set(key, newCat.id);
              resolvedCatIds.push(newCat.id);
            } else {
              results.errors.push(`Row ${i + 2}: Could not match or create category "${catName}"`);
            }
          }
        }

        // Resolve subcategories. In category-scoped imports, only resolve under the selected category
        // (so we never touch another category's subcategory links).
        const subNames = row.subcategories ? row.subcategories.split("|").map((s) => s.trim()).filter(Boolean) : [];
        const resolvedSubIds: string[] = [];
        const subResolutionCatIds = isAllCategories ? resolvedCatIds : [selectedCategoryId];
        for (const subName of subNames) {
          let found = false;
          for (const cId of subResolutionCatIds) {
            const key = `${cId}::${subName.toLowerCase()}`;
            const subId = subMap.get(key);
            if (subId) { resolvedSubIds.push(subId); found = true; break; }
          }
          if (!found && subResolutionCatIds.length > 0) {
            const parentCatId = subResolutionCatIds[0];
            const { data: newSub, error: subErr } = await supabase
              .from("subcategories").insert({ title: subName, category_id: parentCatId }).select("id").single();
            if (!subErr && newSub) {
              resolvedSubIds.push(newSub.id);
              subMap.set(`${parentCatId}::${subName.toLowerCase()}`, newSub.id);
            } else {
              results.errors.push(`Row ${i + 2}: Could not match or create subcategory "${subName}"`);
            }
          }
        }

        // Images are managed exclusively via the Lovable editor — CSV image_url and
        // gallery_images cells are honored only when explicitly provided.

        const existing = existingMap.get(title.toLowerCase());
        const isUpdate = !!existing;
        const listingId = existing?.id ?? crypto.randomUUID();

        // Schema-driven payload build.
        // - Universal fields are always written.
        // - Category-specific fields are written only when the selected category owns them.
        // - On UPDATE, an empty CSV cell preserves the existing value (skip the key).
        //   A literal "-" explicitly clears to null.
        const payload: ListingPayload = { id: listingId, title };
        const payloadRecord = payload as Record<string, unknown>;

        // Always link the listing to the (primary) selected category via the legacy column,
        // unless we're in the "All Categories" universal mode.
        if (!isAllCategories) {
          payloadRecord.category_id = selectedCategoryId;
        } else if (resolvedCatIds[0]) {
          payloadRecord.category_id = resolvedCatIds[0];
        }

        const universalDbFields = getUniversalDbFields();
        const categoryFields = isAllCategories ? [] : getCategorySpecificFields(selectedCategoryTitle);
        const allFieldNames: string[] = [
          ...universalDbFields.filter((f) => f !== "title"),
          ...categoryFields,
        ];

        for (const fieldName of allFieldNames) {
          const spec = (LISTING_FIELD_SPECS as Record<string, { type: FieldType }>)[fieldName];
          if (!spec) continue;
          const parsed = parseField(row[fieldName], spec.type, isUpdate);
          if (parsed.skip === true) continue;
          if (parsed.skip === false) payloadRecord[fieldName] = parsed.value;
        }

        // Remove undefined keys (defensive)
        Object.keys(payloadRecord).forEach((k) => { if (payloadRecord[k] === undefined) delete payloadRecord[k]; });



        importItems.push({ rowNumber: i + 2, listingId, payload, resolvedCatIds, resolvedSubIds, isUpdate });
      }

      setImportStatus(`Saving ${importItems.length} listings in batches...`);
      for (const batch of chunkArray(importItems, 100)) {
        const { error } = await supabase.from("listings").upsert(batch.map((item) => item.payload), { onConflict: "id" });
        if (error) {
          for (const item of batch) {
            const { error: singleError } = await supabase.from("listings").upsert(item.payload, { onConflict: "id" });
            if (singleError) results.errors.push(`Row ${item.rowNumber}: Save failed - ${singleError.message}`);
            else if (item.isUpdate) results.updated++;
            else results.created++;
          }
        } else {
          results.updated += batch.filter((item) => item.isUpdate).length;
          results.created += batch.filter((item) => !item.isUpdate).length;
        }
      }

      const successfulItems = importItems.filter((item) => !results.errors.some((err) => err.startsWith(`Row ${item.rowNumber}: Save failed`)));
      const successfulIds = successfulItems.map((item) => item.listingId);

      // Build map of subcategoryId -> categoryId so we can scope subcategory sync
      const subParentMap = new Map<string, string>(
        (subcategories ?? []).map((s) => [s.id, s.category_id]),
      );

      // Per-listing junction sync.
      // - In "All Categories" mode we still do a full rewrite (explicit "rewrite everything" path).
      // - In category-scoped mode we ONLY touch the selected category's link and the
      //   subcategory links that belong to the selected category. This preserves a listing's
      //   memberships in other categories (e.g. importing Shopping CSV must not unlink
      //   "Woodlands Garden Centre" from "Home & Garden").
      setImportStatus(`Syncing categories for ${successfulItems.length} listings...`);
      for (let idx = 0; idx < successfulItems.length; idx++) {
        const item = successfulItems[idx];
        if (idx % 50 === 0) setImportStatus(`Syncing categories ${idx + 1}/${successfulItems.length}...`);

        if (isAllCategories) {
          // Full rewrite (legacy behavior, intentional for universal mode)
          const { error: catDelErr } = await supabase
            .from("listing_categories").delete().eq("listing_id", item.listingId);
          if (catDelErr) {
            results.errors.push(`Row ${item.rowNumber}: category cleanup failed - ${catDelErr.message}`);
            continue;
          }
          if (item.resolvedCatIds.length > 0) {
            const catRows = item.resolvedCatIds.map((catId) => ({ listing_id: item.listingId, category_id: catId }));
            const { error: catInsErr } = await supabase
              .from("listing_categories").upsert(catRows, { onConflict: "listing_id,category_id" });
            if (catInsErr) results.errors.push(`Row ${item.rowNumber}: category link failed - ${catInsErr.message}`);
          }
          const { error: subDelErr } = await supabase
            .from("listing_subcategories").delete().eq("listing_id", item.listingId);
          if (subDelErr) {
            results.errors.push(`Row ${item.rowNumber}: subcategory cleanup failed - ${subDelErr.message}`);
            continue;
          }
          if (item.resolvedSubIds.length > 0) {
            const subRows = item.resolvedSubIds.map((subId) => ({ listing_id: item.listingId, subcategory_id: subId }));
            const { error: subInsErr } = await supabase
              .from("listing_subcategories").upsert(subRows, { onConflict: "listing_id,subcategory_id" });
            if (subInsErr) results.errors.push(`Row ${item.rowNumber}: subcategory link failed - ${subInsErr.message}`);
          }
        } else {
          // Category-scoped mode: upsert links additively for the selected category +
          // any extras in the CSV's "categories" column. Never delete links for other categories.
          const catRows = item.resolvedCatIds.map((catId) => ({ listing_id: item.listingId, category_id: catId }));
          if (catRows.length > 0) {
            const { error: catInsErr } = await supabase
              .from("listing_categories").upsert(catRows, { onConflict: "listing_id,category_id" });
            if (catInsErr) results.errors.push(`Row ${item.rowNumber}: category link failed - ${catInsErr.message}`);
          }

          // Subcategories: delete only this listing's existing subcategory links that
          // belong to the selected category, then insert the resolved subs (which are
          // already scoped to the selected category — see resolution step above).
          const { data: existingSubLinks, error: subFetchErr } = await supabase
            .from("listing_subcategories").select("id, subcategory_id").eq("listing_id", item.listingId);
          if (subFetchErr) {
            results.errors.push(`Row ${item.rowNumber}: subcategory lookup failed - ${subFetchErr.message}`);
          } else {
            const subLinkIdsToDelete = (existingSubLinks ?? [])
              .filter((l) => subParentMap.get(l.subcategory_id) === selectedCategoryId)
              .map((l) => l.id);
            if (subLinkIdsToDelete.length > 0) {
              const { error: subDelErr } = await supabase
                .from("listing_subcategories").delete().in("id", subLinkIdsToDelete);
              if (subDelErr) results.errors.push(`Row ${item.rowNumber}: subcategory cleanup failed - ${subDelErr.message}`);
            }
            if (item.resolvedSubIds.length > 0) {
              const subRows = item.resolvedSubIds.map((subId) => ({ listing_id: item.listingId, subcategory_id: subId }));
              const { error: subInsErr } = await supabase
                .from("listing_subcategories").upsert(subRows, { onConflict: "listing_id,subcategory_id" });
              if (subInsErr) results.errors.push(`Row ${item.rowNumber}: subcategory link failed - ${subInsErr.message}`);
            }
          }
        }
      }

      // Handle listings present in the selected category but missing from the CSV.
      // - In "All Categories" mode: hard-delete (legacy behavior).
      // - In category-scoped mode: if the listing belongs to OTHER categories, just remove
      //   it from the selected category (and its subs under that category). Only hard-delete
      //   when the listing has no other category links.
      const missingItems = Array.from(existingMap.entries()).filter(([existingTitle]) => !csvTitles.has(existingTitle));
      const missingIds = missingItems.map(([, listing]) => listing.id);

      if (isAllCategories) {
        setImportStatus(`Removing ${missingIds.length} listings not in the CSV...`);
        for (const idBatch of chunkArray(missingIds, 200)) {
          await supabase.from("listing_categories").delete().in("listing_id", idBatch);
          await supabase.from("listing_subcategories").delete().in("listing_id", idBatch);
          const { error } = await supabase.from("listings").delete().in("id", idBatch);
          if (error) results.errors.push(`Delete failed: ${error.message}`);
          else results.deleted += idBatch.length;
        }
      } else if (missingIds.length > 0) {
        setImportStatus(`Processing ${missingIds.length} listings not in the CSV...`);
        // Fetch all category junctions for missing listings to decide per-listing action.
        const otherCatMap = new Map<string, string[]>(); // listingId -> other category ids
        for (const idBatch of chunkArray(missingIds, 200)) {
          const { data: links } = await supabase
            .from("listing_categories").select("listing_id, category_id").in("listing_id", idBatch);
          (links ?? []).forEach((l) => {
            if (l.category_id === selectedCategoryId) return;
            const arr = otherCatMap.get(l.listing_id) ?? [];
            arr.push(l.category_id);
            otherCatMap.set(l.listing_id, arr);
          });
        }

        const toHardDelete: string[] = [];
        const toUnlink: string[] = [];
        for (const id of missingIds) {
          if ((otherCatMap.get(id) ?? []).length > 0) toUnlink.push(id);
          else toHardDelete.push(id);
        }

        // Unlink from the selected category (and that category's subcategories) only
        for (const idBatch of chunkArray(toUnlink, 200)) {
          const { error: unlinkErr } = await supabase
            .from("listing_categories")
            .delete()
            .in("listing_id", idBatch)
            .eq("category_id", selectedCategoryId);
          if (unlinkErr) {
            results.errors.push(`Unlink failed: ${unlinkErr.message}`);
            continue;
          }
          // Remove that category's subs for these listings
          const subIdsForCat = (subcategories ?? [])
            .filter((s) => s.category_id === selectedCategoryId)
            .map((s) => s.id);
          if (subIdsForCat.length > 0) {
            await supabase
              .from("listing_subcategories")
              .delete()
              .in("listing_id", idBatch)
              .in("subcategory_id", subIdsForCat);
          }
          results.removed_from_category += idBatch.length;
        }

        // Hard-delete listings that have no other category memberships
        for (const idBatch of chunkArray(toHardDelete, 200)) {
          await supabase.from("listing_categories").delete().in("listing_id", idBatch);
          await supabase.from("listing_subcategories").delete().in("listing_id", idBatch);
          const { error } = await supabase.from("listings").delete().in("id", idBatch);
          if (error) results.errors.push(`Delete failed: ${error.message}`);
          else results.deleted += idBatch.length;
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setImportStatus("");
      setImportResult(results);
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success(`Import complete: ${results.created} created, ${results.updated} updated, ${results.removed_from_category} removed from category, ${results.deleted} deleted`);
    },
    onError: (e) => { setImportStatus(""); toast.error(e.message); },
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

  const escapeCSV = (val: string) => val.includes(",") || val.includes('"') || val.includes("\n") ? `"${val.replace(/"/g, '""')}"` : val;

  const downloadTemplate = () => {
    if (!selectedCategoryId) {
      toast.error("Please select a category first");
      return;
    }
    const headers = csvHeaders;
    const refRow = buildReferenceRow(headers).map(escapeCSV).join(",");
    const csv = headers.join(",") + "\n" + refRow + "\n";
    const safeName = isAllCategories ? "all_listings" : (selectedCategoryTitle ?? "listings").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    downloadCSV(csv, `${safeName}_template.csv`);
    toast.success("Template downloaded");
  };

  const downloadListings = async () => {
    if (!selectedCategoryId) {
      toast.error("Please select a category first");
      return;
    }

    let listings: ListingRow[] | null;

    if (isAllCategories) {
      const { data } = await supabase.from("listings").select("*");
      listings = data;
    } else {
      const { data: catJunctions } = await supabase
        .from("listing_categories").select("listing_id").eq("category_id", selectedCategoryId);
      const listingIds = (catJunctions ?? []).map((j) => j.listing_id);
      if (listingIds.length === 0) {
        toast.error("No listings in this category");
        return;
      }
      const { data } = await supabase.from("listings").select("*").in("id", listingIds);
      listings = data;
    }

    if (!listings?.length) { toast.error("No listings to export"); return; }

    // Fetch junctions for categories & subcategories
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

    const rows = listings.map((l) => {
      const fieldMap: Record<string, string> = {};
      const lr = l as unknown as Record<string, unknown>;

      // Virtual columns: categories / subcategories pipe-joined
      const fromJunction = listingCatMap.get(l.id) ?? [];
      if (fromJunction.length === 0 && l.category_id) {
        const legacy = catNameMap.get(l.category_id);
        fieldMap.categories = legacy ?? "";
      } else {
        fieldMap.categories = fromJunction.join("|");
      }
      fieldMap.subcategories = (listingSubMap.get(l.id) ?? []).join("|");

      // Schema-driven serialization for every other header
      for (const h of headers) {
        if (h === "categories" || h === "subcategories") continue;
        const spec = (LISTING_FIELD_SPECS as Record<string, { type: FieldType } | undefined>)[h];
        if (!spec) { fieldMap[h] = ""; continue; }
        fieldMap[h] = serializeField(lr[h], spec.type);
      }

      return headers.map((h) => escapeCSV(fieldMap[h] ?? "")).join(",");
    });

    // Prepend a reference row (skipped on re-import) listing valid options / format per field.
    const refRow = buildReferenceRow(headers).map(escapeCSV).join(",");

    const safeName = isAllCategories ? "all_listings" : (selectedCategoryTitle ?? "listings").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    downloadCSV(headers.join(",") + "\n" + refRow + "\n" + rows.join("\n") + "\n", `${safeName}_export.csv`);
    toast.success(`Exported ${listings.length} listings`);
  };

  const resetUpload = () => {
    setParsed(null);
    setFileName("");
    setImportResult(null);
    setImportStatus("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const displayLabel = isAllCategories ? "All Categories (Universal)" : selectedCategoryTitle;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-4">
        <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">Import / Export Listings</h1>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Category selector */}
        <div className="max-w-sm">
          <Label className="mb-2 block">Select Category</Label>
          <Select value={selectedCategoryId} onValueChange={(v) => { setSelectedCategoryId(v); resetUpload(); }}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a category..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES_VALUE}>All Categories (Universal Fields)</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCategoryId && (
            <p className="text-xs text-muted-foreground mt-2">
              {isAllCategories
                ? "Universal fields only across ALL listings. Category-specific fields are preserved during updates."
                : `Imports universal + ${selectedCategoryTitle}-specific fields. A listing's data and links in other categories are never touched.`}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {selectedCategoryId && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadListings} className="gap-2 opacity-100 bg-gray-400 text-slate-50 border-slate-950">
              <FileSpreadsheet className="h-4 w-4" /> Export {displayLabel} Listings
            </Button>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 opacity-100 bg-gray-400 text-slate-50 border-slate-950">
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
              {isAllCategories
                ? "Listings are matched by title. Missing listings will be deleted. Category-specific fields are preserved."
                : "Listings are matched by title (case-insensitive). Listings missing from the CSV are removed from this category only; they're fully deleted only if they don't belong to any other category."}
            </p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>
        )}

        {/* Preview */}
        {parsed && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{parsed.rows.length}</strong> rows found{!isAllCategories && <> for <strong className="text-foreground">{selectedCategoryTitle}</strong></>}.
              </p>
              <Button onClick={() => importMutation.mutate()} disabled={importMutation.isPending} className="gap-2">
                {importMutation.isPending ? "Importing..." : "Import All"}
              </Button>
            </div>
            {importMutation.isPending && importStatus && (
              <p className="text-xs text-muted-foreground">{importStatus}</p>
            )}

            <div className="overflow-x-auto max-h-80 overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left text-muted-foreground font-medium">#</th>
                    {parsed.headers.map((h) => {
                      const headerActive = isAllCategories || csvHeaders.includes(h);
                      return (
                        <th key={h} className={`p-2 text-left font-medium whitespace-nowrap ${headerActive ? "text-muted-foreground" : "text-muted-foreground/40 line-through"}`}>{h}</th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      {parsed.headers.map((h) => {
                        const headerActive = isAllCategories || csvHeaders.includes(h);
                        return (
                          <td key={h} className={`p-2 max-w-[200px] truncate ${headerActive ? "text-foreground" : "text-muted-foreground/40"}`}>{row[h] || "—"}</td>
                        );
                      })}
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
                <CheckCircle className="h-4 w-4 text-amber-600" />
                <span className="text-foreground"><strong>{importResult.removed_from_category}</strong> removed from category</span>
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
