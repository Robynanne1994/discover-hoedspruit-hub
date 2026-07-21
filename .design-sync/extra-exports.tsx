// Named re-exports for default-exported components (ESM `export *` drops
// defaults), plus the preview provider used by cfg.provider.
import { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { GuestAuthProvider } from "@/hooks/useGuestAuth";

// Custom UI primitives (default exports)
export { default as PrimaryButton } from "../src/components/ui/PrimaryButton";
export { default as SearchBar } from "../src/components/ui/SearchBar";
export { default as BackArrowIcon } from "../src/components/ui/BackArrowIcon";

// Feature components (default exports) — the app's real building blocks
export { default as BottomNav } from "../src/components/BottomNav";
export { default as PageHeader } from "../src/components/PageHeader";
export { default as BackButton } from "../src/components/BackButton";
export { default as DisplayTitle } from "../src/components/DisplayTitle";
export { default as FavouriteButton } from "../src/components/FavouriteButton";
export { default as ShareButton } from "../src/components/ShareButton";
export { default as HeroSection } from "../src/components/HeroSection";
export { default as GlobalMenu } from "../src/components/GlobalMenu";
export { default as ModerationBanner } from "../src/components/ModerationBanner";
export { default as OfflineScreen } from "../src/components/OfflineScreen";
export { default as HomeMasthead } from "../src/components/home/HomeMasthead";
export { default as HomeSectionHead } from "../src/components/home/HomeSectionHead";
export { default as HomeCategoryChips } from "../src/components/home/HomeCategoryChips";
export { default as EventCard } from "../src/components/events/EventCard";
export { default as UserCard } from "../src/components/social/UserCard";
export { default as FollowButton } from "../src/components/social/FollowButton";
export { default as FollowStats } from "../src/components/social/FollowStats";

const qc = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false, staleTime: Infinity, gcTime: Infinity } },
});

export const DsPreviewProvider = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <GuestAuthProvider>{children}</GuestAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  </MemoryRouter>
);
