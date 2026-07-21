import {
  Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext,
  Card, CardContent, Badge,
} from "vite_react_shadcn_ts";
import { MapPin, Star } from "lucide-react";

const slides = [
  { name: "Blyde River Canyon Lodge", tag: "Safari lodge", rating: "4.9", loc: "Kampersrus" },
  { name: "Moholoholo Rehab Centre", tag: "Wildlife", rating: "4.8", loc: "R531" },
  { name: "Saturday Farmers Market", tag: "Market", rating: "4.7", loc: "Town centre" },
  { name: "Panorama Route Drive", tag: "Scenic", rating: "5.0", loc: "Blyde" },
];

export const FeaturedLodges = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: "24px 64px" }}>
    <Carousel opts={{ align: "start" }} style={{ width: "100%", maxWidth: 500 }}>
      <CarouselContent>
        {slides.map((s) => (
          <CarouselItem key={s.name}>
            <Card style={{ overflow: "hidden" }}>
              <div style={{ height: 150, background: "linear-gradient(135deg, hsl(28 40% 72%), hsl(90 18% 55%))" }} />
              <CardContent style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Badge variant="secondary">{s.tag}</Badge>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                    <Star style={{ width: 14, height: 14, fill: "currentColor", opacity: 0.8 }} />
                    {s.rating}
                  </span>
                </div>
                <h3 style={{ fontWeight: 600, fontSize: 16, margin: 0 }}>{s.name}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, opacity: 0.7 }}>
                  <MapPin style={{ width: 14, height: 14 }} />
                  {s.loc}
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  </div>
);
