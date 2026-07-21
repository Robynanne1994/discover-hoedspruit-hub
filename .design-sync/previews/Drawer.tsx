import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter,
  Button, Separator,
} from "vite_react_shadcn_ts";
import { CalendarDays, Users, MapPin } from "lucide-react";

export const BookingDetails = () => (
  <Drawer open shouldScaleBackground={false}>
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Booking details</DrawerTitle>
        <DrawerDescription>Blyde River Canyon Lodge — River Suite</DrawerDescription>
      </DrawerHeader>

      <div style={{ padding: "0 16px 8px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CalendarDays style={{ width: 18, height: 18, opacity: 0.7 }} />
          <span style={{ fontSize: 14 }}>18 – 22 Jul 2026 · 4 nights</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Users style={{ width: 18, height: 18, opacity: 0.7 }} />
          <span style={{ fontSize: 14 }}>2 adults · 1 child</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MapPin style={{ width: 18, height: 18, opacity: 0.7 }} />
          <span style={{ fontSize: 14 }}>R14 Kampersrus, Limpopo</span>
        </div>
        <Separator />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
          <span>Total</span>
          <span>R9 600</span>
        </div>
      </div>

      <DrawerFooter>
        <Button>Confirm booking</Button>
        <Button variant="outline">Edit dates</Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
);
