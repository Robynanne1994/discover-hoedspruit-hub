import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import BottomNav from "@/components/BottomNav";
import NativePush from "@/components/NativePush";
import OfflineScreen from "@/components/OfflineScreen";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { GuestAuthProvider } from "@/hooks/useGuestAuth";
import { ShareProvider } from "@/hooks/useShare";
import Index from "./pages/Index.tsx";

import Welcome from "./pages/Welcome.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";

import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminCategories from "./pages/admin/AdminCategories.tsx";
import AdminCategoryOrder from "./pages/admin/AdminCategoryOrder.tsx";

import AdminNotifications from "./pages/admin/AdminNotifications.tsx";
import AdminAppUpdates from "./pages/admin/AdminAppUpdates.tsx";
import AdminListings from "./pages/admin/AdminListings.tsx";
import AdminEvents from "./pages/admin/AdminEvents.tsx";
import AdminImport from "./pages/admin/AdminImport.tsx";
import AdminEventsImport from "./pages/admin/AdminEventsImport.tsx";
import AdminHomepage from "./pages/admin/AdminHomepage.tsx";
import AdminSearchSuggested from "./pages/admin/AdminSearchSuggested.tsx";
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
import AccountNotices from "./pages/AccountNotices.tsx";
import TermsPolicies from "./pages/TermsPolicies.tsx";

import FAQs from "./pages/FAQs.tsx";
import HelpCentre from "./pages/HelpCentre.tsx";

import Notifications from "./pages/Notifications.tsx";
import MyNotifications from "./pages/MyNotifications.tsx";
import NotificationCategories from "./pages/NotificationCategories.tsx";

import Specials from "./pages/Specials.tsx";
import SearchPage from "./pages/Search.tsx";
import SpecialDetail from "./pages/SpecialDetail.tsx";

import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminReports from "./pages/admin/AdminReports.tsx";
import AdminUserReports from "./pages/admin/AdminUserReports.tsx";
import AdminModeratedUsers from "./pages/admin/AdminModeratedUsers.tsx";
import AdminFAQs from "./pages/admin/AdminFAQs.tsx";
import { useLocation } from "react-router-dom";
import { RESET_PASSWORD_PATH, hasRecoveryLink } from "@/lib/passwordReset";
import { EMAIL_CHANGE_PATH, hasEmailChangeLink } from "@/lib/emailChangeLink";
import CompleteProfile from "./pages/CompleteProfile.tsx";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { isSocialAccount, needsProfileSetup } from "@/lib/authProviders";
import { useQuery } from "@tanstack/react-query";

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

const ConditionalBottomNav = () => {
  const location = useLocation();
  const path = location.pathname;
  if (
    path.startsWith("/admin") ||
    path === "/welcome" ||
    path === "/reset-password" ||
    path === "/complete-profile"
  ) {
    return null;
  }
  return <BottomNav />;
};

/**
 * Makes sure a password reset link always lands on the reset screen.
 *
 * Supabase only redirects to URLs on its allow list; when the emailed link's
 * target isn't listed it falls back to the project's Site URL, which drops the
 * user on the homepage with the recovery tokens attached and nothing to do with
 * them. The link is read from the snapshot taken at start-up, so the reset
 * screen still sees it after this redirect.
 */
const RecoveryLinkRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const handled = React.useRef(false);

  React.useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    if (!hasRecoveryLink()) return;
    if (location.pathname === RESET_PASSWORD_PATH) return;
    navigate(RESET_PASSWORD_PATH, { replace: true });
  }, [location.pathname, navigate]);

  return null;
};

/**
 * Same idea for the "confirm your new email" link.
 *
 * The change is normally confirmed with the six-digit code, but the email
 * carries a one-tap link too, and Supabase sends it to the project's Site URL
 * whenever the template predates `emailRedirectTo`. That drops the user on the
 * homepage with the confirmation sitting unused in the URL — the link looks
 * broken. Send them to Account Info, which redeems it and says what happened.
 */
const EmailChangeLinkRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const handled = React.useRef(false);

  React.useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    if (!hasEmailChangeLink()) return;
    if (location.pathname === EMAIL_CHANGE_PATH) return;
    navigate(EMAIL_CHANGE_PATH, { replace: true });
  }, [location.pathname, navigate]);

  return null;
};

/** The path where a half-finished provider signup is completed. */
const COMPLETE_PROFILE_PATH = "/complete-profile";

/**
 * Screens a signed-in-but-incomplete account is still allowed to reach, so the
 * gate below can never trap someone: signing out, reading the terms and
 * finishing a password reset all have to stay possible.
 */
const SETUP_EXEMPT_PATHS = [
  COMPLETE_PROFILE_PATH,
  "/welcome",
  RESET_PASSWORD_PATH,
  "/terms",
];

/**
 * Sends a Google/Apple signup to finish its profile before it can use the app.
 *
 * A provider gives us a verified email address and nothing else — no username,
 * no residency, often no usable name. Left alone, the account exists but has
 * nothing on it, which is neither what the person expects nor something the
 * rest of the app can show to anybody. Signing up with an email asks for all of
 * this on the form, so this only ever catches the provider path.
 */
const ProfileSetupGate = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile-setup", user?.id],
    enabled: !!user?.id && isSocialAccount(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, surname, display_name, username, location")
        .eq("id", user!.id)
        .maybeSingle();
      // `null` means the row hasn't been created yet (the trigger is a moment
      // behind a brand-new signup); treat that as "nothing filled in".
      return data ?? {};
    },
  });

  React.useEffect(() => {
    if (loading || !user || !profile) return;
    if (!isSocialAccount(user)) return;
    const incomplete = needsProfileSetup(profile as Record<string, string | null>);
    if (incomplete && !SETUP_EXEMPT_PATHS.includes(location.pathname)) {
      navigate(COMPLETE_PROFILE_PATH, { replace: true });
    } else if (!incomplete && location.pathname === COMPLETE_PROFILE_PATH) {
      navigate("/", { replace: true });
    }
  }, [loading, user, profile, location.pathname, navigate]);

  return null;
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
            <ShareProvider>
              <NativePush />
              <RecoveryLinkRedirect />
              <EmailChangeLinkRedirect />
              <ProfileSetupGate />
              <ConditionalMain>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/complete-profile" element={<CompleteProfile />} />
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
              <Route path="/account-notices" element={<AccountNotices />} />
              <Route path="/terms" element={<TermsPolicies />} />

              <Route path="/faqs" element={<FAQs />} />
              <Route path="/help-centre" element={<HelpCentre />} />
              
              
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
                <Route path="search-suggested" element={<AdminSearchSuggested />} />
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
                <Route path="app-updates" element={<AdminAppUpdates />} />
                <Route path="import" element={<AdminImport />} />
                
                <Route path="users" element={<AdminUsers />} />
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
            </ShareProvider>
          </GuestAuthProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
