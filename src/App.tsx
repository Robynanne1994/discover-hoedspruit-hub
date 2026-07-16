import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import BottomNav from "@/components/BottomNav";
import OfflineScreen from "@/components/OfflineScreen";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { GuestAuthProvider, useGuestAuth } from "@/hooks/useGuestAuth";
import Index from "./pages/Index.tsx";

import Welcome from "./pages/Welcome.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import ModerationBanner from "./components/ModerationBanner.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminCategories from "./pages/admin/AdminCategories.tsx";
import AdminCategoryOrder from "./pages/admin/AdminCategoryOrder.tsx";

import AdminNotifications from "./pages/admin/AdminNotifications.tsx";
import AdminListings from "./pages/admin/AdminListings.tsx";
import AdminEvents from "./pages/admin/AdminEvents.tsx";
import AdminImport from "./pages/admin/AdminImport.tsx";
import AdminEventsImport from "./pages/admin/AdminEventsImport.tsx";
import AdminHomepage from "./pages/admin/AdminHomepage.tsx";
import AdminBulkEdit from "./pages/admin/AdminBulkEdit.tsx";
import AdminSpecials from "./pages/admin/AdminSpecials.tsx";
import AdminSpecialsImport from "./pages/admin/AdminSpecialsImport.tsx";
import AdminBushTelegraph from "./pages/admin/AdminBushTelegraph.tsx";
import CategoryPage from "./pages/CategoryPage.tsx";
import ListingDetail from "./pages/ListingDetail.tsx";
import ContactUs from "./pages/ContactUs.tsx";
import Events from "./pages/Events.tsx";

import MyAccount from "./pages/MyAccount.tsx";
import MyProfile from "./pages/MyProfile.tsx";
import MyProfileGuest from "./pages/MyProfileGuest.tsx";
import BushTelegraph from "./pages/BushTelegraph.tsx";
import LocalChannelDetail from "./pages/LocalChannelDetail.tsx";

import NotFound from "./pages/NotFound.tsx";
import Categories from "./pages/Categories.tsx";


import UserProfile from "./pages/UserProfile.tsx";
import FollowList from "./pages/FollowList.tsx";
import FollowRequests from "./pages/FollowRequests.tsx";
import UserSaved from "./pages/UserSaved.tsx";
import EventDetail from "./pages/EventDetail.tsx";
import AccountInfo from "./pages/AccountInfo.tsx";
import AccountPrivacy from "./pages/AccountPrivacy.tsx";
import AccountBlocked from "./pages/AccountBlocked.tsx";
import AccountReported from "./pages/AccountReported.tsx";
import TermsPolicies from "./pages/TermsPolicies.tsx";

import TermsOfUse from "./pages/TermsOfUse.tsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.tsx";
import CookiePolicy from "./pages/CookiePolicy.tsx";
import ContentGuidelines from "./pages/ContentGuidelines.tsx";
import FAQs from "./pages/FAQs.tsx";
import HelpCentre from "./pages/HelpCentre.tsx";

import Feedback from "./pages/Feedback.tsx";
import Notifications from "./pages/Notifications.tsx";
import MyNotifications from "./pages/MyNotifications.tsx";
import NotificationCategories from "./pages/NotificationCategories.tsx";

import Specials from "./pages/Specials.tsx";
import SearchPage from "./pages/Search.tsx";
import SpecialDetail from "./pages/SpecialDetail.tsx";
import AdminModeration from "./pages/admin/AdminModeration.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminSubmissions from "./pages/admin/AdminSubmissions.tsx";
import AdminReports from "./pages/admin/AdminReports.tsx";
import AdminUserReports from "./pages/admin/AdminUserReports.tsx";
import AdminModeratedUsers from "./pages/admin/AdminModeratedUsers.tsx";
import AdminFAQs from "./pages/admin/AdminFAQs.tsx";
import { useLocation } from "react-router-dom";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Avoid re-running every query (and flashing every list into a
      // skeleton) when the tab regains focus or React re-mounts.
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const WELCOME_SEEN_KEY = "hh-welcome-seen";

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { isGuest } = useGuestAuth();
  const location = useLocation();

  // Once the user has authenticated or opted into guest mode, remember that
  // Welcome has been seen so subsequent launches (including cold starts on
  // iOS) go straight to Home. Required by Apple Guideline 5.1.1(v).
  React.useEffect(() => {
    if (user || isGuest) {
      try { localStorage.setItem(WELCOME_SEEN_KEY, "1"); } catch { /* ignore */ }
    }
  }, [user, isGuest]);

  if (loading) return <>{children}</>;
  // Welcome route is always reachable so people can sign up/in later.
  if (location.pathname === "/welcome") return <>{children}</>;
  // Only force the Welcome screen on the very first launch. After that,
  // unauthenticated visitors browse freely — sign-in prompts only appear
  // for account-based actions via requireAuth().
  const hasSeenWelcome =
    typeof window !== "undefined" && localStorage.getItem(WELCOME_SEEN_KEY) === "1";
  if (!user && !isGuest && !hasSeenWelcome) return <Welcome />;
  return <>{children}</>;
};

const ConditionalBottomNav = () => {
  const location = useLocation();
  const path = location.pathname;
  if (path.startsWith("/admin") || path === "/welcome") return null;
  return <BottomNav />;
};

const ConditionalMain = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  return (
    <main
      className={
        isAdmin
          ? "w-full min-h-screen bg-background relative"
          : "mx-auto w-full max-w-[480px] min-h-screen bg-background relative"
      }
    >
      {children}
    </main>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <OfflineScreen />
        <BrowserRouter>
          <GuestAuthProvider>
            <AuthGate>
              <ModerationBanner />
              <ConditionalMain>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/welcome" element={<Welcome />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/category/:id" element={<CategoryPage />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              
              
              
              <Route path="/specials" element={<Specials />} />
              <Route path="/specials/:id" element={<SpecialDetail />} />
              <Route path="/auth" element={<Navigate to="/welcome" replace />} />
              <Route path="/my-account" element={<MyAccount />} />
              <Route path="/my-profile" element={<MyProfile />} />
              <Route path="/my-profile-guest" element={<MyProfileGuest />} />
              <Route path="/local-channels" element={<BushTelegraph />} />
              <Route path="/local-channels/:slug" element={<LocalChannelDetail />} />
              
              <Route path="/account-settings" element={<Navigate to="/my-account" replace />} />
              <Route path="/account-settings/info" element={<AccountInfo />} />
              <Route path="/account-settings/privacy" element={<AccountPrivacy />} />
              <Route path="/account-settings/blocked" element={<AccountBlocked />} />
              <Route path="/account-settings/reported" element={<AccountReported />} />
              <Route path="/terms" element={<TermsPolicies />} />
              
              <Route path="/terms-of-use" element={<TermsOfUse />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/content-guidelines" element={<ContentGuidelines />} />
              <Route path="/faqs" element={<FAQs />} />
              <Route path="/help-centre" element={<HelpCentre />} />
              
              
              <Route path="/feedback" element={<Feedback />} />
             <Route path="/notifications" element={<Navigate to="/my-notifications" replace />} />
             <Route path="/my-notifications" element={<MyNotifications />} />
            <Route path="/notification-preferences" element={<Notifications />} />
             <Route path="/notifications/categories/:type" element={<NotificationCategories />} />
              <Route path="/profile/:id" element={<UserProfile />} />
              <Route path="/profile/:id/saved" element={<UserSaved />} />
              <Route path="/follow-requests" element={<FollowRequests />} />
              <Route path="/profile/:id/:type" element={<FollowList />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="homepage" element={<AdminHomepage />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="categories/:id/order" element={<AdminCategoryOrder />} />

                <Route path="listings" element={<AdminListings />} />
                <Route path="listings/bulk-edit" element={<AdminBulkEdit />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="events/import" element={<AdminEventsImport />} />
                <Route path="specials" element={<AdminSpecials />} />
                <Route path="specials/import" element={<AdminSpecialsImport />} />
                
                <Route path="local-channels" element={<AdminBushTelegraph />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="import" element={<AdminImport />} />
                <Route path="moderation" element={<AdminModeration />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="submissions" element={<AdminSubmissions />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="user-reports" element={<AdminUserReports />} />
                <Route path="moderated-users" element={<AdminModeratedUsers />} />
                <Route path="faqs" element={<AdminFAQs />} />
              </Route>
              <Route path="*" element={<NotFound />} />
              </Routes>
              </ConditionalMain>
              <ScrollToTop />
              <ConditionalBottomNav />
            </AuthGate>
          </GuestAuthProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
