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
import Auth from "./pages/Auth.tsx";
import Welcome from "./pages/Welcome.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminCategories from "./pages/admin/AdminCategories.tsx";
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
import About from "./pages/About.tsx";
import MyAccount from "./pages/MyAccount.tsx";
import MyProfile from "./pages/MyProfile.tsx";
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
import BusinessGate from "./components/business/BusinessGate.tsx";
import BusinessSignIn from "./pages/business/BusinessSignIn.tsx";
import BusinessSignUp from "./pages/business/BusinessSignUp.tsx";
import BusinessStart from "./pages/business/BusinessStart.tsx";
import BusinessSubscribe from "./pages/business/BusinessSubscribe.tsx";
import BusinessClaim from "./pages/business/BusinessClaim.tsx";
import BusinessDashboard from "./pages/business/BusinessDashboard.tsx";
import BusinessListing from "./pages/business/BusinessListing.tsx";
import BusinessSpecials from "./pages/business/BusinessSpecials.tsx";
import BusinessSpecialForm from "./pages/business/BusinessSpecialForm.tsx";
import BusinessEvents from "./pages/business/BusinessEvents.tsx";
import BusinessEventForm from "./pages/business/BusinessEventForm.tsx";
import BusinessFeature from "./pages/business/BusinessFeature.tsx";
import BusinessBilling from "./pages/business/BusinessBilling.tsx";
import AdminModeration from "./pages/admin/AdminModeration.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminSubmissions from "./pages/admin/AdminSubmissions.tsx";
import AdminReports from "./pages/admin/AdminReports.tsx";
import AdminUserReports from "./pages/admin/AdminUserReports.tsx";
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

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { isGuest } = useGuestAuth();
  const location = useLocation();

  // The Business Portal has its own auth flow and must be reachable without
  // signing in to the consumer app first.
  if (location.pathname.startsWith("/business")) return <>{children}</>;
  // No splash — render children immediately. While auth is still resolving,
  // protected pages can show their own inline loading state if needed.
  if (loading) return <>{children}</>;
  // Welcome route is always reachable so guests can return to sign up/in.
  if (location.pathname === "/welcome") return <>{children}</>;
  if (!user && !isGuest) return <Welcome />;
  return <>{children}</>;
};

const ConditionalBottomNav = () => {
  const location = useLocation();
  const path = location.pathname;
  const businessPublicPaths = ["/business/start", "/for-business", "/plans", "/business/dashboard"];
  const isBusinessPublic = businessPublicPaths.includes(path);
  if ((path.startsWith("/business") && !isBusinessPublic) || path.startsWith("/admin")) return null;
  return <BottomNav />;
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
              <main>
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
              <Route path="/about" element={<About />} />
              
              
              <Route path="/specials" element={<Specials />} />
              <Route path="/specials/:id" element={<SpecialDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/my-account" element={<MyAccount />} />
              <Route path="/my-profile" element={<MyProfile />} />
              <Route path="/local-channels" element={<BushTelegraph />} />
              <Route path="/local-channels/:slug" element={<LocalChannelDetail />} />
              
              <Route path="/account-settings" element={<Navigate to="/my-account" replace />} />
              <Route path="/account-settings/info" element={<AccountInfo />} />
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
                <Route path="faqs" element={<AdminFAQs />} />
              </Route>
              <Route path="/business/sign-in" element={<BusinessSignIn />} />
              <Route path="/business/start" element={<BusinessStart />} />
              <Route path="/for-business" element={<BusinessStart />} />
              <Route path="/plans" element={<BusinessStart />} />
              <Route path="/business/sign-up" element={<BusinessSignUp />} />
              <Route path="/business/claim" element={<BusinessClaim />} />
              <Route element={<BusinessGate />}>
                <Route path="/business/subscribe" element={<BusinessSubscribe />} />
                <Route path="/business/dashboard" element={<BusinessDashboard />} />
                <Route path="/business/listing" element={<BusinessListing />} />
                <Route path="/business/specials" element={<BusinessSpecials />} />
                <Route path="/business/specials/new" element={<BusinessSpecialForm mode="new" />} />
                <Route path="/business/specials/:id" element={<BusinessSpecialForm mode="edit" />} />
                <Route path="/business/events" element={<BusinessEvents />} />
                <Route path="/business/events/new" element={<BusinessEventForm mode="new" />} />
                <Route path="/business/events/:id" element={<BusinessEventForm mode="edit" />} />
                <Route path="/business/feature/:type/:id" element={<BusinessFeature />} />
                <Route path="/business/billing" element={<BusinessBilling />} />
              </Route>
              <Route path="*" element={<NotFound />} />
              </Routes>
              </main>
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
