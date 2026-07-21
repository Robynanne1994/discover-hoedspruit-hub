import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge,
} from "vite_react_shadcn_ts";
import { MapPin, Star } from "lucide-react";

export const ListingCard = () => (
  <div style={{ padding: 24, maxWidth: 380 }}>
    <Card>
      <CardHeader>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
          <CardTitle>Blyde River Canyon Lodge</CardTitle>
          <Badge variant="secondary">Featured</Badge>
        </div>
        <CardDescription>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <MapPin size={14} /> Hoedspruit, Limpopo
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
          Riverside suites with sweeping views of the Drakensberg escarpment, a
          farm-to-table restaurant and guided sunrise game drives.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 14 }}>
          <Star size={16} fill="currentColor" /> 4.8 <span style={{ opacity: 0.6 }}>(212 reviews)</span>
        </div>
      </CardContent>
      <CardFooter style={{ gap: 8 }}>
        <Button>Book a stay</Button>
        <Button variant="outline">Save</Button>
      </CardFooter>
    </Card>
  </div>
);

export const SimpleCard = () => (
  <div style={{ padding: 24, maxWidth: 340 }}>
    <Card>
      <CardHeader>
        <CardTitle>What's on this week</CardTitle>
        <CardDescription>Events around town, updated daily.</CardDescription>
      </CardHeader>
      <CardContent>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
          From the Saturday farmers market to live music at the local brewery —
          find something to do in Hoedspruit.
        </p>
      </CardContent>
    </Card>
  </div>
);
