import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "vite_react_shadcn_ts";
import { Star, MapPin } from "lucide-react";

export const ListingTabs = () => (
  <div style={{ padding: 24, maxWidth: 440 }}>
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
        <TabsTrigger value="location">Location</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#3a332c" }}>
          Riverside suites with sweeping views of the Drakensberg escarpment, a
          farm-to-table restaurant and guided sunrise game drives. Open
          year-round, with backup power through load-shedding.
        </p>
      </TabsContent>
      <TabsContent value="reviews">
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
          <Star size={16} fill="currentColor" /> 4.8
          <span style={{ opacity: 0.6 }}>· 212 reviews</span>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.6, color: "#3a332c" }}>
          "The most peaceful stay in the lowveld — we watched elephants from the
          deck at breakfast."
        </p>
      </TabsContent>
      <TabsContent value="location">
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#3a332c" }}>
          <MapPin size={16} /> R527, Hoedspruit, Limpopo
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.6, color: "#3a332c" }}>
          15 minutes from the Blyde River Canyon viewpoints and 40 minutes from
          Eastgate Airport.
        </p>
      </TabsContent>
    </Tabs>
  </div>
);

export const CategoryTabs = () => (
  <div style={{ padding: 24, maxWidth: 440 }}>
    <Tabs defaultValue="eat">
      <TabsList>
        <TabsTrigger value="stay">Stay</TabsTrigger>
        <TabsTrigger value="eat">Eat</TabsTrigger>
        <TabsTrigger value="do">Do</TabsTrigger>
      </TabsList>
      <TabsContent value="stay">
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#3a332c" }}>
          Safari lodges, guesthouses and self-catering cottages across the
          Hoedspruit valley.
        </p>
      </TabsContent>
      <TabsContent value="eat">
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#3a332c" }}>
          Farm cafés, wood-fired pizza and the Saturday farmers market — the best
          bites in town.
        </p>
      </TabsContent>
      <TabsContent value="do">
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#3a332c" }}>
          Game drives, canyon hikes, wildlife rehab centres and hot-air balloon
          flights over the bushveld.
        </p>
      </TabsContent>
    </Tabs>
  </div>
);
