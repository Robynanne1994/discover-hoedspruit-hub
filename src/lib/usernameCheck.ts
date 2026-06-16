import { supabase } from "@/integrations/supabase/client";

/**
 * Checks whether a username is available (i.e. not already taken by another
 * user).
 *
 * Uses the SECURITY DEFINER `is_username_available` RPC because RLS blocks
 * reading other users' profile rows directly, so a normal query could never
 * see a clash with someone else's handle.
 *
 * If that function isn't present in the database yet (PostgREST error
 * PGRST202 — "Could not find the function ... in the schema cache"), the
 * pre-check is skipped and we return `available: true`. The
 * `profiles_username_unique_ci` index is the real guard and still rejects a
 * duplicate at write time with a clear "already taken" error, so account
 * creation and profile edits keep working even before the migration is applied.
 */
export async function isUsernameAvailable(
  username: string,
  excludeId?: string,
): Promise<{ available: boolean; error: Error | null }> {
  const args: Record<string, unknown> = { _username: username };
  if (excludeId) args._exclude_id = excludeId;

  const { data, error } = await supabase.rpc(
    "is_username_available" as any,
    args as any,
  );

  if (error) {
    const missing =
      (error as any).code === "PGRST202" ||
      /Could not find the function/i.test(error.message);
    if (missing) return { available: true, error: null };
    return { available: false, error };
  }

  return { available: Boolean(data), error: null };
}
