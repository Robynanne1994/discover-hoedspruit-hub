import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import BottomNav from "@/components/BottomNav";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Welcome from "./pages/Welcome.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminCategories from "./pages/admin/AdminCategories.tsx";
import AdminListings from "./pages/admin/AdminListings.tsx";
import AdminEvents from "./pages/admin/AdminEvents.tsx";
import AdminContent from "./pages/admin/AdminContent.tsx";
import AdminImport from "./pages/admin/AdminImport.tsx";
import AdminEventsImport from "./pages/admin/AdminEventsImport.tsx";
import AdminHomepage from "./pages/admin/AdminHomepage.tsx";
import AdminBulkEdit from "./pages/admin/AdminBulkEdit.tsx";
import AdminSpecials from "./pages/admin/AdminSpecials.tsx";
import AdminArticles from "./pages/admin/AdminArticles.tsx";
import Headlines from "./pages/Headlines.tsx";
import ArticleDetail from "./pages/ArticleDetail.tsx";
import AdminSpecialsImport from "./pages/admin/AdminSpecialsImport.tsx";
import AdminBushTelegraph from "./pages/admin/AdminBushTelegraph.tsx";
import CategoryPage from "./pages/CategoryPage.tsx";
import ListingDetail from "./pages/ListingDetail.tsx";
import ContactUs from "./pages/ContactUs.tsx";
import Events from "./pages/Events.tsx";
import About from "./pages/About.tsx";
import Directories from "./pages/Directories.tsx";
import MyAccount from "./pages/MyAccount.tsx";
import MyProfile from "./pages/MyProfile.tsx";
import BushTelegraph from "./pages/BushTelegraph.tsx";
import SavedListings from "./pages/SavedListings.tsx";
import VisitedPlaces from "./pages/VisitedPlaces.tsx";
import NotFound from "./pages/NotFound.tsx";
import RestaurantQuiz from "./pages/RestaurantQuiz.tsx";
import Categories from "./pages/Categories.tsx";
import EventsCalendar from "./pages/EventsCalendar.tsx";
import Advertise from "./pages/Advertise.tsx";
import People from "./pages/People.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import FollowList from "./pages/FollowList.tsx";
import EventDetail from "./pages/EventDetail.tsx";
import AccountSettings from "./pages/AccountSettings.tsx";
import AccountInfo from "./pages/AccountInfo.tsx";
import TermsPolicies from "./pages/TermsPolicies.tsx";

import TermsOfUse from "./pages/TermsOfUse.tsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.tsx";
import CookiePolicy from "./pages/CookiePolicy.tsx";
import ContentGuidelines from "./pages/ContentGuidelines.tsx";
import FAQs from "./pages/FAQs.tsx";
import PrivacySecurity from "./pages/PrivacySecurity.tsx";
import Feedback from "./pages/Feedback.tsx";
import Notifications from "./pages/Notifications.tsx";
import MyNotifications from "./pages/MyNotifications.tsx";
import NotificationCategories from "./pages/NotificationCategories.tsx";

import Specials from "./pages/Specials.tsx";
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
import { useLocation } from "react-router-dom";

const queryClient = new QueryClient();

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  // The Business Portal has its own auth flow and must be reachable without
  // signing in to the consumer app first.
  if (location.pathname.startsWith("/business")) return <>{children}</>;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#5C6446" }}>
        <div className="animate-pulse text-primary font-heading font-bold text-xl">Hello Hoedspruit</div>
      </div>
    );
  }
  if (!user) return <Welcome />;
  return <>{children}</>;
};

const ConditionalBottomNav = () => {
  const location = useLocation();
  if (location.pathname.startsWith("/business") || location.pathname.startsWith("/admin")) return null;
  return <BottomNav />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthGate>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/quiz" element={<RestaurantQuiz />} />
              <Route path="/category/:id" element={<CategoryPage />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/calendar" element={<EventsCalendar />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/advertise" element={<Advertise />} />
              <Route path="/headlines" element={<Headlines />} />
              <Route path="/headlines/:slug" element={<ArticleDetail />} />
              <Route path="/specials" element={<Specials />} />
              <Route path="/specials/:id" element={<SpecialDetail />} />
              <Route path="/directories" element={<Directories />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/my-account" element={<MyAccount />} />
              <Route path="/my-profile" element={<MyProfile />} />
              <Route path="/bush-telegraph" element={<BushTelegraph />} />
              
              <Route path="/saved" element={<SavedListings />} />
              <Route path="/visited" element={<VisitedPlaces />} />
              <Route path="/account-settings" element={<AccountSettings />} />
              <Route path="/account-settings/info" element={<AccountInfo />} />
              <Route path="/terms" element={<TermsPolicies />} />
              
              <Route path="/terms-of-use" element={<TermsOfUse />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/content-guidelines" element={<ContentGuidelines />} />
              <Route path="/faqs" element={<FAQs />} />
              <Route path="/privacy-security" element={<PrivacySecurity />} />
              <Route path="/people" element={<People />} />
              <Route path="/feedback" element={<Feedback />} />
             <Route path="/notifications" element={<Notifications />} />
             <Route path="/my-notifications" element={<MyNotifications />} />
             <Route path="/notifications/categories/:type" element={<NotificationCategories />} />
              <Route path="/profile/:id" element={<UserProfile />} />
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
                <Route path="articles" element={<AdminArticles />} />
                <Route path="bush-telegraph" element={<AdminBushTelegraph />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="import" element={<AdminImport />} />
                <Route path="moderation" element={<AdminModeration />} />
              </Route>
              <Route path="/business/sign-in" element={<BusinessSignIn />} />
              <Route path="/business/start" element={<BusinessStart />} />
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
            <ScrollToTop />
            <ConditionalBottomNav />
          </AuthGate>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
