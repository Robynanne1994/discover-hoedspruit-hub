import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup,
  CommandItem, CommandSeparator,
} from "vite_react_shadcn_ts";
import { MapPin, Calendar, Store } from "lucide-react";

export const TownSearch = () => (
  <div style={{ padding: 24, display: "flex", justifyContent: "center" }}>
    <Command style={{ width: 380, border: "1px solid hsl(var(--border))", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
      <CommandInput placeholder="Search Hoedspruit…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Places">
          <CommandItem>
            <MapPin size={15} style={{ marginRight: 8 }} /> Blyde River Canyon
          </CommandItem>
          <CommandItem>
            <MapPin size={15} style={{ marginRight: 8 }} /> Buffalo Ridge Lodge
          </CommandItem>
          <CommandItem>
            <Store size={15} style={{ marginRight: 8 }} /> Kudu &amp; Co. Coffee
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Events">
          <CommandItem>
            <Calendar size={15} style={{ marginRight: 8 }} /> Saturday Farmers Market
          </CommandItem>
          <CommandItem>
            <Calendar size={15} style={{ marginRight: 8 }} /> Bushveld Music Evening
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  </div>
);
