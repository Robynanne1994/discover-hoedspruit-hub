import { describe, expect, it, vi } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToggleFavourite } from "@/hooks/useFavourites";

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "user-1" } }) }));

// A favourites table that accepts inserts and deletes.
vi.mock("@/integrations/supabase/client", () => {
  const deleteChain: any = { eq: () => deleteChain, then: (r: any) => r({ error: null }) };
  return {
    supabase: {
      from: () => ({
        insert: async () => ({ error: null }),
        delete: () => deleteChain,
        select: () => ({ eq: async () => ({ data: [] }) }),
      }),
    },
  };
});

// The same defaults the app's QueryClient uses (src/App.tsx). refetchOnMount:
// false is what made a saved-list query that was cached while the profile was
// off screen come back unchanged when the profile reopened.
const appQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { refetchOnWindowFocus: false, refetchOnReconnect: false, refetchOnMount: false, staleTime: 5 * 60 * 1000, retry: false },
      mutations: { retry: false },
    },
  });

const SavedList = ({ fetcher }: { fetcher: () => Promise<string[]> }) => {
  useQuery({ queryKey: ["my-saved-specials", "user-1"], queryFn: fetcher });
  return null;
};

const SaveOnMount = ({ onDone }: { onDone: () => void }) => {
  const toggle = useToggleFavourite();
  useEffect(() => {
    toggle.mutate({ itemId: "special-9", itemType: "special", currentlyFavourited: false }, { onSettled: onDone });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

describe("useToggleFavourite", () => {
  it("refreshes a saved list that was cached while its screen was closed", async () => {
    const qc = appQueryClient();
    const fetcher = vi.fn(async () => ["special-1"]);

    // 1. Open the profile once: the saved list loads and is cached.
    const profile = render(
      <QueryClientProvider client={qc}>
        <SavedList fetcher={fetcher} />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    // 2. Leave the profile, then save a special somewhere else.
    profile.unmount();
    let saved = false;
    render(
      <QueryClientProvider client={qc}>
        <SaveOnMount onDone={() => (saved = true)} />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(saved).toBe(true));

    // 3. Reopen the profile: the list must have been fetched again, not
    //    served from the pre-save cache.
    await act(async () => {
      render(
        <QueryClientProvider client={qc}>
          <SavedList fetcher={fetcher} />
        </QueryClientProvider>,
      );
    });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });
});
