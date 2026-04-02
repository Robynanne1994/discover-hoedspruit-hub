import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import BottomNav from "@/components/BottomNav";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
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
import CategoryPage from "./pages/CategoryPage.tsx";
import ListingDetail from "./pages/ListingDetail.tsx";
import ContactUs from "./pages/ContactUs.tsx";
import Events from "./pages/Events.tsx";
import About from "./pages/About.tsx";
import Directories from "./pages/Directories.tsx";
import MyAccount from "./pages/MyAccount.tsx";
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
import TermsPolicies from "./pages/TermsPolicies.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/directories" element={<Directories />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/my-account" element={<MyAccount />} />
            <Route path="/saved" element={<SavedListings />} />
            <Route path="/visited" element={<VisitedPlaces />} />
            <Route path="/account-settings" element={<AccountSettings />} />
            <Route path="/terms" element={<TermsPolicies />} />
            <Route path="/people" element={<People />} />
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
              <Route path="content" element={<AdminContent />} />
              <Route path="import" element={<AdminImport />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ScrollToTop />
          <BottomNav />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
