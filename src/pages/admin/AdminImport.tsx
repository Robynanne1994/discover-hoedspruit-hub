import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  getCSVHeadersForCategory, isRestaurantCategory, isShoppingCategory, isAccommodationCategory,
  isNGOCategory, isTradesCategory, isHomeGardenCategory, isWeddingsEventsCategory,
  RESTAURANT_ONLY_FIELDS, SHOPPING_ONLY_FIELDS, ACCOMMODATION_ONLY_FIELDS,
  NGO_ONLY_FIELDS, TRADES_ONLY_FIELDS, HOME_GARDEN_ONLY_FIELDS, WEDDINGS_EVENTS_ONLY_FIELDS,
  LISTING_FIELD_SPECS, getCategorySpecificFields, getUniversalDbFields,
  getUniversalCSVHeaders, getUniversalContentFields, CATEGORY_CARD_LABEL_FIELD,
  CATEGORY_MEMBERSHIP_FIELD, CATEGORY_SUBCATEGORY_FIELD,
  type FieldType,
} from "@/lib/categoryFields";
import { buildReferenceRow } from "@/lib/listingFieldOptions";
import { isGoogleOwned, isGoogleSyncedField } from "@/lib/googleFieldOwnership";
import {
  GOOGLE_PLACE_ID_FIELD, normalizeGooglePlaceId, placeIdImportUpdate, isPlaceIdRepointed,
} from "@/lib/googlePlaceId";
import { isBlankPlaceholder } from "@/lib/sanitizeListing";
import { isImageCsvColumn } from "@/lib/csvImageColumns";
import { parseAdditionalHours } from "@/lib/openHours";
import { parseTitleOverrideCell, titleOverrideValue, titleOverrideToCsv } from "@/lib/displayTitle";


const ALL_CATEGORIES_VALUE = "__all__";

// Listings a manual sync run fetches. Below the function's own 200 cap, because
// this one is awaited in the browser: each listing costs a Google call plus a
// deliberate pause, so a bigger batch risks running past the request timeout.
// Whatever is left over stays queued, and the button reports what's still due.
const MANUAL_SYNC_LIMIT = 150;

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

  // Normalise headers: lowercase, strip quotes/BOM, collapse any run of
  // spaces/dashes/other separators into a single underscore. This means
  // "Km From Town", "km-from-town" and "km_from_town" all map to km_from_town.
  const headers = rows[0].map((header) =>
    header
      .replace(/^\uFEFF/, "")
      .toLowerCase()
      .replace(/["']/g, "")
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
  );
  const dataRows = rows.slice(1)
    .map((values) => {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        const v = values[index] ?? "";
        // Every "no value" placeholder ("-", "N/A", ...) is normalised to a
        // single dash, which parseField reads as "clear this field". An empty
        // cell is different: on update it means "leave whatever is there".
        row[header] = isBlankPlaceholder(v) && v.trim() !== "" ? "-" : v;
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
const universalContentFieldSet = new Set<string>(getUniversalContentFields());

// ---- Schema-driven CSV (de)serialization ----

// Distance from town: accept "2,5", "2.5", "2.5 km", "2,50km" etc.
// Stored as a plain numeric string with up to 2 decimal places.
function normalizeKm(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n)) return null;
  return String(Math.round(n * 100) / 100);
}


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
// Empty and "-" are deliberately different: empty means "I'm not saying", "-"
// means "there isn't one".
function parseField(raw: string | undefined, type: FieldType, isUpdate: boolean):
  { skip: true } | { skip: false; value: unknown } {
  const cell = typeof raw === "string" ? raw : "";
  const trimmed = cell.trim();
  // Empty cell on update → preserve existing value
  if (trimmed === "" && isUpdate) return { skip: true };
  // Empty cell on create → null (or default for bool_default_false).
  // A "-" (or any other placeholder) explicitly clears to null, on create and
  // on update alike — that's how a listing loses a website it no longer has.
  if (trimmed === "" || isBlankPlaceholder(trimmed)) {
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
  const [importResult, setImportResult] = useState<{
    created: number; updated: number; deleted: number; removed_from_category: number;
    google_locked: string[];
    universal_ignored: { columns: string[]; rows: number };
    card_labels: number;
    errors: string[];
  } | null>(null);
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

  // What the ratings sync still has to get through. This is the answer to "why
  // hasn't this listing's rating updated yet", which is almost always either
  // "it's queued behind the per-run limit" or "it has no Place ID".
  const { data: syncQueue } = useQuery({
    queryKey: ["admin-google-sync-queue"],
    queryFn: async () => {
      // A `from()` each: two filter chains off one builder is only safe because
      // the current postgrest-js clones its request state, which is not a
      // guarantee worth resting a count on.
      const [{ count: awaitingFirstFetch }, { count: missingPlaceId }] = await Promise.all([
        supabase.from("listings").select("id", { count: "exact", head: true })
          .not("google_place_id", "is", null)
          .is("google_synced_at", null),
        supabase.from("listings").select("id", { count: "exact", head: true })
          .is("google_place_id", null),
      ]);
      return {
        awaitingFirstFetch: awaitingFirstFetch ?? 0,
        missingPlaceId: missingPlaceId ?? 0,
      };
    },
  });

  // Runs the same job as the 4am cron, on demand — so a batch of Place IDs just
  // imported can be fetched now instead of waiting for the night's run.
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("refresh-google-ratings", {
        body: { mode: "refresh", limit: MANUAL_SYNC_LIMIT },
      });
      if (error) throw error;
      const result = data as { error?: string; processed: number; succeeded: number; failedCount: number };
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (result) => {
      toast.success(
        `Google sync: ${result.succeeded} of ${result.processed} listing(s) updated` +
          (result.failedCount > 0 ? `, ${result.failedCount} failed` : ""),
      );
      qc.invalidateQueries({ queryKey: ["admin-google-sync-queue"] });
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Could not run the Google sync");
    },
  });

  const isAllCategories = selectedCategoryId === ALL_CATEGORIES_VALUE;
  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);
  const selectedCategoryTitle = isAllCategories ? null : (selectedCategory?.title ?? null);
  const csvHeaders = isAllCategories ? getUniversalCSVHeaders() : getCSVHeadersForCategory(selectedCategoryTitle);
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

        // Universal columns left over from an older category export (or copied
        // across from the universal sheet). They are read past rather than
        // written, so the universal upload stays the one thing that can change
        // a listing's name, contacts, location or hours.
        const universalExtras = result.headers.filter((h) => universalContentFieldSet.has(h));
        if (universalExtras.length > 0) {
          toast.warning(
            `Universal columns found and will be ignored (edit these on the All Categories sheet): ${universalExtras.join(", ")}`,
          );
        }
      } else if (result.headers.includes(CATEGORY_SUBCATEGORY_FIELD)) {
        // Subcategories are per category, so this sheet has no way to tell which
        // category a name belongs to. Read past rather than guessed at.
        toast.warning(
          "A subcategories column was found and will be ignored — fill subcategories in on each category's own sheet.",
        );
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

      const results = {
        created: 0, updated: 0, deleted: 0, removed_from_category: 0,
        // Listings whose CSV rating cells were ignored because the Google sync owns them.
        google_locked: [] as string[],
        // Universal cells a category upload read past (the universal sheet owns them).
        universal_ignored: { columns: [] as string[], rows: 0 },
        // Rows that set or cleared this category's card label.
        card_labels: 0,
        errors: [] as string[],
      };
      const csvTitles = new Set<string>();

      // Universal columns this file carries that a category upload won't write.
      // Counted per row so the result panel can say how much was actually
      // skipped rather than just which columns were present.
      const universalColumnsInFile = isAllCategories
        ? []
        : parsed.headers.filter((h) => universalContentFieldSet.has(h));
      const universalColumnsUsed = new Set<string>();

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
        // Universal rows only: whether the row named categories, and so gets to
        // rewrite the listing's category set. False leaves the links as they are.
        ownsCategorySet: boolean;
        // Category rows only: whether the subcategories cell was filled in, and
        // so gets to rewrite this category's subcategory links.
        subsProvided: boolean;
        // The card label for the selected category: a string to set it, null to
        // clear it back to automatic, undefined to leave whatever is stored.
        cardLabel?: string | null;
      }[] = [];

      // Subcategory titles belonging to the selected category — the labels a card
      // in this category is allowed to show, alongside the category title itself.
      const categorySubTitles = new Set(
        (subcategories ?? [])
          .filter((s) => s.category_id === selectedCategoryId)
          .map((s) => s.title.trim().toLowerCase()),
      );

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
        const title = isBlankPlaceholder(row.title) ? "" : row.title.trim();
        if (!title) {
          results.errors.push(`Row ${i + 2}: Missing title, skipped`);
          continue;
        }
        csvTitles.add(title.toLowerCase());

        const existing = existingMap.get(title.toLowerCase());
        const isUpdate = !!existing;
        const listingId = existing?.id ?? crypto.randomUUID();

        // ---- Which categories the listing belongs to ----
        //
        // One answer for the whole listing, so it is given once, on the
        // universal sheet. A category upload already knows the category it was
        // run for and adds that membership by itself; a `categories` column left
        // over on an older category export is reported with the other universal
        // columns rather than obeyed, so the two sheets can't disagree about
        // where a listing sits.
        const resolvedCatIds: string[] = [];
        // Whether this row's category cell is authoritative enough to rewrite the
        // listing's category set (see the junction sync below).
        let ownsCategorySet = false;

        if (!isAllCategories) {
          resolvedCatIds.push(selectedCategoryId);
        } else {
          const catCell = row[CATEGORY_MEMBERSHIP_FIELD];
          // Blank means "not saying" here as everywhere else: the listing keeps
          // the categories it has. A cleared cell ("-") is reported instead of
          // obeyed — a listing in no category at all can't be reached anywhere
          // in the app, and dropping one category is done by editing the list.
          const catProvided = typeof catCell === "string" && catCell.trim() !== "";
          const catNames = catProvided && !isBlankPlaceholder(catCell)
            ? catCell.split("|").map((s) => s.trim()).filter((s) => s && !isBlankPlaceholder(s))
            : [];
          if (catProvided && catNames.length === 0) {
            results.errors.push(
              `Row ${i + 2}: categories was cleared — a listing has to sit in at least one category to appear in the app, so its current categories were kept`,
            );
          }
          if (!catProvided && !isUpdate) {
            results.errors.push(
              `Row ${i + 2}: no categories given for a new listing — it will be created but won't appear on any category page until one is set`,
            );
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
          // Only a row that actually named categories rewrites the set. A row
          // whose names all failed to resolve is left alone rather than being
          // read as "belongs to nothing".
          ownsCategorySet = resolvedCatIds.length > 0;
        }

        // ---- Subcategories for THIS category ----
        //
        // The column belongs to the category sheets, and each one carries only
        // its own category's subcategories: the same listing is a "Nursery" on
        // the Home & Garden sheet and a "Builder" on the Building & Renovation
        // one, and each sheet fills in — and syncs — only its own half. The
        // universal sheet has no category to scope them to, so it doesn't ask.
        const subNames = isAllCategories || isBlankPlaceholder(row[CATEGORY_SUBCATEGORY_FIELD])
          ? []
          : row[CATEGORY_SUBCATEGORY_FIELD].split("|").map((s) => s.trim()).filter((s) => s && !isBlankPlaceholder(s));
        // Blank on update means "keep this category's subcategories", matching
        // every other column; "-" clears them (an empty list that still syncs).
        const subsProvided = !isAllCategories && (
          (row[CATEGORY_SUBCATEGORY_FIELD] ?? "").trim() !== "" || !isUpdate
        );
        const resolvedSubIdsRaw: string[] = [];
        for (const subName of subNames) {
          const key = `${selectedCategoryId}::${subName.toLowerCase()}`;
          const subId = subMap.get(key);
          if (subId) { resolvedSubIdsRaw.push(subId); continue; }
          // Unknown name: create it under the category this sheet is for, which
          // is the only category whose subcategories this sheet may touch.
          const { data: newSub, error: subErr } = await supabase
            .from("subcategories").insert({ title: subName, category_id: selectedCategoryId }).select("id").single();
          if (!subErr && newSub) {
            resolvedSubIdsRaw.push(newSub.id);
            subMap.set(key, newSub.id);
            categorySubTitles.add(subName.trim().toLowerCase());
          } else {
            results.errors.push(`Row ${i + 2}: Could not match or create subcategory "${subName}"`);
          }
        }
        const resolvedSubIds = Array.from(new Set(resolvedSubIdsRaw));

        // Images are managed exclusively via the Lovable editor — CSV image_url and
        // gallery_images cells are honored only when explicitly provided.

        // Schema-driven payload build.
        // - The universal upload writes the universal fields, and only it does:
        //   a category upload reads past them entirely, so the two sheets can
        //   never disagree about a listing's name, contacts, location or hours.
        // - Category-specific fields are written only when the selected category owns them.
        // - On UPDATE, an empty CSV cell preserves the existing value (skip the key).
        //   A literal "-" explicitly clears to null.
        //
        // The universal sheet owns the title too, down to its casing: a category
        // row matches on the title but never rewrites it.
        const payload: ListingPayload = {
          id: listingId,
          title: !isAllCategories && existing ? existing.title : title,
        };
        const payloadRecord = payload as Record<string, unknown>;

        // Always link the listing to the (primary) selected category via the legacy column,
        // unless we're in the "All Categories" universal mode.
        if (!isAllCategories) {
          payloadRecord.category_id = selectedCategoryId;
        } else if (resolvedCatIds[0]) {
          payloadRecord.category_id = resolvedCatIds[0];
        }

        // Universal mode writes the universal columns; a category upload writes
        // only the fields that category owns. google_place_id rides in the
        // universal list but is handled on its own below, not in the loop.
        const allFieldNames: string[] = isAllCategories
          ? getUniversalDbFields().filter((f) => f !== "title")
          : getCategorySpecificFields(selectedCategoryTitle);

        // Note in the results which universal cells this row was carrying, so an
        // ignored value is reported rather than silently dropped.
        let rowHadUniversalValue = false;
        for (const column of universalColumnsInFile) {
          const cell = row[column];
          if (cell === undefined || cell.trim() === "") continue;
          rowHadUniversalValue = true;
          universalColumnsUsed.add(column);
        }
        if (rowHadUniversalValue) results.universal_ignored.rows++;

        // The Place ID cell drives the ratings sync rather than the listing's
        // content, so it is parsed up front: it decides who owns the rating
        // columns below, and it writes the sync bookkeeping alongside itself.
        //
        // The column lives on the universal sheet alone, so a category upload
        // leaves the stored ID alone — a stale copy on an older category export
        // is reported with the other universal columns rather than written back.
        let incomingPlaceId: string | null | undefined;
        if (isAllCategories) {
          const placeIdCell = parseField(row[GOOGLE_PLACE_ID_FIELD], "str", isUpdate);
          if (placeIdCell.skip === true) {
            incomingPlaceId = undefined;          // blank on update: leave whatever is stored
          } else if (placeIdCell.value === null) {
            incomingPlaceId = null;               // "-" (or blank on create): no ID for this listing
          } else {
            incomingPlaceId = normalizeGooglePlaceId(placeIdCell.value);
            if (incomingPlaceId === null) {
              // An unreadable ID is dropped rather than stored: a wrong ID would
              // point the sync at somebody else's business and import their rating.
              results.errors.push(
                `Row ${i + 2}: google_place_id "${String(placeIdCell.value).slice(0, 40)}" is not a Google Place ID, left unchanged`,
              );
              incomingPlaceId = undefined;
            }
          }
        }

        // Once the nightly Google sync has successfully fetched this listing, its
        // rating columns are live data and the CSV is a stale snapshot — so the CSV
        // loses. For every other listing (never matched, match confidence too low,
        // awaiting re-match) Google never writes anything, so the CSV is the only
        // source and wins as normal.
        //
        // Re-pointing the listing at a different Place ID is the exception: what
        // the sync fetched belongs to the old place, so it is no longer live and
        // the CSV takes the rating columns back until the next run.
        const googleOwned =
          isUpdate && isGoogleOwned(existing) && !isPlaceIdRepointed(incomingPlaceId ?? null, existing);
        let googleCellsIgnored = false;

        for (const fieldName of allFieldNames) {
          if (fieldName === GOOGLE_PLACE_ID_FIELD) continue;   // handled above
          // Images are managed in the backend editor only: never written from CSV.
          if (isImageCsvColumn(fieldName)) continue;
          // title_override is a true/false toggle in CSV (same switch as the
          // editor): true stores the title verbatim, false clears the override.
          if (fieldName === "title_override") {
            const on = parseTitleOverrideCell(row[fieldName]);
            if (on === null) { if (!isUpdate) payloadRecord[fieldName] = null; continue; }
            payloadRecord[fieldName] = titleOverrideValue(on, title);
            continue;
          }
          const spec = (LISTING_FIELD_SPECS as Record<string, { type: FieldType }>)[fieldName];
          if (!spec) continue;

          if (googleOwned && isGoogleSyncedField(fieldName)) {
            // Only flag it when the CSV actually carried a value to lose — a blank
            // or placeholder cell on update was never going to write anything.
            if (!isBlankPlaceholder(row[fieldName])) googleCellsIgnored = true;
            continue;
          }
          const parsed = parseField(row[fieldName], spec.type, isUpdate);
          if (parsed.skip === true) continue;
          if (parsed.skip === false) {
            if (fieldName === "additional_hours" && parsed.value !== null) {
              // Extra sets of hours are the one column typed as raw JSON by
              // hand, so a mistyped cell is read here rather than at the
              // database, and the row keeps the hours it already had.
              // An explicit empty list is the same answer as "-": this listing
              // keeps a single schedule after all.
              if (Array.isArray(parsed.value) && parsed.value.length === 0) {
                payloadRecord[fieldName] = null;
                continue;
              }
              const sets = parseAdditionalHours(parsed.value);
              if (sets.length === 0) {
                results.errors.push(
                  `Row ${i + 2}: additional_hours could not be read as a list of extra opening-hours sets — e.g. [{"label":"Bar","hours":{"monday":"16:00 - 00:00"}}]. Left unchanged`,
                );
                continue;
              }
              payloadRecord[fieldName] = sets;
              continue;
            }
            payloadRecord[fieldName] =
              fieldName === "km_from_town" ? normalizeKm(parsed.value) : parsed.value;
          }
        }

        if (googleCellsIgnored) results.google_locked.push(title);

        // Writes google_place_id plus the sync bookkeeping it implies (status,
        // confidence, and — on a changed ID — a cleared fetch stamp so the next
        // run replaces the old place's rating straight away).
        Object.assign(payloadRecord, placeIdImportUpdate(incomingPlaceId, existing));

        // Remove undefined keys (defensive)
        Object.keys(payloadRecord).forEach((k) => { if (payloadRecord[k] === undefined) delete payloadRecord[k]; });



        // The card label for this category. It is stored on the listing's
        // `listing_categories` row, not on the listing, so the same business can
        // read "Nurseries" on Home & Garden and "Builders" on Building &
        // Renovation. The universal sheet has no category to answer for, so it
        // never carries the column.
        let cardLabel: string | null | undefined;
        if (!isAllCategories) {
          const cell = parseField(row[CATEGORY_CARD_LABEL_FIELD], "str", isUpdate);
          if (cell.skip === true) {
            cardLabel = undefined;                       // blank on update: leave it alone
          } else {
            const trimmed = typeof cell.value === "string" ? cell.value.trim() : "";
            cardLabel = trimmed || null;                 // "-" (or blank on create): back to automatic
            if (cardLabel) {
              // A label the card can't render is worth flagging: it still gets
              // stored (the subcategory may be added later), but until then the
              // card falls back to its first populated subcategory.
              const matchesCategory =
                (selectedCategoryTitle ?? "").trim().toLowerCase() === cardLabel.toLowerCase();
              if (!matchesCategory && !categorySubTitles.has(cardLabel.toLowerCase())) {
                results.errors.push(
                  `Row ${i + 2}: card_primary_subcategory "${cardLabel}" is neither "${selectedCategoryTitle}" nor one of its subcategories — the card will fall back to the first populated subcategory`,
                );
              }
            }
            results.card_labels++;
          }
        }

        importItems.push({
          rowNumber: i + 2, listingId, payload, resolvedCatIds, resolvedSubIds,
          isUpdate, ownsCategorySet, subsProvided, cardLabel,
        });
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

      // Category links each imported listing already has. Universal mode uses
      // this to remove only the categories the CSV dropped, instead of wiping
      // every link and re-inserting: the junction row also carries that
      // category's card label, which the universal sheet has no column for and
      // must therefore not be able to destroy.
      const existingCatLinks = new Map<string, string[]>();
      if (isAllCategories && successfulIds.length > 0) {
        for (const idBatch of chunkArray(successfulIds, 200)) {
          const { data, error } = await supabase
            .from("listing_categories").select("listing_id, category_id").in("listing_id", idBatch);
          if (error) {
            results.errors.push(`Category lookup failed - ${error.message}`);
            continue;
          }
          (data ?? []).forEach((l) => {
            const arr = existingCatLinks.get(l.listing_id) ?? [];
            arr.push(l.category_id);
            existingCatLinks.set(l.listing_id, arr);
          });
        }
      }

      // Per-listing junction sync — one sheet per half.
      // - In "All Categories" mode the CSV owns the whole category set, applied as a
      //   difference so the surviving rows keep the card labels and subcategory
      //   links they carry. Subcategories are never set here.
      // - In category-scoped mode we ONLY touch the selected category's link and the
      //   subcategory links that belong to the selected category. This preserves a listing's
      //   memberships and subcategories in other categories (e.g. importing Shopping CSV
      //   must not unlink "Woodlands Garden Centre" from "Home & Garden", nor clear the
      //   Home & Garden subcategories it was given on that sheet).
      setImportStatus(`Syncing categories for ${successfulItems.length} listings...`);
      for (let idx = 0; idx < successfulItems.length; idx++) {
        const item = successfulItems[idx];
        if (idx % 50 === 0) setImportStatus(`Syncing categories ${idx + 1}/${successfulItems.length}...`);

        if (isAllCategories) {
          // The CSV owns the listing's full category set, but only for the rows
          // that actually named categories — a blank cell leaves the links alone.
          // It is applied as a difference rather than a wipe-and-reinsert, so a
          // category the CSV kept keeps its junction row, and with it the card
          // label and subcategory links that belong to that category.
          if (!item.ownsCategorySet) continue;
          const uniqueCatIds = Array.from(new Set(item.resolvedCatIds));
          const catRows = uniqueCatIds.map((catId) => ({ listing_id: item.listingId, category_id: catId }));
          const { error: catInsErr } = await supabase
            .from("listing_categories").upsert(catRows, { onConflict: "listing_id,category_id" });
          if (catInsErr) {
            results.errors.push(`Row ${item.rowNumber}: category link failed - ${catInsErr.message}`);
            continue;
          }
          const staleCatIds = (existingCatLinks.get(item.listingId) ?? [])
            .filter((catId) => !uniqueCatIds.includes(catId));
          if (staleCatIds.length > 0) {
            const { error: catDelErr } = await supabase
              .from("listing_categories").delete()
              .eq("listing_id", item.listingId)
              .in("category_id", staleCatIds);
            if (catDelErr) {
              results.errors.push(`Row ${item.rowNumber}: category cleanup failed - ${catDelErr.message}`);
              continue;
            }
            // A subcategory outlives its category only as an orphan: dropping
            // "Home & Garden" has to take "Nurseries" with it, or the listing
            // keeps a subcategory under a category it no longer belongs to.
            // Every surviving category's subcategories are untouched — those are
            // that category's sheet to fill in, not this one's.
            const staleSubIds = (subcategories ?? [])
              .filter((s) => staleCatIds.includes(s.category_id))
              .map((s) => s.id);
            if (staleSubIds.length > 0) {
              const { error: subDelErr } = await supabase
                .from("listing_subcategories").delete()
                .eq("listing_id", item.listingId)
                .in("subcategory_id", staleSubIds);
              if (subDelErr) results.errors.push(`Row ${item.rowNumber}: subcategory cleanup failed - ${subDelErr.message}`);
            }
          }

        } else {
          // Category-scoped mode: upsert the selected category's link additively —
          // being a row on this sheet is what puts the listing in this category.
          // No other category's link is added or removed here; the listing's full
          // category set is the universal sheet's to state.
          //
          // The selected category's row goes up on its own because it is the one
          // carrying card_primary_subcategory. Omitting that key (blank cell on
          // an update) leaves the stored label alone, which is what makes an
          // empty cell mean "keep it" here as everywhere else.
          const selectedRow: any = {
            listing_id: item.listingId, category_id: selectedCategoryId,
          };
          if (item.cardLabel !== undefined) selectedRow.card_primary_subcategory = item.cardLabel;
          const { error: selCatErr } = await supabase
            .from("listing_categories")
            .upsert([selectedRow], { onConflict: "listing_id,category_id" });
          if (selCatErr) {
            // Label column missing from the API schema cache (migration not
            // applied yet) — save the membership so the rest of the row lands.
            const missingLabelColumn =
              item.cardLabel !== undefined &&
              (selCatErr.code === "PGRST204" || selCatErr.message?.includes(CATEGORY_CARD_LABEL_FIELD));
            if (!missingLabelColumn) {
              results.errors.push(`Row ${item.rowNumber}: category link failed - ${selCatErr.message}`);
            } else {
              const { error: retryErr } = await supabase
                .from("listing_categories")
                .upsert([{ listing_id: item.listingId, category_id: selectedCategoryId }], { onConflict: "listing_id,category_id" });
              results.errors.push(retryErr
                ? `Row ${item.rowNumber}: category link failed - ${retryErr.message}`
                : `Row ${item.rowNumber}: card_primary_subcategory could not be saved — the per-category label column is missing, run the latest migration`);
            }
          }

          // Subcategories: delete only this listing's existing subcategory links
          // that belong to the selected category, then insert the resolved subs
          // (which are already scoped to the selected category — see the
          // resolution step above). The listing's subcategories under every
          // other category are that category's sheet to fill in, and are left
          // exactly as they are — which is what lets the same listing be a
          // "Nursery" here and a "Builder" on the next sheet.
          //
          // A blank cell on an update says nothing, so this category's stored
          // subcategories are kept; a "-" resolves to an empty list and clears
          // them.
          if (!item.subsProvided) continue;
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
            const uniqueSubIds = Array.from(new Set(item.resolvedSubIds));
            if (uniqueSubIds.length > 0) {
              const subRows = uniqueSubIds.map((subId) => ({ listing_id: item.listingId, subcategory_id: subId }));
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

      results.universal_ignored.columns = Array.from(universalColumnsUsed);

      return results;
    },
    onSuccess: (results) => {
      setImportStatus("");
      setImportResult(results);
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      const googleNote = results.google_locked.length > 0
        ? `, ${results.google_locked.length} kept their live Google rating`
        : "";
      const universalNote = results.universal_ignored.rows > 0
        ? `, ${results.universal_ignored.rows} kept their universal fields`
        : "";
      toast.success(`Import complete: ${results.created} created, ${results.updated} updated, ${results.removed_from_category} removed from category, ${results.deleted} deleted${googleNote}${universalNote}`);
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

    // The card label is per category, so it comes off this category's junction
    // rows rather than off the listing. Falls back to an empty column if the
    // label migration hasn't been applied yet.
    const cardLabelByListing = new Map<string, string>();
    if (!isAllCategories) {
      const { data: labelRows } = await supabase
        .from("listing_categories")
        .select("listing_id, card_primary_subcategory")
        .eq("category_id", selectedCategoryId);
      ((labelRows ?? []) as any[]).forEach((r: any) => {
        const label = (r.card_primary_subcategory ?? "").trim();
        if (label) cardLabelByListing.set(r.listing_id, label);
      });
    }

    // The listing's category set: a universal-sheet column, so it is only
    // fetched for that sheet. A category export doesn't repeat it — the file
    // you're in already says which category these rows are for.
    const catNameMap = new Map((categories ?? []).map((c) => [c.id, c.title]));
    const listingCatMap = new Map<string, string[]>();
    if (isAllCategories) {
      const { data: allCatJunction } = await supabase.from("listing_categories").select("listing_id, category_id");
      (allCatJunction ?? []).forEach((j) => {
        const name = catNameMap.get(j.category_id);
        if (name) {
          const arr = listingCatMap.get(j.listing_id) ?? [];
          arr.push(name);
          listingCatMap.set(j.listing_id, arr);
        }
      });
    }

    // Subcategories, scoped to the sheet's own category. Exporting Home &
    // Garden lists this listing's Home & Garden subcategories and nothing else,
    // so the column you edit is the column that comes back — its Building &
    // Renovation subcategories belong to that sheet and stay there.
    const listingSubMap = new Map<string, string[]>();
    if (!isAllCategories) {
      const subNameMap = new Map(
        (subcategories ?? [])
          .filter((s) => s.category_id === selectedCategoryId)
          .map((s) => [s.id, s.title]),
      );
      const { data: subJunction } = await supabase.from("listing_subcategories").select("listing_id, subcategory_id");
      (subJunction ?? []).forEach((j) => {
        const name = subNameMap.get(j.subcategory_id);
        if (name) {
          const arr = listingSubMap.get(j.listing_id) ?? [];
          arr.push(name);
          listingSubMap.set(j.listing_id, arr);
        }
      });
    }

    const headers = csvHeaders;

    const rows = listings.map((l) => {
      const fieldMap: Record<string, string> = {};
      const lr = l as unknown as Record<string, unknown>;

      // Virtual (junction) columns, each on the one sheet that owns it.
      if (isAllCategories) {
        const fromJunction = listingCatMap.get(l.id) ?? [];
        if (fromJunction.length === 0 && l.category_id) {
          const legacy = catNameMap.get(l.category_id);
          fieldMap[CATEGORY_MEMBERSHIP_FIELD] = legacy ?? "";
        } else {
          fieldMap[CATEGORY_MEMBERSHIP_FIELD] = fromJunction.join("|");
        }
      } else {
        fieldMap[CATEGORY_SUBCATEGORY_FIELD] = (listingSubMap.get(l.id) ?? []).join("|");
      }

      // Per-category column, not a listing column: read it off the junction so
      // exporting Home & Garden shows the label chosen there, not the one
      // chosen for the same listing under Building & Renovation.
      if (!isAllCategories) fieldMap[CATEGORY_CARD_LABEL_FIELD] = cardLabelByListing.get(l.id) ?? "";

      // Schema-driven serialization for every other header
      for (const h of headers) {
        if (h === CATEGORY_MEMBERSHIP_FIELD || h === CATEGORY_SUBCATEGORY_FIELD) continue;
        if (!isAllCategories && h === CATEGORY_CARD_LABEL_FIELD) continue;
        if (h === "title_override") { fieldMap[h] = titleOverrideToCsv(lr); continue; }
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
        <h1 className="font-heading text-2xl lg:text-3xl font-[550] text-foreground">Import / Export Listings</h1>
      </div>

      {/* Google ratings sync — independent of the category selection below */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-medium text-foreground">Google ratings sync</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Runs the same job as the nightly 4am one, for up to {MANUAL_SYNC_LIMIT} listings at a
              time. Worth pressing straight after importing a batch of Place IDs — it takes about a
              minute.
            </p>
          </div>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="gap-2 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            {syncMutation.isPending ? "Syncing..." : "Sync now"}
          </Button>
        </div>
        {syncQueue && (
          <p className="text-xs text-muted-foreground">
            {syncQueue.awaitingFirstFetch > 0
              ? `${syncQueue.awaitingFirstFetch} listing(s) with a Place ID are waiting for their first fetch — until then they show whatever rating the CSV last put there. Press Sync now again if more are still queued afterwards.`
              : "Every listing with a Place ID has been fetched at least once."}
            {syncQueue.missingPlaceId > 0 &&
              ` ${syncQueue.missingPlaceId} listing(s) have no Place ID at all, so the sync can't reach them — fill in the google_place_id column for those.`}
          </p>
        )}
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
                ? "The source of truth for every universal field, and for which categories each listing belongs to, across ALL listings. Category-specific fields, subcategories, and the card label each category holds are left untouched."
                : `Imports ${selectedCategoryTitle}-specific fields, this category's subcategories, and its card label. Universal fields (name, contacts, location, hours…) and the listing's category set aren't on this sheet — the All Categories upload owns those. A listing's data and links in other categories are never touched.`}
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
                ? "Listings are matched by title. Missing listings will be deleted. Category-specific fields, per-category subcategories and per-category card labels are preserved."
                : "Listings are matched by title (case-insensitive). Listings missing from the CSV are removed from this category only; they're fully deleted only if they don't belong to any other category."}
            </p>
            {isAllCategories ? (
              <>
                <p className="text-xs text-muted-foreground mt-1">
                  This sheet is where universal fields are set. Category uploads can't change
                  them, so what's here (or what you've edited in the backend) is what the app shows.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  categories is the full list of categories a listing belongs to, and this is
                  the only sheet that asks for it — a listing in both Home &amp; Garden and
                  Building &amp; Renovation reads "Home &amp; Garden | Building &amp; Renovation"
                  here and then appears on both of those category sheets. Leave the cell blank to
                  keep the categories it already has. Subcategories aren't set here: they're
                  filled in per category, on each category's own sheet.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mt-1">
                  Universal columns aren't on this sheet, and any left over in an older file
                  are read past rather than imported — title, contacts, location, opening
                  hours, the listing's categories and the rest come from the All Categories
                  upload or the backend editor.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  subcategories on this sheet means {selectedCategoryTitle} subcategories only.
                  A listing that also sits in another category has its subcategories there filled
                  in on that category's sheet, and nothing you put here touches them. Leave the
                  cell blank to keep this category's stored subcategories, or "-" to clear them.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  card_primary_subcategory is per category: the label set here is the eyebrow
                  shown on the card on the {selectedCategoryTitle} page only, so the same
                  listing can read differently in each category it belongs to. Use this
                  category's name or one of its subcategories; leave it blank to keep the
                  stored label, or "-" to go back to picking automatically.
                </p>
              </>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Leave a cell blank to keep whatever the listing already has. Put a "-" in it
              to clear that field — a website column with "-" means the listing has no
              website, and its website button and contact row disappear.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              google_rating, google_reviews_count and google_reviews_url are only imported for
              listings the nightly Google sync has never fetched. Where the sync is working, the
              live numbers are kept and the CSV values for those three columns are ignored.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              google_place_id is the last column and is back-office only — it never shows anywhere
              in the app. It's how the nightly sync finds a listing on Google, so filling it in for
              listings the sync couldn't match gets their rating and review count updating too.
              Export first: every ID the sync has already matched comes down pre-filled, so you
              only need to fill the blanks.
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
            {importResult.card_labels > 0 && (
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">{importResult.card_labels}</strong> card
                label(s) set for {displayLabel} — these apply to this category's page only.
              </p>
            )}
            {importResult.universal_ignored.rows > 0 && (
              <div className="bg-muted border border-border rounded-lg p-4 space-y-1">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Ignored universal values in {importResult.universal_ignored.rows} row(s)
                </p>
                <p className="text-xs text-muted-foreground">
                  Universal fields are owned by the All Categories upload and the backend
                  editor, so a category upload never writes them — whatever is already stored
                  was kept. Everything else in those rows imported normally.
                </p>
                <p className="text-xs text-muted-foreground">
                  Columns ignored: {importResult.universal_ignored.columns.join(", ")}
                </p>
              </div>
            )}
            {importResult.google_locked.length > 0 && (
              <div className="bg-muted border border-border rounded-lg p-4 space-y-1">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Kept the live Google rating for {importResult.google_locked.length} listing(s)
                </p>
                <p className="text-xs text-muted-foreground">
                  These listings are synced from Google Places, so their google_rating,
                  google_reviews_count and google_reviews_url came from the nightly sync and
                  the CSV values were ignored. Every other column in those rows imported normally.
                </p>
                <p className="text-xs text-muted-foreground">
                  {importResult.google_locked.slice(0, 20).join(", ")}
                  {importResult.google_locked.length > 20 && ` … and ${importResult.google_locked.length - 20} more`}
                </p>
              </div>
            )}
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
