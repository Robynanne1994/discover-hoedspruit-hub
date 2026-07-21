import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption,
  Badge,
} from "vite_react_shadcn_ts";
import { Star } from "lucide-react";

const rows = [
  { name: "Blyde River Canyon Lodge", cat: "Safari lodge", rating: "4.9", open: true },
  { name: "Mopani Farm Stall", cat: "Farmers market", rating: "4.7", open: true },
  { name: "Kudu & Cork", cat: "Restaurant", rating: "4.6", open: false },
  { name: "Hoedspruit Endangered Species Centre", cat: "Wildlife tour", rating: "4.8", open: true },
  { name: "Baobab Books & Coffee", cat: "Cafe", rating: "4.5", open: false },
];

export const BusinessListing = () => (
  <div style={{ padding: 16, width: "100%" }}>
    <Table>
      <TableCaption>Local businesses around Hoedspruit · updated weekly</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead style={{ textAlign: "right" }}>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.name}>
            <TableCell style={{ fontWeight: 500 }}>{r.name}</TableCell>
            <TableCell>{r.cat}</TableCell>
            <TableCell>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Star style={{ width: 14, height: 14, fill: "currentColor", opacity: 0.8 }} />
                {r.rating}
              </span>
            </TableCell>
            <TableCell style={{ textAlign: "right" }}>
              <Badge variant={r.open ? "default" : "secondary"}>{r.open ? "Open" : "Closed"}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
