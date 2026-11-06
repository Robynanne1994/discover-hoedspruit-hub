import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { ChannelBusiness } from "@/lib/channelBusiness";

export default function ChannelBusinessSelect({ value, onChange, listings, loading }: { value: string; onChange: (value: string) => void; listings: ChannelBusiness[]; loading: boolean }) {
  const [open, setOpen] = useState(false);
  const selected = listings.find((listing) => listing.id === value);
  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" role="combobox" aria-label="Associated Business" aria-expanded={open} disabled={loading} className="w-full min-w-0 justify-between border-border bg-card text-foreground hover:bg-accent">
            <span className="truncate">{loading ? "Loading businesses..." : selected?.title || "Select Business"}</span><ChevronsUpDown className="shrink-0 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-40px)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search businesses..." aria-label="Search Businesses" />
            <CommandList><CommandEmpty>No businesses found.</CommandEmpty>
              {listings.map((listing) => <CommandItem key={listing.id} value={listing.id} keywords={[listing.title]} onSelect={() => { onChange(listing.id); setOpen(false); }}><Check className={`mr-2 h-4 w-4 ${value === listing.id ? "opacity-100" : "opacity-0"}`} /><span className="break-words">{listing.title}</span></CommandItem>)}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && <Button type="button" variant="ghost" size="icon" aria-label="Clear Associated Business" title="Clear Associated Business" className="shrink-0 bg-transparent text-primary border-border" onClick={() => onChange("")}><X className="h-4 w-4" /></Button>}
    </div>
  );
}