import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, Button,
} from "vite_react_shadcn_ts";
import { MoreHorizontal, Share2, Bookmark, Flag, MapPin } from "lucide-react";

export const ListingActions = () => (
  <div style={{ padding: "24px 24px 240px", display: "flex", justifyContent: "center" }}>
    <DropdownMenu open modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <MoreHorizontal size={16} style={{ marginRight: 8 }} /> Options
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" style={{ minWidth: 200 }}>
        <DropdownMenuLabel>Buffalo Ridge Lodge</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Bookmark size={15} style={{ marginRight: 8 }} /> Save to trip
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Share2 size={15} style={{ marginRight: 8 }} /> Share listing
          <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <MapPin size={15} style={{ marginRight: 8 }} /> Get directions
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Flag size={15} style={{ marginRight: 8 }} /> Report a problem
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);
